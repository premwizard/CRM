import { Router } from "express";
import { db } from "../config/db";
import { ActivityType } from "@prisma/client";

const router = Router();

// GET /api/v1/activities
router.get("/", async (req, res) => {
  try {
    const search = (req.query.search as string) || "";
    const type = req.query.type as string;
    const contactId = req.query.contactId as string;
    const companyId = req.query.companyId as string;
    const leadId = req.query.leadId as string;
    const dealId = req.query.dealId as string;

    const AND: Record<string, unknown>[] = [];
    if (search) {
      AND.push({
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    if (type && Object.values(ActivityType).includes(type as ActivityType)) {
      AND.push({ type: type as ActivityType });
    }

    if (contactId) AND.push({ contactId });
    if (companyId) AND.push({ companyId });
    if (leadId) AND.push({ leadId });
    if (dealId) AND.push({ dealId });

    const where = AND.length > 0 ? { AND } : {};

    const activities = await db.activity.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: { activities } });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch activities" });
  }
});

// POST /api/v1/activities
router.post("/", async (req, res) => {
  try {
    const activity = await db.activity.create({
      data: req.body,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({ success: true, data: { activity } });
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, error: "Failed to create activity" });
  }
});

// DELETE /api/v1/activities/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.activity.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Activity deleted" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete activity" });
  }
});

export default router;
