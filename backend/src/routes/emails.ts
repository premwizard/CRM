import { Router } from "express";
import { db } from "../config/db";
import { resolveTenantId } from "../middleware/tenant";
import { AuthenticatedRequest } from "../middleware/auth";
import { requireWritePermission } from "../middleware/rbac";
import { emailService } from "../services/email";
import { logAudit } from "../services/audit";
import { ActivityType } from "@prisma/client";

const router = Router();

// POST /api/v1/emails/send
router.post("/send", requireWritePermission, async (req, res) => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const tenantId = await resolveTenantId(req);
    const userId = authReq.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized user" });
    }

    const { to, cc, bcc, subject, body, contactId, companyId, leadId, dealId } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ success: false, error: "To, Subject, and Body are required" });
    }

    const cleanTo = String(to).trim();
    const cleanSubject = String(subject).trim();
    const cleanBody = String(body).trim();

    // 1. Dispatch Email via EmailService
    const result = await emailService.sendEmail({
      to: cleanTo,
      cc: cc ? String(cc).trim() : undefined,
      bcc: bcc ? String(bcc).trim() : undefined,
      subject: cleanSubject,
      body: cleanBody,
    });

    if (!result.success || result.status !== "SENT") {
      return res.status(400).json({
        success: false,
        error: result.error || "Failed to send email via email provider",
      });
    }

    // 2. Resolve User Info for PerformedBy field
    const sender = await db.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    const senderName = sender ? `${sender.firstName} ${sender.lastName}`.trim() : "System User";

    // 3. Create CRM Activity (Type: EMAIL)
    let activity = null;
    try {
      activity = await db.activity.create({
        data: {
          title: `Email: ${cleanSubject}`,
          type: ActivityType.EMAIL,
          description: `To: ${cleanTo}\nSubject: ${cleanSubject}\n\n${cleanBody}`,
          performedBy: senderName,
          contactId: contactId ? String(contactId) : null,
          companyId: companyId ? String(companyId) : null,
          leadId: leadId ? String(leadId) : null,
          dealId: dealId ? String(dealId) : null,
          organizationId: tenantId,
        },
      });
    } catch {
      // Ignore background activity creation error
    }

    // 4. Create Audit Log Entry
    try {
      await logAudit({
        organizationId: tenantId,
        userId,
        action: "EMAIL_SENT",
        entityType: "Email",
        entityId: result.messageId || "email_sent",
        description: `Sent email "${cleanSubject}" to ${cleanTo}`,
        metadata: {
          to: cleanTo,
          cc,
          bcc,
          subject: cleanSubject,
          activityId: activity?.id,
        },
      });
    } catch {
      // Ignore background log error
    }

    return res.json({
      success: true,
      message: "Email sent successfully and recorded as CRM activity",
      data: {
        status: "SENT",
        messageId: result.messageId,
        activity,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to process email request",
    });
  }
});

export default router;
