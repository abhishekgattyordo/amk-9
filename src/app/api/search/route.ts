import { NextRequest } from 'next/server';
import { SEARCH_MODULES, SearchModuleConfig } from '../../../config/searchRegistry';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';
import { successResponse, errorResponse } from '../../../utils/api';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    const { searchParams } = req.nextUrl;
    const q = (searchParams.get('q') || '').trim();

    if (!q) {
      return successResponse({ results: [], grouped: {}, totalCount: 0 });
    }

    const queryLower = q.toLowerCase();
    const queryClean = queryLower.replace(/[-_\s]/g, '');

    // Execute queries per module with soft-delete filtering
    const searchModule = async (mod: SearchModuleConfig) => {
      // Permission check
      if (user && mod.permission) {
        const canView = hasApiPermission(user, mod.permission) || hasApiPermission(user, 'all:read');
        if (!canView) return [];
      }

      const notDeleted = {
        isDeleted: false,
        deletedAt: null,
      };

      try {
        let rawItems: any[] = [];

        switch (mod.key) {
          case 'raw-materials': {
            rawItems = await prisma.rawMaterial.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { code: { contains: q, mode: 'insensitive' } },
                  { name: { contains: q, mode: 'insensitive' } },
                  { grade: { contains: q, mode: 'insensitive' } },
                  { category: { contains: q, mode: 'insensitive' } },
                  { subCategory: { contains: q, mode: 'insensitive' } },
                  { description: { contains: q, mode: 'insensitive' } },
                  { hsnCode: { contains: q, mode: 'insensitive' } },
                  { uom: { contains: q, mode: 'insensitive' } },
                  { supplier: { supplierName: { contains: q, mode: 'insensitive' } } },
                  { warehouse: { name: { contains: q, mode: 'insensitive' } } },
                ],
              },
              take: 8,
              include: { supplier: true, warehouse: true },
              orderBy: { updatedAt: 'desc' },
            });
            break;
          }

          case 'products': {
            rawItems = await prisma.product.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { code: { contains: q, mode: 'insensitive' } },
                  { name: { contains: q, mode: 'insensitive' } },
                  { boxType: { contains: q, mode: 'insensitive' } },
                  { category: { contains: q, mode: 'insensitive' } },
                  { subCategory: { contains: q, mode: 'insensitive' } },
                  { dimensions: { contains: q, mode: 'insensitive' } },
                  { hsnCode: { contains: q, mode: 'insensitive' } },
                  { warehouse: { name: { contains: q, mode: 'insensitive' } } },
                ],
              },
              take: 8,
              include: { warehouse: true },
              orderBy: { updatedAt: 'desc' },
            });
            break;
          }

          case 'sales-orders': {
            rawItems = await prisma.salesOrderEntity.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { soNumber: { contains: q, mode: 'insensitive' } },
                  { customerName: { contains: q, mode: 'insensitive' } },
                  { customerPoNumber: { contains: q, mode: 'insensitive' } },
                  { productName: { contains: q, mode: 'insensitive' } },
                  { salesExecutive: { contains: q, mode: 'insensitive' } },
                  { status: { contains: q, mode: 'insensitive' } },
                  { customer: { name: { contains: q, mode: 'insensitive' } } },
                  { product: { name: { contains: q, mode: 'insensitive' } } },
                ],
              },
              take: 8,
              include: { customer: true, product: true },
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          case 'work-orders': {
            rawItems = await prisma.workOrder.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { orderNumber: { contains: q, mode: 'insensitive' } },
                  { supervisor: { contains: q, mode: 'insensitive' } },
                  { assignedLine: { contains: q, mode: 'insensitive' } },
                  { currentStage: { contains: q, mode: 'insensitive' } },
                  { status: { contains: q, mode: 'insensitive' } },
                  { product: { name: { contains: q, mode: 'insensitive' } } },
                  { product: { code: { contains: q, mode: 'insensitive' } } },
                  { salesOrder: { soNumber: { contains: q, mode: 'insensitive' } } },
                  { salesOrder: { customerName: { contains: q, mode: 'insensitive' } } },
                ],
              },
              take: 8,
              include: { product: true, salesOrder: true, bom: true },
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          case 'purchase-orders': {
            rawItems = await prisma.purchaseOrder.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { poNumber: { contains: q, mode: 'insensitive' } },
                  { rfqNumber: { contains: q, mode: 'insensitive' } },
                  { status: { contains: q, mode: 'insensitive' } },
                  { remarks: { contains: q, mode: 'insensitive' } },
                  { supplier: { supplierName: { contains: q, mode: 'insensitive' } } },
                  { supplier: { millName: { contains: q, mode: 'insensitive' } } },
                ],
              },
              take: 8,
              include: { supplier: true },
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          case 'customers': {
            rawItems = await prisma.customer.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { code: { contains: q, mode: 'insensitive' } },
                  { name: { contains: q, mode: 'insensitive' } },
                  { contactPerson: { contains: q, mode: 'insensitive' } },
                  { phone: { contains: q, mode: 'insensitive' } },
                  { email: { contains: q, mode: 'insensitive' } },
                  { salesExecutive: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 8,
              orderBy: { updatedAt: 'desc' },
            });
            break;
          }

          case 'suppliers': {
            rawItems = await prisma.supplier.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { supplierCode: { contains: q, mode: 'insensitive' } },
                  { supplierName: { contains: q, mode: 'insensitive' } },
                  { millName: { contains: q, mode: 'insensitive' } },
                  { category: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 8,
              orderBy: { updatedAt: 'desc' },
            });
            break;
          }

          case 'sales-quotations': {
            rawItems = await prisma.salesQuotation.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { quotationNumber: { contains: q, mode: 'insensitive' } },
                  { customerName: { contains: q, mode: 'insensitive' } },
                  { productName: { contains: q, mode: 'insensitive' } },
                  { salesExecutive: { contains: q, mode: 'insensitive' } },
                  { status: { contains: q, mode: 'insensitive' } },
                  { customer: { name: { contains: q, mode: 'insensitive' } } },
                  { lead: { leadNumber: { contains: q, mode: 'insensitive' } } },
                ],
              },
              take: 8,
              include: { customer: true, lead: true },
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          case 'sales-leads': {
            rawItems = await prisma.salesLead.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { leadNumber: { contains: q, mode: 'insensitive' } },
                  { customerName: { contains: q, mode: 'insensitive' } },
                  { contactPerson: { contains: q, mode: 'insensitive' } },
                  { phone: { contains: q, mode: 'insensitive' } },
                  { email: { contains: q, mode: 'insensitive' } },
                  { productRequirement: { contains: q, mode: 'insensitive' } },
                  { assignedSalesExecutive: { contains: q, mode: 'insensitive' } },
                  { customerPoNumber: { contains: q, mode: 'insensitive' } },
                  { customer: { name: { contains: q, mode: 'insensitive' } } },
                ],
              },
              take: 8,
              include: { customer: true },
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          case 'cost-sheets': {
            rawItems = await prisma.costSheet.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { costSheetNumber: { contains: q, mode: 'insensitive' } },
                  { title: { contains: q, mode: 'insensitive' } },
                  { customerName: { contains: q, mode: 'insensitive' } },
                  { productName: { contains: q, mode: 'insensitive' } },
                  { boxType: { contains: q, mode: 'insensitive' } },
                  { customer: { name: { contains: q, mode: 'insensitive' } } },
                  { product: { name: { contains: q, mode: 'insensitive' } } },
                ],
              },
              take: 8,
              include: { customer: true, product: true },
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          case 'boms': {
            rawItems = await prisma.billOfMaterial.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { bomNumber: { contains: q, mode: 'insensitive' } },
                  { name: { contains: q, mode: 'insensitive' } },
                  { customerName: { contains: q, mode: 'insensitive' } },
                  { fluteType: { contains: q, mode: 'insensitive' } },
                  { product: { name: { contains: q, mode: 'insensitive' } } },
                  { product: { code: { contains: q, mode: 'insensitive' } } },
                  { customer: { name: { contains: q, mode: 'insensitive' } } },
                ],
              },
              take: 8,
              include: { product: true, customer: true },
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          case 'dispatches': {
            rawItems = await prisma.dispatch.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { challanNumber: { contains: q, mode: 'insensitive' } },
                  { soNumber: { contains: q, mode: 'insensitive' } },
                  { customerName: { contains: q, mode: 'insensitive' } },
                  { customerPoNumber: { contains: q, mode: 'insensitive' } },
                  { vehicleNumber: { contains: q, mode: 'insensitive' } },
                  { driverName: { contains: q, mode: 'insensitive' } },
                  { transporterName: { contains: q, mode: 'insensitive' } },
                  { ewayBillNumber: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 8,
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          case 'rfqs': {
            rawItems = await prisma.rFQ.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { rfqNumber: { contains: q, mode: 'insensitive' } },
                  { department: { contains: q, mode: 'insensitive' } },
                  { description: { contains: q, mode: 'insensitive' } },
                  { status: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 8,
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          case 'gate-entries': {
            rawItems = await prisma.gateEntry.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { gateEntryNumber: { contains: q, mode: 'insensitive' } },
                  { poNumber: { contains: q, mode: 'insensitive' } },
                  { vehicleNumber: { contains: q, mode: 'insensitive' } },
                  { driverName: { contains: q, mode: 'insensitive' } },
                  { challanNumber: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 8,
              include: { purchaseOrder: true },
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          case 'reel-inwards': {
            rawItems = await prisma.reelInward.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { inwardNumber: { contains: q, mode: 'insensitive' } },
                  { reelNumber: { contains: q, mode: 'insensitive' } },
                  { challanNumber: { contains: q, mode: 'insensitive' } },
                  { invoiceNumber: { contains: q, mode: 'insensitive' } },
                  { poNumber: { contains: q, mode: 'insensitive' } },
                  { supplierName: { contains: q, mode: 'insensitive' } },
                  { millName: { contains: q, mode: 'insensitive' } },
                  { vehicleNumber: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 8,
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          case 'quality-checks': {
            rawItems = await prisma.qualityCheck.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { qcNumber: { contains: q, mode: 'insensitive' } },
                  { referenceNumber: { contains: q, mode: 'insensitive' } },
                  { inspector: { contains: q, mode: 'insensitive' } },
                  { stage: { contains: q, mode: 'insensitive' } },
                  { result: { contains: q, mode: 'insensitive' } },
                  { status: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 8,
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          case 'warehouses': {
            rawItems = await prisma.warehouse.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { code: { contains: q, mode: 'insensitive' } },
                  { name: { contains: q, mode: 'insensitive' } },
                  { location: { contains: q, mode: 'insensitive' } },
                  { manager: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 8,
              orderBy: { updatedAt: 'desc' },
            });
            break;
          }

          case 'categories': {
            rawItems = await prisma.category.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { code: { contains: q, mode: 'insensitive' } },
                  { name: { contains: q, mode: 'insensitive' } },
                  { description: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 8,
              orderBy: { updatedAt: 'desc' },
            });
            break;
          }

          case 'users': {
            rawItems = await prisma.user.findMany({
              where: {
                ...notDeleted,
                OR: [
                  { name: { contains: q, mode: 'insensitive' } },
                  { email: { contains: q, mode: 'insensitive' } },
                  { department: { contains: q, mode: 'insensitive' } },
                ],
              },
              take: 8,
              include: { role: true },
              orderBy: { createdAt: 'desc' },
            });
            break;
          }

          default:
            rawItems = [];
        }

        return rawItems.map((item: any) => {
          const codeVal =
            item[mod.codeField] ||
            item.code ||
            item.supplierCode ||
            item.soNumber ||
            item.orderNumber ||
            item.poNumber ||
            item.quotationNumber ||
            item.leadNumber ||
            item.costSheetNumber ||
            item.bomNumber ||
            item.challanNumber ||
            item.rfqNumber ||
            item.gateEntryNumber ||
            item.inwardNumber ||
            item.qcNumber ||
            item.email ||
            item.id ||
            '';

          const nameVal =
            item[mod.nameField] ||
            item.name ||
            item.supplierName ||
            item.customerName ||
            item.productName ||
            (item.product && item.product.name) ||
            item.title ||
            item.description ||
            'Record';

          const subtitleVal = mod.subtitleBuilder ? mod.subtitleBuilder(item) : '';

          // Relevance scoring
          const itemCodeStr = String(codeVal).toLowerCase();
          const itemNameStr = String(nameVal).toLowerCase();
          const itemCodeClean = itemCodeStr.replace(/[-_\s]/g, '');

          let relevance = 10;
          if (itemCodeStr === queryLower || itemCodeClean === queryClean) {
            relevance = 1000;
          } else if (itemCodeStr.startsWith(queryLower) || itemCodeClean.startsWith(queryClean)) {
            relevance = 500;
          } else if (itemCodeStr.includes(queryLower) || itemCodeClean.includes(queryClean)) {
            relevance = 250;
          } else if (itemNameStr === queryLower) {
            relevance = 200;
          } else if (itemNameStr.startsWith(queryLower)) {
            relevance = 150;
          } else if (itemNameStr.includes(queryLower)) {
            relevance = 100;
          }

          return {
            id: item.id,
            code: codeVal,
            name: nameVal,
            subtitle: subtitleVal,
            module: mod.key,
            moduleLabel: mod.label,
            group: mod.group,
            route: mod.route,
            iconName: mod.iconName,
            relevance,
          };
        });
      } catch (err) {
        console.error(`Error querying search module ${mod.key}:`, err);
        return [];
      }
    };

    // Execute in parallel
    const moduleResults = await Promise.all(SEARCH_MODULES.map((m) => searchModule(m)));
    const flatResults = moduleResults.flat();

    // Sort by relevance score descending
    flatResults.sort((a, b) => b.relevance - a.relevance);

    // Group results by moduleLabel
    const grouped: Record<string, typeof flatResults> = {};
    for (const item of flatResults) {
      if (!grouped[item.moduleLabel]) {
        grouped[item.moduleLabel] = [];
      }
      grouped[item.moduleLabel].push(item);
    }

    return successResponse({
      results: flatResults,
      grouped,
      totalCount: flatResults.length,
    });
  } catch (err: any) {
    console.error('Central search error:', err);
    return errorResponse(err, 400);
  }
}
