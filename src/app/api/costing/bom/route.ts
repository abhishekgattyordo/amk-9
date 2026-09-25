import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getAuthorizedUser, hasApiPermission } from '@/middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const { searchParams } = new URL(req.url);

    // Check if stats are requested
    if (searchParams.get('stats') === 'true') {
      const total = await prisma.billOfMaterial.count({ where: { isDeleted: false } });
      const active = await prisma.billOfMaterial.count({ where: { isDeleted: false, status: 'Active' } });
      const draft = await prisma.billOfMaterial.count({ where: { isDeleted: false, status: 'Draft' } });
      const linkedToQuotation = await prisma.billOfMaterial.count({ 
        where: { 
          isDeleted: false, 
          OR: [{ quotationId: { not: null } }, { leadId: { not: null } }] 
        } 
      });
      const withCostSheets = await prisma.billOfMaterial.count({
        where: {
          isDeleted: false,
          costSheets: { some: { isDeleted: false } }
        }
      });

      return NextResponse.json({
        success: true,
        stats: {
          total,
          active,
          draft,
          linkedToQuotation,
          withCostSheets,
        },
      });
    }

    const search = searchParams.get('search')?.trim().toLowerCase() || '';
    const status = searchParams.get('status');
    const productId = searchParams.get('productId');
    const customerId = searchParams.get('customerId');
    const leadId = searchParams.get('leadId');
    const quotationId = searchParams.get('quotationId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: any = { isDeleted: false };

    if (status && status !== 'all') {
      where.status = status;
    }
    if (productId && productId !== 'all') {
      where.productId = productId;
    }
    if (customerId && customerId !== 'all') {
      where.customerId = customerId;
    }
    if (leadId) {
      where.leadId = leadId;
    }
    if (quotationId) {
      where.quotationId = quotationId;
    }

    if (search) {
      where.OR = [
        { bomNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { code: { contains: search, mode: 'insensitive' } } },
        { items: { some: { materialName: { contains: search, mode: 'insensitive' } } } },
        { items: { some: { materialCode: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [boms, total] = await Promise.all([
      prisma.billOfMaterial.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
              availableStock: true,
              costPrice: true,
              sellingPrice: true,
            },
          },
          customer: {
            select: {
              id: true,
              code: true,
              name: true,
              phone: true,
              email: true,
              salesExecutive: true,
            },
          },
          lead: {
            select: {
              id: true,
              leadNumber: true,
              productRequirement: true,
              expectedQuantity: true,
              status: true,
            },
          },
          quotation: {
            select: {
              id: true,
              quotationNumber: true,
              productName: true,
              amount: true,
              status: true,
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
                  grade: true,
                  gsm: true,
                  uom: true,
                  currentStock: true,
                  purchasePrice: true,
                },
              },
            },
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
              createdAt: true,
            },
          },
        },
      }),
      prisma.billOfMaterial.count({ where }),
    ]);

    const formattedBoms = boms.map((bom: any) => {
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
          // Plain text note
        }
      }
      return {
        ...bom,
        notes: cleanNotes,
        sections: parsedSections,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedBoms,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching BOMs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch BOMs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const prisma = getPrisma();
    const user = await getAuthorizedUser(req);
    const body = await req.json();

    if (!body.name || !body.productId) {
      return NextResponse.json(
        { success: false, error: 'BOM Name and Product selection are required' },
        { status: 400 }
      );
    }

    // Auto-generate BOM Number: BOM-2026-001
    const currentYear = new Date().getFullYear();
    const prefix = `BOM-${currentYear}-`;
    const lastBom = await prisma.billOfMaterial.findFirst({
      where: { bomNumber: { startsWith: prefix } },
      orderBy: { bomNumber: 'desc' },
    });

    let nextNum = 1;
    if (lastBom?.bomNumber) {
      const match = lastBom.bomNumber.match(/BOM-\d{4}-(\d+)/);
      if (match && match[1]) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const bomNumber = body.bomNumber || `${prefix}${String(nextNum).padStart(3, '0')}`;

    // Lookup customer name if customerId provided
    let customerName = body.customerName;
    if (!customerName && body.customerId) {
      const cust = await prisma.customer.findUnique({ where: { id: body.customerId } });
      if (cust) customerName = cust.name;
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
      // Approximate weight calculation: if unit is Kg, weight in grams = qtyPerUnit * 1000
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

    const requiredQuantity = Number(body.requiredQuantity) || 1000;
    const ply = Number(body.ply) || 5;

    let storedNotes = body.notes || null;
    if (body.sections) {
      try {
        storedNotes = JSON.stringify({
          noteText: typeof body.notes === 'string' ? body.notes : '',
          sections: body.sections,
        });
      } catch (e) {
        storedNotes = body.notes || null;
      }
    }

    const newBom = await prisma.billOfMaterial.create({
      data: {
        bomNumber,
        name: body.name,
        productId: body.productId,
        customerId: body.customerId || null,
        customerName: customerName || null,
        leadId: body.leadId || null,
        quotationId: body.quotationId || null,
        requiredQuantity,
        version: Number(body.version) || 1,
        fluteType: body.fluteType || 'BC-Flute (5-Ply)',
        ply,
        deckleSizeMm: body.deckleSizeMm ? Number(body.deckleSizeMm) : null,
        cutSizeMm: body.cutSizeMm ? Number(body.cutSizeMm) : null,
        totalWeightGrams,
        estimatedCost,
        status: body.status || 'Active',
        notes: storedNotes,
        createdBy: user?.name || body.createdBy || 'System User',
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

    let parsedSections = null;
    let cleanNotes = newBom.notes || '';
    if (newBom.notes) {
      try {
        const parsed = JSON.parse(newBom.notes);
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
      message: `BOM ${newBom.bomNumber} created successfully`,
      data: {
        ...newBom,
        notes: cleanNotes,
        sections: parsedSections,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating BOM:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create BOM' },
      { status: 500 }
    );
  }
}
