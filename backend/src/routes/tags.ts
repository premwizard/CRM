import { Router } from "express";
import { db } from "../config/db";

const router = Router();

// GET /api/v1/tags
router.get("/", async (req, res) => {
  try {
    const tags = await db.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            contacts: true,
            companies: true,
            leads: true,
            deals: true,
          },
        },
      },
    });

    return res.json({ success: true, data: { tags } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch tags" });
  }
});

// POST /api/v1/tags
router.post("/", async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "Tag name is required" });
    }

    const nameClean = name.trim();
    let tag = await db.tag.findUnique({ where: { name: nameClean } });
    if (!tag) {
      tag = await db.tag.create({
        data: { name: nameClean, color: color || "#3B82F6" },
      });
    }

    return res.status(201).json({ success: true, data: { tag } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to create tag" });
  }
});

// PUT /api/v1/tags/:id
router.put("/:id", async (req, res) => {
  try {
    const tag = await db.tag.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json({ success: true, data: { tag } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to update tag" });
  }
});

// DELETE /api/v1/tags/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.tag.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Tag deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete tag" });
  }
});

// POST /api/v1/tags/assign
router.post("/assign", async (req, res) => {
  try {
    const { tagId, tagName, color, entityType, entityId } = req.body;
    let targetTagId = tagId;

    if (!targetTagId && tagName) {
      const nameClean = tagName.trim();
      let existing = await db.tag.findUnique({ where: { name: nameClean } });
      if (!existing) {
        existing = await db.tag.create({
          data: { name: nameClean, color: color || "#3B82F6" },
        });
      }
      targetTagId = existing.id;
    }

    if (!targetTagId || !entityType || !entityId) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    if (entityType === "contact") {
      await db.contactTag.upsert({
        where: { contactId_tagId: { contactId: entityId, tagId: targetTagId } },
        create: { contactId: entityId, tagId: targetTagId },
        update: {},
      });
    } else if (entityType === "company") {
      await db.companyTag.upsert({
        where: { companyId_tagId: { companyId: entityId, tagId: targetTagId } },
        create: { companyId: entityId, tagId: targetTagId },
        update: {},
      });
    } else if (entityType === "lead") {
      await db.leadTag.upsert({
        where: { leadId_tagId: { leadId: entityId, tagId: targetTagId } },
        create: { leadId: entityId, tagId: targetTagId },
        update: {},
      });
    } else if (entityType === "deal") {
      await db.dealTag.upsert({
        where: { dealId_tagId: { dealId: entityId, tagId: targetTagId } },
        create: { dealId: entityId, tagId: targetTagId },
        update: {},
      });
    }

    return res.json({ success: true, message: "Tag assigned" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to assign tag" });
  }
});

// POST /api/v1/tags/remove
router.post("/remove", async (req, res) => {
  try {
    const { tagId, entityType, entityId } = req.body;
    if (entityType === "contact") {
      await db.contactTag.deleteMany({ where: { contactId: entityId, tagId } });
    } else if (entityType === "company") {
      await db.companyTag.deleteMany({ where: { companyId: entityId, tagId } });
    } else if (entityType === "lead") {
      await db.leadTag.deleteMany({ where: { leadId: entityId, tagId } });
    } else if (entityType === "deal") {
      await db.dealTag.deleteMany({ where: { dealId: entityId, tagId } });
    }
    return res.json({ success: true, message: "Tag removed" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to remove tag" });
  }
});

export default router;
