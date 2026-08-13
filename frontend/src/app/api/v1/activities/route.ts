import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";
import { ActivityType } from "@prisma/client";

const activitySchema = z.object({
  title: z.string().min(1, "Activity title is required"),
  type: z.nativeEnum(ActivityType).default(ActivityType.NOTE),
  description: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  performedBy: z.string().optional().nullable(),
});

// GET /api/v1/activities (list + search + type + entity filters)
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") || "";
    const type = request.nextUrl.searchParams.get("type");
    const contactId = request.nextUrl.searchParams.get("contactId");
    const companyId = request.nextUrl.searchParams.get("companyId");
    const leadId = request.nextUrl.searchParams.get("leadId");
    const dealId = request.nextUrl.searchParams.get("dealId");

    const AND: Record<string, unknown>[] = [];

    if (search) {
      AND.push({
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    if (type && Object.values(ActivityType).includes(type as ActivityType)) {
      AND.push({ type: type as ActivityType });
    }

    if (contactId) AND.push({ contactId });
    if (companyId) AND.push({ companyId });
    if (leadId) AND.push({ leadId });
    if (dealId) AND.push({ dealId });

    const where = AND.length > 0 ? { AND } : {};

    const activities = await db.activity.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ activities });
  } catch (error) {
    console.error("Activities fetch error:", error);
    return apiSuccess({ activities: [] }, "Database query fallback");
  }
}

// POST /api/v1/activities (create)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = activitySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid activity input",
        400,
      );
    }

    const headerUserEmail = request.headers.get("x-user-email");
    const performedBy =
      parsed.data.performedBy || headerUserEmail || "System User";

    const activity = await db.activity.create({
      data: {
        ...parsed.data,
        performedBy,
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } },
      },
    });

    return apiSuccess({ activity }, "Activity logged successfully", 201);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to log activity",
      500,
    );
  }
}
