import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";
import { ActivityType } from "@prisma/client";

const activitySchema = z.object({
  title: z.string().min(1, "Activity title is required"),
  type: z.nativeEnum(ActivityType).optional(),
  description: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  performedBy: z.string().optional().nullable(),
});

// GET /api/v1/activities/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const activity = await db.activity.findUnique({
      where: { id },
      include: {
        contact: true,
        deal: true,
      },
    });

    if (!activity) {
      return apiError("Activity not found", 404);
    }

    return apiSuccess({ activity });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error fetching activity",
      500,
    );
  }
}

// PUT /api/v1/activities/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = activitySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid activity input",
        400,
      );
    }

    const activity = await db.activity.update({
      where: { id },
      data: parsed.data,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, name: true } },
      },
    });

    return apiSuccess({ activity }, "Activity updated successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error updating activity",
      500,
    );
  }
}

// DELETE /api/v1/activities/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await db.activity.delete({
      where: { id },
    });
    return apiSuccess(null, "Activity deleted successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error deleting activity",
      500,
    );
  }
}
