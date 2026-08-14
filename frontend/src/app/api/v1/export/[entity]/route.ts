import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";

// GET /api/v1/export/[entity]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const { entity } = await params;
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const stage = searchParams.get("stage") || "";
    const industry = searchParams.get("industry") || "";
    const tagId = searchParams.get("tagId") || "";
    const companyId = searchParams.get("companyId") || "";
    const source = searchParams.get("source") || "";

    const filename = `${entity}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    let rows: Record<string, unknown>[] = [];

    if (entity === "contacts") {
      const AND: Record<string, unknown>[] = [];
      if (search) {
        AND.push({
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { jobTitle: { contains: search, mode: "insensitive" as const } },
          ],
        });
      }
      if (companyId) AND.push({ companyId });
      if (tagId) AND.push({ tags: { some: { tagId } } });

      const where = AND.length > 0 ? { AND } : {};
      const contacts = await db.contact.findMany({
        where,
        include: {
          company: { select: { name: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      rows = contacts.map((c) => ({
        "First Name": c.firstName,
        "Last Name": c.lastName,
        Email: c.email,
        Phone: c.phone || "",
        "Job Title": c.jobTitle || "",
        Company: c.company?.name || "",
        Owner: c.owner || "",
        Tags: c.tags?.map((t) => t.tag.name).join("; ") || "",
        Notes: c.notes || "",
        "Created At": c.createdAt.toISOString(),
      }));
    } else if (entity === "companies") {
      const AND: Record<string, unknown>[] = [];
      if (search) {
        AND.push({
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { industry: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        });
      }
      if (industry) AND.push({ industry });
      if (tagId) AND.push({ tags: { some: { tagId } } });

      const where = AND.length > 0 ? { AND } : {};
      const companies = await db.company.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          _count: { select: { contacts: true, deals: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      rows = companies.map((c) => ({
        Name: c.name,
        Industry: c.industry || "",
        Website: c.website || "",
        Email: c.email || "",
        Phone: c.phone || "",
        Address: c.address || "",
        Contacts: c._count.contacts,
        Deals: c._count.deals,
        Tags: c.tags?.map((t) => t.tag.name).join("; ") || "",
        Notes: c.notes || "",
        "Created At": c.createdAt.toISOString(),
      }));
    } else if (entity === "leads") {
      const AND: Record<string, unknown>[] = [];
      if (search) {
        AND.push({
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { company: { contains: search, mode: "insensitive" as const } },
          ],
        });
      }
      if (status) AND.push({ status });
      if (source) AND.push({ source });
      if (tagId) AND.push({ tags: { some: { tagId } } });

      const where = AND.length > 0 ? { AND } : {};
      const leads = await db.lead.findMany({
        where,
        include: { tags: { include: { tag: true } } },
        orderBy: { createdAt: "desc" },
      });

      rows = leads.map((l) => ({
        Name: l.name,
        Email: l.email || "",
        Phone: l.phone || "",
        Company: l.company || "",
        Source: l.source,
        Status: l.status,
        "Estimated Value": l.value,
        Owner: l.owner || "",
        Tags: l.tags?.map((t) => t.tag.name).join("; ") || "",
        Notes: l.notes || "",
        "Created At": l.createdAt.toISOString(),
      }));
    } else if (entity === "deals") {
      const AND: Record<string, unknown>[] = [];
      if (search) AND.push({ name: { contains: search, mode: "insensitive" as const } });
      if (stage) AND.push({ stage });
      if (tagId) AND.push({ tags: { some: { tagId } } });

      const where = AND.length > 0 ? { AND } : {};
      const deals = await db.deal.findMany({
        where,
        include: {
          company: { select: { name: true } },
          contact: { select: { firstName: true, lastName: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      rows = deals.map((d) => ({
        Name: d.name,
        Value: d.value,
        Stage: d.stage,
        "Probability (%)": d.probability ?? 50,
        "Forecast Category": d.forecastCategory,
        Owner: d.owner || "",
        Company: d.company?.name || "",
        Contact: d.contact ? `${d.contact.firstName} ${d.contact.lastName}` : "",
        Tags: d.tags?.map((t) => t.tag.name).join("; ") || "",
        "Created At": d.createdAt.toISOString(),
      }));
    } else {
      return apiError("Invalid entity for export", 400);
    }

    if (rows.length === 0) {
      return apiSuccess({
        filename,
        csvContent: "",
        totalRecords: 0,
      });
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const val = r[h] === null || r[h] === undefined ? "" : String(r[h]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ];

    return apiSuccess({
      filename,
      csvContent: csvLines.join("\n"),
      totalRecords: rows.length,
    });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Export failed",
      500
    );
  }
}
