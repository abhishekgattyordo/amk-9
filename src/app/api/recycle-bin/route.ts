import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';
import { enterpriseFallbackStore } from '../../../lib/enterprise-fallback-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [
      products,
      rawMaterials,
      categories,
      subCategories,
      materialGroups,
      suppliers,
      warehouses,
      binLocations,
      purchaseOrders,
      rfqs,
      supplierQuotations,
      gateEntries,
      reelInwards,
      qualityChecks,
      customers,
      salesLeads,
      salesQuotations,
      salesOrders,
      dispatches,
      users,
      roles,
      boms,
      workOrders,
      productionPlans,
      productionOrders,
      materialRequests,
      dailyProductionReports,
      machines,
      costSheets,
    ] = await Promise.all([
      prisma.product.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.products?.filter((p: any) => p.isDeleted) || []),
      prisma.rawMaterial.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.rawMaterials?.filter((r: any) => r.isDeleted) || []),
      prisma.category.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.categories?.filter((c: any) => c.isDeleted) || []),
      prisma.subCategory.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.subCategories?.filter((s: any) => s.isDeleted) || []),
      prisma.materialGroup.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.materialGroups?.filter((m: any) => m.isDeleted) || []),
      prisma.supplier.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.suppliers?.filter((s: any) => s.isDeleted) || []),
      prisma.warehouse.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.warehouses?.filter((w: any) => w.isDeleted) || []),
      (prisma.binLocation as any)?.findMany?.({ where: { isDeleted: true } })?.catch?.(() => enterpriseFallbackStore.binLocations?.filter((b: any) => b.isDeleted) || []) ?? (enterpriseFallbackStore.binLocations?.filter((b: any) => b.isDeleted) || []),
      prisma.purchaseOrder.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.purchaseOrders?.filter((p: any) => p.isDeleted) || []),
      prisma.rFQ.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.rfqs?.filter((r: any) => r.isDeleted) || []),
      prisma.supplierQuotation.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.supplierQuotations?.filter((q: any) => q.isDeleted) || []),
      prisma.gateEntry.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.gateEntries?.filter((g: any) => g.isDeleted) || []),
      prisma.reelInward.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.reelInwards?.filter((r: any) => r.isDeleted) || []),
      (prisma.qualityCheck as any)?.findMany?.({ where: { isDeleted: true } })?.catch?.(() => enterpriseFallbackStore.qualityChecks?.filter((q: any) => q.isDeleted) || []) ?? (enterpriseFallbackStore.qualityChecks?.filter((q: any) => q.isDeleted) || []),
      prisma.customer.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.customers?.filter((c: any) => c.isDeleted) || []),
      prisma.salesLead.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.salesLeads?.filter((l: any) => l.isDeleted) || []),
      prisma.salesQuotation.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.quotations?.filter((q: any) => q.isDeleted) || []),
      prisma.salesOrderEntity.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.salesOrders?.filter((s: any) => s.isDeleted) || []),
      prisma.dispatch.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.dispatches?.filter((d: any) => d.isDeleted) || []),
      prisma.user.findMany({ 
        where: { 
          OR: [
            { isDeleted: true },
            { deletedAt: { not: null } }
          ] 
        } 
      }).catch(() => enterpriseFallbackStore.users?.filter((u: any) => u.isDeleted) || []),
      prisma.role.findMany({ where: { isDeleted: true } }).catch(() => enterpriseFallbackStore.roles?.filter((r: any) => r.isDeleted) || []),
      prisma.billOfMaterial.findMany({ where: { isDeleted: true } }).catch(() => []),
      prisma.workOrder.findMany({ where: { isDeleted: true } }).catch(() => []),
      prisma.productionPlan.findMany({ where: { isDeleted: true } }).catch(() => []),
      prisma.productionOrder.findMany({ where: { isDeleted: true } }).catch(() => []),
      prisma.materialRequest.findMany({ where: { isDeleted: true } }).catch(() => []),
      prisma.dailyProductionReport.findMany({ where: { isDeleted: true } }).catch(() => []),
      prisma.machine.findMany({ where: { isDeleted: true } }).catch(() => []),
      prisma.costSheet.findMany({ where: { isDeleted: true } }).catch(() => []),
    ]);

    const formatItems = (items: any[], module: string, page: string, nameField: string | ((item: any) => string), type: string) => 
      (items || []).map(item => ({
        id: item.id,
        type,
        module,
        page,
        recordName: typeof nameField === 'function' ? nameField(item) : (item[nameField] || `${type} #${item.id}`),
        deletedBy: item.deletedBy || 'Administrator',
        deletedAt: item.deletedAt || item.updatedAt || new Date().toISOString(),
      }));

    const allDeletedItems = [
      // Inventory & Raw Materials
      ...formatItems(products, 'Inventory', 'Finished Products List', (p) => p.code ? `${p.code} - ${p.name}` : p.name, 'product'),
      ...formatItems(rawMaterials, 'Raw Materials', 'Raw Materials List', (r) => r.code ? `${r.code} - ${r.name}` : r.name, 'rawMaterial'),
      
      // Master Data
      ...formatItems(categories, 'Master Data', 'Categories', 'name', 'category'),
      ...formatItems(subCategories, 'Master Data', 'Subcategories', 'name', 'subCategory'),
      ...formatItems(materialGroups, 'Master Data', 'Material Groups', 'name', 'materialGroup'),
      ...formatItems(suppliers, 'Master Data', 'Suppliers', (s) => s.millName ? `${s.supplierName} (${s.millName})` : s.supplierName, 'supplier'),
      ...formatItems(warehouses, 'Master Data', 'Warehouses', 'name', 'warehouse'),
      ...formatItems(binLocations, 'Master Data', 'Storage Bins', (b) => b.code ? `${b.code} - ${b.name || 'Bin'}` : (b.name || 'Storage Bin'), 'binLocation'),
      
      // Procurement & Logistics
      ...formatItems(purchaseOrders, 'Procurement', 'Purchase Order List', 'poNumber', 'purchaseOrder'),
      ...formatItems(rfqs, 'Procurement', 'RFQ List', 'rfqNumber', 'rfq'),
      ...formatItems(supplierQuotations, 'Procurement', 'Quotations List', (q) => q.quoteNumber || q.quotationNumber || `Quote #${q.id.slice(0, 8)}`, 'supplierQuotation'),
      ...formatItems(gateEntries, 'Procurement', 'Gate Entry', (g) => g.vehicleNumber ? `${g.entryNumber || g.gateEntryNumber} (${g.vehicleNumber})` : (g.entryNumber || g.gateEntryNumber), 'gateEntry'),
      ...formatItems(reelInwards, 'Procurement', 'Reel Inward', (r) => r.reelNumber ? `${r.inwardNumber || 'Inward'} - Reel: ${r.reelNumber}` : (r.inwardNumber || 'Reel Inward'), 'reelInward'),
      ...formatItems(qualityChecks, 'Procurement', 'Quality Inspections', (qc) => qc.reportNumber || `QC Inspection #${qc.id.slice(0, 8)}`, 'qualityCheck'),

      // Sales Module
      ...formatItems(customers, 'Sales', 'Customer Directory', (c) => c.code ? `${c.code} - ${c.name}` : c.name, 'customer'),
      ...formatItems(salesLeads, 'Sales', 'Sales Leads & Enquiries', (l) => l.customerName ? `${l.leadNumber} - ${l.customerName}` : l.leadNumber, 'salesLead'),
      ...formatItems(salesQuotations, 'Sales', 'Sales Quotations', (q) => q.customerName ? `${q.quotationNumber} - ${q.customerName}` : q.quotationNumber, 'salesQuotation'),
      ...formatItems(salesOrders, 'Sales', 'Sales Orders', (so) => so.customerName ? `${so.soNumber} - ${so.customerName}` : so.soNumber, 'salesOrderEntity'),
      ...formatItems(dispatches, 'Sales', 'Delivery Challans & Dispatch', (d) => d.customerName ? `${d.challanNumber} - ${d.customerName}` : d.challanNumber, 'dispatch'),

      // Production Module
      ...formatItems(boms, 'Production', 'Bill of Materials (BOM)', (b) => b.bomNumber ? `${b.bomNumber} - ${b.name || 'BOM'}` : (b.name || 'BOM'), 'bom'),
      ...formatItems(workOrders, 'Production', 'Work Orders', (w) => w.orderNumber ? `${w.orderNumber} - ${w.productName || 'Work Order'}` : (w.productName || 'Work Order'), 'workOrder'),
      ...formatItems(productionPlans, 'Production', 'Planning & Scheduling', (p) => p.planDate ? `Plan ${p.planDate} (${p.shift || 'General'} - ${p.line || 'Line'})` : 'Production Plan', 'productionPlan'),
      ...formatItems(productionOrders, 'Production', 'Production Orders', (po) => po.orderNumber ? `${po.orderNumber} - ${po.status}` : 'Production Order', 'productionOrder'),
      ...formatItems(materialRequests, 'Production', 'Material Indents & Requests', (mr) => mr.requestNumber ? `${mr.requestNumber} (${mr.status})` : 'Material Indent', 'materialRequest'),
      ...formatItems(dailyProductionReports, 'Production', 'Daily Production Reports', (dpr) => dpr.reportNumber ? `${dpr.reportNumber} (${dpr.productionDate})` : `Daily Report #${dpr.id.slice(0, 8)}`, 'dailyProductionReport'),
      ...formatItems(machines, 'Production', 'Machines & Equipment', (m) => m.code ? `${m.code} - ${m.name}` : m.name, 'machine'),

      // Costing Module
      ...formatItems(costSheets, 'Costing', 'Cost Estimation Sheets', (cs) => cs.costSheetNumber ? `${cs.costSheetNumber} - ${cs.customerName || cs.productName || 'Cost Sheet'}` : (cs.title || 'Cost Sheet'), 'costSheet'),

      // User & Role Management
      ...formatItems(users, 'User Management', 'Users Directory', (u) => u.department ? `${u.name} (${u.email}) - ${u.department}` : `${u.name} (${u.email})`, 'user'),
      ...formatItems(roles, 'User Management', 'Roles & Permissions', 'name', 'role'),
    ].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    return NextResponse.json({
      success: true,
      data: allDeletedItems
    });
  } catch (error: any) {
    console.error('Error fetching recycle bin:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch recycle bin' }, { status: 500 });
  }
}
