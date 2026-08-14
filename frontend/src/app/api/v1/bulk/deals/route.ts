import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { DealStage, ForecastCategory, ActivityType } from "@prisma/client";

const defaultProbabilityForStage = (stage: DealStage): number => {
  switch (stage) {
    case DealStage.NEW:
      return 10;
    case DealStage.QUALIFIED:
      return 30;
    case DealStage.PROPOSAL:
      return 60;
    case DealStage.NEGOTIATION:
      return 80;
    case DealStage.WON:
      return 100;
    case DealStage.LOST:
      return 0;
    default:
      return 50;
  }
};

const defaultCategoryForStage = (stage: DealStage): ForecastCategory => {
  switch (stage) {
    case DealStage.WON:
    case DealStage.LOST:
      return ForecastCategory.CLOSED;
    case DealStage.NEGOTIATION:
    case DealStage.PROPOSAL:
      return ForecastCategory.COMMIT;
    default:
      return ForecastCategory.OPEN;
  }
};

// POST /api/v1/bulk/deals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ids, data } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError("No deal IDs provided", 400);
    }

    if (!action) {
      return apiError("Action is required", 400);
    }

    // 1. Change Stage
    if (action === "change-stage") {
      const { stage } = data || {};
      if (!stage || !Object.values(DealStage).includes(stage as DealStage)) {
        return apiError("Valid deal stage is required", 400);
      }

      const targetStage = stage as DealStage;
      const targetProbability = defaultProbabilityForStage(targetStage);
      const targetCategory = defaultCategoryForStage(targetStage);

      let successCount = 0;
      let failureCount = 0;
      const errors: { id: string; error: string }[] = [];

      await db.$transaction(async (tx) => {
        for (const dealId of ids) {
          try {
            const existingDeal = await tx.deal.findUnique({ where: { id: dealId } });
            if (!existingDeal) {
              failureCount++;
              errors.push({ id: dealId, error: "Deal not found" });
              continue;
            }

            const updatedDeal = await tx.deal.update({
              where: { id: dealId },
              data: {
                stage: targetStage,
                probability: targetProbability,
                forecastCategory: targetCategory,
              },
            });

            if (existingDeal.stage !== targetStage) {
              await tx.dealStageHistory.create({
                data: {
                  dealId,
                  fromStage: existingDeal.stage,
                  toStage: targetStage,
                  changedBy: data?.owner || "Bulk Action System",
                },
              });

              await tx.activity.create({
                data: {
                  title: `Bulk Stage Change: ${existingDeal.stage} → ${targetStage}`,
                  type: ActivityType.TASK,
                  description: `Deal "${updatedDeal.name}" stage updated via bulk action to ${targetStage}`,
                  performedBy: data?.owner || "Bulk Action System",
                  dealId,
                  companyId: updatedDeal.companyId || null,
                  contactId: updatedDeal.contactId || null,
                },
              });
            }
            successCount++;
          } catch (err) {
            failureCount++;
            errors.push({
              id: dealId,
              error: err instanceof Error ? err.message : "Failed to change stage",
            });
          }
        }
      });

      return apiSuccess(
        { action: "change-stage", successCount, failureCount, errors },
        "Bulk deal stage update completed",
      );
    }

    // 2. Assign Owner
    if (action === "assign-owner") {
      const { owner } = data || {};
      const ownerValue = owner !== undefined ? owner : null;

      const result = await db.deal.updateMany({
        where: { id: { in: ids } },
        data: { owner: ownerValue },
      });

      return apiSuccess(
        { action: "assign-owner", successCount: result.count, failureCount: 0 },
        "Bulk deal owner assigned successfully",
      );
    }

    // 3. Add Tag
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
        for (const dealId of ids) {
          try {
            await tx.dealTag.upsert({
              where: { dealId_tagId: { dealId, tagId: targetTagId } },
              create: { dealId, tagId: targetTagId },
              update: {},
            });
            successCount++;
          } catch (err) {
            failureCount++;
            errors.push({
              id: dealId,
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

    return apiError(`Invalid action '${action}' for Deals`, 400);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Bulk deal action failed",
      500,
    );
  }
}
