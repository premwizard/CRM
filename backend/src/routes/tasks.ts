import { Router } from "express";
import { db } from "../config/db";

const router = Router();

const includeRelations = {
  contact: { select: { id: true, firstName: true, lastName: true, email: true } },
  company: { select: { id: true, name: true } },
  lead: { select: { id: true, name: true } },
  deal: { select: { id: true, name: true } },
};

// GET /api/v1/tasks
router.get("/", async (req, res) => {
  try {
    const search = (req.query.search as string) || "";
    const status = req.query.status as string;
    const priority = req.query.priority as string;
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
    if (status) AND.push({ status });
    if (priority) AND.push({ priority });
    if (contactId) AND.push({ contactId });
    if (companyId) AND.push({ companyId });
    if (leadId) AND.push({ leadId });
    if (dealId) AND.push({ dealId });

    const where = AND.length > 0 ? { AND } : {};

    const tasks = await db.task.findMany({
      where,
      include: includeRelations,
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: { tasks } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch tasks" });
  }
});

// POST /api/v1/tasks
router.post("/", async (req, res) => {
  try {
    const { dueDate, ...restData } = req.body;
    const task = await db.task.create({
      data: {
        ...restData,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: includeRelations,
    });
    return res.status(201).json({ success: true, data: { task } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to create task" });
  }
});

// PUT /api/v1/tasks/:id
router.put("/:id", async (req, res) => {
  try {
    const { dueDate, ...restData } = req.body;
    const task = await db.task.update({
      where: { id: req.params.id },
      data: {
        ...restData,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: includeRelations,
    });
    return res.json({ success: true, data: { task } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to update task" });
  }
});

// DELETE /api/v1/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.task.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete task" });
  }
});

export default router;
