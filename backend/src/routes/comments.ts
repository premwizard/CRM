import { Router } from "express";
import { db } from "../config/db";
import { resolveTenantId } from "../middleware/tenant";
import { AuthenticatedRequest } from "../middleware/auth";
import { requireWritePermission, normalizeRole } from "../middleware/rbac";
import { createNotification } from "../services/notifications";
import { NotificationType } from "@prisma/client";

const router = Router();

const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

// GET /api/v1/comments?entityType=...&entityId=...
router.get("/", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const entityType = (req.query.entityType as string || "").toUpperCase();
    const entityId = req.query.entityId as string;

    if (!entityType || !entityId) {
      return res.status(400).json({ success: false, error: "entityType and entityId are required" });
    }

    const comments = await db.comment.findMany({
      where: {
        organizationId: tenantId,
        entityType,
        entityId,
      },
      include: {
        author: { select: authorSelect },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json({ success: true, data: { comments } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch comments" });
  }
});

// POST /api/v1/comments
router.post("/", requireWritePermission, async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const { entityType, entityId, content } = req.body;

    if (!entityType || !entityId || !content || !content.trim()) {
      return res.status(400).json({ success: false, error: "entityType, entityId, and content are required" });
    }

    const cleanEntityType = String(entityType).toUpperCase();
    const cleanContent = String(content).trim();

    // 1. Create Comment
    const comment = await db.comment.create({
      data: {
        organizationId: tenantId,
        authorId: userId,
        entityType: cleanEntityType,
        entityId: String(entityId),
        content: cleanContent,
      },
      include: {
        author: { select: authorSelect },
      },
    });

    // 2. Mention Processing & Notification Creation
    try {
      // Find all @mentions in content (e.g. @Prem, @Arun, @user@domain.com)
      const mentionMatches = cleanContent.match(/@([\w.-]+)/g);
      if (mentionMatches && mentionMatches.length > 0) {
        const mentionTokens = mentionMatches.map((m) => m.substring(1).toLowerCase());

        // Fetch organization members to find matching users
        const members = await db.organizationMember.findMany({
          where: { organizationId: tenantId },
          include: { user: true },
        });

        const authorName = comment.author ? `${comment.author.firstName} ${comment.author.lastName}` : "A team member";

        const notifiedUserIds = new Set<string>();

        for (const token of mentionTokens) {
          for (const member of members) {
            const u = member.user;
            if (!u || u.id === userId) continue; // Skip author self-mention

            const firstNameMatch = u.firstName.toLowerCase() === token;
            const lastNameMatch = u.lastName.toLowerCase() === token;
            const fullNameMatch = `${u.firstName}${u.lastName}`.toLowerCase() === token;
            const emailMatch = u.email.toLowerCase().includes(token);

            if (firstNameMatch || lastNameMatch || fullNameMatch || emailMatch) {
              if (!notifiedUserIds.has(u.id)) {
                notifiedUserIds.add(u.id);
                await createNotification({
                  organizationId: tenantId,
                  recipientUserId: u.id,
                  type: NotificationType.COMMENT_MENTION,
                  title: "You were mentioned in a comment",
                  message: `${authorName} mentioned you in a comment on ${cleanEntityType.toLowerCase()}`,
                  entityType: cleanEntityType,
                  entityId: String(entityId),
                });
              }
            }
          }
        }
      }
    } catch {
      // Background mention notification failure handling
    }

    return res.status(201).json({ success: true, data: { comment } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to create comment" });
  }
});

// PUT /api/v1/comments/:id
router.put("/:id", requireWritePermission, async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;
    const userRole = normalizeRole(authReq.user?.role || "SALES_REP");
    const commentId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const existing = await db.comment.findFirst({
      where: { id: commentId, organizationId: tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Comment not found" });
    }

    // Security check: Only author or ADMIN/OWNER can edit
    const isAuthor = existing.authorId === userId;
    const isAdmin = userRole === "ADMIN" || userRole === "OWNER";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, error: "Forbidden: You can only edit your own comments" });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: "Content is required" });
    }

    const updatedComment = await db.comment.update({
      where: { id: commentId },
      data: { content: String(content).trim() },
      include: { author: { select: authorSelect } },
    });

    return res.json({ success: true, data: { comment: updatedComment } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to update comment" });
  }
});

// DELETE /api/v1/comments/:id
router.delete("/:id", requireWritePermission, async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;
    const userRole = normalizeRole(authReq.user?.role || "SALES_REP");
    const commentId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const existing = await db.comment.findFirst({
      where: { id: commentId, organizationId: tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Comment not found" });
    }

    // Security check: Only author or ADMIN/OWNER/MANAGER can delete
    const isAuthor = existing.authorId === userId;
    const isModerator = userRole === "ADMIN" || userRole === "OWNER" || userRole === "MANAGER";

    if (!isAuthor && !isModerator) {
      return res.status(403).json({ success: false, error: "Forbidden: You can only delete your own comments" });
    }

    await db.comment.delete({ where: { id: commentId } });

    return res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete comment" });
  }
});

export default router;
