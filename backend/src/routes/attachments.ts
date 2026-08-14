import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { db } from "../config/db";
import { resolveTenantId } from "../middleware/tenant";
import { AuthenticatedRequest } from "../middleware/auth";
import { requireWritePermission, normalizeRole } from "../middleware/rbac";
import { storageProvider, isDangerousExtension, MAX_FILE_SIZE } from "../services/storage";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const uploaderSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

// GET /api/v1/attachments?entityType=...&entityId=...
router.get("/", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const entityType = (req.query.entityType as string || "").toUpperCase();
    const entityId = req.query.entityId as string;

    if (!entityType || !entityId) {
      return res.status(400).json({ success: false, error: "entityType and entityId parameters are required" });
    }

    const attachments = await db.attachment.findMany({
      where: {
        organizationId: tenantId,
        entityType,
        entityId,
      },
      include: {
        uploadedBy: { select: uploaderSelect },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: { attachments } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch attachments" });
  }
});

// POST /api/v1/attachments (upload file)
router.post("/", requireWritePermission, upload.single("file"), async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const file = req.file;
    const entityType = (req.body.entityType as string || "").toUpperCase();
    const entityId = req.body.entityId as string;

    if (!file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    if (!entityType || !entityId) {
      return res.status(400).json({ success: false, error: "entityType and entityId are required" });
    }

    // 1. Size Guard
    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ success: false, error: "File exceeds 25MB maximum upload limit" });
    }

    // 2. Dangerous File Extension Guard
    const originalFileName = file.originalname || "unnamed_file";
    if (isDangerousExtension(originalFileName)) {
      return res.status(400).json({ success: false, error: "Executable or dangerous file types are strictly prohibited" });
    }

    // 3. Generate Storage Key & Save File
    const uniqueId = (Math.random() + 1).toString(36).substring(2, 10);
    const safeFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `org_${tenantId}/${Date.now()}_${uniqueId}_${safeFileName}`;

    await storageProvider.saveFile(file.buffer, storageKey);

    // 4. Create Attachment DB Record
    const attachment = await db.attachment.create({
      data: {
        organizationId: tenantId,
        uploadedById: userId,
        originalFileName,
        storageKey,
        mimeType: file.mimetype || "application/octet-stream",
        size: file.size,
        entityType,
        entityId,
      },
      include: {
        uploadedBy: { select: uploaderSelect },
      },
    });

    return res.status(201).json({ success: true, data: { attachment } });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to upload file",
    });
  }
});

// GET /api/v1/attachments/:id/download
router.get("/:id/download", async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const attachmentId = String(req.params.id);

    const attachment = await db.attachment.findFirst({
      where: { id: attachmentId, organizationId: tenantId },
    });

    if (!attachment) {
      return res.status(404).json({ success: false, error: "Attachment not found or access denied" });
    }

    const exists = await storageProvider.fileExists(attachment.storageKey);
    if (!exists) {
      return res.status(404).json({ success: false, error: "File binary not found in storage" });
    }

    const fileStream = await storageProvider.getFileStream(attachment.storageKey);

    res.setHeader("Content-Type", attachment.mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(attachment.originalFileName)}"`
    );
    res.setHeader("Content-Length", attachment.size);

    fileStream.pipe(res);
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to download attachment" });
  }
});

// DELETE /api/v1/attachments/:id
router.delete("/:id", requireWritePermission, async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;
    const userRole = normalizeRole(authReq.user?.role || "SALES_REP");
    const attachmentId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const attachment = await db.attachment.findFirst({
      where: { id: attachmentId, organizationId: tenantId },
    });

    if (!attachment) {
      return res.status(404).json({ success: false, error: "Attachment not found" });
    }

    // Security check: Only uploader or ADMIN/OWNER/MANAGER can delete
    const isUploader = attachment.uploadedById === userId;
    const isModerator = userRole === "ADMIN" || userRole === "OWNER" || userRole === "MANAGER";

    if (!isUploader && !isModerator) {
      return res.status(403).json({ success: false, error: "Forbidden: You can only delete your own attachments" });
    }

    // Delete file from storage
    await storageProvider.deleteFile(attachment.storageKey);

    // Delete attachment database record
    await db.attachment.delete({ where: { id: attachmentId } });

    return res.json({ success: true, message: "Attachment deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete attachment" });
  }
});

export default router;
