import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const prisma = getPrisma();

    const [
      customers,
      products,
      rawMaterials,
      categories,
      subCategories,
      machines,
      suppliers,
      leads,
      quotations,
    ] = await Promise.all([
      prisma.customer.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          code: true,
          name: true,
          contactPerson: true,
          phone: true,
          email: true,
          address: true,
          status: true,
          salesExecutive: true,
        },
        orderBy: { name: 'asc' },
      }).catch(() => []),

      prisma.product.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          subCategory: true,
          boxType: true,
          dimensions: true,
          gsm: true,
          unit: true,
          costPrice: true,
          sellingPrice: true,
          availableStock: true,
          specifications: true,
        },
        orderBy: { name: 'asc' },
      }).catch(() => []),

      prisma.rawMaterial.findMany({
        where: { isDeleted: false },
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
          purchasePrice: true,
          currentStock: true,
          status: true,
        },
        orderBy: { name: 'asc' },
      }).catch(() => []),

      prisma.category.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          status: true,
        },
        orderBy: { name: 'asc' },
      }).catch(() => []),

      prisma.subCategory.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          code: true,
          name: true,
          categoryId: true,
          status: true,
        },
        orderBy: { name: 'asc' },
      }).catch(() => []),

      prisma.machine.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          line: true,
          capacityPerHour: true,
          unit: true,
          status: true,
          operator: true,
        },
        orderBy: { name: 'asc' },
      }).catch(() => []),

      prisma.supplier.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          supplierCode: true,
          supplierName: true,
          millName: true,
          category: true,
        },
        orderBy: { supplierName: 'asc' },
      }).catch(() => []),

      prisma.salesLead.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          leadNumber: true,
          customerName: true,
          productRequirement: true,
          expectedQuantity: true,
          status: true,
          specifications: true,
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),

      prisma.salesQuotation.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          quotationNumber: true,
          customerName: true,
          productName: true,
          amount: true,
          status: true,
          quotationDate: true,
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
    ]);

    // Calculate next auto-generated BOM number
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
        customers,
        products,
        rawMaterials,
        categories,
        subCategories,
        machines,
        suppliers,
        leads,
        quotations,
        nextBomNumber,
      },
    });
  } catch (error: any) {
    console.error('Error loading costing master data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load master data' },
      { status: 500 }
    );
  }
}
