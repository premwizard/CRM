import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/v1/contacts (list + pagination + sorting + filters)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const companyId = searchParams.get("companyId");
    const jobTitle = searchParams.get("jobTitle");
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
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { jobTitle: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    if (companyId) {
      AND.push({ companyId });
    }

    if (jobTitle) {
      AND.push({
        jobTitle: { contains: jobTitle, mode: "insensitive" as const },
      });
    }

    if (tagId) {
      AND.push({ tags: { some: { tagId } } });
    }

    const where = AND.length > 0 ? { AND } : {};

    const allowedSortKeys = ["firstName", "lastName", "email", "createdAt"];
    const orderByKey = allowedSortKeys.includes(sortBy) ? sortBy : "createdAt";

    const [totalItems, contacts] = await Promise.all([
      db.contact.count({ where }),
      db.contact.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { [orderByKey]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    return apiSuccess({
      contacts,
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
      error instanceof Error ? error.message : "Failed to fetch contacts",
      500,
    );
  }
}

// POST /api/v1/contacts (create)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid contact input",
        400,
      );
    }

    const contact = await db.contact.create({
      data: parsed.data,
      include: {
        company: { select: { id: true, name: true } },
      },
    });
    return apiSuccess({ contact }, "Contact created successfully", 201);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to create contact",
      500,
    );
  }
}
