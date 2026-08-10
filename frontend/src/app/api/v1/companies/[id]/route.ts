import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  industry: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/v1/companies/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const company = await db.company.findUnique({
      where: { id },
      include: {
        contacts: true,
        deals: true,
      },
    });

    if (!company) {
      return apiError("Company not found", 404);
    }

    return apiSuccess({ company });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error fetching company",
      500,
    );
  }
}

// PUT /api/v1/companies/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = companySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid company data",
        400,
      );
    }

    const company = await db.company.update({
      where: { id },
      data: parsed.data,
    });

    return apiSuccess({ company }, "Company updated successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error updating company",
      500,
    );
  }
}

// DELETE /api/v1/companies/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await db.company.delete({
      where: { id },
    });

    return apiSuccess(null, "Company deleted successfully");
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Error deleting company",
      500,
    );
  }
}
