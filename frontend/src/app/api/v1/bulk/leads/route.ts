import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { LeadStatus } from "@prisma/client";

// POST /api/v1/bulk/leads
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ids, data } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError("No lead IDs provided", 400);
    }

    if (!action) {
      return apiError("Action is required", 400);
    }

    // 1. Export Action
    if (action === "export") {
      const leads = await db.lead.findMany({
        where: { id: { in: ids } },
        include: {
          tags: { include: { tag: true } },
          convertedCompany: { select: { id: true, name: true } },
          convertedContact: { select: { id: true, firstName: true, lastName: true } },
          convertedDeal: { select: { id: true, name: true } },
        },
      });
      return apiSuccess({ action: "export", total: leads.length, leads });
    }

    // 2. Change Status
    if (action === "change-status") {
      const { status } = data || {};
      if (!status || !Object.values(LeadStatus).includes(status as LeadStatus)) {
        return apiError("Valid lead status is required", 400);
      }

      const result = await db.lead.updateMany({
        where: { id: { in: ids } },
        data: { status: status as LeadStatus },
      });

      return apiSuccess(
        { action: "change-status", successCount: result.count, failureCount: 0 },
        "Bulk lead status updated successfully",
      );
    }

    // 3. Assign Owner
    if (action === "assign-owner") {
      const { owner } = data || {};
      const ownerValue = owner !== undefined ? owner : null;

      const result = await db.lead.updateMany({
        where: { id: { in: ids } },
        data: { owner: ownerValue },
      });

      return apiSuccess(
        { action: "assign-owner", successCount: result.count, failureCount: 0 },
        "Bulk lead owner assigned successfully",
      );
    }

    // 4. Add Tag
    if (action === "add-tag") {
      const { tagId, tagName, color } = data || {};
      let targetTagId = tagId;

      if (!targetTagId && tagName) {
        const nameClean = tagName.trim();
        let existingTag = await db.tag.findUnique({ where: { name: nameClean } });
        if (!existingTag) {
          existingTag = await db.tag.create({
            data: { name: nameClean, color: color || "#3B82F6" },
          });
        }
        targetTagId = existingTag.id;
      }

      if (!targetTagId) {
        return apiError("Tag ID or Tag Name is required", 400);
      }

      let successCount = 0;
      let failureCount = 0;
      const errors: { id: string; error: string }[] = [];

      await db.$transaction(async (tx) => {
        for (const leadId of ids) {
          try {
            await tx.leadTag.upsert({
              where: { leadId_tagId: { leadId, tagId: targetTagId } },
              create: { leadId, tagId: targetTagId },
              update: {},
            });
            successCount++;
          } catch (err) {
            failureCount++;
            errors.push({
              id: leadId,
              error: err instanceof Error ? err.message : "Failed to add tag",
            });
          }
        }
      });

      return apiSuccess(
        { action: "add-tag", successCount, failureCount, errors },
        "Bulk tag operation completed",
      );
    }

    // 5. Delete Leads
    if (action === "delete") {
      const result = await db.lead.deleteMany({
        where: { id: { in: ids } },
      });

      return apiSuccess(
        { action: "delete", successCount: result.count, failureCount: 0 },
        "Bulk lead deletion completed",
      );
    }

    return apiError(`Invalid action '${action}' for Leads`, 400);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Bulk lead action failed",
      500,
    );
  }
}
