import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const updateNoteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

// PUT /api/v1/notes/[id] (edit note)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateNoteSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid note content",
        400,
      );
    }

    const note = await db.note.update({
      where: { id },
      data: {
        content: parsed.data.content.trim(),
      },
    });

    return apiSuccess({ note }, "Note updated successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to update note",
      500,
    );
  }
}

// DELETE /api/v1/notes/[id] (delete note)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await db.note.delete({
      where: { id },
    });

    return apiSuccess(null, "Note deleted successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to delete note",
      500,
    );
  }
}
