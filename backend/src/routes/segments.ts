import { Router } from "express";
import { db } from "../config/db";
import { SegmentEntityType } from "@prisma/client";

const router = Router();

// GET /api/v1/segments
router.get("/", async (req, res) => {
  try {
    const segments = await db.segment.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: { segments } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch segments" });
  }
});

// POST /api/v1/segments
router.post("/", async (req, res) => {
  try {
    const { name, description, entityType, filterConfig } = req.body;
    const segment = await db.segment.create({
      data: {
        name,
        description,
        entityType,
        filterConfig,
      },
    });
    return res.status(201).json({ success: true, data: { segment } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to create segment" });
  }
});

// DELETE /api/v1/segments/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.segment.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Segment deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete segment" });
  }
});

export default router;
