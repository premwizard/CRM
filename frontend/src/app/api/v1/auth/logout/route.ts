import { NextRequest } from 'next/server';
import { apiSuccess } from '@/lib/api-response';

export async function POST() {
  return apiSuccess({ message: 'Logged out successfully' });
}
