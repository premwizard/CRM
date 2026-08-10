import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";
import { LeadSource, LeadStatus } from "@prisma/client";

const leadSchema = z.object({
  name: z.string().min(1, "Lead name is required"),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  source: z.nativeEnum(LeadSource).default(LeadSource.WEBSITE),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  value: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
});

// GET /api/v1/leads (list + search + status filter)
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") || "";
    const status = request.nextUrl.searchParams.get("status");

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

    if (status && Object.values(LeadStatus).includes(status as LeadStatus)) {
      AND.push({ status: status as LeadStatus });
    }

    const where = AND.length > 0 ? { AND } : {};

    const leads = await db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ leads });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch leads",
      500,
    );
  }
}

// POST /api/v1/leads (create)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid lead data",
        400,
      );
    }

    const lead = await db.lead.create({
      data: parsed.data,
    });

    return apiSuccess({ lead }, "Lead created successfully", 201);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to create lead",
      500,
    );
  }
}
