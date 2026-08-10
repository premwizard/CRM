import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/v1/contacts/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const contact = await db.contact.findUnique({
      where: { id },
      include: {
        company: true,
        deals: true,
      },
    });

    if (!contact) {
      return apiError("Contact not found", 404);
    }

    return apiSuccess({ contact });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error fetching contact",
      500,
    );
  }
}

// PUT /api/v1/contacts/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid contact input",
        400,
      );
    }

    const contact = await db.contact.update({
      where: { id },
      data: parsed.data,
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    return apiSuccess({ contact }, "Contact updated successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error updating contact",
      500,
    );
  }
}

// DELETE /api/v1/contacts/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await db.contact.delete({
      where: { id },
    });

    return apiSuccess(null, "Contact deleted successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error deleting contact",
      500,
    );
  }
}
