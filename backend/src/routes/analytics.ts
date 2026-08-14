import { Router } from "express";
import { db } from "../config/db";
import { resolveTenantId } from "../middleware/tenant";
import { AuthenticatedRequest } from "../middleware/auth";
import { normalizeRole } from "../middleware/rbac";
import { DealStage, LeadStatus, TaskStatus } from "@prisma/client";

const router = Router();

const STAGE_WEIGHTS: Record<string, number> = {
  NEW: 0.1,
  QUALIFIED: 0.3,
  PROPOSAL: 0.6,
  NEGOTIATION: 0.8,
  WON: 1.0,
  LOST: 0.0,
};

// Helper: Build date range filter for createdAt
function buildDateFilter(startDate?: any, endDate?: any) {
  if (!startDate && !endDate) return undefined;
  const filter: any = {};
  if (startDate) filter.gte = new Date(startDate as string);
  if (endDate) filter.lte = new Date(endDate as string);
  return filter;
}

// GET /api/v1/analytics/sales
router.get("/sales", async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;
    const userRole = normalizeRole(authReq.user?.role || "SALES_REP");

    const { startDate, endDate, ownerId, dealStage } = req.query;

    const AND: any[] = [{ organizationId: tenantId }];

    // RBAC: SALES_REP only sees their own assigned metrics if restricted
    if (userRole === "SALES_REP" && userId) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { email: true, firstName: true } });
      if (user) {
        AND.push({ owner: { in: [user.email, user.firstName] } });
      }
    } else if (ownerId) {
      AND.push({ owner: String(ownerId) });
    }

    if (dealStage) AND.push({ stage: String(dealStage).toUpperCase() as DealStage });

    const dateFilter = buildDateFilter(startDate, endDate);
    if (dateFilter) AND.push({ createdAt: dateFilter });

    const where = { AND };

    // Fetch deals aggregated metrics
    const [allDeals, agg] = await Promise.all([
      db.deal.findMany({ where }),
      db.deal.aggregate({
        where,
        _count: { id: true },
        _sum: { value: true },
        _avg: { value: true },
      }),
    ]);

    let totalPipeline = 0;
    let weightedPipeline = 0;
    let wonRevenue = 0;
    let lostRevenue = 0;
    let openDealsCount = 0;
    let wonCount = 0;
    let lostCount = 0;
    let totalSalesCycleDays = 0;

    for (const deal of allDeals) {
      const val = Number(deal.value || 0);
      const stageStr = deal.stage.toUpperCase();
      const weight = STAGE_WEIGHTS[stageStr] || 0.1;

      if (stageStr === "WON") {
        wonRevenue += val;
        wonCount++;
        const created = new Date(deal.createdAt).getTime();
        const updated = new Date(deal.updatedAt).getTime();
        const diffDays = Math.max(1, Math.round((updated - created) / (1000 * 60 * 60 * 24)));
        totalSalesCycleDays += diffDays;
      } else if (stageStr === "LOST") {
        lostRevenue += val;
        lostCount++;
      } else {
        totalPipeline += val;
        weightedPipeline += val * weight;
        openDealsCount++;
      }
    }

    const avgDealValue = Number(agg._avg.value || 0);
    const winRate = wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;
    const avgSalesCycleDays = wonCount > 0 ? Math.round(totalSalesCycleDays / wonCount) : 0;

    return res.json({
      success: true,
      data: {
        totalPipeline,
        weightedPipeline,
        wonRevenue,
        lostRevenue,
        openDealsCount,
        totalDealsCount: agg._count.id || 0,
        avgDealValue: Math.round(avgDealValue),
        avgSalesCycleDays,
        winRate: Math.round(winRate * 10) / 10,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch sales analytics" });
  }
});

// GET /api/v1/analytics/leads
router.get("/leads", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const { startDate, endDate, ownerId, leadSource, status } = req.query;

    const AND: any[] = [{ organizationId: tenantId }];

    if (ownerId) AND.push({ owner: String(ownerId) });
    if (leadSource) AND.push({ source: String(leadSource).toUpperCase() });
    if (status) AND.push({ status: String(status).toUpperCase() as LeadStatus });

    const dateFilter = buildDateFilter(startDate, endDate);
    if (dateFilter) AND.push({ createdAt: dateFilter });

    const where = { AND };

    const [totalLeads, byStatusGroup, bySourceGroup] = await Promise.all([
      db.lead.count({ where }),
      db.lead.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      }),
      db.lead.groupBy({
        by: ["source"],
        where,
        _count: { id: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const item of byStatusGroup) {
      statusCounts[item.status] = item._count.id;
    }

    const sourceCounts: Record<string, number> = {};
    for (const item of bySourceGroup) {
      const src = item.source || "OTHER";
      sourceCounts[src] = item._count.id;
    }

    const newLeads = statusCounts["NEW"] || 0;
    const qualifiedLeads = statusCounts["QUALIFIED"] || 0;
    const convertedLeads = statusCounts["CONVERTED"] || 0;
    const lostLeads = statusCounts["LOST"] || 0;

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return res.json({
      success: true,
      data: {
        totalLeads,
        newLeads,
        qualifiedLeads,
        convertedLeads,
        lostLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        byStatus: statusCounts,
        bySource: sourceCounts,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch lead analytics" });
  }
});

// GET /api/v1/analytics/deals
router.get("/deals", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const { startDate, endDate, ownerId } = req.query;

    const AND: any[] = [{ organizationId: tenantId }];
    if (ownerId) AND.push({ owner: String(ownerId) });

    const dateFilter = buildDateFilter(startDate, endDate);
    if (dateFilter) AND.push({ createdAt: dateFilter });

    const where = { AND };

    const [byStageGroup, agg] = await Promise.all([
      db.deal.groupBy({
        by: ["stage"],
        where,
        _count: { id: true },
        _sum: { value: true },
      }),
      db.deal.aggregate({
        where,
        _avg: { value: true },
        _count: { id: true },
      }),
    ]);

    const byStage: Record<string, { count: number; value: number }> = {};
    let wonCount = 0;
    let lostCount = 0;
    let wonValue = 0;
    let lostValue = 0;

    for (const item of byStageGroup) {
      const stage = item.stage;
      const count = item._count.id;
      const value = Number(item._sum.value || 0);

      byStage[stage] = { count, value };

      if (stage === "WON") {
        wonCount += count;
        wonValue += value;
      } else if (stage === "LOST") {
        lostCount += count;
        lostValue += value;
      }
    }

    // Find deals closing this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

    const dealsClosingThisMonth = await db.deal.count({
      where: {
        organizationId: tenantId,
        stage: { notIn: [DealStage.WON, DealStage.LOST] },
        expectedCloseDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    return res.json({
      success: true,
      data: {
        totalDeals: agg._count.id || 0,
        avgDealSize: Math.round(Number(agg._avg.value || 0)),
        byStage,
        wonVsLost: {
          wonCount,
          lostCount,
          wonValue,
          lostValue,
        },
        dealsClosingThisMonth,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch deal analytics" });
  }
});

// GET /api/v1/analytics/team
router.get("/team", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);

    // Fetch team members in organization
    const members = await db.organizationMember.findMany({
      where: { organizationId: tenantId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    const teamPerformance = await Promise.all(
      members.map(async (m) => {
        const name = `${m.user.firstName} ${m.user.lastName}`.trim();
        const email = m.user.email;
        const ownerIdentifiers = [email, name, m.user.firstName];

        const [leadsAssigned, leadsConverted, dealsCreated, dealsWon, dealsLost, wonAgg, pipelineAgg, tasksCompleted] =
          await Promise.all([
            db.lead.count({ where: { organizationId: tenantId, owner: { in: ownerIdentifiers } } }),
            db.lead.count({ where: { organizationId: tenantId, owner: { in: ownerIdentifiers }, status: LeadStatus.CONVERTED } }),
            db.deal.count({ where: { organizationId: tenantId, owner: { in: ownerIdentifiers } } }),
            db.deal.count({ where: { organizationId: tenantId, owner: { in: ownerIdentifiers }, stage: DealStage.WON } }),
            db.deal.count({ where: { organizationId: tenantId, owner: { in: ownerIdentifiers }, stage: DealStage.LOST } }),
            db.deal.aggregate({
              where: { organizationId: tenantId, owner: { in: ownerIdentifiers }, stage: DealStage.WON },
              _sum: { value: true },
            }),
            db.deal.aggregate({
              where: {
                organizationId: tenantId,
                owner: { in: ownerIdentifiers },
                stage: { notIn: [DealStage.WON, DealStage.LOST] },
              },
              _sum: { value: true },
            }),
            db.task.count({ where: { organizationId: tenantId, status: TaskStatus.COMPLETED, assignedTo: { in: ownerIdentifiers } } }),
          ]);

        const revenueWon = Number(wonAgg._sum.value || 0);
        const pipelineValue = Number(pipelineAgg._sum.value || 0);
        const winRate = dealsWon + dealsLost > 0 ? (dealsWon / (dealsWon + dealsLost)) * 100 : 0;

        return {
          userId: m.user.id,
          name,
          email,
          role: m.role,
          leadsAssigned,
          leadsConverted,
          dealsCreated,
          dealsWon,
          revenueWon,
          pipelineValue,
          winRate: Math.round(winRate * 10) / 10,
          tasksCompleted,
        };
      })
    );

    return res.json({ success: true, data: { teamPerformance } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch team analytics" });
  }
});

export default router;
