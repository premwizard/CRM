import { apiSuccess } from '@/lib/api-response';

export async function GET() {
  return apiSuccess(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'IC CRM API',
      version: 'v1',
      environment: process.env.NODE_ENV || 'development',
    },
    'IC CRM API Health Check OK'
  );
}
