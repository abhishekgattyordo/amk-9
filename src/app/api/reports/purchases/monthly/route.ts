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
    const status = searchParams.get('status') || undefined;

    const result = await ReportService.getMonthlyPurchaseReport({
      preset,
      startDate,
      endDate,
      supplierId,
      status,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Monthly Purchase Report API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate monthly purchase report' },
      { status: 500 }
    );
  }
}
