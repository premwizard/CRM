import { Router } from "express";
import { db } from "../config/db";
import { LeadStatus, DealStage } from "@prisma/client";

const router = Router();

// GET /api/v1/leads
router.get("/", async (req, res) => {
  try {
    const search = (req.query.search as string) || "";
    const status = req.query.status as string;

    const AND: Record<string, unknown>[] = [];
    if (search) {
      AND.push({
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { company: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }

    if (status && Object.values(LeadStatus).includes(status as LeadStatus)) {
      AND.push({ status: status as LeadStatus });
    }

    const where = AND.length > 0 ? { AND } : {};
    const leads = await db.lead.findMany({
      where,
      include: {
        convertedCompany: true,
        convertedContact: true,
        convertedDeal: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: { leads } });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch leads" });
  }
});

// GET /api/v1/leads/:id
router.get("/:id", async (req, res) => {
  try {
    const lead = await db.lead.findUnique({
      where: { id: req.params.id },
      include: {
        convertedCompany: true,
        convertedContact: true,
        convertedDeal: true,
      },
    });

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, error: "Lead not found" });
    }

    return res.json({ success: true, data: { lead } });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, error: "Error fetching lead" });
  }
});

// POST /api/v1/leads/:id/convert
router.post("/:id/convert", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existingLead = await db.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return res
        .status(404)
        .json({ success: false, error: "Lead not found" });
    }

    if (
      existingLead.status === LeadStatus.CONVERTED ||
      existingLead.convertedAt
    ) {
      return res
        .status(400)
        .json({ success: false, error: "This lead has already been converted." });
    }

    if (existingLead.status === LeadStatus.LOST) {
      return res.status(400).json({
        success: false,
        error: "Leads with status LOST cannot be converted.",
      });
    }

    const companyMode = body.companyMode || "new";
    const contactMode = body.contactMode || "new";
    const createDeal = body.createDeal ?? true;

    // Duplicate company check
    if (
      companyMode === "new" &&
      body.newCompany?.name &&
      !body.skipDuplicateCompanyCheck
    ) {
      const dup = await db.company.findFirst({
        where: {
          name: { equals: body.newCompany.name.trim(), mode: "insensitive" },
        },
      });
      if (dup) {
        return res.status(409).json({
          success: false,
          error: `A company named '${dup.name}' already exists.`,
        });
      }
    }

    const result = await db.$transaction(async (tx) => {
      let createdCompany = null;
      let companyIdToLink: string | null = null;

      if (companyMode === "new" && body.newCompany) {
        createdCompany = await tx.company.create({
          data: {
            name: body.newCompany.name.trim(),
            industry: body.newCompany.industry || null,
            website: body.newCompany.website || null,
            email: body.newCompany.email || null,
            phone: body.newCompany.phone || null,
            address: body.newCompany.address || null,
            notes: body.newCompany.notes || null,
          },
        });
        companyIdToLink = createdCompany.id;
      } else if (companyMode === "existing" && body.companyId) {
        const found = await tx.company.findUnique({
          where: { id: body.companyId },
        });
        if (!found) throw new Error("Selected company does not exist");
        createdCompany = found;
        companyIdToLink = found.id;
      }

      let createdContact = null;
      let contactIdToLink: string | null = null;

      if (contactMode === "new" && body.newContact) {
        const existingEmail = await tx.contact.findUnique({
          where: { email: body.newContact.email.trim() },
        });
        if (existingEmail) {
          throw new Error(
            `Contact with email '${body.newContact.email}' already exists`,
          );
        }

        createdContact = await tx.contact.create({
          data: {
            firstName: body.newContact.firstName.trim(),
            lastName: body.newContact.lastName.trim(),
            email: body.newContact.email.trim(),
            phone: body.newContact.phone || null,
            jobTitle: body.newContact.jobTitle || null,
            notes: body.newContact.notes || null,
            companyId: companyIdToLink,
          },
        });
        contactIdToLink = createdContact.id;
      } else if (contactMode === "existing" && body.contactId) {
        const found = await tx.contact.findUnique({
          where: { id: body.contactId },
        });
        if (!found) throw new Error("Selected contact does not exist");
        createdContact = found;
        contactIdToLink = found.id;
      }

      let createdDeal = null;
      let dealIdToLink: string | null = null;

      if (createDeal && body.dealData) {
        createdDeal = await tx.deal.create({
          data: {
            name: body.dealData.name.trim(),
            value: body.dealData.value || 0,
            stage: body.dealData.stage || DealStage.QUALIFIED,
            expectedCloseDate: body.dealData.expectedCloseDate
              ? new Date(body.dealData.expectedCloseDate)
              : null,
            notes: body.dealData.notes || null,
            companyId: companyIdToLink,
            contactId: contactIdToLink,
          },
        });
        dealIdToLink = createdDeal.id;
      }

      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: LeadStatus.CONVERTED,
          convertedAt: new Date(),
          convertedCompanyId: companyIdToLink,
          convertedContactId: contactIdToLink,
          convertedDealId: dealIdToLink,
        },
        include: {
          convertedCompany: true,
          convertedContact: true,
          convertedDeal: true,
        },
      });

      return {
        lead: updatedLead,
        company: createdCompany,
        contact: createdContact,
        deal: createdDeal,
      };
    });

    return res.json({
      success: true,
      message: "Lead converted successfully",
      data: result,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : "Failed to convert lead",
    });
  }
});

export default router;
