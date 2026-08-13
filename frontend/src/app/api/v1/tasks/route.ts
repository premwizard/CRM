import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";
import { TaskPriority, TaskStatus } from "@prisma/client";

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  assignedTo: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
});

const includeRelations = {
  contact: { select: { id: true, firstName: true, lastName: true, email: true } },
  company: { select: { id: true, name: true } },
  lead: { select: { id: true, name: true } },
  deal: { select: { id: true, name: true } },
};

// GET /api/v1/tasks (list + pagination + sorting + filters)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const contactId = searchParams.get("contactId");
    const companyId = searchParams.get("companyId");
    const leadId = searchParams.get("leadId");
    const dealId = searchParams.get("dealId");
    const isOverdue = searchParams.get("overdue") === "true";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)),
    );
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder =
      searchParams.get("sortOrder")?.toLowerCase() === "asc" ? "asc" : "desc";

    const AND: Record<string, unknown>[] = [];

    if (search) {
      AND.push({
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      AND.push({ status: status as TaskStatus });
    }

    if (
      priority &&
      Object.values(TaskPriority).includes(priority as TaskPriority)
    ) {
      AND.push({ priority: priority as TaskPriority });
    }

    if (isOverdue) {
      AND.push({
        dueDate: { lt: new Date() },
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      });
    }

    if (contactId) AND.push({ contactId });
    if (companyId) AND.push({ companyId });
    if (leadId) AND.push({ leadId });
    if (dealId) AND.push({ dealId });

    const where = AND.length > 0 ? { AND } : {};

    const allowedSortKeys = ["title", "dueDate", "priority", "status", "createdAt"];
    const orderByKey = allowedSortKeys.includes(sortBy) ? sortBy : "createdAt";

    const [totalItems, tasks] = await Promise.all([
      db.task.count({ where }),
      db.task.findMany({
        where,
        include: includeRelations,
        orderBy: { [orderByKey]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    return apiSuccess({
      tasks,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch tasks",
      500,
    );
  }
}

// POST /api/v1/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = taskSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid task input",
        400,
      );
    }

    const { dueDate, contactId, companyId, leadId, dealId, ...restData } =
      parsed.data;

    const task = await db.task.create({
      data: {
        ...restData,
        dueDate: dueDate ? new Date(dueDate) : null,
        contactId: contactId || null,
        companyId: companyId || null,
        leadId: leadId || null,
        dealId: dealId || null,
      },
      include: includeRelations,
    });
    return apiSuccess({ task }, "Task created successfully", 201);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to create task",
      500,
    );
  }
}
