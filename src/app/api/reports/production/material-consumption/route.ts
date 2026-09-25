import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const preset = searchParams.get('preset') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const workOrderNumber = searchParams.get('workOrderNumber') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await ReportService.getMaterialConsumptionReport({
      preset,
      startDate,
      endDate,
      workOrderNumber,
      status,
      search,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Material Consumption Report API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate material consumption report' },
      { status: 500 }
    );
  }
}
