import { Router } from "express";
import { db } from "../config/db";
import { parseCsvString } from "../utils/csv-parser";
import { LeadStatus, LeadSource } from "@prisma/client";
import { resolveTenantId } from "../middleware/tenant";
import { requireWritePermission } from "../middleware/rbac";

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Helper to normalize header names
function getFieldValue(row: Record<string, string>, possibleKeys: string[]): string {
  for (const key of possibleKeys) {
    const foundKey = Object.keys(row).find(
      (k) => k.trim().toLowerCase() === key.toLowerCase()
    );
    if (foundKey && row[foundKey] !== undefined) {
      return row[foundKey].trim();
    }
  }
  return "";
}

// ==========================================
// GET /api/v1/export/:entity
// ==========================================
router.get("/export/:entity", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const { entity } = req.params;
    const { search, status, stage, industry, tagId, companyId, source } = req.query as Record<string, string>;

    let filename = `${entity}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    let rows: Record<string, unknown>[] = [];

    if (entity === "contacts") {
      const AND: Record<string, unknown>[] = [{ organizationId: tenantId }];
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

      const contacts = await db.contact.findMany({
        where: { AND },
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
      const AND: Record<string, unknown>[] = [{ organizationId: tenantId }];
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

      const companies = await db.company.findMany({
        where: { AND },
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
      const AND: Record<string, unknown>[] = [{ organizationId: tenantId }];
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

      const leads = await db.lead.findMany({
        where: { AND },
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
      const AND: Record<string, unknown>[] = [{ organizationId: tenantId }];
      if (search) AND.push({ name: { contains: search, mode: "insensitive" as const } });
      if (stage) AND.push({ stage });
      if (tagId) AND.push({ tags: { some: { tagId } } });

      const deals = await db.deal.findMany({
        where: { AND },
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
      return res.status(400).json({ success: false, error: "Invalid entity for export" });
    }

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          filename,
          csvContent: "",
          totalRecords: 0,
        },
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

    return res.json({
      success: true,
      data: {
        filename,
        csvContent: csvLines.join("\n"),
        totalRecords: rows.length,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Export failed",
    });
  }
});

// ==========================================
// POST /api/v1/import/validate
// ==========================================
router.post("/import/validate", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const { entity, csvContent } = req.body;

    if (!entity || !["contacts", "companies", "leads"].includes(entity)) {
      return res.status(400).json({ success: false, error: "Invalid or unsupported import entity" });
    }

    if (!csvContent || typeof csvContent !== "string") {
      return res.status(400).json({ success: false, error: "CSV content is required" });
    }

    if (Buffer.byteLength(csvContent, "utf8") > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({ success: false, error: "CSV file exceeds maximum upload size limit of 5MB" });
    }

    const parsed = parseCsvString(csvContent);
    if (parsed.errors.length > 0 && parsed.rows.length === 0) {
      return res.status(400).json({ success: false, error: parsed.errors.join("; ") });
    }

    const validationErrors: { rowNumber: number; error: string }[] = [];
    const parsedRows: Array<{
      rowNumber: number;
      data: Record<string, string>;
      isValid: boolean;
      errors: string[];
    }> = [];

    // Pre-fetch existing emails/names for duplicate check scoped to organizationId
    let existingEmails = new Set<string>();
    let existingCompanyNames = new Set<string>();

    if (entity === "contacts") {
      const existing = await db.contact.findMany({
        where: { organizationId: tenantId },
        select: { email: true },
      });
      existingEmails = new Set(existing.map((c) => c.email.toLowerCase()));
    } else if (entity === "companies") {
      const existing = await db.company.findMany({
        where: { organizationId: tenantId },
        select: { name: true },
      });
      existingCompanyNames = new Set(existing.map((c) => c.name.toLowerCase()));
    } else if (entity === "leads") {
      const existing = await db.lead.findMany({
        where: { organizationId: tenantId, email: { not: null } },
        select: { email: true },
      });
      existingEmails = new Set(
        existing.map((l) => (l.email ? l.email.toLowerCase() : "")).filter(Boolean)
      );
    }

    const seenInCsvEmails = new Set<string>();
    const seenInCsvCompanies = new Set<string>();

    parsed.rows.forEach((row, index) => {
      const rowNumber = index + 2; // +1 for 0-index, +1 for header line
      const rowErrors: string[] = [];

      if (entity === "contacts") {
        const firstName = getFieldValue(row, ["firstName", "first name", "firstname", "first"]);
        const lastName = getFieldValue(row, ["lastName", "last name", "lastname", "last"]);
        const email = getFieldValue(row, ["email", "email address", "mail"]);

        if (!firstName) rowErrors.push("Missing required field 'First Name'");
        if (!lastName) rowErrors.push("Missing required field 'Last Name'");

        if (!email) {
          rowErrors.push("Missing required field 'Email'");
        } else if (!EMAIL_REGEX.test(email)) {
          rowErrors.push(`Invalid email format '${email}'`);
        } else {
          const lowerEmail = email.toLowerCase();
          if (existingEmails.has(lowerEmail)) {
            rowErrors.push(`Contact with email '${email}' already exists in database`);
          } else if (seenInCsvEmails.has(lowerEmail)) {
            rowErrors.push(`Duplicate email '${email}' found in CSV file`);
          } else {
            seenInCsvEmails.add(lowerEmail);
          }
        }
      } else if (entity === "companies") {
        const name = getFieldValue(row, ["name", "company name", "company"]);
        if (!name) {
          rowErrors.push("Missing required field 'Company Name'");
        } else {
          const lowerName = name.toLowerCase();
          if (existingCompanyNames.has(lowerName)) {
            rowErrors.push(`Company '${name}' already exists in database`);
          } else if (seenInCsvCompanies.has(lowerName)) {
            rowErrors.push(`Duplicate company name '${name}' found in CSV file`);
          } else {
            seenInCsvCompanies.add(lowerName);
          }
        }
      } else if (entity === "leads") {
        const name = getFieldValue(row, ["name", "lead name", "title", "lead"]);
        const email = getFieldValue(row, ["email", "email address"]);
        const status = getFieldValue(row, ["status", "lead status"]);

        if (!name) rowErrors.push("Missing required field 'Lead Name'");

        if (email) {
          if (!EMAIL_REGEX.test(email)) {
            rowErrors.push(`Invalid email format '${email}'`);
          }
        }

        if (status) {
          const validStatuses = Object.values(LeadStatus);
          if (!validStatuses.includes(status.toUpperCase() as LeadStatus)) {
            rowErrors.push(`Invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}`);
          }
        }
      }

      const isValid = rowErrors.length === 0;
      if (!isValid) {
        rowErrors.forEach((err) => validationErrors.push({ rowNumber, error: err }));
      }

      parsedRows.push({
        rowNumber,
        data: row,
        isValid,
        errors: rowErrors,
      });
    });

    const validRowsCount = parsedRows.filter((r) => r.isValid).length;
    const invalidRowsCount = parsedRows.filter((r) => !r.isValid).length;

    return res.json({
      success: true,
      data: {
        totalRows: parsedRows.length,
        validRowsCount,
        invalidRowsCount,
        headers: parsed.headers,
        validationErrors,
        parsedRows,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Validation failed",
    });
  }
});

// ==========================================
// POST /api/v1/import/execute
// ==========================================
router.post("/import/execute", requireWritePermission, async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const { entity, rows, allowPartial } = req.body;

    if (!entity || !["contacts", "companies", "leads"].includes(entity)) {
      return res.status(400).json({ success: false, error: "Invalid import entity" });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: "No rows provided for import" });
    }

    let importedCount = 0;
    let skippedCount = 0;

    await db.$transaction(async (tx) => {
      if (entity === "contacts") {
        for (const row of rows) {
          const firstName = getFieldValue(row, ["firstName", "first name", "firstname", "first"]);
          const lastName = getFieldValue(row, ["lastName", "last name", "lastname", "last"]);
          const email = getFieldValue(row, ["email", "email address", "mail"]);
          const phone = getFieldValue(row, ["phone", "phone number", "mobile"]);
          const jobTitle = getFieldValue(row, ["jobTitle", "job title", "title"]);
          const companyName = getFieldValue(row, ["company", "company name"]);
          const owner = getFieldValue(row, ["owner", "contact owner"]);
          const notes = getFieldValue(row, ["notes", "note"]);

          if (!firstName || !lastName || !email || !EMAIL_REGEX.test(email)) {
            skippedCount++;
            if (!allowPartial) throw new Error(`Invalid row found: ${JSON.stringify(row)}`);
            continue;
          }

          let companyId: string | null = null;
          if (companyName) {
            let foundComp = await tx.company.findFirst({
              where: { name: { equals: companyName, mode: "insensitive" }, organizationId: tenantId },
            });
            if (!foundComp) {
              foundComp = await tx.company.create({ data: { name: companyName, organizationId: tenantId } });
            }
            companyId = foundComp.id;
          }

          await tx.contact.create({
            data: {
              firstName,
              lastName,
              email: email.toLowerCase(),
              phone: phone || null,
              jobTitle: jobTitle || null,
              companyId,
              owner: owner || null,
              notes: notes || null,
              organizationId: tenantId,
            },
          });
          importedCount++;
        }
      } else if (entity === "companies") {
        for (const row of rows) {
          const name = getFieldValue(row, ["name", "company name", "company"]);
          const industry = getFieldValue(row, ["industry"]);
          const website = getFieldValue(row, ["website", "url"]);
          const email = getFieldValue(row, ["email", "email address"]);
          const phone = getFieldValue(row, ["phone", "phone number"]);
          const address = getFieldValue(row, ["address"]);
          const notes = getFieldValue(row, ["notes", "note"]);

          if (!name) {
            skippedCount++;
            if (!allowPartial) throw new Error(`Invalid company row found: ${JSON.stringify(row)}`);
            continue;
          }

          await tx.company.create({
            data: {
              name,
              industry: industry || null,
              website: website || null,
              email: email || null,
              phone: phone || null,
              address: address || null,
              notes: notes || null,
              organizationId: tenantId,
            },
          });
          importedCount++;
        }
      } else if (entity === "leads") {
        for (const row of rows) {
          const name = getFieldValue(row, ["name", "lead name", "title", "lead"]);
          const email = getFieldValue(row, ["email", "email address"]);
          const phone = getFieldValue(row, ["phone", "phone number"]);
          const company = getFieldValue(row, ["company", "company name"]);
          const sourceRaw = getFieldValue(row, ["source", "lead source"]);
          const statusRaw = getFieldValue(row, ["status", "lead status"]);
          const valueRaw = getFieldValue(row, ["value", "estimated value"]);
          const owner = getFieldValue(row, ["owner", "lead owner"]);
          const notes = getFieldValue(row, ["notes", "note"]);

          if (!name) {
            skippedCount++;
            if (!allowPartial) throw new Error(`Invalid lead row found: ${JSON.stringify(row)}`);
            continue;
          }

          let source: LeadSource = LeadSource.WEBSITE;
          if (sourceRaw && Object.values(LeadSource).includes(sourceRaw.toUpperCase() as LeadSource)) {
            source = sourceRaw.toUpperCase() as LeadSource;
          }

          let status: LeadStatus = LeadStatus.NEW;
          if (statusRaw && Object.values(LeadStatus).includes(statusRaw.toUpperCase() as LeadStatus)) {
            status = statusRaw.toUpperCase() as LeadStatus;
          }

          const value = parseFloat(valueRaw) || 0;

          await tx.lead.create({
            data: {
              name,
              email: email || null,
              phone: phone || null,
              company: company || null,
              source,
              status,
              value,
              owner: owner || null,
              notes: notes || null,
              organizationId: tenantId,
            },
          });
          importedCount++;
        }
      }
    });

    return res.json({
      success: true,
      message: `Successfully imported ${importedCount} ${entity}`,
      data: { importedCount, skippedCount },
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : "Import execution failed",
    });
  }
});

export default router;
