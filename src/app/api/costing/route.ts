import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { calculateCostSheet, CalculationInput } from '@/lib/costing-calculator';

export async function GET(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status');
    const leadId = searchParams.get('leadId');
    const customerId = searchParams.get('customerId');
    const boxType = searchParams.get('boxType');

    const where: any = { isDeleted: false };

    if (status && status !== 'all') {
      where.status = status;
    }
    if (leadId) {
      where.leadId = leadId;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (boxType && boxType !== 'all') {
      where.boxType = boxType;
    }

    if (search) {
      where.OR = [
        { costSheetNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const costSheets = await prisma.costSheet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        product: true,
        lead: true,
        bom: {
          select: {
            id: true,
            bomNumber: true,
            name: true,
            status: true,
            estimatedCost: true,
            items: true,
          },
        },
        layers: {
          orderBy: { layerIndex: 'asc' },
          include: { material: true },
        },
        approvals: {
          orderBy: { timestamp: 'desc' },
        },
        revisions: {
          orderBy: { revisionNumber: 'desc' },
        },
      },
    });

    return NextResponse.json({ success: true, data: costSheets });
  } catch (error: any) {
    console.error('Error fetching cost sheets:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch cost sheets' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const body = await req.json();

    // Generate unique sequential Cost Sheet Number e.g. CS-2026-0001
    const currentYear = new Date().getFullYear();
    const prefix = `CS-${currentYear}-`;
    const lastSheet = await prisma.costSheet.findFirst({
      where: { costSheetNumber: { startsWith: prefix } },
      orderBy: { costSheetNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastSheet && lastSheet.costSheetNumber) {
      const match = lastSheet.costSheetNumber.match(/CS-\d{4}-(\d+)/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const costSheetNumber = `${prefix}${String(nextNumber).padStart(4, '0')}`;

    // Perform full recalculation to guarantee server-side precision
    const calcInput: CalculationInput = {
      boxType: body.boxType || 'Universal Box',
      dimensionUnit: body.dimensionUnit || 'mm',
      length: Number(body.length) || 0,
      width: Number(body.width) || 0,
      height: Number(body.height) || 0,
      targetQuantity: Number(body.targetQuantity) || 1000,
      jointFlapMm: body.jointFlapMm !== undefined ? Number(body.jointFlapMm) : 35,
      creaseAllowanceMm: body.creaseAllowanceMm !== undefined ? Number(body.creaseAllowanceMm) : 0,
      deckleSizeMm: body.deckleSizeMm ? Number(body.deckleSizeMm) : undefined,
      cuttingLengthMm: body.cuttingLengthMm ? Number(body.cuttingLengthMm) : undefined,
      ply: Number(body.ply) || 3,
      fluteType: body.fluteType || 'B',
      fluteTakeUp: body.fluteTakeUp ? Number(body.fluteTakeUp) : undefined,
      layers: (body.layers || []).map((l: any, idx: number) => ({
        layerIndex: l.layerIndex ?? idx,
        layerName: l.layerName || `Layer ${idx + 1}`,
        layerType: l.layerType || (idx % 2 === 1 ? 'Fluting' : 'Liner'),
        materialId: l.materialId || undefined,
        paperGrade: l.paperGrade || '',
        gsm: Number(l.gsm) || 120,
        bf: Number(l.bf) || 18,
        fluteType: l.fluteType,
        fluteFactor: Number(l.fluteFactor) || (l.layerType === 'Fluting' ? 1.35 : 1.0),
        ratePerKg: Number(l.ratePerKg) || 0,
        remarks: l.remarks,
      })),
      starchCostPerBox: Number(body.starchCostPerBox) || 0,
      printingCostPerBox: Number(body.printingCostPerBox) || 0,
      stitchingGlueCostPerBox: Number(body.stitchingGlueCostPerBox) || 0,
      dieCostTotal: Number(body.dieCostTotal) || 0,
      plateStereoCostTotal: Number(body.plateStereoCostTotal) || 0,
      wastagePercent: body.wastagePercent !== undefined ? Number(body.wastagePercent) : 3,
      conversionLaborCostPerBox: Number(body.conversionLaborCostPerBox) || 0,
      overheadCostPerBox: Number(body.overheadCostPerBox) || 0,
      freightCostPerBox: Number(body.freightCostPerBox) || 0,
      otherCostPerBox: Number(body.otherCostPerBox) || 0,
      profitMarginPercent: body.profitMarginPercent !== undefined ? Number(body.profitMarginPercent) : 15,
      taxRate: body.taxRate !== undefined ? Number(body.taxRate) : 18,
    };

    const calculated = calculateCostSheet(calcInput);

    // Customer & Product lookup names if not provided
    let customerName = body.customerName;
    if (!customerName && body.customerId) {
      const cust = await prisma.customer.findUnique({ where: { id: body.customerId } });
      if (cust) customerName = cust.name;
    }
    let productName = body.productName;
    if (!productName && body.productId) {
      const prod = await prisma.product.findUnique({ where: { id: body.productId } });
      if (prod) productName = prod.name;
    }

    const initialStatus = body.status || 'Draft';

    const costSheet = await prisma.costSheet.create({
      data: {
        costSheetNumber,
        revision: 1,
        title: body.title || `${calculated.dimensionUnit === 'inch' ? `${body.length}x${body.width}x${body.height}"` : `${calculated.lengthMm}x${calculated.widthMm}x${calculated.heightMm}mm`} ${body.boxType || 'Universal Box'}`,
        boxType: body.boxType || 'Universal Box',
        calculationType: body.calculationType || 'Universal Box',
        bomId: body.bomId || null,
        leadId: body.leadId || null,
        customerId: body.customerId || null,
        customerName: customerName || null,
        productId: body.productId || null,
        productName: productName || null,
        targetQuantity: calcInput.targetQuantity,
        unit: body.unit || 'Pcs',
        dimensionUnit: calcInput.dimensionUnit,
        length: calcInput.length,
        width: calcInput.width,
        height: calcInput.height,
        jointFlapMm: calcInput.jointFlapMm || 35,
        creaseAllowanceMm: calcInput.creaseAllowanceMm || 0,
        deckleSizeMm: calculated.deckleSizeMm,
        cuttingLengthMm: calculated.cuttingLengthMm,
        sheetAreaSqM: calculated.sheetAreaSqM,
        ply: calcInput.ply,
        fluteType: calcInput.fluteType,
        fluteTakeUp: body.fluteTakeUp || 1.35,
        totalBoardGsm: calculated.totalBoardGsm,
        burstingFactor: calculated.burstingFactor,
        burstingStrength: calculated.burstingStrength,
        boxCompressionTest: calculated.boxCompressionTest,
        singleBoxWeightGrams: calculated.singleBoxWeightGrams,
        singleBoxWeightKg: calculated.singleBoxWeightKg,
        paperCostPerBox: calculated.paperCostPerBox,
        starchCostPerBox: calculated.starchCostPerBox,
        printingCostPerBox: calculated.printingCostPerBox,
        stitchingGlueCostPerBox: calculated.stitchingGlueCostPerBox,
        dieCostTotal: calculated.dieCostTotal,
        dieCostPerBox: calculated.dieCostPerBox,
        plateStereoCostTotal: calculated.plateStereoCostTotal,
        plateStereoCostPerBox: calculated.plateStereoCostPerBox,
        wastagePercent: calculated.wastagePercent,
        wastageCostPerBox: calculated.wastageCostPerBox,
        conversionLaborCostPerBox: calculated.conversionLaborCostPerBox,
        overheadCostPerBox: calculated.overheadCostPerBox,
        freightCostPerBox: calculated.freightCostPerBox,
        otherCostPerBox: calculated.otherCostPerBox,
        totalManufacturingCostPerBox: calculated.totalManufacturingCostPerBox,
        profitMarginPercent: calculated.profitMarginPercent,
        profitAmountPerBox: calculated.profitAmountPerBox,
        sellingPricePerBox: calculated.sellingPricePerBox,
        totalOrderValue: calculated.totalOrderValue,
        taxRate: calculated.taxRate,
        taxAmount: calculated.taxAmount,
        grandTotalValue: calculated.grandTotalValue,
        status: initialStatus,
        preparedBy: body.preparedBy || 'Costing Engineer',
        notes: body.notes || null,
        specifications: body.specifications || null,
        layers: {
          create: calculated.calculatedLayers.map((cl) => ({
            layerIndex: cl.layerIndex,
            layerName: cl.layerName,
            layerType: cl.layerType,
            materialId: cl.materialId || null,
            paperGrade: cl.paperGrade,
            gsm: cl.gsm,
            bf: cl.bf,
            fluteType: cl.fluteType || null,
            fluteFactor: cl.fluteFactor,
            weightGrams: cl.weightGrams,
            ratePerKg: cl.ratePerKg,
            costPerBox: cl.costPerBox,
            remarks: cl.remarks || null,
          })),
        },
        revisions: {
          create: {
            revisionNumber: 1,
            snapshotData: JSON.stringify({
              input: calcInput,
              calculated,
              createdAt: new Date().toISOString(),
            }),
            reason: 'Initial Cost Sheet Creation',
            changedBy: body.preparedBy || 'Costing Engineer',
            sellingPrice: calculated.sellingPricePerBox,
            profitMargin: calculated.profitMarginPercent,
          },
        },
        approvals: initialStatus === 'Pending MD Approval' || initialStatus === 'Submitted'
          ? {
              create: {
                action: 'Submitted for Approval',
                status: 'Pending',
                userName: body.preparedBy || 'Costing Engineer',
                userRole: 'Costing Team',
                remarks: 'Submitted for MD Commercial Approval',
                priceAtReview: calculated.sellingPricePerBox,
                marginAtReview: calculated.profitMarginPercent,
              },
            }
          : undefined,
      },
      include: {
        customer: true,
        product: true,
        lead: true,
        layers: true,
        approvals: true,
        revisions: true,
      },
    });

    return NextResponse.json({ success: true, data: costSheet }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cost sheet:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create cost sheet' },
      { status: 500 }
    );
  }
}
