import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

// GET /api/v1/audit-logs
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.userId) {
      return apiError("Unauthorized request", 401);
    }

    const userRole = payload.role?.toUpperCase() || "USER";
    if (userRole !== "ADMIN" && userRole !== "OWNER" && userRole !== "MANAGER") {
      return apiError("Forbidden: Access to audit logs requires OWNER, ADMIN, or MANAGER role", 403);
    }

    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get("targetUserId");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const AND: Record<string, unknown>[] = [];

    if (targetUserId) AND.push({ userId: targetUserId });
    if (action) AND.push({ action: action.toUpperCase() });
    if (entityType) AND.push({ entityType });

    if (startDate || endDate) {
      const createdAtFilter: Record<string, Date> = {};
      if (startDate) createdAtFilter.gte = new Date(startDate);
      if (endDate) createdAtFilter.lte = new Date(endDate);
      AND.push({ createdAt: createdAtFilter });
    }

    const where = AND.length > 0 ? { AND } : {};

    const [totalItems, auditLogs] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        include: {
          user: { select: userSelect },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    return apiSuccess({
      auditLogs,
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
      error instanceof Error ? error.message : "Failed to fetch audit logs",
      500
    );
  }
}
