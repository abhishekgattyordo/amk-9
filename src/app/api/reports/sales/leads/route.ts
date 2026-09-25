import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const preset = searchParams.get('preset') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const salesExecutive = searchParams.get('salesExecutive') || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const result = await ReportService.getLeadsReport({
      preset,
      startDate,
      endDate,
      salesExecutive,
      customerId,
      status,
      search,
      page,
      limit,
      sortOrder,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Leads Report API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate leads report' },
      { status: 500 }
    );
  }
}
