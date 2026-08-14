import { Router } from "express";
import { db } from "../config/db";
import { resolveTenantId } from "../middleware/tenant";
import { AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET /api/v1/notifications
router.get("/", async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const notifications = await db.notification.findMany({
      where: {
        organizationId: tenantId,
        recipientUserId: userId,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await db.notification.count({
      where: {
        organizationId: tenantId,
        recipientUserId: userId,
        isRead: false,
      },
    });

    return res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});

// PATCH /api/v1/notifications/read-all
router.patch("/read-all", async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const result = await db.notification.updateMany({
      where: {
        organizationId: tenantId,
        recipientUserId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: "All notifications marked as read",
      data: { updatedCount: result.count },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to mark notifications as read" });
  }
});

// PATCH /api/v1/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;
    const notificationId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const existing = await db.notification.findFirst({
      where: {
        id: notificationId,
        organizationId: tenantId,
        recipientUserId: userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    const notification = await db.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return res.json({ success: true, data: { notification } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to mark notification as read" });
  }
});

// DELETE /api/v1/notifications/:id
router.delete("/:id", async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;
    const notificationId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const existing = await db.notification.findFirst({
      where: {
        id: notificationId,
        organizationId: tenantId,
        recipientUserId: userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    await db.notification.delete({ where: { id: notificationId } });

    return res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete notification" });
  }
});

export default router;
