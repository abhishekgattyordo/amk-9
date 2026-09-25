import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();
    const body = await req.json().catch(() => ({}));

    const costSheet = await prisma.costSheet.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true,
        layers: true,
      },
    });

    if (!costSheet) {
      return NextResponse.json(
        { success: false, error: 'Cost Sheet not found' },
        { status: 404 }
      );
    }

    if (costSheet.status !== 'Approved' && costSheet.status !== 'Converted to Quotation') {
      return NextResponse.json(
        { success: false, error: 'Cost Sheet must be MD Approved before converting to Sales Quotation' },
        { status: 400 }
      );
    }

    // Generate Quotation Number
    const currentYear = new Date().getFullYear();
    const prefix = `QT-${currentYear}-`;
    const lastQuote = await prisma.salesQuotation.findFirst({
      where: { quotationNumber: { startsWith: prefix } },
      orderBy: { quotationNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastQuote && lastQuote.quotationNumber) {
      const match = lastQuote.quotationNumber.match(/QT-\d{4}-(\d+)/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const quotationNumber = `${prefix}${String(nextNumber).padStart(4, '0')}`;

    const todayStr = new Date().toISOString().substring(0, 10);
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 30);
    const validUntilStr = validUntilDate.toISOString().substring(0, 10);

    // Format item specification for quotation
    const dimStr = `${costSheet.length} x ${costSheet.width} x ${costSheet.height} ${costSheet.dimensionUnit}`;
    const itemDesc = `${costSheet.boxType} (${costSheet.ply}-Ply, ${dimStr}, GSM: ${costSheet.totalBoardGsm}, BS: ${costSheet.burstingStrength} kg/cm²)`;

    // Create the Quotation record
    const quotation = await prisma.salesQuotation.create({
      data: {
        quotationNumber,
        leadId: costSheet.leadId || null,
        customerId: costSheet.customerId || null,
        customerName: costSheet.customerName || (costSheet.customer?.name ?? 'Valued Customer'),
        productId: costSheet.productId || null,
        productName: costSheet.productName || (costSheet.product?.name ?? costSheet.title ?? 'Custom Corrugated Box'),
        costSheetId: costSheet.id,
        revision: 1,
        quotationDate: todayStr,
        validUntil: validUntilStr,
        amount: costSheet.grandTotalValue || costSheet.totalOrderValue || (costSheet.sellingPricePerBox * costSheet.targetQuantity),
        salesExecutive: body.userName || costSheet.preparedBy || 'Sales & Costing',
        status: 'Approved',
        costingSummary: `Selling Price/Box: ₹${costSheet.sellingPricePerBox.toFixed(2)} | Qty: ${costSheet.targetQuantity.toLocaleString()} | Margin: ${costSheet.profitMarginPercent}% | Box Specs: ${itemDesc}`,
        remarks: body.notes || `Directly converted from Approved Cost Sheet ${costSheet.costSheetNumber}`,
      },
    });

    // Update Cost Sheet status
    await prisma.costSheet.update({
      where: { id },
      data: {
        status: 'Converted to Quotation',
      },
    });

    // Add approval log entry
    await prisma.costSheetApproval.create({
      data: {
        costSheetId: id,
        action: 'Converted to Quotation',
        status: 'Approved',
        userName: body.userName || 'Sales Team',
        userRole: 'Sales & Commercial',
        remarks: `Converted to Sales Quotation ${quotationNumber}`,
        priceAtReview: costSheet.sellingPricePerBox,
        marginAtReview: costSheet.profitMarginPercent,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Quotation ${quotationNumber} generated successfully`,
      data: {
        quotation,
        costSheetId: costSheet.id,
      },
    });
  } catch (error: any) {
    console.error('Error converting cost sheet to quotation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to convert cost sheet to quotation' },
      { status: 500 }
    );
  }
}
