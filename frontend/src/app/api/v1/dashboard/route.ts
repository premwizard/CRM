import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { TaskStatus } from "@prisma/client";

export async function GET() {
  try {
    let totalContacts = 0;
    let totalCompanies = 0;
    let totalLeads = 0;
    let totalDeals = 0;
    let totalDealValue = 0;
    let todaysFollowUps: any[] = [];

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

      // Query today's follow-ups and active tasks (or tasks with due dates)
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const tasks = await db.task.findMany({
        where: {
          status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        },
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          company: { select: { id: true, name: true } },
          lead: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true, value: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      });

      todaysFollowUps = tasks;
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
      todaysFollowUps,
    });
  } catch (error) {
    return apiError(
      error instanceof Error
        ? error.message
        : "Error fetching dashboard metrics",
      500,
    );
  }
}
