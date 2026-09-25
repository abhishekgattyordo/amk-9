import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const preset = searchParams.get('preset') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const itemType = (searchParams.get('itemType') || 'All') as any;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await ReportService.getOpeningClosingStockReport({
      preset,
      startDate,
      endDate,
      itemType,
      warehouseId,
      search,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Opening Closing Stock Report API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate opening closing stock report' },
      { status: 500 }
    );
  }
}
