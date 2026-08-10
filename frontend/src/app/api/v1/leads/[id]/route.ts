import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";
import { LeadSource, LeadStatus } from "@prisma/client";

const leadSchema = z.object({
  name: z.string().min(1, "Lead name is required"),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  source: z.nativeEnum(LeadSource).optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  value: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable(),
});

// GET /api/v1/leads/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const lead = await db.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return apiError("Lead not found", 404);
    }

    return apiSuccess({ lead });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error fetching lead",
      500,
    );
  }
}

// PUT /api/v1/leads/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid lead data",
        400,
      );
    }

    const lead = await db.lead.update({
      where: { id },
      data: parsed.data,
    });

    return apiSuccess({ lead }, "Lead updated successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error updating lead",
      500,
    );
  }
}

// DELETE /api/v1/leads/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await db.lead.delete({
      where: { id },
    });

    return apiSuccess(null, "Lead deleted successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error deleting lead",
      500,
    );
  }
}
