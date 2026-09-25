import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await ReportService.getSFGReport({
      warehouseId,
      search,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('SFG Report API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate semi-finished goods report' },
      { status: 500 }
    );
  }
}
