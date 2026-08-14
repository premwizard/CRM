import { Router } from "express";
import { db } from "../config/db";
import { SegmentEntityType } from "@prisma/client";
import { requireWritePermission, requireDeletePermission } from "../middleware/rbac";
import { resolveTenantId } from "../middleware/tenant";

const router = Router();

// GET /api/v1/segments
router.get("/", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const segments = await db.segment.findMany({
      where: { organizationId: tenantId },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: { segments } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch segments" });
  }
});

// POST /api/v1/segments
router.post("/", requireWritePermission, async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const { name, description, entityType, filterConfig } = req.body;
    const segment = await db.segment.create({
      data: {
        name,
        description,
        entityType,
        filterConfig,
        organizationId: tenantId,
      },
    });
    return res.status(201).json({ success: true, data: { segment } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to create segment" });
  }
});

// DELETE /api/v1/segments/:id
router.delete("/:id", requireWritePermission, requireDeletePermission, async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const segmentId = String(req.params.id);

    const existing = await db.segment.findFirst({
      where: { id: segmentId, organizationId: tenantId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Segment not found" });
    }

    await db.segment.delete({ where: { id: segmentId } });
    return res.json({ success: true, message: "Segment deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete segment" });
  }
});

export default router;
