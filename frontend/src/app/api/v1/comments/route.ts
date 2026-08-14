import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

// GET /api/v1/comments?entityType=...&entityId=...
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = (searchParams.get("entityType") || "").toUpperCase();
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return apiError("entityType and entityId parameters are required", 400);
    }

    const comments = await db.comment.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        author: { select: authorSelect },
      },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess({ comments });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch comments",
      500
    );
  }
}

// POST /api/v1/comments
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const payload = token ? verifyToken(token) : null;

    if (!payload?.userId) {
      return apiError("Unauthorized request", 401);
    }

    const body = await request.json();
    const { entityType, entityId, content } = body;

    if (!entityType || !entityId || !content || !content.trim()) {
      return apiError("entityType, entityId, and content are required", 400);
    }

    const cleanEntityType = String(entityType).toUpperCase();
    const cleanContent = String(content).trim();

    const comment = await db.comment.create({
      data: {
        organizationId: payload.organizationId || "default-org",
        authorId: payload.userId,
        entityType: cleanEntityType,
        entityId: String(entityId),
        content: cleanContent,
      },
      include: {
        author: { select: authorSelect },
      },
    });

    return apiSuccess({ comment }, "Comment posted successfully", 201);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to post comment",
      500
    );
  }
}
