import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { SegmentEntityType } from "@prisma/client";

// GET /api/v1/segments/[id]/results (dynamically evaluates segment filterConfig against DB)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const segment = await db.segment.findUnique({
      where: { id },
    });

    if (!segment) {
      return apiError("Segment not found", 404);
    }

    const config = (segment.filterConfig as Record<string, any>) || {};
    const entityType = segment.entityType;

    let records: any[] = [];

    if (entityType === SegmentEntityType.CONTACT) {
      const AND: any[] = [];
      if (config.search) {
        AND.push({
          OR: [
            { firstName: { contains: config.search, mode: "insensitive" } },
            { lastName: { contains: config.search, mode: "insensitive" } },
            { email: { contains: config.search, mode: "insensitive" } },
          ],
        });
      }
      if (config.tagId) {
        AND.push({ tags: { some: { tagId: config.tagId } } });
      }
      if (config.tagName) {
        AND.push({ tags: { some: { tag: { name: config.tagName } } } });
      }

      records = await db.contact.findMany({
        where: AND.length > 0 ? { AND } : {},
        include: {
          company: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (entityType === SegmentEntityType.COMPANY) {
      const AND: any[] = [];
      if (config.search) {
        AND.push({ name: { contains: config.search, mode: "insensitive" } });
      }
      if (config.industry) {
        AND.push({ industry: { contains: config.industry, mode: "insensitive" } });
      }
      if (config.tagId) {
        AND.push({ tags: { some: { tagId: config.tagId } } });
      }
      if (config.tagName) {
        AND.push({ tags: { some: { tag: { name: config.tagName } } } });
      }

      records = await db.company.findMany({
        where: AND.length > 0 ? { AND } : {},
        include: {
          tags: { include: { tag: true } },
          _count: { select: { contacts: true, deals: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (entityType === SegmentEntityType.LEAD) {
      const AND: any[] = [];
      if (config.search) {
        AND.push({ name: { contains: config.search, mode: "insensitive" } });
      }
      if (config.status) {
        AND.push({ status: config.status });
      }
      if (config.minVal) {
        AND.push({ value: { gte: Number(config.minVal) } });
      }
      if (config.tagId) {
        AND.push({ tags: { some: { tagId: config.tagId } } });
      }
      if (config.tagName) {
        AND.push({ tags: { some: { tag: { name: config.tagName } } } });
      }

      records = await db.lead.findMany({
        where: AND.length > 0 ? { AND } : {},
        include: {
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (entityType === SegmentEntityType.DEAL) {
      const AND: any[] = [];
      if (config.search) {
        AND.push({ name: { contains: config.search, mode: "insensitive" } });
      }
      if (config.stage) {
        AND.push({ stage: config.stage });
      }
      if (config.forecastCategory) {
        AND.push({ forecastCategory: config.forecastCategory });
      }
      if (config.minVal) {
        AND.push({ value: { gte: Number(config.minVal) } });
      }
      if (config.tagId) {
        AND.push({ tags: { some: { tagId: config.tagId } } });
      }
      if (config.tagName) {
        AND.push({ tags: { some: { tag: { name: config.tagName } } } });
      }

      records = await db.deal.findMany({
        where: AND.length > 0 ? { AND } : {},
        include: {
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return apiSuccess({
      segment,
      recordsCount: records.length,
      records,
    });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Failed to evaluate segment results",
      500,
    );
  }
}
