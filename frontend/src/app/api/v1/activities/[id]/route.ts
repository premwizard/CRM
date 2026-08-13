import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";

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
      error instanceof Error ? error.message : "Failed to delete activity",
      500,
    );
  }
}
