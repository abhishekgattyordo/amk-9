import { NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const options = await ReportService.getFilterOptions();
    return NextResponse.json({ success: true, ...options });
  } catch (error: any) {
    console.error('Report Filter Options API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
