import { Router } from "express";
import { db } from "../config/db";
import { ActivityType, ActivityOutcome, TaskPriority, TaskStatus } from "@prisma/client";
import { requireWritePermission, requireDeletePermission } from "../middleware/rbac";

const router = Router();

const activityInclude = {
  contact: { select: { id: true, firstName: true, lastName: true } },
  company: { select: { id: true, name: true } },
  lead: { select: { id: true, name: true } },
  deal: { select: { id: true, name: true } },
  task: { select: { id: true, title: true, dueDate: true, status: true, priority: true } },
};

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
      include: activityInclude,
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
router.post("/", requireWritePermission, async (req, res) => {
  try {
    const {
      followUpDate,
      createFollowUpTask,
      nextAction,
      outcome,
      duration,
      ...restData
    } = req.body;

    let createdTaskId: string | null = null;

    const shouldCreateTask =
      createFollowUpTask ||
      outcome === ActivityOutcome.FOLLOW_UP_REQUIRED ||
      Boolean(followUpDate && nextAction);

    if (shouldCreateTask) {
      const taskTitle =
        nextAction && nextAction.trim()
          ? nextAction.trim()
          : `Follow up: ${restData.title}`;

      const task = await db.task.create({
        data: {
          title: taskTitle,
          description: restData.description
            ? `Follow-up from activity: ${restData.title}\n${restData.description}`
            : `Follow-up from activity: ${restData.title}`,
          dueDate: followUpDate ? new Date(followUpDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
          priority: outcome === ActivityOutcome.FOLLOW_UP_REQUIRED ? TaskPriority.HIGH : TaskPriority.MEDIUM,
          status: TaskStatus.TODO,
          assignedTo: restData.performedBy || "System User",
          contactId: restData.contactId || null,
          companyId: restData.companyId || null,
          leadId: restData.leadId || null,
          dealId: restData.dealId || null,
        },
      });

      createdTaskId = task.id;
    }

    const activity = await db.activity.create({
      data: {
        ...restData,
        outcome: outcome || null,
        duration: duration ? Number(duration) : null,
        nextAction: nextAction || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        taskId: createdTaskId,
      },
      include: activityInclude,
    });

    return res.status(201).json({ success: true, data: { activity } });
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, error: "Failed to create activity" });
  }
});

// DELETE /api/v1/activities/:id
router.delete("/:id", requireWritePermission, requireDeletePermission, async (req, res) => {
  try {
    const activityId = String(req.params.id);
    await db.activity.delete({ where: { id: activityId } });
    return res.json({ success: true, message: "Activity deleted" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to delete activity" });
  }
});

export default router;
