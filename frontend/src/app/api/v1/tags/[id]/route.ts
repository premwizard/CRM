import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1, "Tag name is required").optional(),
  color: z.string().optional(),
});

// PUT /api/v1/tags/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid update input",
        400,
      );
    }

    const tag = await db.tag.update({
      where: { id },
      data: parsed.data,
    });

    return apiSuccess({ tag }, "Tag updated successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to update tag",
      500,
    );
  }
}

// DELETE /api/v1/tags/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await db.tag.delete({ where: { id } });

    return apiSuccess(null, "Tag deleted successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to delete tag",
      500,
    );
  }
}
