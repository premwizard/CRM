import { Router } from "express";
import { db } from "../config/db";
import { DealStage, ForecastCategory, ActivityType } from "@prisma/client";
import { requireWritePermission, requireDeletePermission } from "../middleware/rbac";

const router = Router();

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

// GET /api/v1/deals/forecast
router.get("/forecast", async (req, res) => {
  try {
    const deals = await db.deal.findMany({
      select: {
        id: true,
        name: true,
        value: true,
        stage: true,
        probability: true,
        forecastCategory: true,
        owner: true,
        expectedCloseDate: true,
      },
    });

    let totalPipeline = 0;
    let weightedPipeline = 0;
    let wonRevenue = 0;
    let lostRevenue = 0;

    deals.forEach((deal) => {
      const val = deal.value || 0;
      const prob = deal.probability ?? 50;
      const weighted = val * (prob / 100);

      totalPipeline += val;
      weightedPipeline += weighted;

      if (deal.stage === DealStage.WON) wonRevenue += val;
      if (deal.stage === DealStage.LOST) lostRevenue += val;
    });

    return res.json({
      success: true,
      data: {
        metrics: {
          totalPipeline,
          weightedPipeline,
          wonRevenue,
          lostRevenue,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to generate forecast" });
  }
});

// GET /api/v1/deals
router.get("/", async (req, res) => {
  try {
    const search = (req.query.search as string) || "";
    const stage = req.query.stage as string;

    const AND: Record<string, unknown>[] = [];
    if (search) {
      AND.push({ name: { contains: search, mode: "insensitive" as const } });
    }
    if (stage) AND.push({ stage });

    const where = AND.length > 0 ? { AND } : {};

    const deals = await db.deal.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        stageHistory: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: { deals } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch deals" });
  }
});

// POST /api/v1/deals
router.post("/", requireWritePermission, async (req, res) => {
  try {
    const { expectedCloseDate, probability, forecastCategory, stage, ...restData } = req.body;
    const calcProb = probability ?? defaultProbabilityForStage(stage || DealStage.NEW);
    const calcCat = forecastCategory ?? defaultCategoryForStage(stage || DealStage.NEW);

    const deal = await db.deal.create({
      data: {
        ...restData,
        stage: stage || DealStage.NEW,
        probability: calcProb,
        forecastCategory: calcCat,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return res.status(201).json({ success: true, data: { deal } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to create deal" });
  }
});

// PUT /api/v1/deals/:id
router.put("/:id", requireWritePermission, async (req, res) => {
  try {
    const id = String(req.params.id);
    const existingDeal = await db.deal.findUnique({ where: { id } });

    if (!existingDeal) {
      return res.status(404).json({ success: false, error: "Deal not found" });
    }

    const { expectedCloseDate, stage, probability, forecastCategory, ...restData } = req.body;

    let updatedProbability = probability;
    if (stage && stage !== existingDeal.stage && probability === undefined) {
      updatedProbability = defaultProbabilityForStage(stage as DealStage);
    }

    let updatedCategory = forecastCategory;
    if (stage && stage !== existingDeal.stage && forecastCategory === undefined) {
      updatedCategory = defaultCategoryForStage(stage as DealStage);
    }

    const deal = await db.deal.update({
      where: { id },
      data: {
        ...restData,
        stage: stage || existingDeal.stage,
        probability: updatedProbability !== undefined ? updatedProbability : existingDeal.probability,
        forecastCategory: updatedCategory !== undefined ? updatedCategory : existingDeal.forecastCategory,
        expectedCloseDate: expectedCloseDate !== undefined
          ? (expectedCloseDate ? new Date(expectedCloseDate) : null)
          : existingDeal.expectedCloseDate,
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (stage && stage !== existingDeal.stage) {
      try {
        await db.dealStageHistory.create({
          data: {
            dealId: id,
            fromStage: existingDeal.stage,
            toStage: stage as DealStage,
            changedBy: req.body.owner || "System User",
          },
        });

        await db.activity.create({
          data: {
            title: `Stage changed: ${existingDeal.stage} → ${stage}`,
            type: ActivityType.TASK,
            description: `Deal "${deal.name}" moved from ${existingDeal.stage} to ${stage}`,
            performedBy: req.body.owner || "System User",
            dealId: id,
            companyId: deal.companyId || null,
            contactId: deal.contactId || null,
          },
        });
      } catch {
        // Ignore background errors
      }
    }

    return res.json({ success: true, data: { deal } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to update deal" });
  }
});

// DELETE /api/v1/deals/:id
router.delete("/:id", requireWritePermission, requireDeletePermission, async (req, res) => {
  try {
    const dealId = String(req.params.id);
    await db.deal.delete({ where: { id: dealId } });
    return res.json({ success: true, message: "Deal deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete deal" });
  }
});

export default router;
