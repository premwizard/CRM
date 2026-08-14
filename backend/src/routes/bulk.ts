import { Router } from "express";
import { db } from "../config/db";
import { LeadStatus, DealStage, ForecastCategory, ActivityType } from "@prisma/client";

const router = Router();

const defaultProbabilityForStage = (stage: DealStage): number => {
  switch (stage) {
    case DealStage.NEW:
      return 10;
    case DealStage.QUALIFIED:
      return 30;
    case DealStage.PROPOSAL:
      return 60;
    case DealStage.NEGOTIATION:
      return 80;
    case DealStage.WON:
      return 100;
    case DealStage.LOST:
      return 0;
    default:
      return 50;
  }
};

const defaultCategoryForStage = (stage: DealStage): ForecastCategory => {
  switch (stage) {
    case DealStage.WON:
    case DealStage.LOST:
      return ForecastCategory.CLOSED;
    case DealStage.NEGOTIATION:
    case DealStage.PROPOSAL:
      return ForecastCategory.COMMIT;
    default:
      return ForecastCategory.OPEN;
  }
};

// ==========================================
// POST /api/v1/bulk/contacts
// ==========================================
router.post("/contacts", async (req, res) => {
  try {
    const { action, ids, data } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: "No contact IDs provided" });
    }

    if (!action) {
      return res.status(400).json({ success: false, error: "Action is required" });
    }

    // 1. Export Action
    if (action === "export") {
      const contacts = await db.contact.findMany({
        where: { id: { in: ids } },
        include: {
          company: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
      });
      return res.json({
        success: true,
        data: {
          action: "export",
          total: contacts.length,
          contacts,
        },
      });
    }

    // 2. Assign Owner
    if (action === "assign-owner") {
      const { owner } = data || {};
      const ownerValue = owner !== undefined ? owner : null;

      const result = await db.contact.updateMany({
        where: { id: { in: ids } },
        data: { owner: ownerValue },
      });

      return res.json({
        success: true,
        data: {
          action: "assign-owner",
          successCount: result.count,
          failureCount: 0,
        },
      });
    }

    // 3. Add Tag
    if (action === "add-tag") {
      const { tagId, tagName, color } = data || {};
      let targetTagId = tagId;

      if (!targetTagId && tagName) {
        const nameClean = tagName.trim();
        let existingTag = await db.tag.findUnique({ where: { name: nameClean } });
        if (!existingTag) {
          existingTag = await db.tag.create({
            data: { name: nameClean, color: color || "#3B82F6" },
          });
        }
        targetTagId = existingTag.id;
      }

      if (!targetTagId) {
        return res.status(400).json({ success: false, error: "Tag ID or Tag Name is required" });
      }

      let successCount = 0;
      let failureCount = 0;
      const errors: { id: string; error: string }[] = [];

      await db.$transaction(async (tx) => {
        for (const contactId of ids) {
          try {
            await tx.contactTag.upsert({
              where: { contactId_tagId: { contactId, tagId: targetTagId } },
              create: { contactId, tagId: targetTagId },
              update: {},
            });
            successCount++;
          } catch (err) {
            failureCount++;
            errors.push({ id: contactId, error: err instanceof Error ? err.message : "Failed to add tag" });
          }
        }
      });

      return res.json({
        success: true,
        data: { action: "add-tag", successCount, failureCount, errors },
      });
    }

    // 4. Remove Tag
    if (action === "remove-tag") {
      const { tagId } = data || {};
      if (!tagId) {
        return res.status(400).json({ success: false, error: "Tag ID is required" });
      }

      const result = await db.contactTag.deleteMany({
        where: {
          contactId: { in: ids },
          tagId: tagId,
        },
      });

      return res.json({
        success: true,
        data: {
          action: "remove-tag",
          successCount: result.count,
          failureCount: 0,
        },
      });
    }

    // 5. Delete Contacts
    if (action === "delete") {
      const result = await db.contact.deleteMany({
        where: { id: { in: ids } },
      });

      return res.json({
        success: true,
        data: {
          action: "delete",
          successCount: result.count,
          failureCount: 0,
        },
      });
    }

    return res.status(400).json({ success: false, error: `Invalid action '${action}' for Contacts` });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Bulk contact action failed",
    });
  }
});

// ==========================================
// POST /api/v1/bulk/leads
// ==========================================
router.post("/leads", async (req, res) => {
  try {
    const { action, ids, data } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: "No lead IDs provided" });
    }

    if (!action) {
      return res.status(400).json({ success: false, error: "Action is required" });
    }

    // 1. Export Action
    if (action === "export") {
      const leads = await db.lead.findMany({
        where: { id: { in: ids } },
        include: {
          tags: { include: { tag: true } },
          convertedCompany: { select: { id: true, name: true } },
          convertedContact: { select: { id: true, firstName: true, lastName: true } },
          convertedDeal: { select: { id: true, name: true } },
        },
      });
      return res.json({
        success: true,
        data: {
          action: "export",
          total: leads.length,
          leads,
        },
      });
    }

    // 2. Change Status
    if (action === "change-status") {
      const { status } = data || {};
      if (!status || !Object.values(LeadStatus).includes(status as LeadStatus)) {
        return res.status(400).json({ success: false, error: "Valid lead status is required" });
      }

      const result = await db.lead.updateMany({
        where: { id: { in: ids } },
        data: { status: status as LeadStatus },
      });

      return res.json({
        success: true,
        data: {
          action: "change-status",
          successCount: result.count,
          failureCount: 0,
        },
      });
    }

    // 3. Assign Owner
    if (action === "assign-owner") {
      const { owner } = data || {};
      const ownerValue = owner !== undefined ? owner : null;

      const result = await db.lead.updateMany({
        where: { id: { in: ids } },
        data: { owner: ownerValue },
      });

      return res.json({
        success: true,
        data: {
          action: "assign-owner",
          successCount: result.count,
          failureCount: 0,
        },
      });
    }

    // 4. Add Tag
    if (action === "add-tag") {
      const { tagId, tagName, color } = data || {};
      let targetTagId = tagId;

      if (!targetTagId && tagName) {
        const nameClean = tagName.trim();
        let existingTag = await db.tag.findUnique({ where: { name: nameClean } });
        if (!existingTag) {
          existingTag = await db.tag.create({
            data: { name: nameClean, color: color || "#3B82F6" },
          });
        }
        targetTagId = existingTag.id;
      }

      if (!targetTagId) {
        return res.status(400).json({ success: false, error: "Tag ID or Tag Name is required" });
      }

      let successCount = 0;
      let failureCount = 0;
      const errors: { id: string; error: string }[] = [];

      await db.$transaction(async (tx) => {
        for (const leadId of ids) {
          try {
            await tx.leadTag.upsert({
              where: { leadId_tagId: { leadId, tagId: targetTagId } },
              create: { leadId, tagId: targetTagId },
              update: {},
            });
            successCount++;
          } catch (err) {
            failureCount++;
            errors.push({ id: leadId, error: err instanceof Error ? err.message : "Failed to add tag" });
          }
        }
      });

      return res.json({
        success: true,
        data: { action: "add-tag", successCount, failureCount, errors },
      });
    }

    // 5. Delete Leads
    if (action === "delete") {
      const result = await db.lead.deleteMany({
        where: { id: { in: ids } },
      });

      return res.json({
        success: true,
        data: {
          action: "delete",
          successCount: result.count,
          failureCount: 0,
        },
      });
    }

    return res.status(400).json({ success: false, error: `Invalid action '${action}' for Leads` });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Bulk lead action failed",
    });
  }
});

// ==========================================
// POST /api/v1/bulk/deals
// ==========================================
router.post("/deals", async (req, res) => {
  try {
    const { action, ids, data } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: "No deal IDs provided" });
    }

    if (!action) {
      return res.status(400).json({ success: false, error: "Action is required" });
    }

    // 1. Change Stage
    if (action === "change-stage") {
      const { stage } = data || {};
      if (!stage || !Object.values(DealStage).includes(stage as DealStage)) {
        return res.status(400).json({ success: false, error: "Valid deal stage is required" });
      }

      const targetStage = stage as DealStage;
      const targetProbability = defaultProbabilityForStage(targetStage);
      const targetCategory = defaultCategoryForStage(targetStage);

      let successCount = 0;
      let failureCount = 0;
      const errors: { id: string; error: string }[] = [];

      await db.$transaction(async (tx) => {
        for (const dealId of ids) {
          try {
            const existingDeal = await tx.deal.findUnique({ where: { id: dealId } });
            if (!existingDeal) {
              failureCount++;
              errors.push({ id: dealId, error: "Deal not found" });
              continue;
            }

            const updatedDeal = await tx.deal.update({
              where: { id: dealId },
              data: {
                stage: targetStage,
                probability: targetProbability,
                forecastCategory: targetCategory,
              },
            });

            if (existingDeal.stage !== targetStage) {
              await tx.dealStageHistory.create({
                data: {
                  dealId,
                  fromStage: existingDeal.stage,
                  toStage: targetStage,
                  changedBy: req.body.owner || "Bulk Action System",
                },
              });

              await tx.activity.create({
                data: {
                  title: `Bulk Stage Change: ${existingDeal.stage} → ${targetStage}`,
                  type: ActivityType.TASK,
                  description: `Deal "${updatedDeal.name}" stage updated via bulk action to ${targetStage}`,
                  performedBy: req.body.owner || "Bulk Action System",
                  dealId,
                  companyId: updatedDeal.companyId || null,
                  contactId: updatedDeal.contactId || null,
                },
              });
            }
            successCount++;
          } catch (err) {
            failureCount++;
            errors.push({ id: dealId, error: err instanceof Error ? err.message : "Failed to change stage" });
          }
        }
      });

      return res.json({
        success: true,
        data: { action: "change-stage", successCount, failureCount, errors },
      });
    }

    // 2. Assign Owner
    if (action === "assign-owner") {
      const { owner } = data || {};
      const ownerValue = owner !== undefined ? owner : null;

      const result = await db.deal.updateMany({
        where: { id: { in: ids } },
        data: { owner: ownerValue },
      });

      return res.json({
        success: true,
        data: {
          action: "assign-owner",
          successCount: result.count,
          failureCount: 0,
        },
      });
    }

    // 3. Add Tag
    if (action === "add-tag") {
      const { tagId, tagName, color } = data || {};
      let targetTagId = tagId;

      if (!targetTagId && tagName) {
        const nameClean = tagName.trim();
        let existingTag = await db.tag.findUnique({ where: { name: nameClean } });
        if (!existingTag) {
          existingTag = await db.tag.create({
            data: { name: nameClean, color: color || "#3B82F6" },
          });
        }
        targetTagId = existingTag.id;
      }

      if (!targetTagId) {
        return res.status(400).json({ success: false, error: "Tag ID or Tag Name is required" });
      }

      let successCount = 0;
      let failureCount = 0;
      const errors: { id: string; error: string }[] = [];

      await db.$transaction(async (tx) => {
        for (const dealId of ids) {
          try {
            await tx.dealTag.upsert({
              where: { dealId_tagId: { dealId, tagId: targetTagId } },
              create: { dealId, tagId: targetTagId },
              update: {},
            });
            successCount++;
          } catch (err) {
            failureCount++;
            errors.push({ id: dealId, error: err instanceof Error ? err.message : "Failed to add tag" });
          }
        }
      });

      return res.json({
        success: true,
        data: { action: "add-tag", successCount, failureCount, errors },
      });
    }

    return res.status(400).json({ success: false, error: `Invalid action '${action}' for Deals` });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Bulk deal action failed",
    });
  }
});

export default router;
