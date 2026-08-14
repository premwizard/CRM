import { Router } from "express";
import { db } from "../config/db";
import { ActivityType } from "@prisma/client";
import { requireWritePermission, requireDeletePermission } from "../middleware/rbac";
import { resolveTenantId } from "../middleware/tenant";

const router = Router();

// GET /api/v1/notes
router.get("/", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const contactId = req.query.contactId as string;
    const companyId = req.query.companyId as string;
    const leadId = req.query.leadId as string;
    const dealId = req.query.dealId as string;
    const sort = (req.query.sort as string) || "newest";

    const AND: Record<string, unknown>[] = [{ organizationId: tenantId }];
    if (contactId) AND.push({ contactId });
    if (companyId) AND.push({ companyId });
    if (leadId) AND.push({ leadId });
    if (dealId) AND.push({ dealId });

    const orderBy = sort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };

    const notes = await db.note.findMany({ where: { AND }, orderBy });
    return res.json({ success: true, data: { notes } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch notes" });
  }
});

// POST /api/v1/notes
router.post("/", requireWritePermission, async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const note = await db.note.create({
      data: {
        ...req.body,
        organizationId: tenantId,
      },
    });

    try {
      const summaryTitle =
        req.body.content.length > 60
          ? req.body.content.substring(0, 60) + "..."
          : req.body.content;

      await db.activity.create({
        data: {
          title: `Added note: "${summaryTitle}"`,
          type: ActivityType.NOTE,
          description: req.body.content,
          performedBy: req.body.createdBy || "System User",
          contactId: req.body.contactId || null,
          companyId: req.body.companyId || null,
          leadId: req.body.leadId || null,
          dealId: req.body.dealId || null,
          organizationId: tenantId,
        },
      });
    } catch {
      // Ignore background timeline log errors
    }

    return res.status(201).json({ success: true, data: { note } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to create note" });
  }
});

// PUT /api/v1/notes/:id
router.put("/:id", requireWritePermission, async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const noteId = String(req.params.id);

    const existing = await db.note.findFirst({
      where: { id: noteId, organizationId: tenantId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Note not found" });
    }

    const note = await db.note.update({
      where: { id: noteId },
      data: { content: req.body.content },
    });
    return res.json({ success: true, data: { note } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to update note" });
  }
});

// DELETE /api/v1/notes/:id
router.delete("/:id", requireWritePermission, requireDeletePermission, async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const noteId = String(req.params.id);

    const existing = await db.note.findFirst({
      where: { id: noteId, organizationId: tenantId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Note not found" });
    }

    await db.note.delete({ where: { id: noteId } });
    return res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete note" });
  }
});

export default router;
