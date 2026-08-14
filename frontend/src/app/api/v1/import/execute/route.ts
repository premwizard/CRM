import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { LeadStatus, LeadSource } from "@prisma/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// POST /api/v1/import/execute
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity, rows, allowPartial } = body;

    if (!entity || !["contacts", "companies", "leads"].includes(entity)) {
      return apiError("Invalid import entity", 400);
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return apiError("No rows provided for import", 400);
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
            if (!allowPartial) throw new Error(`Invalid contact row found: ${JSON.stringify(row)}`);
            continue;
          }

          let companyId: string | null = null;
          if (companyName) {
            let foundComp = await tx.company.findFirst({
              where: { name: { equals: companyName, mode: "insensitive" } },
            });
            if (!foundComp) {
              foundComp = await tx.company.create({ data: { name: companyName } });
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
            },
          });
          importedCount++;
        }
      }
    });

    return apiSuccess({
      importedCount,
      skippedCount,
    }, `Successfully imported ${importedCount} ${entity}`);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Import execution failed",
      400
    );
  }
}
