import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { DealStage, ForecastCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
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

    const byStageMap: Record<
      string,
      { count: number; totalValue: number; weightedValue: number }
    > = {};
    const byCategoryMap: Record<
      string,
      { count: number; totalValue: number; weightedValue: number }
    > = {};
    const byOwnerMap: Record<
      string,
      { count: number; totalValue: number; weightedValue: number }
    > = {};
    const byMonthMap: Record<
      string,
      { count: number; totalValue: number; weightedValue: number }
    > = {};

    // Initialize stage map
    Object.values(DealStage).forEach((st) => {
      byStageMap[st] = { count: 0, totalValue: 0, weightedValue: 0 };
    });

    // Initialize forecast category map
    Object.values(ForecastCategory).forEach((cat) => {
      byCategoryMap[cat] = { count: 0, totalValue: 0, weightedValue: 0 };
    });

    deals.forEach((deal) => {
      const val = deal.value || 0;
      const prob = deal.probability ?? 50;
      const weighted = val * (prob / 100);

      totalPipeline += val;
      weightedPipeline += weighted;

      if (deal.stage === DealStage.WON) {
        wonRevenue += val;
      }
      if (deal.stage === DealStage.LOST) {
        lostRevenue += val;
      }

      // Breakdown by Stage
      if (byStageMap[deal.stage]) {
        byStageMap[deal.stage].count += 1;
        byStageMap[deal.stage].totalValue += val;
        byStageMap[deal.stage].weightedValue += weighted;
      }

      // Breakdown by Category
      const cat = deal.forecastCategory || ForecastCategory.OPEN;
      if (byCategoryMap[cat]) {
        byCategoryMap[cat].count += 1;
        byCategoryMap[cat].totalValue += val;
        byCategoryMap[cat].weightedValue += weighted;
      }

      // Breakdown by Owner
      const owner = deal.owner || "Unassigned";
      if (!byOwnerMap[owner]) {
        byOwnerMap[owner] = { count: 0, totalValue: 0, weightedValue: 0 };
      }
      byOwnerMap[owner].count += 1;
      byOwnerMap[owner].totalValue += val;
      byOwnerMap[owner].weightedValue += weighted;

      // Breakdown by Month
      let monthKey = "Unscheduled";
      if (deal.expectedCloseDate) {
        const d = new Date(deal.expectedCloseDate);
        monthKey = d.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      }

      if (!byMonthMap[monthKey]) {
        byMonthMap[monthKey] = { count: 0, totalValue: 0, weightedValue: 0 };
      }
      byMonthMap[monthKey].count += 1;
      byMonthMap[monthKey].totalValue += val;
      byMonthMap[monthKey].weightedValue += weighted;
    });

    const byStage = Object.entries(byStageMap).map(([stage, metrics]) => ({
      stage,
      ...metrics,
    }));

    const byCategory = Object.entries(byCategoryMap).map(([category, metrics]) => ({
      category,
      ...metrics,
    }));

    const byOwner = Object.entries(byOwnerMap).map(([owner, metrics]) => ({
      owner,
      ...metrics,
    }));

    const byMonth = Object.entries(byMonthMap).map(([month, metrics]) => ({
      month,
      ...metrics,
    }));

    return apiSuccess({
      metrics: {
        totalPipeline,
        weightedPipeline,
        wonRevenue,
        lostRevenue,
      },
      breakdowns: {
        byStage,
        byCategory,
        byOwner,
        byMonth,
      },
    });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error generating forecast analytics",
      500,
    );
  }
}
