import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { z } from "zod";
import { DealStage, ForecastCategory } from "@prisma/client";

const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  value: z.number().nonnegative().default(0),
  stage: z.nativeEnum(DealStage).default(DealStage.NEW),
  probability: z.number().min(0).max(100).optional(),
  forecastCategory: z.nativeEnum(ForecastCategory).optional(),
  owner: z.string().optional().nullable(),
  expectedCloseDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

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

// GET /api/v1/deals (list + search + stage filter)
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search") || "";
    const stage = request.nextUrl.searchParams.get("stage");

    const AND: Record<string, unknown>[] = [];

    if (search) {
      AND.push({
        name: { contains: search, mode: "insensitive" as const },
      });
    }

    if (stage && Object.values(DealStage).includes(stage as DealStage)) {
      AND.push({ stage: stage as DealStage });
    }

    const where = AND.length > 0 ? { AND } : {};

    const deals = await db.deal.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        stageHistory: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ deals });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch deals",
      500,
    );
  }
}

// POST /api/v1/deals (create)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = dealSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.errors[0]?.message || "Invalid deal data",
        400,
      );
    }

    const {
      expectedCloseDate,
      probability,
      forecastCategory,
      stage,
      ...restData
    } = parsed.data;

    const calcProb = probability ?? defaultProbabilityForStage(stage);
    const calcCat = forecastCategory ?? defaultCategoryForStage(stage);

    const deal = await db.deal.create({
      data: {
        ...restData,
        stage,
        probability: calcProb,
        forecastCategory: calcCat,
        expectedCloseDate: expectedCloseDate
          ? new Date(expectedCloseDate)
          : null,
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return apiSuccess({ deal }, "Deal created successfully", 201);
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to create deal",
      500,
    );
  }
}
