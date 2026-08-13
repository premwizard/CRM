import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const removeSchema = z.object({
  tagId: z.string().min(1, "tagId is required"),
  entityType: z.enum(["contact", "company", "lead", "deal"]),
  entityId: z.string().min(1, "entityId is required"),
});

// POST /api/v1/tags/remove
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = removeSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid remove input",
        400,
      );
    }

    const { tagId, entityType, entityId } = parsed.data;

    if (entityType === "contact") {
      await db.contactTag.deleteMany({
        where: { contactId: entityId, tagId },
      });
    } else if (entityType === "company") {
      await db.companyTag.deleteMany({
        where: { companyId: entityId, tagId },
      });
    } else if (entityType === "lead") {
      await db.leadTag.deleteMany({
        where: { leadId: entityId, tagId },
      });
    } else if (entityType === "deal") {
      await db.dealTag.deleteMany({
        where: { dealId: entityId, tagId },
      });
    }

    return apiSuccess(null, "Tag removed successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to remove tag",
      500,
    );
  }
}
