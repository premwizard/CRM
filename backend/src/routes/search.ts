import { Router } from "express";
import { db } from "../config/db";
import { resolveTenantId } from "../middleware/tenant";

const router = Router();

// GET /api/v1/search?q=query
router.get("/", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const query = String(req.query.q || "").trim();

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: {
          results: {
            contacts: [],
            companies: [],
            leads: [],
            deals: [],
            tasks: [],
            activities: [],
          },
          totalCount: 0,
        },
      });
    }

    const limit = 5;

    const [contacts, companies, leads, deals, tasks, activities] =
      await Promise.all([
        db.contact.findMany({
          where: {
            organizationId: tenantId,
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { phone: { contains: query, mode: "insensitive" } },
            ],
          },
          include: { company: { select: { name: true } } },
          take: limit,
        }),
        db.company.findMany({
          where: {
            organizationId: tenantId,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { industry: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
        }),
        db.lead.findMany({
          where: {
            organizationId: tenantId,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { company: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
        }),
        db.deal.findMany({
          where: {
            organizationId: tenantId,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { notes: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
        }),
        db.task.findMany({
          where: {
            organizationId: tenantId,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
        }),
        db.activity.findMany({
          where: {
            organizationId: tenantId,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          take: limit,
        }),
      ]);

    const formattedContacts = contacts.map((c) => ({
      id: c.id,
      title: `${c.firstName} ${c.lastName}`,
      subtitle: c.company?.name ? `${c.email} • ${c.company.name}` : c.email,
      url: `/contacts/${c.id}`,
      type: "CONTACT",
    }));

    const formattedCompanies = companies.map((c) => ({
      id: c.id,
      title: c.name,
      subtitle: c.industry || "Company Account",
      url: `/companies/${c.id}`,
      type: "COMPANY",
    }));

    const formattedLeads = leads.map((l) => ({
      id: l.id,
      title: l.name,
      subtitle: `Status: ${l.status}`,
      url: `/leads/${l.id}`,
      type: "LEAD",
    }));

    const formattedDeals = deals.map((d) => ({
      id: d.id,
      title: d.name,
      subtitle: `Stage: ${d.stage} • $${d.value}`,
      url: `/deals/${d.id}`,
      type: "DEAL",
    }));

    const formattedTasks = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      subtitle: `Priority: ${t.priority}`,
      url: `/tasks`,
      type: "TASK",
    }));

    const formattedActivities = activities.map((a) => ({
      id: a.id,
      title: a.title,
      subtitle: `Type: ${a.type}`,
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

    return res.json({
      success: true,
      data: {
        results: {
          contacts: formattedContacts,
          companies: formattedCompanies,
          leads: formattedLeads,
          deals: formattedDeals,
          tasks: formattedTasks,
          activities: formattedActivities,
        },
        totalCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to execute search" });
  }
});

export default router;
