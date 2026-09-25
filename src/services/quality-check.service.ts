import { prisma } from '../lib/prisma';
import { generateNextCode } from '../utils/code-generator';
import { AuditService } from './audit.service';

export interface QualityCheckFilterQuery {
  referenceType?: string;
  qcType?: string;
  status?: string;
  result?: string;
  search?: string;
  salesOrderId?: string;
  workOrderId?: string;
  reelInwardId?: string;
  productId?: string;
  rawMaterialId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

export class QualityCheckService {
  /**
   * Get all QC inspection records with search, filtering, and pagination
   */
  static async getAll(query?: QualityCheckFilterQuery) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (!query?.includeDeleted) {
      where.isDeleted = false;
    }

    if (query?.qcType && query.qcType !== 'All') {
      where.qcType = query.qcType;
    }

    if (query?.referenceType && query.referenceType !== 'All') {
      where.referenceType = query.referenceType;
    }

    if (query?.status && query.status !== 'All') {
      where.status = { contains: query.status, mode: 'insensitive' };
    }

    if (query?.result && query.result !== 'All') {
      where.result = query.result;
    }

    if (query?.salesOrderId) where.salesOrderId = query.salesOrderId;
    if (query?.workOrderId) where.workOrderId = query.workOrderId;
    if (query?.reelInwardId) where.reelInwardId = query.reelInwardId;
    if (query?.productId) where.productId = query.productId;
    if (query?.rawMaterialId) where.rawMaterialId = query.rawMaterialId;

    if (query?.search) {
      const search = query.search.trim();
      where.OR = [
        { qcNumber: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { inspector: { contains: search, mode: 'insensitive' } },
        { stage: { contains: search, mode: 'insensitive' } },
        { remarks: { contains: search, mode: 'insensitive' } },
        { rejectionReason: { contains: search, mode: 'insensitive' } },
        { salesOrder: { soNumber: { contains: search, mode: 'insensitive' } } },
        { salesOrder: { customerName: { contains: search, mode: 'insensitive' } } },
        { workOrder: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { code: { contains: search, mode: 'insensitive' } } },
        { rawMaterial: { name: { contains: search, mode: 'insensitive' } } },
        { rawMaterial: { code: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [checks, total] = await Promise.all([
      prisma.qualityCheck.findMany({
        where,
        include: {
          gateEntry: { include: { items: true, warehouse: true, purchaseOrder: { include: { supplier: true } } } },
          reelInward: { include: { items: true, supplier: true } },
          salesOrder: { include: { customer: true, product: true, warehouse: true } },
          workOrder: { include: { product: true, bom: true, operations: true, warehouse: true } },
          product: true,
          rawMaterial: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.qualityCheck.count({ where }),
    ]);

    return { checks, total, page, limit };
  }

  /**
   * Get single QC record by ID with all relations
   */
  static async getById(id: string) {
    return prisma.qualityCheck.findUnique({
      where: { id },
      include: {
        gateEntry: { include: { items: true, warehouse: true, purchaseOrder: { include: { supplier: true } } } },
        reelInward: { include: { items: true, supplier: true } },
        salesOrder: { include: { customer: true, product: true, warehouse: true } },
        workOrder: { include: { product: true, bom: true, operations: true, warehouse: true } },
        product: true,
        rawMaterial: true,
      },
    });
  }

  /**
   * Get QC Dashboard aggregate metrics
   */
  static async getDashboardStats() {
    const whereActive = { isDeleted: false };

    const [
      allChecks,
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      partialCount,
      todayChecks,
      pendingReels,
      pendingSampleSOs,
      pendingWorkOrders,
    ] = await Promise.all([
      prisma.qualityCheck.findMany({
        where: whereActive,
        select: {
          id: true,
          qcNumber: true,
          qcType: true,
          status: true,
          result: true,
          stage: true,
          inspector: true,
          inspectionDate: true,
          testedAt: true,
          expectedQuantity: true,
          inspectedQuantity: true,
          passedQuantity: true,
          rejectedQuantity: true,
          rejectionReason: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.qualityCheck.count({ where: whereActive }),
      prisma.qualityCheck.count({
        where: {
          ...whereActive,
          OR: [
            { status: { in: ['Pending', 'Pending QC', 'In Inspection', 'IN_INSPECTION'] } },
            { result: 'Pending' },
          ],
        },
      }),
      prisma.qualityCheck.count({
        where: {
          ...whereActive,
          OR: [
            { status: { in: ['Approved', 'Passed', 'QC PASSED', 'PASSED'] } },
            { result: 'Approved' },
          ],
        },
      }),
      prisma.qualityCheck.count({
        where: {
          ...whereActive,
          OR: [
            { status: { in: ['Rejected', 'Failed', 'QC FAILED', 'FAILED'] } },
            { result: 'Rejected' },
          ],
        },
      }),
      prisma.qualityCheck.count({
        where: {
          ...whereActive,
          OR: [
            { status: { in: ['Partially Approved', 'PARTIALLY PASSED', 'Conditional Pass'] } },
            { result: 'Partially Approved' },
          ],
        },
      }),
      prisma.qualityCheck.count({
        where: {
          ...whereActive,
          testedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.reelInward.count({
        where: {
          isDeleted: false,
          OR: [
            { status: { in: ['Pending QC', 'PENDING QC', 'Pending Inspection', 'Pending'] } },
            { qcStatus: { in: ['Pending', 'PENDING'] } },
          ],
        },
      }),
      prisma.salesOrderEntity.count({
        where: {
          isDeleted: false,
          OR: [
            { specialInstructions: { contains: 'Sample', mode: 'insensitive' } },
            { productName: { contains: 'Sample', mode: 'insensitive' } },
            { customerPoNumber: { contains: 'SAMPLE', mode: 'insensitive' } },
          ],
          productionStatus: { in: ['Planning', 'In Production', 'Produced', 'Pending Planning'] },
        },
      }),
      prisma.workOrder.count({
        where: {
          isDeleted: false,
          status: { in: ['In Production', 'Planned'] },
          currentStage: { in: ['QC', 'Die-Cutting', 'Printing', 'Corrugation', 'Finished Goods'] },
        },
      }),
    ]);

    // Breakdown by QC Type
    const typeMap: Record<string, { count: number; approved: number; rejected: number; pending: number }> = {
      'Reel Inward QC': { count: 0, approved: 0, rejected: 0, pending: 0 },
      'Sample SO QC': { count: 0, approved: 0, rejected: 0, pending: 0 },
      'Production QC': { count: 0, approved: 0, rejected: 0, pending: 0 },
      'Final QC': { count: 0, approved: 0, rejected: 0, pending: 0 },
    };

    allChecks.forEach((c) => {
      const type = c.qcType || 'Reel Inward QC';
      if (!typeMap[type]) {
        typeMap[type] = { count: 0, approved: 0, rejected: 0, pending: 0 };
      }
      typeMap[type].count += 1;

      const st = (c.status || '').toUpperCase();
      const res = (c.result || '').toUpperCase();

      if (res === 'APPROVED' || st.includes('PASS') || st.includes('APPROV')) {
        typeMap[type].approved += 1;
      } else if (res === 'REJECTED' || st.includes('FAIL') || st.includes('REJECT')) {
        typeMap[type].rejected += 1;
      } else {
        typeMap[type].pending += 1;
      }
    });

    const byType = Object.entries(typeMap).map(([type, stats]) => ({
      type,
      count: stats.count,
      approved: stats.approved,
      rejected: stats.rejected,
      pending: stats.pending,
    }));

    // Breakdown by Status
    const byStatus = [
      { status: 'Approved', count: approvedCount },
      { status: 'Pending', count: pendingCount },
      { status: 'Rejected', count: rejectedCount },
      { status: 'Partially Approved', count: partialCount },
    ];

    // Compute Pass Rate
    const evaluatedTotal = approvedCount + rejectedCount + partialCount;
    const passRate = evaluatedTotal > 0 ? Math.round(((approvedCount + partialCount * 0.5) / evaluatedTotal) * 100) : 100;

    // Recent inspections with full relations
    const [recentInspections, pendingInspections, rejectedInspections] = await Promise.all([
      prisma.qualityCheck.findMany({
        where: whereActive,
        include: {
          reelInward: { select: { id: true, reelNumber: true, inwardNumber: true } },
          salesOrder: { select: { id: true, soNumber: true, customerName: true } },
          workOrder: { select: { id: true, orderNumber: true } },
          product: { select: { id: true, name: true, code: true } },
          rawMaterial: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.qualityCheck.findMany({
        where: {
          ...whereActive,
          OR: [
            { status: { in: ['Pending', 'Pending QC', 'In Inspection'] } },
            { result: 'Pending' },
          ],
        },
        include: {
          reelInward: { select: { id: true, reelNumber: true, inwardNumber: true } },
          salesOrder: { select: { id: true, soNumber: true, customerName: true } },
          workOrder: { select: { id: true, orderNumber: true } },
          product: { select: { id: true, name: true, code: true } },
          rawMaterial: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.qualityCheck.findMany({
        where: {
          ...whereActive,
          OR: [
            { status: { in: ['Rejected', 'Failed', 'QC FAILED'] } },
            { result: 'Rejected' },
          ],
        },
        include: {
          reelInward: { select: { id: true, reelNumber: true, inwardNumber: true } },
          salesOrder: { select: { id: true, soNumber: true, customerName: true } },
          workOrder: { select: { id: true, orderNumber: true } },
          product: { select: { id: true, name: true, code: true } },
          rawMaterial: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    return {
      totalInspections: totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      partiallyApprovedCount: partialCount,
      todayCount: todayChecks,
      sampleQcPending: pendingSampleSOs,
      reelQcPending: pendingReels,
      productionQcPending: pendingWorkOrders,
      finalQcPending: Math.max(0, pendingWorkOrders - 2),
      passRate,
      byType,
      byStatus,
      recentInspections,
      pendingInspections,
      rejectedInspections,
    };
  }

  /**
   * Get Candidate entities across the system awaiting Quality Check
   */
  static async getPendingCandidates() {
    const [reels, sampleSOs, workOrders] = await Promise.all([
      // Reel Inwards pending QC
      prisma.reelInward.findMany({
        where: {
          isDeleted: false,
          OR: [
            { status: { in: ['Pending QC', 'PENDING QC', 'Pending Inspection', 'Pending'] } },
            { qcStatus: { in: ['Pending', 'PENDING', 'Pending QC'] } },
          ],
        },
        include: { items: true, supplier: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      // Sample Sales Orders
      prisma.salesOrderEntity.findMany({
        where: {
          isDeleted: false,
          OR: [
            { specialInstructions: { contains: 'Sample', mode: 'insensitive' } },
            { productName: { contains: 'Sample', mode: 'insensitive' } },
            { customerPoNumber: { contains: 'SAMPLE', mode: 'insensitive' } },
            { status: { in: ['Confirmed', 'In Production', 'Planning'] } },
          ],
        },
        include: { customer: true, product: true, warehouse: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      // Work Orders in stages
      prisma.workOrder.findMany({
        where: {
          isDeleted: false,
          status: { in: ['In Production', 'Planned', 'Completed'] },
        },
        include: { product: true, bom: true, operations: true, warehouse: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      pendingReels: reels,
      sampleSalesOrders: sampleSOs,
      activeWorkOrders: workOrders,
    };
  }

  /**
   * Create a new QC Inspection record
   */
  static async create(data: any) {
    return this.processQcInspection(null, data);
  }

  /**
   * Update an existing QC Inspection record
   */
  static async update(id: string, data: any) {
    return this.processQcInspection(id, data);
  }

  /**
   * Soft Delete a QC record
   */
  static async softDelete(id: string, deletedBy?: string) {
    return prisma.qualityCheck.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deletedBy || 'System User',
      },
    });
  }

  /**
   * Restore a soft-deleted QC record
   */
  static async restore(id: string) {
    return prisma.qualityCheck.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    });
  }

  /**
   * Core Transactional QC Inspection Processor
   */
  private static async processQcInspection(existingQcId: string | null, data: any) {
    const qcNumber = data.qcNumber || null;
    const qcType = data.qcType || (data.reelInwardId ? 'Reel Inward QC' : (data.salesOrderId ? 'Sample SO QC' : (data.workOrderId ? 'Production QC' : 'Reel Inward QC')));

    const qcData = {
      qcType,
      referenceType: data.referenceType || (qcType === 'Reel Inward QC' ? 'Reel Inward' : (qcType === 'Sample SO QC' ? 'Sales Order' : 'Work Order')),
      referenceNumber: data.referenceNumber || data.soNumber || data.woNumber || data.reelNumber || null,
      gateEntryId: data.gateEntryId || null,
      reelInwardId: data.reelInwardId || null,
      salesOrderId: data.salesOrderId || null,
      workOrderId: data.workOrderId || null,
      productId: data.productId || null,
      rawMaterialId: data.rawMaterialId || null,
      stage: data.stage || (qcType === 'Final QC' ? 'Final Inspection' : (qcType === 'Sample SO QC' ? 'Sample Evaluation' : 'In-Process')),
      operationId: data.operationId || null,
      inspector: data.inspector || data.inspectorName || 'QC Specialist',
      status: data.status || 'Pending',
      result: data.result || (data.status === 'Approved' || data.status === 'QC PASSED' ? 'Approved' : (data.status === 'Rejected' || data.status === 'QC FAILED' ? 'Rejected' : 'Pending')),
      expectedQuantity: Number(data.expectedQuantity || data.quantity || 0),
      inspectedQuantity: Number(data.inspectedQuantity || data.sampleSize || data.quantity || 0),
      passedQuantity: Number(data.passedQuantity || 0),
      rejectedQuantity: Number(data.rejectedQuantity || data.rejectedQty || 0),
      balanceQuantity: Number(data.balanceQuantity || 0),
      wastageQuantity: Number(data.wastageQuantity || 0),
      rejectionReason: data.rejectionReason || null,
      rootCause: data.rootCause || null,
      correctiveAction: data.correctiveAction || null,
      remarks: data.remarks || '',
      testedAt: data.testedAt ? new Date(data.testedAt) : new Date(),
      inspectionDate: data.inspectionDate || new Date().toISOString().split('T')[0],
    };

    let inspectionItems: any[] = [];
    try {
      inspectionItems = typeof data.parameters === 'string'
        ? JSON.parse(data.parameters)
        : (data.parameters || []);
    } catch (e) {
      inspectionItems = [];
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        let dbReelInward: any = null;
        let dbSalesOrder: any = null;
        let dbWorkOrder: any = null;

        // 1. Resolve Reel Inward if provided
        if (qcData.reelInwardId) {
          dbReelInward = await tx.reelInward.findUnique({
            where: { id: qcData.reelInwardId },
            include: { items: true, supplier: true },
          });
          if (dbReelInward && !qcData.referenceNumber) {
            qcData.referenceNumber = dbReelInward.inwardNumber || dbReelInward.reelNumber;
          }
        }

        // 2. Resolve Sales Order if provided
        if (qcData.salesOrderId) {
          dbSalesOrder = await tx.salesOrderEntity.findUnique({
            where: { id: qcData.salesOrderId },
            include: { customer: true, product: true },
          });
          if (dbSalesOrder) {
            if (!qcData.referenceNumber) qcData.referenceNumber = dbSalesOrder.soNumber;
            if (!qcData.productId && dbSalesOrder.productId) qcData.productId = dbSalesOrder.productId;
            if (!qcData.expectedQuantity) qcData.expectedQuantity = dbSalesOrder.quantity;
          }
        }

        // 3. Resolve Work Order if provided
        if (qcData.workOrderId) {
          dbWorkOrder = await tx.workOrder.findUnique({
            where: { id: qcData.workOrderId },
            include: { product: true, bom: true, operations: true },
          });
          if (dbWorkOrder) {
            if (!qcData.referenceNumber) qcData.referenceNumber = dbWorkOrder.woNumber;
            if (!qcData.productId && dbWorkOrder.productId) qcData.productId = dbWorkOrder.productId;
            if (!qcData.expectedQuantity) qcData.expectedQuantity = dbWorkOrder.orderedQuantity;
          }
        }

        // 4. Create or Update QualityCheck record
        let qc: any = null;
        if (existingQcId) {
          qc = await tx.qualityCheck.update({
            where: { id: existingQcId },
            data: {
              qcType: qcData.qcType,
              referenceType: qcData.referenceType,
              referenceNumber: qcData.referenceNumber,
              gateEntryId: qcData.gateEntryId,
              reelInwardId: qcData.reelInwardId,
              salesOrderId: qcData.salesOrderId,
              workOrderId: qcData.workOrderId,
              productId: qcData.productId,
              rawMaterialId: qcData.rawMaterialId,
              stage: qcData.stage,
              operationId: qcData.operationId,
              inspector: qcData.inspector,
              status: qcData.status,
              result: qcData.result,
              expectedQuantity: qcData.expectedQuantity,
              inspectedQuantity: qcData.inspectedQuantity,
              passedQuantity: qcData.passedQuantity,
              rejectedQuantity: qcData.rejectedQuantity,
              balanceQuantity: qcData.balanceQuantity,
              wastageQuantity: qcData.wastageQuantity,
              rejectionReason: qcData.rejectionReason,
              rootCause: qcData.rootCause,
              correctiveAction: qcData.correctiveAction,
              remarks: qcData.remarks,
              testedAt: qcData.testedAt,
              inspectionDate: qcData.inspectionDate,
              parameters: JSON.stringify(inspectionItems),
            },
            include: {
              gateEntry: { include: { items: true } },
              reelInward: true,
              salesOrder: true,
              workOrder: true,
              product: true,
              rawMaterial: true,
            },
          });
        } else {
          const finalQcNumber = qcNumber || await generateNextCode('qualityCheck', 'QC-', 'qcNumber', 4, tx);

          const existingByQcNumber = await tx.qualityCheck.findUnique({
            where: { qcNumber: finalQcNumber },
          });

          if (existingByQcNumber) {
            qc = await tx.qualityCheck.update({
              where: { id: existingByQcNumber.id },
              data: {
                qcType: qcData.qcType,
                referenceType: qcData.referenceType,
                referenceNumber: qcData.referenceNumber,
                gateEntryId: qcData.gateEntryId,
                reelInwardId: qcData.reelInwardId,
                salesOrderId: qcData.salesOrderId,
                workOrderId: qcData.workOrderId,
                productId: qcData.productId,
                rawMaterialId: qcData.rawMaterialId,
                stage: qcData.stage,
                operationId: qcData.operationId,
                inspector: qcData.inspector,
                status: qcData.status,
                result: qcData.result,
                expectedQuantity: qcData.expectedQuantity,
                inspectedQuantity: qcData.inspectedQuantity,
                passedQuantity: qcData.passedQuantity,
                rejectedQuantity: qcData.rejectedQuantity,
                balanceQuantity: qcData.balanceQuantity,
                wastageQuantity: qcData.wastageQuantity,
                rejectionReason: qcData.rejectionReason,
                rootCause: qcData.rootCause,
                correctiveAction: qcData.correctiveAction,
                remarks: qcData.remarks,
                testedAt: qcData.testedAt,
                inspectionDate: qcData.inspectionDate,
                parameters: JSON.stringify(inspectionItems),
              },
              include: {
                gateEntry: { include: { items: true } },
                reelInward: true,
                salesOrder: true,
                workOrder: true,
                product: true,
                rawMaterial: true,
              },
            });
          } else {
            qc = await tx.qualityCheck.create({
              data: {
                qcNumber: finalQcNumber,
                qcType: qcData.qcType,
                referenceType: qcData.referenceType,
                referenceNumber: qcData.referenceNumber,
                gateEntryId: qcData.gateEntryId,
                reelInwardId: qcData.reelInwardId,
                salesOrderId: qcData.salesOrderId,
                workOrderId: qcData.workOrderId,
                productId: qcData.productId,
                rawMaterialId: qcData.rawMaterialId,
                stage: qcData.stage,
                operationId: qcData.operationId,
                inspector: qcData.inspector,
                status: qcData.status,
                result: qcData.result,
                expectedQuantity: qcData.expectedQuantity,
                inspectedQuantity: qcData.inspectedQuantity,
                passedQuantity: qcData.passedQuantity,
                rejectedQuantity: qcData.rejectedQuantity,
                balanceQuantity: qcData.balanceQuantity,
                wastageQuantity: qcData.wastageQuantity,
                rejectionReason: qcData.rejectionReason,
                rootCause: qcData.rootCause,
                correctiveAction: qcData.correctiveAction,
                remarks: qcData.remarks,
                testedAt: qcData.testedAt,
                inspectionDate: qcData.inspectionDate,
                parameters: JSON.stringify(inspectionItems),
              },
              include: {
                gateEntry: { include: { items: true } },
                reelInward: true,
                salesOrder: true,
                workOrder: true,
                product: true,
                rawMaterial: true,
              },
            });
          }
        }

        // 5. Handle Type-Specific Workflows & Inventory Integration

        // A. REEL INWARD QC FLOW
        if (dbReelInward) {
          const inwardItems = dbReelInward.items || [];
          const inwardIdentifier = dbReelInward.inwardNumber || dbReelInward.reelNumber || dbReelInward.id;

          let targetWarehouse = await tx.warehouse.findFirst({
            where: { isDeleted: false },
            orderBy: { createdAt: 'asc' },
          });

          for (const row of inspectionItems) {
            const rowReelNo = (row.reelNo || row.reelNumber || '').trim();
            if (!rowReelNo) continue;

            let matchedItem = inwardItems.find(
              (it: any) => it.reelNumber.trim().toUpperCase() === rowReelNo.toUpperCase()
            );

            if (!matchedItem) {
              matchedItem = await tx.reelInwardItem.findFirst({
                where: { reelInwardId: dbReelInward.id, reelNumber: rowReelNo },
              });
            }

            const isPassed =
              row.result === 'Passed' ||
              row.result === 'PASSED' ||
              row.result === 'Approved' ||
              row.result === 'APPROVED';

            const isFailed =
              row.result === 'Failed' ||
              row.result === 'FAILED' ||
              row.result === 'Rejected' ||
              row.result === 'REJECTED';

            const itemQcStatus = isPassed ? 'Approved' : (isFailed ? 'Rejected' : 'Pending');
            const itemStatusText = isPassed ? 'PASSED' : (isFailed ? 'FAILED' : 'Pending QC');

            const itemWeight = row.netWeight ? Number(row.netWeight) : (matchedItem?.weight || 0);
            const itemGsm = row.observationGsm ? Number(row.observationGsm) : (row.gsm ? Number(row.gsm) : matchedItem?.gsm);
            const itemBf = row.observationBf ? Number(row.observationBf) : (row.bf ? Number(row.bf) : matchedItem?.bf);

            if (matchedItem) {
              await tx.reelInwardItem.update({
                where: { id: matchedItem.id },
                data: {
                  qcStatus: itemQcStatus,
                  status: itemStatusText,
                  gsm: itemGsm || matchedItem.gsm,
                  bf: itemBf || matchedItem.bf,
                  weight: itemWeight > 0 ? itemWeight : matchedItem.weight,
                  remarks: row.remarks || row.observation || matchedItem.remarks,
                },
              });
            } else {
              matchedItem = await tx.reelInwardItem.create({
                data: {
                  reelInwardId: dbReelInward.id,
                  reelNumber: rowReelNo,
                  material: row.material || dbReelInward.description || 'Paper Reel',
                  weight: itemWeight,
                  gsm: itemGsm,
                  bf: itemBf,
                  uom: 'Kg',
                  qcStatus: itemQcStatus,
                  status: itemStatusText,
                  remarks: row.remarks || null,
                },
              });
            }

            // Raw Material Stock update for passed reel
            const targetGsm = itemGsm || dbReelInward.gsm;
            let rawMat = await tx.rawMaterial.findFirst({
              where: {
                isDeleted: false,
                OR: [
                  targetGsm ? { gsm: Number(targetGsm) } : undefined,
                  { name: { contains: 'Kraft', mode: 'insensitive' } },
                  { name: { contains: 'Paper', mode: 'insensitive' } },
                ].filter(Boolean) as any,
              },
            });

            if (!rawMat) {
              rawMat = await tx.rawMaterial.findFirst({ where: { isDeleted: false } });
            }

            if (rawMat && targetWarehouse && isPassed) {
              const weightToAdd = itemWeight > 0 ? itemWeight : 500;
              await tx.rawMaterial.update({
                where: { id: rawMat.id },
                data: { currentStock: rawMat.currentStock + weightToAdd },
              });

              await tx.inventoryTransaction.create({
                data: {
                  transactionNumber: `TXN-QC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  itemCode: rawMat.code || 'RM-KRAFT',
                  itemName: rawMat.name,
                  itemType: 'Raw Material',
                  rawMaterialId: rawMat.id,
                  warehouseId: targetWarehouse.id,
                  quantity: weightToAdd,
                  previousStock: rawMat.currentStock,
                  currentStock: rawMat.currentStock + weightToAdd,
                  transactionType: 'QC Release',
                  user: qcData.inspector,
                  date: qcData.inspectionDate,
                  time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  reason: `Approved QC for Reel ${rowReelNo}`,
                  referenceNumber: rowReelNo,
                  referenceType: 'Reel Inward QC',
                },
              });
            }
          }

          // Authoritative Reel Inward status
          const updatedItems = await tx.reelInwardItem.findMany({
            where: { reelInwardId: dbReelInward.id },
          });

          const totalCount = updatedItems.length > 0 ? updatedItems.length : inspectionItems.length;
          const passedCount = updatedItems.filter((it) => it.qcStatus === 'Approved' || it.status === 'PASSED').length;
          const failedCount = updatedItems.filter((it) => it.qcStatus === 'Rejected' || it.status === 'FAILED').length;

          let overallStatus = 'QC PASSED';
          let overallQcStatus = 'Approved';

          if (failedCount === totalCount && totalCount > 0) {
            overallStatus = 'QC FAILED';
            overallQcStatus = 'Rejected';
          } else if (failedCount > 0 && passedCount > 0) {
            overallStatus = 'PARTIALLY PASSED';
            overallQcStatus = 'Partially Approved';
          } else if (passedCount === 0 && totalCount > 0) {
            overallStatus = 'PENDING QC';
            overallQcStatus = 'Pending';
          }

          await tx.reelInward.update({
            where: { id: dbReelInward.id },
            data: { status: overallStatus, qcStatus: overallQcStatus },
          });
        }

        // B. SAMPLE SALES ORDER QC FLOW
        if (dbSalesOrder) {
          const isSampleApproved = qcData.status === 'Approved' || qcData.result === 'Approved';
          const isSampleRejected = qcData.status === 'Rejected' || qcData.result === 'Rejected';

          const newProductionStatus = isSampleApproved
            ? 'QC Passed'
            : isSampleRejected
            ? 'QC Rejected'
            : 'In Production';

          await tx.salesOrderEntity.update({
            where: { id: dbSalesOrder.id },
            data: {
              productionStatus: newProductionStatus,
              status: isSampleApproved ? 'Ready' : (isSampleRejected ? 'Planning' : dbSalesOrder.status),
            },
          });
        }

        // C. PRODUCTION / FINAL QC FLOW
        if (dbWorkOrder) {
          const isWoApproved = qcData.status === 'Approved' || qcData.result === 'Approved';
          const isWoRejected = qcData.status === 'Rejected' || qcData.result === 'Rejected';

          if (isWoApproved) {
            if (qcData.qcType === 'Final QC' || qcData.stage === 'Final Inspection') {
              await tx.workOrder.update({
                where: { id: dbWorkOrder.id },
                data: {
                  currentStage: 'Finished Goods',
                  status: 'Completed',
                  producedQuantity: dbWorkOrder.orderedQuantity,
                },
              });

              if (dbWorkOrder.salesOrderId) {
                await tx.salesOrderEntity.update({
                  where: { id: dbWorkOrder.salesOrderId },
                  data: {
                    productionStatus: 'QC Passed',
                    dispatchStatus: 'Ready for Dispatch',
                  },
                });
              }
            } else {
              // In-Process QC passed: move operation forward
              await tx.workOrder.update({
                where: { id: dbWorkOrder.id },
                data: {
                  currentStage: 'QC Passed - Next Stage',
                },
              });
            }
          } else if (isWoRejected) {
            await tx.workOrder.update({
              where: { id: dbWorkOrder.id },
              data: {
                rejectedQuantity: (dbWorkOrder.rejectedQuantity || 0) + (qcData.rejectedQuantity || 1),
                currentStage: 'QC Rejected - Rework Required',
              },
            });
          }
        }

        // Audit Trail entry
        await AuditService.safeCreate(tx, {
          action: existingQcId ? 'QUALITY_CHECK_UPDATED' : 'QUALITY_CHECK_CREATED',
          module: 'Quality',
          entity: 'QualityCheck',
          entityId: qc.id,
          user: qcData.inspector,
          details: `Recorded Quality Inspection ${qc.qcNumber} (${qc.qcType}) - Status: ${qc.status}, Result: ${qc.result || 'Pending'}. Reference: ${qc.referenceNumber || 'N/A'}.`,
        });

        return qc;
      });

      return result;
    } catch (error) {
      console.error('QUALITY CHECK SERVICE ERROR', error);
      throw error;
    }
  }
}
