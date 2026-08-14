import { Router } from "express";
import { db } from "../config/db";
import { resolveTenantId } from "../middleware/tenant";
import { AuthenticatedRequest } from "../middleware/auth";
import { requireWritePermission, normalizeRole } from "../middleware/rbac";
import { createNotification, resolveUserId } from "../services/notifications";
import { logAudit } from "../services/audit";
import { ActivityType, MeetingStatus } from "@prisma/client";

const router = Router();

const organizerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
};

// GET /api/v1/meetings
router.get("/", async (req, res) => {
  try {
    const tenantId = await resolveTenantId(req);
    const { startDate, endDate, organizerId, status, contactId, companyId, leadId, dealId } = req.query;

    const AND: any[] = [{ organizationId: tenantId }];

    if (organizerId) AND.push({ organizerId: String(organizerId) });
    if (status) AND.push({ status: String(status).toUpperCase() as MeetingStatus });
    if (contactId) AND.push({ contactId: String(contactId) });
    if (companyId) AND.push({ companyId: String(companyId) });
    if (leadId) AND.push({ leadId: String(leadId) });
    if (dealId) AND.push({ dealId: String(dealId) });

    if (startDate || endDate) {
      const timeFilter: any = {};
      if (startDate) timeFilter.gte = new Date(startDate as string);
      if (endDate) timeFilter.lte = new Date(endDate as string);
      AND.push({ startTime: timeFilter });
    }

    const meetings = await db.meeting.findMany({
      where: { AND },
      include: {
        organizer: { select: organizerSelect },
      },
      orderBy: { startTime: "asc" },
    });

    return res.json({ success: true, data: { meetings } });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to fetch meetings" });
  }
});

// POST /api/v1/meetings (Schedule Meeting with Conflict Detection)
router.post("/", requireWritePermission, async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const {
      title,
      description,
      startTime,
      endTime,
      location,
      meetingUrl,
      organizerId,
      companyId,
      contactId,
      leadId,
      dealId,
    } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ success: false, error: "Title, startTime, and endTime are required" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ success: false, error: "endTime must be after startTime" });
    }

    const targetOrganizerId = organizerId ? String(organizerId) : userId;

    // 1. Conflict Detection Guard
    const overlappingMeeting = await db.meeting.findFirst({
      where: {
        organizationId: tenantId,
        organizerId: targetOrganizerId,
        status: { notIn: [MeetingStatus.CANCELLED] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    const hasConflict = !!overlappingMeeting;
    const conflictMessage = hasConflict
      ? `Warning: You already have another meeting ("${overlappingMeeting.title}") scheduled during this time.`
      : null;

    // 2. Create Meeting Record
    const meeting = await db.meeting.create({
      data: {
        organizationId: tenantId,
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        startTime: start,
        endTime: end,
        location: location ? String(location).trim() : null,
        meetingUrl: meetingUrl ? String(meetingUrl).trim() : null,
        organizerId: targetOrganizerId,
        companyId: companyId ? String(companyId) : null,
        contactId: contactId ? String(contactId) : null,
        leadId: leadId ? String(leadId) : null,
        dealId: dealId ? String(dealId) : null,
        status: MeetingStatus.SCHEDULED,
      },
      include: {
        organizer: { select: organizerSelect },
      },
    });

    // 3. Automatically Create CRM Activity (Type: MEETING)
    try {
      const organizerName = meeting.organizer
        ? `${meeting.organizer.firstName} ${meeting.organizer.lastName}`
        : "Organizer";

      await db.activity.create({
        data: {
          title: `Scheduled Meeting: "${meeting.title}"`,
          type: ActivityType.MEETING,
          description: `Meeting: ${meeting.title}\nTime: ${start.toLocaleString()} - ${end.toLocaleString()}\nLocation: ${meeting.location || "N/A"}\nURL: ${meeting.meetingUrl || "N/A"}`,
          performedBy: organizerName,
          companyId: meeting.companyId || null,
          contactId: meeting.contactId || null,
          leadId: meeting.leadId || null,
          dealId: meeting.dealId || null,
          organizationId: tenantId,
        },
      });
    } catch {
      // Ignore background log error
    }

    // 4. Create Audit Log Entry
    try {
      await logAudit({
        organizationId: tenantId,
        userId,
        action: "CREATE",
        entityType: "Meeting",
        entityId: meeting.id,
        description: `Scheduled meeting "${meeting.title}"`,
        newValues: meeting,
      });
    } catch {
      // Ignore background log error
    }

    return res.status(201).json({
      success: true,
      data: {
        meeting,
        hasConflict,
        conflictMessage,
      },
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to schedule meeting" });
  }
});

// PUT /api/v1/meetings/:id (Update / Record Outcome & Completion)
router.put("/:id", requireWritePermission, async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;
    const userRole = normalizeRole(authReq.user?.role || "SALES_REP");
    const meetingId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const existing = await db.meeting.findFirst({
      where: { id: meetingId, organizationId: tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Meeting not found" });
    }

    // Security check: Only organizer or ADMIN/OWNER/MANAGER can edit
    const isOrganizer = existing.organizerId === userId;
    const isModerator = userRole === "ADMIN" || userRole === "OWNER" || userRole === "MANAGER";

    if (!isOrganizer && !isModerator) {
      return res.status(403).json({ success: false, error: "Forbidden: You can only edit meetings you own" });
    }

    const {
      title,
      description,
      startTime,
      endTime,
      location,
      meetingUrl,
      status,
      outcome,
      notes,
      nextAction,
    } = req.body;

    const updatedData: any = {};
    if (title !== undefined) updatedData.title = String(title).trim();
    if (description !== undefined) updatedData.description = String(description).trim();
    if (startTime !== undefined) updatedData.startTime = new Date(startTime);
    if (endTime !== undefined) updatedData.endTime = new Date(endTime);
    if (location !== undefined) updatedData.location = String(location).trim();
    if (meetingUrl !== undefined) updatedData.meetingUrl = String(meetingUrl).trim();
    if (status !== undefined) updatedData.status = String(status).toUpperCase() as MeetingStatus;
    if (outcome !== undefined) updatedData.outcome = String(outcome).trim();
    if (notes !== undefined) updatedData.notes = String(notes).trim();
    if (nextAction !== undefined) updatedData.nextAction = String(nextAction).trim();

    const meeting = await db.meeting.update({
      where: { id: meetingId },
      data: updatedData,
      include: { organizer: { select: organizerSelect } },
    });

    try {
      const isStatusChange = status && status !== existing.status;
      await logAudit({
        organizationId: tenantId,
        userId,
        action: isStatusChange ? "STATUS_CHANGE" : "UPDATE",
        entityType: "Meeting",
        entityId: meeting.id,
        description: isStatusChange
          ? `Changed meeting status to ${status}`
          : `Updated meeting "${meeting.title}"`,
        oldValues: existing,
        newValues: meeting,
      });
    } catch {
      // Ignore background log error
    }

    return res.json({ success: true, data: { meeting } });
  } catch (err) {
    return res.status(400).json({ success: false, error: "Failed to update meeting" });
  }
});

// DELETE /api/v1/meetings/:id (Cancel / Delete Meeting)
router.delete("/:id", requireWritePermission, async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;
    const userRole = normalizeRole(authReq.user?.role || "SALES_REP");
    const meetingId = String(req.params.id);

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const existing = await db.meeting.findFirst({
      where: { id: meetingId, organizationId: tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Meeting not found" });
    }

    // Security check: Only organizer or ADMIN/OWNER/MANAGER can delete/cancel
    const isOrganizer = existing.organizerId === userId;
    const isModerator = userRole === "ADMIN" || userRole === "OWNER" || userRole === "MANAGER";

    if (!isOrganizer && !isModerator) {
      return res.status(403).json({ success: false, error: "Forbidden: You can only cancel meetings you own" });
    }

    await db.meeting.delete({ where: { id: meetingId } });

    try {
      await logAudit({
        organizationId: tenantId,
        userId,
        action: "DELETE",
        entityType: "Meeting",
        entityId: meetingId,
        description: `Cancelled meeting "${existing.title}"`,
        oldValues: existing,
      });
    } catch {
      // Ignore log error
    }

    return res.json({ success: true, message: "Meeting cancelled and deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to delete meeting" });
  }
});

export default router;
