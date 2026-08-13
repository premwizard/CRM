import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";
import { DealStage, ActivityType } from "@prisma/client";

const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required").optional(),
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  value: z.number().nonnegative().optional(),
  stage: z.nativeEnum(DealStage).optional(),
  probability: z.number().min(0).max(100).optional(),
  owner: z.string().optional().nullable(),
  expectedCloseDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

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

// GET /api/v1/deals/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const deal = await db.deal.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
        stageHistory: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!deal) {
      return apiError("Deal not found", 404);
    }

    return apiSuccess({ deal });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error fetching deal",
      500,
    );
  }
}

// PUT /api/v1/deals/[id] (update deal with stage transition audit + activity log)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = dealSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid deal data",
        400,
      );
    }

    const existingDeal = await db.deal.findUnique({
      where: { id },
    });

    if (!existingDeal) {
      return apiError("Deal not found", 404);
    }

    const headerUserEmail = request.headers.get("x-user-email");
    const changedBy = body.owner || headerUserEmail || "System User";

    const { expectedCloseDate, stage, probability, ...restData } = parsed.data;

    let updatedProbability = probability;
    if (stage && stage !== existingDeal.stage && probability === undefined) {
      updatedProbability = defaultProbabilityForStage(stage);
    }

    const deal = await db.deal.update({
      where: { id },
      data: {
        ...restData,
        stage: stage || existingDeal.stage,
        probability: updatedProbability !== undefined ? updatedProbability : existingDeal.probability,
        expectedCloseDate: expectedCloseDate !== undefined
          ? (expectedCloseDate ? new Date(expectedCloseDate) : null)
          : existingDeal.expectedCloseDate,
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Check if stage changed -> Record stage history & Activity log
    if (stage && stage !== existingDeal.stage) {
      try {
        await db.dealStageHistory.create({
          data: {
            dealId: id,
            fromStage: existingDeal.stage,
            toStage: stage,
            changedBy,
          },
        });

        await db.activity.create({
          data: {
            title: `Stage changed: ${existingDeal.stage} → ${stage}`,
            type: ActivityType.TASK,
            description: `Deal "${deal.name}" moved from ${existingDeal.stage} to ${stage} by ${changedBy}`,
            performedBy: changedBy,
            dealId: id,
            companyId: deal.companyId || null,
            contactId: deal.contactId || null,
          },
        });
      } catch {
        // Ignore background logging errors
      }
    }

    return apiSuccess({ deal }, "Deal updated successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error updating deal",
      500,
    );
  }
}

// DELETE /api/v1/deals/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await db.deal.delete({
      where: { id },
    });

    return apiSuccess(null, "Deal deleted successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error deleting deal",
      500,
    );
  }
}
