import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { LeadStatus } from "@prisma/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function parseCsvString(csvText: string, maxRows = 5000) {
  const errors: string[] = [];
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) cleanText = cleanText.slice(1);

  if (!cleanText || !cleanText.trim()) {
    return { headers: [], rows: [], errors: ["CSV file is empty"] };
  }

  const lines: string[][] = [];
  let currentField = "";
  let currentLine: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentLine.push(currentField.trim());
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentLine.push(currentField.trim());
      if (currentLine.some((f) => f !== "")) lines.push(currentLine);
      currentLine = [];
      currentField = "";

      if (lines.length > maxRows + 1) {
        errors.push(`File exceeds limit of ${maxRows} rows`);
        break;
      }
    } else {
      currentField += char;
    }
  }

  if (currentField !== "" || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some((f) => f !== "")) lines.push(currentLine);
  }

  if (inQuotes) errors.push("Malformed CSV: Unclosed quotation mark found");
  if (lines.length === 0) return { headers: [], rows: [], errors: ["No valid data rows found"] };

  const rawHeaders = lines[0];
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, "").trim());
  const rawRows = lines.slice(1);

  const rows: Record<string, string>[] = [];
  rawRows.forEach((rowValues) => {
    const rowObj: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) {
        rowObj[header] = rowValues[index] !== undefined ? rowValues[index] : "";
      }
    });
    rows.push(rowObj);
  });

  return { headers, rows, errors };
}

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

// POST /api/v1/import/validate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity, csvContent } = body;

    if (!entity || !["contacts", "companies", "leads"].includes(entity)) {
      return apiError("Invalid or unsupported import entity", 400);
    }

    if (!csvContent || typeof csvContent !== "string") {
      return apiError("CSV content is required", 400);
    }

    if (Buffer.byteLength(csvContent, "utf8") > MAX_FILE_SIZE_BYTES) {
      return apiError("CSV file exceeds maximum upload size limit of 5MB", 400);
    }

    const parsed = parseCsvString(csvContent);
    if (parsed.errors.length > 0 && parsed.rows.length === 0) {
      return apiError(parsed.errors.join("; "), 400);
    }

    const validationErrors: { rowNumber: number; error: string }[] = [];
    const parsedRows: Array<{
      rowNumber: number;
      data: Record<string, string>;
      isValid: boolean;
      errors: string[];
    }> = [];

    let existingEmails = new Set<string>();
    let existingCompanyNames = new Set<string>();

    if (entity === "contacts") {
      const existing = await db.contact.findMany({ select: { email: true } });
      existingEmails = new Set(existing.map((c) => c.email.toLowerCase()));
    } else if (entity === "companies") {
      const existing = await db.company.findMany({ select: { name: true } });
      existingCompanyNames = new Set(existing.map((c) => c.name.toLowerCase()));
    } else if (entity === "leads") {
      const existing = await db.lead.findMany({
        where: { email: { not: null } },
        select: { email: true },
      });
      existingEmails = new Set(
        existing.map((l) => (l.email ? l.email.toLowerCase() : "")).filter(Boolean)
      );
    }

    const seenInCsvEmails = new Set<string>();
    const seenInCsvCompanies = new Set<string>();

    parsed.rows.forEach((row, index) => {
      const rowNumber = index + 2;
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

        if (email && !EMAIL_REGEX.test(email)) {
          rowErrors.push(`Invalid email format '${email}'`);
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

    return apiSuccess({
      totalRows: parsedRows.length,
      validRowsCount,
      invalidRowsCount,
      headers: parsed.headers,
      validationErrors,
      parsedRows,
    });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Validation failed",
      500
    );
  }
}
