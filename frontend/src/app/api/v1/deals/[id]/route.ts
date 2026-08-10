import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";
import { DealStage } from "@prisma/client";

const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  value: z.number().nonnegative().optional(),
  stage: z.nativeEnum(DealStage).optional(),
  expectedCloseDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/v1/deals/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const deal = await db.deal.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
      },
    });

    if (!deal) {
      return apiError("Deal not found", 404);
    }

    return apiSuccess({ deal });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error fetching deal",
      500,
    );
  }
}

// PUT /api/v1/deals/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = dealSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid deal data",
        400,
      );
    }

    const { expectedCloseDate, ...restData } = parsed.data;

    const deal = await db.deal.update({
      where: { id },
      data: {
        ...restData,
        expectedCloseDate: expectedCloseDate
          ? new Date(expectedCloseDate)
          : null,
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return apiSuccess({ deal }, "Deal updated successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error updating deal",
      500,
    );
  }
}

// DELETE /api/v1/deals/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await db.deal.delete({
      where: { id },
    });

    return apiSuccess(null, "Deal deleted successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error deleting deal",
      500,
    );
  }
}
