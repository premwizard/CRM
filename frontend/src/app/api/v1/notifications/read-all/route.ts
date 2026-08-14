import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// PATCH /api/v1/notifications/read-all
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.userId) {
      return apiError("Unauthorized request", 401);
    }

    const result = await db.notification.updateMany({
      where: {
        recipientUserId: payload.userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return apiSuccess({ updatedCount: result.count }, "All notifications marked as read");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to mark notifications as read",
      500
    );
  }
}
