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

// GET /api/v1/leads (list + server-side pagination + sorting + filters)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const tagId = searchParams.get("tagId");
    const minVal = searchParams.get("minVal");
    const maxVal = searchParams.get("maxVal");

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)),
    );
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder =
      searchParams.get("sortOrder")?.toLowerCase() === "asc" ? "asc" : "desc";

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

    if (source && Object.values(LeadSource).includes(source as LeadSource)) {
      AND.push({ source: source as LeadSource });
    }

    if (tagId) {
      AND.push({ tags: { some: { tagId } } });
    }

    if (minVal) {
      AND.push({ value: { gte: Number(minVal) } });
    }

    if (maxVal) {
      AND.push({ value: { lte: Number(maxVal) } });
    }

    const where = AND.length > 0 ? { AND } : {};

    // Supported sort keys
    const allowedSortKeys = ["name", "value", "status", "source", "createdAt"];
    const orderByKey = allowedSortKeys.includes(sortBy) ? sortBy : "createdAt";

    const [totalItems, leads] = await Promise.all([
      db.lead.count({ where }),
      db.lead.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
        },
        orderBy: { [orderByKey]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    return apiSuccess({
      leads,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
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
