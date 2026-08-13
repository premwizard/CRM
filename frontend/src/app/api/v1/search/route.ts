import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  type: "CONTACT" | "COMPANY" | "LEAD" | "DEAL" | "TASK" | "ACTIVITY";
}

// GET /api/v1/search?q=query
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return apiSuccess({
        results: {
          contacts: [],
          companies: [],
          leads: [],
          deals: [],
          tasks: [],
          activities: [],
        },
        totalCount: 0,
      });
    }

    const limit = 5;

    // Search all 6 entities in parallel
    const [contacts, companies, leads, deals, tasks, activities] =
      await Promise.all([
        db.contact.findMany({
          where: {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { phone: { contains: query, mode: "insensitive" } },
              { jobTitle: { contains: query, mode: "insensitive" } },
            ],
          },
          include: { company: { select: { name: true } } },
          take: limit,
        }),
        db.company.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { industry: { contains: query, mode: "insensitive" } },
              { website: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
        }),
        db.lead.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { company: { contains: query, mode: "insensitive" } },
              { notes: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
        }),
        db.deal.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { notes: { contains: query, mode: "insensitive" } },
            ],
          },
          include: { company: { select: { name: true } } },
          take: limit,
        }),
        db.task.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
        }),
        db.activity.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { nextAction: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
        }),
      ]);

    const formattedContacts: SearchResultItem[] = contacts.map((c) => ({
      id: c.id,
      title: `${c.firstName} ${c.lastName}`,
      subtitle: c.company?.name ? `${c.email} • ${c.company.name}` : c.email,
      url: `/contacts/${c.id}`,
      type: "CONTACT",
    }));

    const formattedCompanies: SearchResultItem[] = companies.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.industry ? `${c.industry} Account` : "Company Account",
      url: `/companies/${c.id}`,
      type: "COMPANY",
    }));

    const formattedLeads: SearchResultItem[] = leads.map((l) => ({
      id: l.id,
      title: l.name,
      subtitle: `Status: ${l.status}${l.company ? ` • ${l.company}` : ""}`,
      url: `/leads/${l.id}`,
      type: "LEAD",
    }));

    const formattedDeals: SearchResultItem[] = deals.map((d) => ({
      id: d.id,
      title: d.name,
      subtitle: `Stage: ${d.stage} • $${d.value.toLocaleString()}`,
      url: `/deals/${d.id}`,
      type: "DEAL",
    }));

    const formattedTasks: SearchResultItem[] = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: `Priority: ${t.priority} • Status: ${t.status}`,
      url: `/tasks`,
      type: "TASK",
    }));

    const formattedActivities: SearchResultItem[] = activities.map((a) => ({
      id: a.id,
      title: a.title,
      subtitle: `Type: ${a.type}${a.outcome ? ` • ${a.outcome}` : ""}`,
      url: `/activities`,
      type: "ACTIVITY",
    }));

    const totalCount =
      formattedContacts.length +
      formattedCompanies.length +
      formattedLeads.length +
      formattedDeals.length +
      formattedTasks.length +
      formattedActivities.length;

    return apiSuccess({
      results: {
        contacts: formattedContacts,
        companies: formattedCompanies,
        leads: formattedLeads,
        deals: formattedDeals,
        tasks: formattedTasks,
        activities: formattedActivities,
      },
      totalCount,
    });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to execute global search",
      500,
    );
  }
}
