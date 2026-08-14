import { Router } from "express";
import { db } from "../config/db";
import { resolveTenantId } from "../middleware/tenant";
import { AuthenticatedRequest } from "../middleware/auth";
import { normalizeRole } from "../middleware/rbac";

const router = Router();

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

// GET /api/v1/audit-logs
router.get("/", async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;
    const userRole = normalizeRole(authReq.user?.role || "SALES_REP");

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    // Role-based authorization: Only OWNER, ADMIN, and MANAGER roles can access audit logs
    const isAuthorized = userRole === "OWNER" || userRole === "ADMIN" || userRole === "MANAGER";
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Access to audit logs requires OWNER, ADMIN, or MANAGER role",
      });
    }

    const { targetUserId, action, entityType, startDate, endDate } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string || "20", 10)));

    const AND: any[] = [{ organizationId: tenantId }];

    if (targetUserId) {
      AND.push({ userId: String(targetUserId) });
    }

    if (action) {
      AND.push({ action: String(action).toUpperCase() });
    }

    if (entityType) {
      AND.push({ entityType: String(entityType) });
    }

    if (startDate || endDate) {
      const createdAtFilter: any = {};
      if (startDate) createdAtFilter.gte = new Date(startDate as string);
      if (endDate) createdAtFilter.lte = new Date(endDate as string);
      AND.push({ createdAt: createdAtFilter });
    }

    const where = { AND };

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

    return res.json({
      success: true,
      data: {
        auditLogs,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasPreviousPage: page > 1,
          hasNextPage: page < totalPages,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch audit logs" });
  }
});

export default router;
