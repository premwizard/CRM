import { Router } from "express";
import { db } from "../config/db";
import { resolveTenantId } from "../middleware/tenant";
import { AuthenticatedRequest } from "../middleware/auth";
import { normalizeRole } from "../middleware/rbac";
import { logAudit } from "../services/audit";

const router = Router();

const DEFAULT_LEAD_STATUSES = [
  { id: "new", name: "NEW", order: 1, isActive: true },
  { id: "contacted", name: "CONTACTED", order: 2, isActive: true },
  { id: "qualified", name: "QUALIFIED", order: 3, isActive: true },
  { id: "lost", name: "LOST", order: 4, isActive: true },
  { id: "converted", name: "CONVERTED", order: 5, isActive: true },
];

const DEFAULT_LEAD_SOURCES = [
  { id: "website", name: "WEBSITE", order: 1, isActive: true },
  { id: "linkedin", name: "LINKEDIN", order: 2, isActive: true },
  { id: "referral", name: "REFERRAL", order: 3, isActive: true },
  { id: "email", name: "EMAIL", order: 4, isActive: true },
  { id: "advertisement", name: "ADVERTISEMENT", order: 5, isActive: true },
  { id: "cold_call", name: "COLD_CALL", order: 6, isActive: true },
  { id: "other", name: "OTHER", order: 7, isActive: true },
];

const DEFAULT_DEAL_STAGES = [
  { id: "new", name: "NEW", order: 1, probability: 10, isActive: true },
  { id: "qualified", name: "QUALIFIED", order: 2, probability: 30, isActive: true },
  { id: "proposal", name: "PROPOSAL", order: 3, probability: 60, isActive: true },
  { id: "negotiation", name: "NEGOTIATION", order: 4, probability: 80, isActive: true },
  { id: "won", name: "WON", order: 5, probability: 100, isActive: true },
  { id: "lost", name: "LOST", order: 6, probability: 0, isActive: true },
];

const DEFAULT_ACTIVITY_TYPES = [
  { id: "call", name: "CALL", icon: "phone", isActive: true },
  { id: "email", name: "EMAIL", icon: "mail", isActive: true },
  { id: "meeting", name: "MEETING", icon: "calendar", isActive: true },
  { id: "note", name: "NOTE", icon: "file-text", isActive: true },
  { id: "task", name: "TASK", icon: "check-square", isActive: true },
  { id: "other", name: "OTHER", icon: "more-horizontal", isActive: true },
];

const DEFAULT_TASK_PRIORITIES = [
  { id: "low", name: "LOW", level: 1, isActive: true },
  { id: "medium", name: "MEDIUM", level: 2, isActive: true },
  { id: "high", name: "HIGH", level: 3, isActive: true },
  { id: "urgent", name: "URGENT", level: 4, isActive: true },
];

const DEFAULT_TASK_STATUSES = [
  { id: "todo", name: "TODO", order: 1, isActive: true },
  { id: "in_progress", name: "IN_PROGRESS", order: 2, isActive: true },
  { id: "completed", name: "COMPLETED", order: 3, isActive: true },
  { id: "cancelled", name: "CANCELLED", order: 4, isActive: true },
];

// Helper: Ensure user has OWNER or ADMIN role for configuration changes
async function verifyAdminOrOwner(req: any) {
  const authReq = req as unknown as AuthenticatedRequest;
  const role = normalizeRole(authReq.user?.role || "SALES_REP");
  if (role !== "ADMIN" && role !== "OWNER") {
    return false;
  }
  return true;
}

// GET /api/v1/crm-config
router.get("/", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);

    let config = await db.crmConfig.findUnique({
      where: { organizationId: tenantId },
    });

    if (!config) {
      config = await db.crmConfig.create({
        data: {
          organizationId: tenantId,
          companyName: "IC CRM Enterprise",
          currency: "INR",
          timezone: "Asia/Kolkata",
          dateFormat: "DD/MM/YYYY",
          leadStatuses: DEFAULT_LEAD_STATUSES,
          leadSources: DEFAULT_LEAD_SOURCES,
          dealStages: DEFAULT_DEAL_STAGES,
          activityTypes: DEFAULT_ACTIVITY_TYPES,
          taskPriorities: DEFAULT_TASK_PRIORITIES,
          taskStatuses: DEFAULT_TASK_STATUSES,
        },
      });
    }

    const tags = await db.tag.findMany({
      where: { organizationId: tenantId },
      orderBy: { name: "asc" },
    });

    return res.json({ success: true, data: { config, tags } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch CRM configuration" });
  }
});

// PUT /api/v1/crm-config
router.put("/", async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;

    const isAuthorized = await verifyAdminOrOwner(req);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Only Organization Owners and Administrators can modify CRM settings",
      });
    }

    const {
      companyName,
      currency,
      timezone,
      dateFormat,
      leadStatuses,
      leadSources,
      dealStages,
      activityTypes,
      taskPriorities,
      taskStatuses,
    } = req.body;

    const existing = await db.crmConfig.findUnique({
      where: { organizationId: tenantId },
    });

    // Safety Checks: Deactivating or removing statuses/stages with active records
    if (leadStatuses && Array.isArray(leadStatuses)) {
      const activeStatusNames = leadStatuses.filter((s: any) => s.isActive).map((s: any) => s.name);
      const deactivatedStatuses = Array.isArray(existing?.leadStatuses)
        ? (existing.leadStatuses as any[]).filter((s: any) => s.isActive && !activeStatusNames.includes(s.name))
        : [];

      for (const statusObj of deactivatedStatuses) {
        const count = await db.lead.count({
          where: { organizationId: tenantId, status: statusObj.name as any },
        });
        if (count > 0) {
          return res.status(400).json({
            success: false,
            error: `Cannot deactivate lead status "${statusObj.name}" because ${count} active lead(s) currently use it. Please reassign records first.`,
          });
        }
      }
    }

    const updatedConfig = await db.crmConfig.upsert({
      where: { organizationId: tenantId },
      create: {
        organizationId: tenantId,
        companyName: companyName ? String(companyName).trim() : "IC CRM Enterprise",
        currency: currency ? String(currency).trim() : "INR",
        timezone: timezone ? String(timezone).trim() : "Asia/Kolkata",
        dateFormat: dateFormat ? String(dateFormat).trim() : "DD/MM/YYYY",
        leadStatuses: leadStatuses || DEFAULT_LEAD_STATUSES,
        leadSources: leadSources || DEFAULT_LEAD_SOURCES,
        dealStages: dealStages || DEFAULT_DEAL_STAGES,
        activityTypes: activityTypes || DEFAULT_ACTIVITY_TYPES,
        taskPriorities: taskPriorities || DEFAULT_TASK_PRIORITIES,
        taskStatuses: taskStatuses || DEFAULT_TASK_STATUSES,
      },
      update: {
        ...(companyName !== undefined && { companyName: String(companyName).trim() }),
        ...(currency !== undefined && { currency: String(currency).trim() }),
        ...(timezone !== undefined && { timezone: String(timezone).trim() }),
        ...(dateFormat !== undefined && { dateFormat: String(dateFormat).trim() }),
        ...(leadStatuses !== undefined && { leadStatuses }),
        ...(leadSources !== undefined && { leadSources }),
        ...(dealStages !== undefined && { dealStages }),
        ...(activityTypes !== undefined && { activityTypes }),
        ...(taskPriorities !== undefined && { taskPriorities }),
        ...(taskStatuses !== undefined && { taskStatuses }),
      },
    });

    if (userId) {
      try {
        await logAudit({
          organizationId: tenantId,
          userId,
          action: "CRM_CONFIG_UPDATED",
          entityType: "CrmConfig",
          entityId: updatedConfig.id,
          description: "Updated organization CRM configuration and terminology settings",
          oldValues: existing,
          newValues: updatedConfig,
        });
      } catch {
        // Ignore log error
      }
    }

    return res.json({
      success: true,
      message: "CRM configuration updated successfully",
      data: { config: updatedConfig },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to update CRM configuration" });
  }
});

export default router;
