import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// GET /api/v1/notifications
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.userId) {
      return apiError("Unauthorized request", 401);
    }

    const notifications = await db.notification.findMany({
      where: {
        recipientUserId: payload.userId,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await db.notification.count({
      where: {
        recipientUserId: payload.userId,
        isRead: false,
      },
    });

    return apiSuccess({ notifications, unreadCount });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch notifications",
      500
    );
  }
}
