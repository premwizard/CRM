import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { MeetingStatus } from "@prisma/client";

const organizerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

// GET /api/v1/meetings
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const organizerId = searchParams.get("organizerId");
    const status = searchParams.get("status");
    const contactId = searchParams.get("contactId");
    const companyId = searchParams.get("companyId");
    const leadId = searchParams.get("leadId");
    const dealId = searchParams.get("dealId");

    const AND: Record<string, unknown>[] = [];

    if (organizerId) AND.push({ organizerId });
    if (status) AND.push({ status: status.toUpperCase() as MeetingStatus });
    if (contactId) AND.push({ contactId });
    if (companyId) AND.push({ companyId });
    if (leadId) AND.push({ leadId });
    if (dealId) AND.push({ dealId });

    if (startDate || endDate) {
      const timeFilter: Record<string, Date> = {};
      if (startDate) timeFilter.gte = new Date(startDate);
      if (endDate) timeFilter.lte = new Date(endDate);
      AND.push({ startTime: timeFilter });
    }

    const where = AND.length > 0 ? { AND } : {};

    const meetings = await db.meeting.findMany({
      where,
      include: {
        organizer: { select: organizerSelect },
      },
      orderBy: { startTime: "asc" },
    });

    return apiSuccess({ meetings });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch meetings",
      500
    );
  }
}

// POST /api/v1/meetings
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.userId) {
      return apiError("Unauthorized request", 401);
    }

    const body = await request.json();
    const res = await fetch("http://localhost:5000/api/v1/meetings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      return apiError(json.error || "Failed to schedule meeting", res.status || 400);
    }

    return apiSuccess(json.data, "Meeting scheduled successfully", 201);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to schedule meeting",
      500
    );
  }
}
