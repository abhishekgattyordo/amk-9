import { NextRequest, NextResponse } from 'next/server';
import { SalesService } from '@/services/sales.service';
import { convertQuotationSchema } from '@/validations/sales.schema';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    const validation = convertQuotationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.format()
        },
        { status: 400 }
      );
    }

    const salesOrder = await SalesService.convertQuotationToSalesOrder(id, validation.data);

    return NextResponse.json({
      success: true,
      data: salesOrder,
      message: `Quotation converted successfully to Sales Order ${salesOrder.soNumber}`
    });
  } catch (error: any) {
    console.error('Error converting quotation to sales order:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to convert quotation to sales order'
      },
      { status: 500 }
    );
  }
}
