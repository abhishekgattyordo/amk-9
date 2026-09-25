import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const prisma = getPrisma();
    
    // Fetch all active cost sheets
    const costSheets = await prisma.costSheet.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        product: true,
        layers: true,
      }
    });

    const totalCostSheets = costSheets.length;
    const pendingApprovalCount = costSheets.filter(
      (c) => c.status === 'Submitted' || c.status === 'Pending MD Approval'
    ).length;
    const approvedCount = costSheets.filter(
      (c) => c.status === 'Approved' || c.status === 'Converted to Quotation'
    ).length;
    const draftCount = costSheets.filter((c) => c.status === 'Draft').length;
    const rejectedCount = costSheets.filter(
      (c) => c.status === 'Rejected' || c.status === 'Revision Requested'
    ).length;

    const totalValueQuoted = costSheets.reduce(
      (sum, c) => sum + (c.totalOrderValue || 0),
      0
    );

    const avgMargin =
      totalCostSheets > 0
        ? costSheets.reduce((sum, c) => sum + (c.profitMarginPercent || 0), 0) /
          totalCostSheets
        : 0;

    // Group by Box Type
    const boxTypeMap: Record<string, { count: number; value: number }> = {};
    costSheets.forEach((c) => {
      const type = c.boxType || 'Universal Box';
      if (!boxTypeMap[type]) boxTypeMap[type] = { count: 0, value: 0 };
      boxTypeMap[type].count += 1;
      boxTypeMap[type].value += c.totalOrderValue || 0;
    });

    const byBoxType = Object.keys(boxTypeMap).map((k) => ({
      boxType: k,
      count: boxTypeMap[k].count,
      value: Number(boxTypeMap[k].value.toFixed(2)),
    }));

    // Group by Status
    const statusMap: Record<string, number> = {};
    costSheets.forEach((c) => {
      const st = c.status || 'Draft';
      statusMap[st] = (statusMap[st] || 0) + 1;
    });

    const byStatus = Object.keys(statusMap).map((k) => ({
      status: k,
      count: statusMap[k],
    }));

    const recentCostSheets = costSheets.slice(0, 8);
    const pendingApprovals = costSheets.filter(
      (c) => c.status === 'Submitted' || c.status === 'Pending MD Approval'
    );

    return NextResponse.json({
      success: true,
      data: {
        totalCostSheets,
        pendingApprovalCount,
        approvedCount,
        draftCount,
        rejectedCount,
        averageMargin: Number(avgMargin.toFixed(1)),
        totalValueQuoted: Number(totalValueQuoted.toFixed(2)),
        recentCostSheets,
        pendingApprovals,
        byBoxType,
        byStatus,
      },
    });
  } catch (error: any) {
    console.error('Error fetching costing stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch costing stats' },
      { status: 500 }
    );
  }
}
