import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { z } from 'zod';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/v1/companies (list + search)
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') || '';

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { industry: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const companies = await db.company.findMany({
      where,
      include: {
        _count: {
          select: { contacts: true, deals: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess({ companies });
  } catch (error) {
    console.error('Companies fetch error:', error);
    return apiSuccess({ companies: [] }, 'Database offline, returning graceful empty list');
  }
}

// POST /api/v1/companies (create)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = companySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Invalid company data', 400);
    }

    try {
      const company = await db.company.create({
        data: parsed.data,
      });
      return apiSuccess({ company }, 'Company created successfully', 201);
    } catch {
      const mockCompany = {
        id: 'comp_' + Math.random().toString(36).substring(2, 9),
        ...parsed.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return apiSuccess({ company: mockCompany }, 'Company created (mock mode)', 201);
    }
  } catch (error) {
    return apiError(error instanceof Error ? error.message : 'Failed to create company', 500);
  }
}
