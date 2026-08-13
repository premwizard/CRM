import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/v1/companies (list + pagination + sorting + filters)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const industry = searchParams.get("industry");
    const tagId = searchParams.get("tagId");

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
          { industry: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    if (industry) {
      AND.push({
        industry: { contains: industry, mode: "insensitive" as const },
      });
    }

    if (tagId) {
      AND.push({ tags: { some: { tagId } } });
    }

    const where = AND.length > 0 ? { AND } : {};

    const allowedSortKeys = ["name", "industry", "createdAt"];
    const orderByKey = allowedSortKeys.includes(sortBy) ? sortBy : "createdAt";

    const [totalItems, companies] = await Promise.all([
      db.company.count({ where }),
      db.company.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          _count: { select: { contacts: true, deals: true } },
        },
        orderBy: { [orderByKey]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    return apiSuccess({
      companies,
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
      error instanceof Error ? error.message : "Failed to fetch companies",
      500,
    );
  }
}

// POST /api/v1/companies (create)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = companySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid company data",
        400,
      );
    }

    const company = await db.company.create({
      data: parsed.data,
    });
    return apiSuccess({ company }, "Company created successfully", 201);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to create company",
      500,
    );
  }
}
