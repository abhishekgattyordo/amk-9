import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { calculateCostSheet, CalculationInput } from '@/lib/costing-calculator';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();

    const costSheet = await prisma.costSheet.findUnique({
      where: { id },
      include: {
        customer: true,
        product: true,
        lead: true,
        bom: {
          include: {
            items: true,
            product: true,
            customer: true,
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
        quotations: true,
      },
    });

    if (!costSheet) {
      return NextResponse.json(
        { success: false, error: 'Cost Sheet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: costSheet });
  } catch (error: any) {
    console.error('Error fetching cost sheet by id:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch cost sheet' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();
    const body = await req.json();

    const existing = await prisma.costSheet.findUnique({
      where: { id },
      include: { layers: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Cost Sheet not found' },
        { status: 404 }
      );
    }

    // Recalculate
    const calcInput: CalculationInput = {
      boxType: body.boxType || existing.boxType,
      dimensionUnit: body.dimensionUnit || (existing.dimensionUnit as any) || 'mm',
      length: body.length !== undefined ? Number(body.length) : existing.length,
      width: body.width !== undefined ? Number(body.width) : existing.width,
      height: body.height !== undefined ? Number(body.height) : existing.height,
      targetQuantity: body.targetQuantity !== undefined ? Number(body.targetQuantity) : existing.targetQuantity,
      jointFlapMm: body.jointFlapMm !== undefined ? Number(body.jointFlapMm) : existing.jointFlapMm,
      creaseAllowanceMm: body.creaseAllowanceMm !== undefined ? Number(body.creaseAllowanceMm) : existing.creaseAllowanceMm,
      deckleSizeMm: body.deckleSizeMm ? Number(body.deckleSizeMm) : undefined,
      cuttingLengthMm: body.cuttingLengthMm ? Number(body.cuttingLengthMm) : undefined,
      ply: body.ply !== undefined ? Number(body.ply) : existing.ply,
      fluteType: body.fluteType || existing.fluteType || 'B',
      fluteTakeUp: body.fluteTakeUp ? Number(body.fluteTakeUp) : existing.fluteTakeUp,
      layers: (body.layers || existing.layers).map((l: any, idx: number) => ({
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
      starchCostPerBox: body.starchCostPerBox !== undefined ? Number(body.starchCostPerBox) : existing.starchCostPerBox,
      printingCostPerBox: body.printingCostPerBox !== undefined ? Number(body.printingCostPerBox) : existing.printingCostPerBox,
      stitchingGlueCostPerBox: body.stitchingGlueCostPerBox !== undefined ? Number(body.stitchingGlueCostPerBox) : existing.stitchingGlueCostPerBox,
      dieCostTotal: body.dieCostTotal !== undefined ? Number(body.dieCostTotal) : existing.dieCostTotal,
      plateStereoCostTotal: body.plateStereoCostTotal !== undefined ? Number(body.plateStereoCostTotal) : existing.plateStereoCostTotal,
      wastagePercent: body.wastagePercent !== undefined ? Number(body.wastagePercent) : existing.wastagePercent,
      conversionLaborCostPerBox: body.conversionLaborCostPerBox !== undefined ? Number(body.conversionLaborCostPerBox) : existing.conversionLaborCostPerBox,
      overheadCostPerBox: body.overheadCostPerBox !== undefined ? Number(body.overheadCostPerBox) : existing.overheadCostPerBox,
      freightCostPerBox: body.freightCostPerBox !== undefined ? Number(body.freightCostPerBox) : existing.freightCostPerBox,
      otherCostPerBox: body.otherCostPerBox !== undefined ? Number(body.otherCostPerBox) : existing.otherCostPerBox,
      profitMarginPercent: body.profitMarginPercent !== undefined ? Number(body.profitMarginPercent) : existing.profitMarginPercent,
      taxRate: body.taxRate !== undefined ? Number(body.taxRate) : existing.taxRate,
    };

    const calculated = calculateCostSheet(calcInput);
    const newRevisionNumber = existing.revision + 1;

    // Delete existing layers and re-create fresh calculated layers
    await prisma.costSheetLayer.deleteMany({
      where: { costSheetId: id },
    });

    // Create a revision record
    await prisma.costSheetRevision.create({
      data: {
        costSheetId: id,
        revisionNumber: newRevisionNumber,
        snapshotData: JSON.stringify({
          input: calcInput,
          calculated,
          updatedAt: new Date().toISOString(),
        }),
        reason: body.revisionReason || 'Updated specifications & costing parameters',
        changedBy: body.updatedBy || 'Costing Engineer',
        sellingPrice: calculated.sellingPricePerBox,
        profitMargin: calculated.profitMarginPercent,
      },
    });

    // If status updated to Submitted or Pending MD Approval, add approval log
    if (body.status && body.status !== existing.status) {
      await prisma.costSheetApproval.create({
        data: {
          costSheetId: id,
          action: `Status changed to ${body.status}`,
          status: body.status === 'Approved' ? 'Approved' : body.status === 'Rejected' ? 'Rejected' : 'Pending',
          userName: body.updatedBy || 'Costing Team',
          userRole: body.userRole || 'Costing Engineer',
          remarks: body.statusRemarks || body.notes || 'Status updated',
          priceAtReview: calculated.sellingPricePerBox,
          marginAtReview: calculated.profitMarginPercent,
        },
      });
    }

    const updated = await prisma.costSheet.update({
      where: { id },
      data: {
        revision: newRevisionNumber,
        title: body.title !== undefined ? body.title : existing.title,
        boxType: body.boxType || existing.boxType,
        calculationType: body.calculationType || existing.calculationType,
        leadId: body.leadId !== undefined ? body.leadId : existing.leadId,
        customerId: body.customerId !== undefined ? body.customerId : existing.customerId,
        customerName: body.customerName !== undefined ? body.customerName : existing.customerName,
        productId: body.productId !== undefined ? body.productId : existing.productId,
        productName: body.productName !== undefined ? body.productName : existing.productName,
        targetQuantity: calcInput.targetQuantity,
        unit: body.unit || existing.unit,
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
        fluteTakeUp: body.fluteTakeUp || existing.fluteTakeUp,
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
        status: body.status || existing.status,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        specifications: body.specifications !== undefined ? body.specifications : existing.specifications,
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

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating cost sheet:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update cost sheet' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();

    // Soft delete
    const deleted = await prisma.costSheet.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: 'System User',
      },
    });

    return NextResponse.json({ success: true, message: 'Cost sheet moved to recycle bin', data: deleted });
  } catch (error: any) {
    console.error('Error deleting cost sheet:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete cost sheet' },
      { status: 500 }
    );
  }
}
