import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";

const uploaderSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

// GET /api/v1/attachments?entityType=...&entityId=...
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = (searchParams.get("entityType") || "").toUpperCase();
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return apiError("entityType and entityId parameters are required", 400);
    }

    const attachments = await db.attachment.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        uploadedBy: { select: uploaderSelect },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ attachments });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch attachments",
      500
    );
  }
}
