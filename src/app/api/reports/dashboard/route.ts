import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const preset = searchParams.get('preset') as any;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const data = await ReportService.getDashboardReport({ preset, startDate, endDate });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Reports Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate dashboard report' },
      { status: 500 }
    );
  }
}
