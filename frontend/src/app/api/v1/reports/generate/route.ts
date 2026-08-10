import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type") || "summary";

    let totalContacts = 0;
    let totalCompanies = 0;
    let totalLeads = 0;
    let totalDeals = 0;
    let totalDealValue = 0;
    let leadsByStatus: Record<string, number> = {};
    let dealsByStage: Record<string, number> = {};

    try {
      totalContacts = await db.contact.count();
      totalCompanies = await db.company.count();
      totalLeads = await db.lead.count();
      totalDeals = await db.deal.count();

      const dealAggregate = await db.deal.aggregate({
        _sum: { value: true },
      });
      totalDealValue = dealAggregate._sum.value || 0;

      const leadGroup = await db.lead.groupBy({
        by: ["status"],
        _count: { status: true },
      });
      leadGroup.forEach((g) => {
        leadsByStatus[g.status] = g._count.status;
      });

      const dealGroup = await db.deal.groupBy({
        by: ["stage"],
        _count: { stage: true },
      });
      dealGroup.forEach((g) => {
        dealsByStage[g.stage] = g._count.stage;
      });
    } catch {
      // Return defaults if tables empty
    }

    const generatedAt = new Date().toISOString();

    const report = {
      reportId: "REP-" + Math.floor(100000 + Math.random() * 900000),
      title: "Executive Sales & Pipeline Summary Report",
      generatedAt,
      summary: {
        totalContacts,
        totalCompanies,
        totalLeads,
        totalDeals,
        totalDealValue,
        averageDealValue: totalDeals > 0 ? totalDealValue / totalDeals : 0,
      },
      leadBreakdown: leadsByStatus,
      dealBreakdown: dealsByStage,
      insights: [
        `Active pipeline contains ${totalDeals} deal opportunities with cumulative value of $${totalDealValue.toLocaleString()}.`,
        `Database currently manages ${totalContacts} individual contacts across ${totalCompanies} registered enterprise companies.`,
        `Lead conversion pool holds ${totalLeads} total prospects.`,
      ],
    };

    return apiSuccess({ report }, "Sample report generated successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error generating report",
      500,
    );
  }
}
