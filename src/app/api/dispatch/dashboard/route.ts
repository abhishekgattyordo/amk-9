import { NextResponse } from 'next/server';
import { DispatchService } from '@/services/dispatch.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const metrics = await DispatchService.getDashboardMetrics();
    return NextResponse.json({ success: true, data: metrics });
  } catch (error: any) {
    console.error('Error fetching dispatch dashboard metrics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
