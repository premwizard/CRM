import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";
import { DealStage, LeadStatus } from "@prisma/client";

const convertSchema = z.object({
  companyMode: z.enum(["new", "existing", "none"]).default("new"),
  companyId: z.string().optional().nullable(),
  newCompany: z
    .object({
      name: z.string().min(1, "Company name is required"),
      industry: z.string().optional().nullable(),
      website: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  skipDuplicateCompanyCheck: z.boolean().optional().default(false),

  contactMode: z.enum(["new", "existing", "none"]).default("new"),
  contactId: z.string().optional().nullable(),
  newContact: z
    .object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: z.string().min(1, "Contact email is required"),
      phone: z.string().optional().nullable(),
      jobTitle: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),

  createDeal: z.boolean().default(true),
  dealData: z
    .object({
      name: z.string().min(1, "Deal name is required"),
      value: z.number().nonnegative("Value must be non-negative").default(0),
      stage: z.nativeEnum(DealStage).default(DealStage.QUALIFIED),
      expectedCloseDate: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

// POST /api/v1/leads/[id]/convert
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Auth check
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    const headerUserId = request.headers.get("x-user-id");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : cookieToken;

    if (!token && !headerUserId) {
      return apiError("Authentication required. Token missing.", 401);
    }

    if (token) {
      const payload = verifyToken(token);
      if (!payload) {
        return apiError("Invalid or expired token.", 401);
      }
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = convertSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid conversion payload",
        400,
      );
    }

    const data = parsed.data;

    // 2. Fetch existing lead
    const existingLead = await db.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return apiError("Lead not found", 404);
    }

    // Check duplicate conversion
    if (
      existingLead.status === LeadStatus.CONVERTED ||
      existingLead.convertedAt
    ) {
      return apiError("This lead has already been converted.", 400);
    }

    // Check valid status
    if (existingLead.status === LeadStatus.LOST) {
      return apiError("Leads with status LOST cannot be converted.", 400);
    }

    const allowedStatuses: LeadStatus[] = [
      LeadStatus.NEW,
      LeadStatus.CONTACTED,
      LeadStatus.QUALIFIED,
    ];
    if (!allowedStatuses.includes(existingLead.status)) {
      return apiError(
        `Lead status '${existingLead.status}' is not eligible for conversion.`,
        400,
      );
    }

    // 3. Duplicate Company Warning Check
    if (
      data.companyMode === "new" &&
      data.newCompany?.name &&
      !data.skipDuplicateCompanyCheck
    ) {
      const duplicateCompany = await db.company.findFirst({
        where: {
          name: { equals: data.newCompany.name.trim(), mode: "insensitive" },
        },
      });

      if (duplicateCompany) {
        return apiError(
          `A company named '${duplicateCompany.name}' already exists. Please choose a different name, select the existing company, or confirm creation.`,
          409,
        );
      }
    }

    // 4. Perform single database transaction
    const result = await db.$transaction(async (tx) => {
      let createdCompany = null;
      let companyIdToLink: string | null = null;

      if (data.companyMode === "new" && data.newCompany) {
        createdCompany = await tx.company.create({
          data: {
            name: data.newCompany.name.trim(),
            industry: data.newCompany.industry || null,
            website: data.newCompany.website || null,
            email: data.newCompany.email || null,
            phone: data.newCompany.phone || null,
            address: data.newCompany.address || null,
            notes: data.newCompany.notes || null,
          },
        });
        companyIdToLink = createdCompany.id;
      } else if (data.companyMode === "existing" && data.companyId) {
        const foundCompany = await tx.company.findUnique({
          where: { id: data.companyId },
        });
        if (!foundCompany) {
          throw new Error("Selected company does not exist");
        }
        createdCompany = foundCompany;
        companyIdToLink = foundCompany.id;
      }

      let createdContact = null;
      let contactIdToLink: string | null = null;

      if (data.contactMode === "new" && data.newContact) {
        const existingContactEmail = await tx.contact.findUnique({
          where: { email: data.newContact.email.trim() },
        });
        if (existingContactEmail) {
          throw new Error(
            `Contact with email '${data.newContact.email}' already exists`,
          );
        }

        createdContact = await tx.contact.create({
          data: {
            firstName: data.newContact.firstName.trim(),
            lastName: data.newContact.lastName.trim(),
            email: data.newContact.email.trim(),
            phone: data.newContact.phone || null,
            jobTitle: data.newContact.jobTitle || null,
            notes: data.newContact.notes || null,
            companyId: companyIdToLink,
          },
        });
        contactIdToLink = createdContact.id;
      } else if (data.contactMode === "existing" && data.contactId) {
        const foundContact = await tx.contact.findUnique({
          where: { id: data.contactId },
        });
        if (!foundContact) {
          throw new Error("Selected contact does not exist");
        }
        createdContact = foundContact;
        contactIdToLink = foundContact.id;
      }

      let createdDeal = null;
      let dealIdToLink: string | null = null;

      if (data.createDeal && data.dealData) {
        let expectedCloseDateObj: Date | null = null;
        if (data.dealData.expectedCloseDate) {
          expectedCloseDateObj = new Date(data.dealData.expectedCloseDate);
        }

        createdDeal = await tx.deal.create({
          data: {
            name: data.dealData.name.trim(),
            value: data.dealData.value || 0,
            stage: data.dealData.stage || DealStage.QUALIFIED,
            expectedCloseDate: expectedCloseDateObj,
            notes: data.dealData.notes || null,
            companyId: companyIdToLink,
            contactId: contactIdToLink,
          },
        });
        dealIdToLink = createdDeal.id;
      }

      // Update lead status to CONVERTED
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

    return apiSuccess(result, "Lead converted successfully", 200);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to convert lead";
    const statusCode =
      errorMessage.includes("already exists") ||
      errorMessage.includes("does not exist")
        ? 400
        : 500;
    return apiError(errorMessage, statusCode);
  }
}
