import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";
import { ActivityType } from "@prisma/client";

const noteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
  createdBy: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
});

// GET /api/v1/notes (list filtered by entity + sort order)
export async function GET(request: NextRequest) {
  try {
    const contactId = request.nextUrl.searchParams.get("contactId");
    const companyId = request.nextUrl.searchParams.get("companyId");
    const leadId = request.nextUrl.searchParams.get("leadId");
    const dealId = request.nextUrl.searchParams.get("dealId");
    const sort = request.nextUrl.searchParams.get("sort") || "newest";

    const AND: Record<string, unknown>[] = [];
    if (contactId) AND.push({ contactId });
    if (companyId) AND.push({ companyId });
    if (leadId) AND.push({ leadId });
    if (dealId) AND.push({ dealId });

    const where = AND.length > 0 ? { AND } : {};
    const orderBy = sort === "oldest" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };

    const notes = await db.note.findMany({
      where,
      orderBy,
    });

    return apiSuccess({ notes });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch notes",
      500,
    );
  }
}

// POST /api/v1/notes (create note & log activity timeline)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = noteSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid note data",
        400,
      );
    }

    const headerUserEmail = request.headers.get("x-user-email");
    const createdBy = parsed.data.createdBy || headerUserEmail || "System User";

    // 1. Create note in DB
    const note = await db.note.create({
      data: {
        content: parsed.data.content.trim(),
        createdBy,
        contactId: parsed.data.contactId || null,
        companyId: parsed.data.companyId || null,
        leadId: parsed.data.leadId || null,
        dealId: parsed.data.dealId || null,
      },
    });

    // 2. Also log a NOTE entry to Activity Timeline where appropriate
    try {
      const summaryTitle =
        parsed.data.content.length > 60
          ? parsed.data.content.substring(0, 60) + "..."
          : parsed.data.content;

      await db.activity.create({
        data: {
          title: `Added note: "${summaryTitle}"`,
          type: ActivityType.NOTE,
          description: parsed.data.content,
          performedBy: createdBy,
          contactId: parsed.data.contactId || null,
          companyId: parsed.data.companyId || null,
          leadId: parsed.data.leadId || null,
          dealId: parsed.data.dealId || null,
        },
      });
    } catch {
      // Ignore background timeline log errors
    }

    return apiSuccess({ note }, "Note created successfully", 201);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to create note",
      500,
    );
  }
}
