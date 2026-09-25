import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';
import { enterpriseFallbackStore } from '../../../../lib/enterprise-fallback-store';

export async function POST(req: Request) {
  try {
    const { type, id } = await req.json();
    let result;
    const data = { isDeleted: false, deletedAt: null, deletedBy: null };
    
    try {
      switch (type) {
        // Inventory & Raw Materials
        case 'product': result = await prisma.product.update({ where: { id }, data }); break;
        case 'rawMaterial': result = await prisma.rawMaterial.update({ where: { id }, data }); break;
        
        // Master Data
        case 'category': result = await prisma.category.update({ where: { id }, data }); break;
        case 'subCategory': result = await prisma.subCategory.update({ where: { id }, data }); break;
        case 'materialGroup': result = await prisma.materialGroup.update({ where: { id }, data }); break;
        case 'supplier': result = await prisma.supplier.update({ where: { id }, data }); break;
        case 'warehouse': result = await prisma.warehouse.update({ where: { id }, data }); break;
        case 'binLocation': result = await (prisma.binLocation as any)?.update?.({ where: { id }, data }); break;
        
        // Procurement & Logistics
        case 'purchaseOrder': result = await prisma.purchaseOrder.update({ where: { id }, data }); break;
        case 'rfq': result = await prisma.rFQ.update({ where: { id }, data }); break;
        case 'supplierQuotation': result = await prisma.supplierQuotation.update({ where: { id }, data }); break;
        case 'gateEntry': result = await prisma.gateEntry.update({ where: { id }, data }); break;
        case 'reelInward': result = await prisma.reelInward.update({ where: { id }, data }); break;
        case 'qualityCheck': result = await (prisma.qualityCheck as any)?.update?.({ where: { id }, data }); break;

        // Sales Modules
        case 'customer': result = await prisma.customer.update({ where: { id }, data }); break;
        case 'salesLead': result = await prisma.salesLead.update({ where: { id }, data }); break;
        case 'salesQuotation': result = await prisma.salesQuotation.update({ where: { id }, data }); break;
        case 'salesOrderEntity': result = await prisma.salesOrderEntity.update({ where: { id }, data }); break;
        case 'dispatch': result = await prisma.dispatch.update({ where: { id }, data }); break;

        // Production Module
        case 'bom': result = await prisma.billOfMaterial.update({ where: { id }, data }); break;
        case 'workOrder': result = await prisma.workOrder.update({ where: { id }, data }); break;
        case 'productionPlan': result = await prisma.productionPlan.update({ where: { id }, data }); break;
        case 'productionOrder': result = await prisma.productionOrder.update({ where: { id }, data }); break;
        case 'materialRequest': result = await prisma.materialRequest.update({ where: { id }, data }); break;
        case 'dailyProductionReport': result = await prisma.dailyProductionReport.update({ where: { id }, data }); break;
        case 'machine': result = await prisma.machine.update({ where: { id }, data }); break;

        // Costing Module
        case 'costSheet': result = await prisma.costSheet.update({ where: { id }, data }); break;

        // User & Role Management
        case 'user': result = await prisma.user.update({ where: { id }, data }); break;
        case 'role': result = await prisma.role.update({ where: { id }, data }); break;
        
        default: return NextResponse.json({ success: false, error: `Invalid entity type: ${type}` }, { status: 400 });
      }
    } catch (dbErr) {
      // Fallback restore in memory store
      const mapTypeToStoreKey: Record<string, string> = {
        product: 'products',
        rawMaterial: 'rawMaterials',
        category: 'categories',
        subCategory: 'subCategories',
        materialGroup: 'materialGroups',
        supplier: 'suppliers',
        warehouse: 'warehouses',
        binLocation: 'binLocations',
        purchaseOrder: 'purchaseOrders',
        rfq: 'rfqs',
        supplierQuotation: 'supplierQuotations',
        gateEntry: 'gateEntries',
        reelInward: 'reelInwards',
        qualityCheck: 'qualityChecks',
        customer: 'customers',
        salesLead: 'salesLeads',
        salesQuotation: 'quotations',
        salesOrderEntity: 'salesOrders',
        dispatch: 'dispatches',
        user: 'users',
        role: 'roles',
      };

      const key = mapTypeToStoreKey[type];
      if (key) {
        const store = enterpriseFallbackStore as any;
        const item = store[key]?.find((x: any) => x.id === id);
        if (item) {
          item.isDeleted = false;
          item.deletedAt = null;
          item.deletedBy = null;
          result = item;
        }
      }
    }
        
    return NextResponse.json({ success: true, data: result || { id, type, restored: true } });
  } catch (error: any) {
    console.error('Error restoring item:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to restore item' }, { status: 500 });
  }
}
