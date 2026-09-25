import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getAuthorizedUser } from '@/middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();

    const bom = await prisma.billOfMaterial.findFirst({
      where: {
        OR: [
          { id: id },
          { bomNumber: id },
        ],
        isDeleted: false,
      },
      include: {
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            boxType: true,
            dimensions: true,
            gsm: true,
            unit: true,
            costPrice: true,
            sellingPrice: true,
            availableStock: true,
            specifications: true,
            category: true,
            subCategory: true,
          },
        },
        customer: {
          select: {
            id: true,
            code: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true,
            address: true,
            salesExecutive: true,
          },
        },
        lead: {
          select: {
            id: true,
            leadNumber: true,
            customerName: true,
            productRequirement: true,
            expectedQuantity: true,
            status: true,
            specifications: true,
          },
        },
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            customerName: true,
            productName: true,
            amount: true,
            status: true,
            quotationDate: true,
          },
        },
        items: {
          include: {
            material: {
              select: {
                id: true,
                code: true,
                name: true,
                category: true,
                subCategory: true,
                grade: true,
                gsm: true,
                thickness: true,
                uom: true,
                currentStock: true,
                minStock: true,
                purchasePrice: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
        costSheets: {
          where: { isDeleted: false },
          select: {
            id: true,
            costSheetNumber: true,
            title: true,
            status: true,
            sellingPricePerBox: true,
            targetQuantity: true,
            totalManufacturingCostPerBox: true,
            grandTotalValue: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!bom) {
      return NextResponse.json(
        { success: false, error: 'BOM not found' },
        { status: 404 }
      );
    }

    let parsedSections = null;
    let cleanNotes = bom.notes || '';
    if (bom.notes) {
      try {
        const parsed = JSON.parse(bom.notes);
        if (parsed && typeof parsed === 'object') {
          if (parsed.sections) {
            parsedSections = parsed.sections;
          }
          if (parsed.noteText !== undefined) {
            cleanNotes = parsed.noteText;
          } else if (parsed.sections?.basicInfo?.notes) {
            cleanNotes = parsed.sections.basicInfo.notes;
          }
        }
      } catch (e) {
        // regular text note
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...bom,
        notes: cleanNotes,
        sections: parsedSections,
      },
    });
  } catch (error: any) {
    console.error('Error fetching BOM details:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch BOM details' },
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
    const user = await getAuthorizedUser(req);
    const body = await req.json();

    const existing = await prisma.billOfMaterial.findFirst({
      where: {
        OR: [{ id }, { bomNumber: id }],
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'BOM not found' },
        { status: 404 }
      );
    }

    // Process items and calculate total weight and estimated cost
    const itemsRaw = Array.isArray(body.items) ? body.items : [];
    let calculatedCostPerUnit = 0;
    let calculatedWeightGrams = 0;

    const itemsData = itemsRaw.map((item: any) => {
      const qtyPerUnit = Number(item.quantityPerUnit) || 0;
      const unitCost = Number(item.unitCost) || 0;
      const totalCost = Number(item.totalCost) !== undefined && Number(item.totalCost) !== 0 
        ? Number(item.totalCost) 
        : Number((qtyPerUnit * unitCost).toFixed(2));

      calculatedCostPerUnit += totalCost;
      if ((item.unit || '').toLowerCase().includes('kg')) {
        calculatedWeightGrams += qtyPerUnit * 1000;
      } else if ((item.unit || '').toLowerCase().includes('g')) {
        calculatedWeightGrams += qtyPerUnit;
      }

      return {
        layer: item.layer || 'Material Item',
        materialId: item.materialId || null,
        materialCode: item.materialCode || null,
        materialName: item.materialName || 'Material',
        gsm: item.gsm ? Number(item.gsm) : null,
        quantityPerUnit: qtyPerUnit,
        unit: item.unit || 'Kg',
        unitCost: unitCost,
        totalCost: totalCost,
      };
    });

    const totalWeightGrams = body.totalWeightGrams !== undefined && body.totalWeightGrams !== null 
      ? Number(body.totalWeightGrams) 
      : Number(calculatedWeightGrams.toFixed(1));

    const estimatedCost = body.estimatedCost !== undefined && body.estimatedCost !== null
      ? Number(body.estimatedCost)
      : Number(calculatedCostPerUnit.toFixed(2));

    // Handle customer name
    let customerName = body.customerName;
    if (!customerName && body.customerId) {
      const cust = await prisma.customer.findUnique({ where: { id: body.customerId } });
      if (cust) customerName = cust.name;
    }

    let storedNotes = body.notes !== undefined ? body.notes : existing.notes;
    if (body.sections !== undefined) {
      try {
        storedNotes = JSON.stringify({
          noteText: typeof body.notes === 'string' ? body.notes : '',
          sections: body.sections,
        });
      } catch (e) {
        storedNotes = body.notes || existing.notes;
      }
    }

    // Delete existing items and recreate within transaction
    const updated = await prisma.$transaction(async (tx) => {
      await tx.bomItem.deleteMany({ where: { bomId: existing.id } });

      return tx.billOfMaterial.update({
        where: { id: existing.id },
        data: {
          name: body.name !== undefined ? body.name : existing.name,
          productId: body.productId !== undefined ? body.productId : existing.productId,
          customerId: body.customerId !== undefined ? body.customerId : existing.customerId,
          customerName: customerName !== undefined ? customerName : existing.customerName,
          leadId: body.leadId !== undefined ? body.leadId : existing.leadId,
          quotationId: body.quotationId !== undefined ? body.quotationId : existing.quotationId,
          requiredQuantity: body.requiredQuantity !== undefined ? Number(body.requiredQuantity) : existing.requiredQuantity,
          version: body.version !== undefined ? Number(body.version) : existing.version,
          fluteType: body.fluteType !== undefined ? body.fluteType : existing.fluteType,
          ply: body.ply !== undefined ? Number(body.ply) : existing.ply,
          deckleSizeMm: body.deckleSizeMm !== undefined ? (body.deckleSizeMm ? Number(body.deckleSizeMm) : null) : existing.deckleSizeMm,
          cutSizeMm: body.cutSizeMm !== undefined ? (body.cutSizeMm ? Number(body.cutSizeMm) : null) : existing.cutSizeMm,
          totalWeightGrams,
          estimatedCost,
          status: body.status !== undefined ? body.status : existing.status,
          notes: storedNotes,
          items: {
            create: itemsData,
          },
        },
        include: {
          product: true,
          customer: true,
          lead: true,
          quotation: true,
          items: {
            include: {
              material: true,
            },
          },
        },
      });
    });

    let parsedSections = null;
    let cleanNotes = updated.notes || '';
    if (updated.notes) {
      try {
        const parsed = JSON.parse(updated.notes);
        if (parsed && typeof parsed === 'object') {
          if (parsed.sections) {
            parsedSections = parsed.sections;
          }
          if (parsed.noteText !== undefined) {
            cleanNotes = parsed.noteText;
          } else if (parsed.sections?.basicInfo?.notes) {
            cleanNotes = parsed.sections.basicInfo.notes;
          }
        }
      } catch (e) {
        // regular text
      }
    }

    return NextResponse.json({
      success: true,
      message: `BOM ${updated.bomNumber} updated successfully`,
      data: {
        ...updated,
        notes: cleanNotes,
        sections: parsedSections,
      },
    });
  } catch (error: any) {
    console.error('Error updating BOM:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update BOM' },
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
    const user = await getAuthorizedUser(req);

    const existing = await prisma.billOfMaterial.findFirst({
      where: {
        OR: [{ id }, { bomNumber: id }],
        isDeleted: false,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'BOM not found' },
        { status: 404 }
      );
    }

    await prisma.billOfMaterial.update({
      where: { id: existing.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user?.name || 'System User',
      },
    });

    return NextResponse.json({
      success: true,
      message: `BOM ${existing.bomNumber} moved to Recycle Bin`,
    });
  } catch (error: any) {
    console.error('Error deleting BOM:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete BOM' },
      { status: 500 }
    );
  }
}
