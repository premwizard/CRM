import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";
import { SegmentEntityType } from "@prisma/client";

const segmentSchema = z.object({
  name: z.string().min(1, "Segment name is required"),
  description: z.string().optional().nullable(),
  entityType: z.nativeEnum(SegmentEntityType),
  filterConfig: z.record(z.unknown()),
});

// GET /api/v1/segments
export async function GET() {
  try {
    const segments = await db.segment.findMany({
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ segments });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch segments",
      500,
    );
  }
}

// POST /api/v1/segments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = segmentSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid segment input",
        400,
      );
    }

    const segment = await db.segment.create({
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description || null,
        entityType: parsed.data.entityType,
        filterConfig: parsed.data.filterConfig as any,
      },
    });

    return apiSuccess({ segment }, "Segment saved successfully", 201);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to save segment",
      500,
    );
  }
}
