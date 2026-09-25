import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await ReportService.getSalesOrderMaterialStatusReport({
      status,
      search,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('SO Material Status Report API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate SO material status report' },
      { status: 500 }
    );
  }
}
