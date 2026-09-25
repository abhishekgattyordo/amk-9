import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const preset = searchParams.get('preset') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await ReportService.getProductionWastageReport({
      preset,
      startDate,
      endDate,
      search,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Production Wastage Report API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate production wastage report' },
      { status: 500 }
    );
  }
}
