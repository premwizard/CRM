import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";

// GET /api/v1/segments/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const segment = await db.segment.findUnique({
      where: { id },
    });

    if (!segment) {
      return apiError("Segment not found", 404);
    }

    return apiSuccess({ segment });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch segment",
      500,
    );
  }
}

// DELETE /api/v1/segments/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await db.segment.delete({ where: { id } });

    return apiSuccess(null, "Segment deleted successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to delete segment",
      500,
    );
  }
}
