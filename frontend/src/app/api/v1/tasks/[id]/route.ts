import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";
import { TaskPriority, TaskStatus } from "@prisma/client";

const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
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

// GET /api/v1/tasks/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const task = await db.task.findUnique({
      where: { id },
      include: includeRelations,
    });

    if (!task) {
      return apiError("Task not found", 404);
    }

    return apiSuccess({ task });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error fetching task",
      500,
    );
  }
}

// PUT /api/v1/tasks/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = taskSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid task input",
        400,
      );
    }

    const { dueDate, contactId, companyId, leadId, dealId, ...restData } = parsed.data;

    const task = await db.task.update({
      where: { id },
      data: {
        ...restData,
        dueDate: dueDate ? new Date(dueDate) : null,
        contactId: contactId === undefined ? undefined : (contactId || null),
        companyId: companyId === undefined ? undefined : (companyId || null),
        leadId: leadId === undefined ? undefined : (leadId || null),
        dealId: dealId === undefined ? undefined : (dealId || null),
      },
      include: includeRelations,
    });

    return apiSuccess({ task }, "Task updated successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error updating task",
      500,
    );
  }
}

// DELETE /api/v1/tasks/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await db.task.delete({
      where: { id },
    });
    return apiSuccess(null, "Task deleted successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error deleting task",
      500,
    );
  }
}
