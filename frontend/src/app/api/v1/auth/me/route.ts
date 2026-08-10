import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const role = request.headers.get('x-user-role');

  if (!userId || !email) {
    return apiError('Unauthorized access', 401);
  }

  return apiSuccess({
    user: {
      id: userId,
      email,
      role: role || 'USER',
    },
    message: 'Protected route access verified successfully',
  });
}
