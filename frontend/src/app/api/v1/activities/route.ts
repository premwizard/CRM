import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";
import { ActivityType, ActivityOutcome, TaskPriority, TaskStatus } from "@prisma/client";

const activitySchema = z.object({
  title: z.string().min(1, "Activity title is required"),
  type: z.nativeEnum(ActivityType).default(ActivityType.NOTE),
  description: z.string().optional().nullable(),
  outcome: z.nativeEnum(ActivityOutcome).optional().nullable(),
  duration: z.number().optional().nullable(),
  nextAction: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  createFollowUpTask: z.boolean().optional(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  performedBy: z.string().optional().nullable(),
});

const activityInclude = {
  contact: { select: { id: true, firstName: true, lastName: true } },
  company: { select: { id: true, name: true } },
  lead: { select: { id: true, name: true } },
  deal: { select: { id: true, name: true } },
  task: { select: { id: true, title: true, dueDate: true, status: true, priority: true } },
};

// GET /api/v1/activities (list + search + type + entity filters)
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") || "";
    const type = request.nextUrl.searchParams.get("type");
    const contactId = request.nextUrl.searchParams.get("contactId");
    const companyId = request.nextUrl.searchParams.get("companyId");
    const leadId = request.nextUrl.searchParams.get("leadId");
    const dealId = request.nextUrl.searchParams.get("dealId");

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

    return apiSuccess({ activities });
  } catch (error) {
    console.error("Activities fetch error:", error);
    return apiSuccess({ activities: [] }, "Database query fallback");
  }
}

// POST /api/v1/activities (create with follow-up task handling)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = activitySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid activity input",
        400,
      );
    }

    const headerUserEmail = request.headers.get("x-user-email");
    const performedBy =
      parsed.data.performedBy || headerUserEmail || "System User";

    const {
      followUpDate,
      createFollowUpTask,
      nextAction,
      outcome,
      duration,
      ...restData
    } = parsed.data;

    let createdTaskId: string | null = null;

    // Check if auto follow-up task creation is needed
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
          assignedTo: performedBy,
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
        title: restData.title,
        type: restData.type,
        description: restData.description || null,
        outcome: outcome || null,
        duration: duration || null,
        nextAction: nextAction || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        taskId: createdTaskId,
        contactId: restData.contactId || null,
        companyId: restData.companyId || null,
        leadId: restData.leadId || null,
        dealId: restData.dealId || null,
        performedBy,
      },
      include: activityInclude,
    });

    return apiSuccess({ activity }, "Activity logged successfully", 201);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to log activity",
      500,
    );
  }
}
