import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const preset = searchParams.get('preset') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const supplierId = searchParams.get('supplierId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    const result = await ReportService.getCategoryPurchaseReport({
      preset,
      startDate,
      endDate,
      supplierId,
      categoryId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Category Purchase Report API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate category purchase report' },
      { status: 500 }
    );
  }
}
