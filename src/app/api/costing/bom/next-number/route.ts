import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const currentYear = new Date().getFullYear();
    const prefix = `BOM-${currentYear}-`;

    const lastBom = await prisma.billOfMaterial.findFirst({
      where: { bomNumber: { startsWith: prefix } },
      orderBy: { bomNumber: 'desc' },
    }).catch(() => null);

    let nextNum = 1;
    if (lastBom?.bomNumber) {
      const match = lastBom.bomNumber.match(/BOM-\d{4}-(\d+)/);
      if (match && match[1]) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    const nextBomNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;

    return NextResponse.json({
      success: true,
      data: {
        nextBomNumber,
        year: currentYear,
        sequence: nextNum,
      },
    });
  } catch (error: any) {
    console.error('Error generating next BOM number:', error);
    const fallbackYear = new Date().getFullYear();
    return NextResponse.json({
      success: true,
      data: {
        nextBomNumber: `BOM-${fallbackYear}-0001`,
        year: fallbackYear,
        sequence: 1,
      },
    });
  }
}
