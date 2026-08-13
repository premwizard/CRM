import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const assignSchema = z.object({
  tagId: z.string().optional(),
  tagName: z.string().optional(),
  color: z.string().optional(),
  entityType: z.enum(["contact", "company", "lead", "deal"]),
  entityId: z.string().min(1, "entityId is required"),
});

// POST /api/v1/tags/assign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = assignSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid assign input",
        400,
      );
    }

    const { tagId, tagName, color, entityType, entityId } = parsed.data;

    let targetTagId = tagId;

    if (!targetTagId && tagName) {
      const nameClean = tagName.trim();
      let existing = await db.tag.findUnique({ where: { name: nameClean } });
      if (!existing) {
        existing = await db.tag.create({
          data: { name: nameClean, color: color || "#3B82F6" },
        });
      }
      targetTagId = existing.id;
    }

    if (!targetTagId) {
      return apiError("tagId or tagName is required", 400);
    }

    if (entityType === "contact") {
      await db.contactTag.upsert({
        where: { contactId_tagId: { contactId: entityId, tagId: targetTagId } },
        create: { contactId: entityId, tagId: targetTagId },
        update: {},
      });
    } else if (entityType === "company") {
      await db.companyTag.upsert({
        where: { companyId_tagId: { companyId: entityId, tagId: targetTagId } },
        create: { companyId: entityId, tagId: targetTagId },
        update: {},
      });
    } else if (entityType === "lead") {
      await db.leadTag.upsert({
        where: { leadId_tagId: { leadId: entityId, tagId: targetTagId } },
        create: { leadId: entityId, tagId: targetTagId },
        update: {},
      });
    } else if (entityType === "deal") {
      await db.dealTag.upsert({
        where: { dealId_tagId: { dealId: entityId, tagId: targetTagId } },
        create: { dealId: entityId, tagId: targetTagId },
        update: {},
      });
    }

    return apiSuccess(null, "Tag assigned successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to assign tag",
      500,
    );
  }
}
