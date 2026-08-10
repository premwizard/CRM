import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  assignedTo: z.string().optional().nullable(),
});

// GET /api/v1/tasks
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') || '';
    const status = request.nextUrl.searchParams.get('status');
    const priority = request.nextUrl.searchParams.get('priority');

    const AND: Record<string, unknown>[] = [];

    if (search) {
      AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      });
    }

    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      AND.push({ status: status as TaskStatus });
    }

    if (priority && Object.values(TaskPriority).includes(priority as TaskPriority)) {
      AND.push({ priority: priority as TaskPriority });
    }

    const where = AND.length > 0 ? { AND } : {};

    const tasks = await db.task.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess({ tasks });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    return apiSuccess({ tasks: [] }, 'Database query fallback');
  }
}

// POST /api/v1/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = taskSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Invalid task input', 400);
    }

    const { dueDate, ...restData } = parsed.data;

    const task = await db.task.create({
      data: {
        ...restData,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    return apiSuccess({ task }, 'Task created successfully', 201);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : 'Failed to create task', 500);
  }
}
