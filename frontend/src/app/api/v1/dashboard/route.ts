import { apiSuccess, apiError } from '@/lib/api-response';
import { db } from '@/lib/db';

export async function GET() {
  try {
    let totalContacts = 0;
    let totalCompanies = 0;
    let totalLeads = 0;
    let totalDeals = 0;
    let totalDealValue = 0;

    try {
      totalContacts = await db.contact.count();
      totalCompanies = await db.company.count();
      totalLeads = await db.lead.count();
      totalDeals = await db.deal.count();

      const dealAggregate = await db.deal.aggregate({
        _sum: {
          value: true,
        },
      });
      totalDealValue = dealAggregate._sum.value || 0;
    } catch {
      // Return 0 values if database tables are unmigrated
    }

    return apiSuccess({
      metrics: {
        totalContacts,
        totalCompanies,
        totalLeads,
        totalDeals,
        totalDealValue,
      },
    });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : 'Error fetching dashboard metrics', 500);
  }
}
