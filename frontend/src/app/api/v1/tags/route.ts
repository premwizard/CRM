import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";

const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().optional().default("#3B82F6"),
});

// GET /api/v1/tags
export async function GET() {
  try {
    const tags = await db.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            contacts: true,
            companies: true,
            leads: true,
            deals: true,
          },
        },
      },
    });

    return apiSuccess({ tags });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch tags",
      500,
    );
  }
}

// POST /api/v1/tags
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = tagSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid tag input",
        400,
      );
    }

    const name = parsed.data.name.trim();

    const existing = await db.tag.findUnique({
      where: { name },
    });

    if (existing) {
      return apiSuccess({ tag: existing }, "Tag already exists", 200);
    }

    const tag = await db.tag.create({
      data: {
        name,
        color: parsed.data.color,
      },
    });

    return apiSuccess({ tag }, "Tag created successfully", 201);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to create tag",
      500,
    );
  }
}
