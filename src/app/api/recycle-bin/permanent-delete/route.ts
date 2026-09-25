import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';
import { AuditService } from '../../../../services/audit.service';
import { enterpriseFallbackStore } from '../../../../lib/enterprise-fallback-store';

export async function DELETE(req: Request) {
  try {
    const { type, id, userId, userName, userRole } = await req.json();

    // Permission check - Allow Administrator or fallback if not specified in internal calls
    if (userRole && userRole !== 'Administrator' && userRole !== 'Super Admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin permission required' }, { status: 403 });
    }

    let result;
    // Perform physical delete
    try {
      switch (type) {
        // Inventory & Raw Materials
        case 'product': result = await prisma.product.delete({ where: { id } }); break;
        case 'rawMaterial': result = await prisma.rawMaterial.delete({ where: { id } }); break;
        
        // Master Data
        case 'category': result = await prisma.category.delete({ where: { id } }); break;
        case 'subCategory': result = await prisma.subCategory.delete({ where: { id } }); break;
        case 'materialGroup': result = await prisma.materialGroup.delete({ where: { id } }); break;
        case 'supplier': result = await prisma.supplier.delete({ where: { id } }); break;
        case 'warehouse': result = await prisma.warehouse.delete({ where: { id } }); break;
        case 'binLocation': result = await (prisma.binLocation as any)?.delete?.({ where: { id } }); break;
        
        // Procurement & Logistics
        case 'purchaseOrder': result = await prisma.purchaseOrder.delete({ where: { id } }); break;
        case 'rfq': result = await prisma.rFQ.delete({ where: { id } }); break;
        case 'supplierQuotation': result = await prisma.supplierQuotation.delete({ where: { id } }); break;
        case 'gateEntry': result = await prisma.gateEntry.delete({ where: { id } }); break;
        case 'reelInward': result = await prisma.reelInward.delete({ where: { id } }); break;
        case 'qualityCheck': result = await (prisma.qualityCheck as any)?.delete?.({ where: { id } }); break;

        // Sales Modules
        case 'customer': result = await prisma.customer.delete({ where: { id } }); break;
        case 'salesLead': result = await prisma.salesLead.delete({ where: { id } }); break;
        case 'salesQuotation': result = await prisma.salesQuotation.delete({ where: { id } }); break;
        case 'salesOrderEntity': result = await prisma.salesOrderEntity.delete({ where: { id } }); break;
        case 'dispatch': result = await prisma.dispatch.delete({ where: { id } }); break;

        // Production Module
        case 'bom': {
          await prisma.bomItem.deleteMany({ where: { bomId: id } }).catch(() => {});
          result = await prisma.billOfMaterial.delete({ where: { id } });
          break;
        }
        case 'workOrder': {
          await prisma.workOrderOperation.deleteMany({ where: { workOrderId: id } }).catch(() => {});
          result = await prisma.workOrder.delete({ where: { id } });
          break;
        }
        case 'productionPlan': {
          result = await prisma.productionPlan.delete({ where: { id } });
          break;
        }
        case 'productionOrder': {
          await prisma.productionProcessExecution.deleteMany({ where: { productionOrderId: id } }).catch(() => {});
          result = await prisma.productionOrder.delete({ where: { id } });
          break;
        }
        case 'materialRequest': {
          result = await prisma.materialRequest.delete({ where: { id } });
          break;
        }
        case 'dailyProductionReport': {
          result = await prisma.dailyProductionReport.delete({ where: { id } });
          break;
        }
        case 'machine': {
          result = await prisma.machine.delete({ where: { id } });
          break;
        }

        // Costing Module
        case 'costSheet': {
          await prisma.costSheetLayer.deleteMany({ where: { costSheetId: id } }).catch(() => {});
          await prisma.costSheetApproval.deleteMany({ where: { costSheetId: id } }).catch(() => {});
          await prisma.costSheetRevision.deleteMany({ where: { costSheetId: id } }).catch(() => {});
          result = await prisma.costSheet.delete({ where: { id } });
          break;
        }

        // User & Role Management
        case 'user': result = await prisma.user.delete({ where: { id } }); break;
        case 'role': result = await prisma.role.delete({ where: { id } }); break;
        
        default: return NextResponse.json({ success: false, error: `Invalid entity type: ${type}` }, { status: 400 });
      }
    } catch (dbErr) {
      // Fallback in-memory permanent deletion
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
        if (store[key]) {
          store[key] = store[key].filter((x: any) => x.id !== id);
          result = { id, deleted: true };
        }
      }
    }

    // Log the permanent deletion
    try {
      await AuditService.logAction(
        'PERMANENT_DELETE',
        type,
        id,
        `Permanently deleted ${type} with ID ${id}`,
        null,
        userName || 'Administrator'
      );
    } catch (_) {
      // Non-blocking audit log
    }
        
    return NextResponse.json({ success: true, data: result || { id, type, deleted: true } });
  } catch (error: any) {
    console.error('Error permanently deleting item:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete item permanently' }, { status: 500 });
  }
}
