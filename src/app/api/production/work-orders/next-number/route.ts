import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const currentYear = new Date().getFullYear();
    const prefix = `WO-${currentYear}-`;

    const lastWo = await prisma.workOrder.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
    }).catch(() => null);

    let nextNum = 1;
    if (lastWo?.orderNumber) {
      const match = lastWo.orderNumber.match(/WO-\d{4}-(\d+)/);
      if (match && match[1]) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    const nextOrderNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;

    return NextResponse.json({
      success: true,
      data: {
        nextOrderNumber,
        year: currentYear,
        sequence: nextNum,
      },
    });
  } catch (error: any) {
    console.error('Error generating next Work Order number:', error);
    const fallbackYear = new Date().getFullYear();
    return NextResponse.json({
      success: true,
      data: {
        nextOrderNumber: `WO-${fallbackYear}-0001`,
        year: fallbackYear,
        sequence: 1,
      },
    });
  }
}
