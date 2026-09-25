import { getPrisma } from '../lib/prisma';
import { generateNextCode } from '../utils/code-generator';
import { InventoryService } from './inventory.service';

// Standard Packaging Process Steps
export const DEFAULT_PRODUCTION_PROCESSES = [
  'Paper Cutting',
  'Corrugation',
  'Printing & Slotting',
  'Die-Cutting & Pasting',
  'Punching & Scoring',
  'Stitching & Strapping',
  'Folder Gluer',
  'Final QC',
];

export interface CreateBomInput {
  bomNumber?: string;
  name: string;
  productId: string;
  fluteType?: string;
  ply?: number;
  deckleSizeMm?: number;
  cutSizeMm?: number;
  totalWeightGrams?: number;
  estimatedCost?: number;
  status?: string;
  notes?: string;
  items: Array<{
    layer: string;
    materialId?: string;
    materialCode?: string;
    materialName: string;
    gsm?: number;
    quantityPerUnit: number;
    unit?: string;
    unitCost?: number;
    totalCost?: number;
  }>;
}

export interface CreateWorkOrderInput {
  orderNumber?: string;
  salesOrderId?: string;
  productId: string;
  bomId?: string;
  orderedQuantity: number;
  startDate?: string;
  targetDate?: string;
  priority?: string;
  status?: string;
  assignedLine?: string;
  warehouseId?: string;
  supervisor?: string;
  remarks?: string;
  operations?: Array<{
    sequence?: number;
    stageName: string;
    machineId?: string;
    machineName?: string;
    operatorName?: string;
    status?: string;
    inputQuantity?: number;
    outputQuantity?: number;
    scrapQuantity?: number;
    startTime?: string | Date | null;
    endTime?: string | Date | null;
    notes?: string;
  }>;
}

export interface CreateProductionPlanInput {
  planNumber?: string;
  planDate: string;
  shift?: string;
  line: string;
  salesOrderId?: string;
  workOrderId?: string;
  productId?: string;
  bomId?: string;
  customerId?: string;
  customerName?: string;
  totalSalesOrderQty?: number;
  previouslyProducedQty?: number;
  remainingQty?: number;
  targetQuantity: number;
  scheduledHours?: number;
  priority?: string;
  selectedProcesses?: string | string[];
  status?: string;
  supervisor?: string;
  notes?: string;
  remarks?: string;
}

export interface CreateProductionOrderInput {
  orderNumber?: string;
  productionDate: string;
  productionPlanId?: string;
  workOrderId: string;
  salesOrderId?: string;
  productId: string;
  bomId?: string;
  plannedQuantity: number;
  actualQuantity?: number;
  status?: string;
  supervisor?: string;
  remarks?: string;
  processNames?: string[];
}

export interface CreateMaterialRequestInput {
  indentNumber?: string;
  productionOrderId?: string;
  workOrderId?: string;
  productId?: string;
  rawMaterialId: string;
  requiredQuantity: number;
  uom?: string;
  requiredDate: string;
  requestedBy: string;
  remarks?: string;
}

export interface CreateMaterialAllocationInput {
  materialRequestId?: string;
  productionOrderId?: string;
  rawMaterialId: string;
  rawMaterialStockId?: string;
  batchLotNumber?: string;
  supplierName?: string;
  quantity: number;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  allocationDate?: string;
  allocatedBy: string;
}

export interface CreateMaterialIssueInput {
  productionOrderId: string;
  allocationId?: string;
  rawMaterialId: string;
  batchLotNumber?: string;
  quantityIssued: number;
  warehouseId: string;
  operatorTeam?: string;
  issueDate?: string;
  issuedBy: string;
  reference?: string;
  remarks?: string;
}

export interface CreateMaterialReturnInput {
  productionOrderId: string;
  rawMaterialId: string;
  batchLotNumber?: string;
  quantityReturned: number;
  destinationWarehouseId: string;
  returnDate?: string;
  returnedBy: string;
  receivedBy?: string;
  reason: string;
}

export interface CreateDailyReportInput {
  reportNumber?: string;
  productionDate: string;
  workOrderId?: string;
  productionOrderId?: string;
  salesOrderId?: string;
  productId: string;
  plannedQuantity: number;
  actualProducedQuantity: number;
  balanceQuantity?: number;
  scrapQuantity?: number;
  wastageQuantity?: number;
  materialIssued?: number;
  materialConsumed?: number;
  materialReturned?: number;
  reasonForNonCompletion?: string;
  operator?: string;
  supervisor?: string;
  remarks?: string;
}

export interface CreateQCInput {
  qcNumber?: string;
  workOrderId?: string;
  productionOrderId?: string;
  stage: string;
  inspectorName: string;
  sampleSize?: number;
  burstingFactor?: number;
  burstingStrength?: number;
  moisturePercent?: number;
  boxCompressionTest?: number;
  caliperThicknessMm?: number;
  dimensionCheck?: string;
  printQuality?: string;
  status?: string;
  rejectedQty?: number;
  remarks?: string;
  inspectionDate?: string;
}

export interface CreateScrapInput {
  scrapNumber?: string;
  workOrderId?: string;
  stage: string;
  materialType: string;
  weightKg: number;
  reason: string;
  recordedBy: string;
  date?: string;
}

export interface CreateDowntimeInput {
  machineId: string;
  reasonCategory: string;
  durationMinutes: number;
  startTime: string | Date;
  endTime?: string | Date;
  resolvedBy?: string;
  actionTaken?: string;
  date?: string;
}

export class ProductionService {
  // =========================================================================
  // 1. DASHBOARD OVERVIEW & METRICS
  // =========================================================================
  static async getDashboardMetrics() {
    const prisma = getPrisma();
    const today = new Date().toISOString().split('T')[0];

    const [
      activeWorkOrdersCount,
      totalWorkOrdersCount,
      completedWorkOrdersCount,
      activeProductionOrdersCount,
      todayPlans,
      activeMachines,
      totalMachines,
      pendingQCInspections,
      todayScrap,
      recentProductionOrders,
      recentDailyReports,
      pendingAllocations,
    ] = await Promise.all([
      prisma.workOrder.count({
        where: { isDeleted: false, status: { in: ['Planned', 'In Production', 'Running'] } },
      }),
      prisma.workOrder.count({ where: { isDeleted: false } }),
      prisma.workOrder.count({ where: { isDeleted: false, status: 'Completed' } }),
      prisma.productionOrder.count({
        where: { isDeleted: false, status: { in: ['Planned', 'Material Allocated', 'Material Issued', 'In Production', 'Partially Completed'] } },
      }),
      prisma.productionPlan.findMany({
        where: { isDeleted: false, planDate: today },
      }),
      prisma.machine.count({ where: { isDeleted: false, status: 'Running' } }),
      prisma.machine.count({ where: { isDeleted: false } }),
      prisma.qualityCheck.count({
        where: { isDeleted: false, status: 'Pending', referenceType: { in: ['Work Order', 'Production Order', 'Process Stage'] } },
      }),
      prisma.scrapLog.findMany({
        where: { date: today },
      }),
      prisma.productionOrder.findMany({
        where: { isDeleted: false },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, code: true, boxType: true, dimensions: true } },
          workOrder: { select: { id: true, orderNumber: true, priority: true } },
          salesOrder: { select: { id: true, soNumber: true, customerName: true } },
          processSteps: { orderBy: { sequence: 'asc' } },
        },
      }),
      prisma.dailyProductionReport.findMany({
        where: { isDeleted: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, code: true } },
          productionOrder: { select: { orderNumber: true } },
        },
      }),
      prisma.materialAllocation.count({
        where: { status: 'Allocated' },
      }),
    ]);

    const totalTodayPlannedQty = todayPlans.reduce((sum, p) => sum + (p.targetQuantity || 0), 0);
    const todayTotalScrapKg = todayScrap.reduce((sum, s) => sum + (s.weightKg || 0), 0);

    // Calculate overall achievement rate for today's reports
    const todayReports = await prisma.dailyProductionReport.findMany({
      where: { isDeleted: false, productionDate: today },
    });
    const todayActualProduced = todayReports.reduce((sum, r) => sum + (r.actualProducedQuantity || 0), 0);
    const overallAchievementPercent = totalTodayPlannedQty > 0
      ? Math.min(100, Math.round((todayActualProduced / totalTodayPlannedQty) * 100))
      : 0;

    return {
      activeWorkOrdersCount,
      totalWorkOrdersCount,
      completedWorkOrdersCount,
      activeProductionOrdersCount,
      totalTodayPlannedQty,
      todayActualProduced,
      overallAchievementPercent,
      activeMachines,
      totalMachines,
      pendingQCInspections,
      todayTotalScrapKg,
      pendingAllocations,
      recentProductionOrders,
      recentDailyReports,
    };
  }

  // =========================================================================
  // 2. BILL OF MATERIALS (BOM)
  // =========================================================================
  static async getBoms(query?: {
    productId?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const prisma = getPrisma();
    const where: any = { isDeleted: false };
    if (query?.productId) where.productId = query.productId;
    if (query?.status && query.status !== 'All') where.status = query.status;
    if (query?.search) {
      where.OR = [
        { bomNumber: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { product: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query?.page && query?.limit) {
      const page = query.page || 1;
      const limit = query.limit || 50;
      const skip = (page - 1) * limit;

      const [boms, total] = await Promise.all([
        prisma.billOfMaterial.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            product: true,
            customer: true,
            items: {
              include: { material: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        }),
        prisma.billOfMaterial.count({ where }),
      ]);

      return { boms, total, page, limit };
    }

    const boms = await prisma.billOfMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        customer: true,
        items: {
          include: { material: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return { boms, total: boms.length, page: 1, limit: boms.length };
  }

  static async getBomById(id: string) {
    const prisma = getPrisma();
    return prisma.billOfMaterial.findUnique({
      where: { id },
      include: {
        product: true,
        customer: true,
        items: {
          include: { material: true },
          orderBy: { createdAt: 'asc' },
        },
        workOrders: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async createBom(data: CreateBomInput, user?: string) {
    const prisma = getPrisma();
    const bomNumber = data.bomNumber || (await generateNextCode('billOfMaterial', 'BOM-2025-', 'bomNumber', 3));

    const totalCost = data.items.reduce((sum, item) => sum + (item.totalCost || item.quantityPerUnit * (item.unitCost || 0)), 0);

    return prisma.billOfMaterial.create({
      data: {
        bomNumber,
        name: data.name,
        productId: data.productId,
        fluteType: data.fluteType || 'BC-Flute (5-Ply)',
        ply: data.ply || 5,
        deckleSizeMm: data.deckleSizeMm,
        cutSizeMm: data.cutSizeMm,
        totalWeightGrams: data.totalWeightGrams,
        estimatedCost: data.estimatedCost || totalCost,
        status: data.status || 'Active',
        notes: data.notes,
        createdBy: user || 'Production Team',
        items: {
          create: data.items.map((item) => ({
            layer: item.layer,
            materialId: item.materialId,
            materialCode: item.materialCode,
            materialName: item.materialName,
            gsm: item.gsm,
            quantityPerUnit: item.quantityPerUnit,
            unit: item.unit || 'Kg',
            unitCost: item.unitCost || 0,
            totalCost: item.totalCost || item.quantityPerUnit * (item.unitCost || 0),
          })),
        },
      },
      include: {
        product: true,
        items: { include: { material: true } },
      },
    });
  }

  static async updateBom(id: string, data: Partial<CreateBomInput>) {
    const prisma = getPrisma();

    if (data.items) {
      await prisma.bomItem.deleteMany({ where: { bomId: id } });
    }

    return prisma.billOfMaterial.update({
      where: { id },
      data: {
        name: data.name,
        productId: data.productId,
        fluteType: data.fluteType,
        ply: data.ply,
        deckleSizeMm: data.deckleSizeMm,
        cutSizeMm: data.cutSizeMm,
        totalWeightGrams: data.totalWeightGrams,
        estimatedCost: data.estimatedCost,
        status: data.status,
        notes: data.notes,
        ...(data.items && {
          items: {
            create: data.items.map((item) => ({
              layer: item.layer,
              materialId: item.materialId,
              materialCode: item.materialCode,
              materialName: item.materialName,
              gsm: item.gsm,
              quantityPerUnit: item.quantityPerUnit,
              unit: item.unit || 'Kg',
              unitCost: item.unitCost || 0,
              totalCost: item.totalCost || item.quantityPerUnit * (item.unitCost || 0),
            })),
          },
        }),
      },
      include: {
        product: true,
        items: { include: { material: true } },
      },
    });
  }

  static async deleteBom(id: string, user?: string) {
    const prisma = getPrisma();
    return prisma.billOfMaterial.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user || 'System',
      },
    });
  }

  // =========================================================================
  // 3. WORK ORDERS
  // =========================================================================
  static async getWorkOrders(query?: {
    search?: string;
    status?: string;
    salesOrderId?: string;
    priority?: string;
    stage?: string;
    productId?: string;
    page?: number;
    limit?: number;
  }) {
    const prisma = getPrisma();
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (query?.status && query.status !== 'All') where.status = query.status;
    if (query?.salesOrderId) where.salesOrderId = query.salesOrderId;
    if (query?.productId) where.productId = query.productId;
    if (query?.priority && query.priority !== 'All') where.priority = query.priority;
    if (query?.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { product: { name: { contains: query.search, mode: 'insensitive' } } },
        { product: { code: { contains: query.search, mode: 'insensitive' } } },
        { salesOrder: { soNumber: { contains: query.search, mode: 'insensitive' } } },
        { salesOrder: { customerName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          salesOrder: true,
          bom: { include: { items: { include: { material: true } } } },
          operations: { orderBy: { sequence: 'asc' } },
          productionOrders: {
            where: { isDeleted: false },
            include: { processSteps: { orderBy: { sequence: 'asc' } } },
          },
          materialRequests: { where: { isDeleted: false } },
        },
      }),
      prisma.workOrder.count({ where }),
    ]);

    return { workOrders, total, page, limit };
  }

  static async getWorkOrderById(id: string) {
    const prisma = getPrisma();
    return prisma.workOrder.findUnique({
      where: { id },
      include: {
        product: true,
        salesOrder: {
          include: { customer: true },
        },
        bom: {
          include: {
            items: { include: { material: true } },
          },
        },
        operations: {
          orderBy: { sequence: 'asc' },
          include: { machine: true },
        },
        productionOrders: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          include: {
            processSteps: { orderBy: { sequence: 'asc' }, include: { machine: true } },
            materialAllocations: true,
            materialIssues: true,
            dailyReports: true,
          },
        },
        materialRequests: {
          where: { isDeleted: false },
          include: { rawMaterial: true, allocations: true },
        },
        qcInspections: {
          orderBy: { createdAt: 'desc' },
        },
        scrapLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async releaseWorkOrderToFloor(id: string, user?: string) {
    const prisma = getPrisma();
    return prisma.workOrder.update({
      where: { id },
      data: {
        status: 'In Production',
        updatedAt: new Date(),
      },
      include: {
        product: true,
        operations: { orderBy: { sequence: 'asc' } },
      },
    });
  }

  static async updateOperationProgress(
    operationId: string,
    data: { completedQty?: number; scrapQty?: number; status?: string; operatorNotes?: string },
    user?: string
  ) {
    const prisma = getPrisma();
    const op = await prisma.workOrderOperation.findUnique({ where: { id: operationId } });
    if (!op) throw new Error('Work Order Operation not found');

    const updated = await prisma.workOrderOperation.update({
      where: { id: operationId },
      data: {
        outputQuantity: data.completedQty !== undefined ? data.completedQty : undefined,
        scrapQuantity: data.scrapQty !== undefined ? data.scrapQty : undefined,
        status: data.status || undefined,
        notes: data.operatorNotes !== undefined ? data.operatorNotes : undefined,
      },
    });

    return updated;
  }

  static async issueMaterialForWorkOrder(
    inputOrId:
      | string
      | {
          workOrderId: string;
          materialId?: string;
          rawMaterialId?: string;
          quantity: number;
          warehouseId: string;
          batchNumber?: string;
          reelNumber?: string;
          notes?: string;
          user?: string;
        },
    data?: {
      rawMaterialId?: string;
      materialId?: string;
      quantity: number;
      warehouseId: string;
      batchNumber?: string;
      issuedBy?: string;
    }
  ) {
    const prisma = getPrisma();
    const workOrderId = typeof inputOrId === 'string' ? inputOrId : inputOrId.workOrderId;
    const rawMaterialId =
      typeof inputOrId === 'object'
        ? inputOrId.rawMaterialId || inputOrId.materialId || ''
        : data?.rawMaterialId || data?.materialId || '';
    const quantity = typeof inputOrId === 'object' ? inputOrId.quantity : data?.quantity || 0;
    const warehouseId = typeof inputOrId === 'object' ? inputOrId.warehouseId : data?.warehouseId || '';
    const batchNumber = typeof inputOrId === 'object' ? inputOrId.batchNumber || inputOrId.reelNumber : data?.batchNumber;
    const issuedBy = typeof inputOrId === 'object' ? inputOrId.user || 'Store Keeper' : data?.issuedBy || 'Store Keeper';

    const wo = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { productionOrders: true },
    });
    if (!wo) throw new Error('Work Order not found');

    let poId = wo.productionOrders[0]?.id;
    if (!poId) {
      // Create a default production order for this work order
      const po = await this.createProductionOrder({
        workOrderId: wo.id,
        salesOrderId: wo.salesOrderId || undefined,
        productId: wo.productId,
        plannedQuantity: wo.orderedQuantity,
        productionDate: new Date().toISOString().split('T')[0],
        supervisor: wo.supervisor || undefined,
      });
      poId = po.id;
    }

    return this.issueMaterialToProduction({
      productionOrderId: poId,
      rawMaterialId,
      quantityIssued: quantity,
      warehouseId,
      batchLotNumber: batchNumber,
      issuedBy,
    });
  }

  static async createWorkOrder(data: CreateWorkOrderInput) {
    const prisma = getPrisma();
    const currentYear = new Date().getFullYear();
    const orderNumber = data.orderNumber || (await generateNextCode('workOrder', `WO-${currentYear}-`, 'orderNumber', 4));
    const today = new Date().toISOString().split('T')[0];

    // Find default BOM if not provided
    let bomId = data.bomId;
    if (!bomId && data.productId) {
      const existingBom = await prisma.billOfMaterial.findFirst({
        where: { productId: data.productId, isDeleted: false, status: 'Active' },
        orderBy: { createdAt: 'desc' },
      });
      if (existingBom) bomId = existingBom.id;
    }

    // Standard Packaging Processes if custom operations not provided
    const defaultOps = [
      { sequence: 1, stageName: 'Corrugation', status: 'Pending', inputQuantity: data.orderedQuantity },
      { sequence: 2, stageName: 'Corrugation 2 Ply', status: 'Pending', inputQuantity: 0 },
      { sequence: 3, stageName: 'Pasting', status: 'Pending', inputQuantity: 0 },
      { sequence: 4, stageName: 'Printing', status: 'Pending', inputQuantity: 0 },
      { sequence: 5, stageName: 'Manual Punching', status: 'Pending', inputQuantity: 0 },
      { sequence: 6, stageName: 'Joint Details', status: 'Pending', inputQuantity: 0 },
      { sequence: 7, stageName: 'Bundling', status: 'Pending', inputQuantity: 0 },
    ];

    const opsToCreate = data.operations && data.operations.length > 0
      ? data.operations.map((op, idx) => ({
          sequence: op.sequence || idx + 1,
          stageName: op.stageName,
          machineId: op.machineId || null,
          machineName: op.machineName || null,
          operatorName: op.operatorName || null,
          status: op.status || 'Pending',
          inputQuantity: Number(op.inputQuantity) || 0,
          outputQuantity: Number(op.outputQuantity) || 0,
          scrapQuantity: Number(op.scrapQuantity) || 0,
          startTime: op.startTime ? new Date(op.startTime) : null,
          endTime: op.endTime ? new Date(op.endTime) : null,
          notes: op.notes || null,
        }))
      : defaultOps;

    const createdWorkOrder = await prisma.workOrder.create({
      data: {
        orderNumber,
        salesOrderId: data.salesOrderId || null,
        productId: data.productId,
        bomId: bomId || null,
        orderedQuantity: data.orderedQuantity,
        producedQuantity: 0,
        rejectedQuantity: 0,
        startDate: data.startDate || today,
        targetDate: data.targetDate || today,
        priority: data.priority || 'Medium',
        status: data.status || 'Planned',
        currentStage: 'Planning',
        assignedLine: data.assignedLine || 'Corrugator Line 1',
        warehouseId: data.warehouseId || null,
        supervisor: data.supervisor || null,
        remarks: data.remarks || null,
        operations: {
          create: opsToCreate,
        },
      },
      include: {
        product: true,
        salesOrder: true,
        bom: { include: { items: { include: { material: true } } } },
        operations: { orderBy: { sequence: 'asc' } },
      },
    });

    if (data.salesOrderId) {
      await prisma.salesOrderEntity.update({
        where: { id: data.salesOrderId },
        data: { productionStatus: 'Planning' },
      }).catch(() => {});
    }

    return createdWorkOrder;
  }

  static async updateWorkOrder(id: string, data: Partial<CreateWorkOrderInput>) {
    const prisma = getPrisma();

    if (data.operations && data.operations.length > 0) {
      await prisma.workOrderOperation.deleteMany({ where: { workOrderId: id } });
    }

    return prisma.workOrder.update({
      where: { id },
      data: {
        productId: data.productId,
        bomId: data.bomId,
        orderedQuantity: data.orderedQuantity,
        startDate: data.startDate,
        targetDate: data.targetDate,
        priority: data.priority,
        status: data.status,
        assignedLine: data.assignedLine,
        warehouseId: data.warehouseId,
        supervisor: data.supervisor,
        remarks: data.remarks,
        ...(data.operations && data.operations.length > 0 && {
          operations: {
            create: data.operations.map((op, idx) => ({
              sequence: op.sequence || idx + 1,
              stageName: op.stageName,
              machineId: op.machineId || null,
              machineName: op.machineName || null,
              operatorName: op.operatorName || null,
              status: op.status || 'Pending',
              inputQuantity: Number(op.inputQuantity) || 0,
              outputQuantity: Number(op.outputQuantity) || 0,
              scrapQuantity: Number(op.scrapQuantity) || 0,
              startTime: op.startTime ? new Date(op.startTime) : null,
              endTime: op.endTime ? new Date(op.endTime) : null,
              notes: op.notes || null,
            })),
          },
        }),
      },
      include: {
        product: true,
        salesOrder: true,
        bom: true,
        operations: { orderBy: { sequence: 'asc' } },
      },
    });
  }

  static async deleteWorkOrder(id: string, user?: string) {
    const prisma = getPrisma();
    return prisma.workOrder.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user || 'System',
      },
    });
  }

  // =========================================================================
  // 4. DAILY PRODUCTION PLANNING
  // =========================================================================
  static async getProductionPlans(query?: {
    planDate?: string;
    shift?: string;
    line?: string;
    status?: string;
    salesOrderId?: string;
    workOrderId?: string;
  }) {
    const prisma = getPrisma();
    const where: any = { isDeleted: false };
    if (query?.planDate) where.planDate = query.planDate;
    if (query?.shift && query.shift !== 'All') where.shift = query.shift;
    if (query?.line && query.line !== 'All') where.line = query.line;
    if (query?.status && query.status !== 'All') where.status = query.status;
    if (query?.salesOrderId) where.salesOrderId = query.salesOrderId;
    if (query?.workOrderId) where.workOrderId = query.workOrderId;

    return prisma.productionPlan.findMany({
      where,
      orderBy: [{ planDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        salesOrder: { select: { id: true, soNumber: true, customerName: true, quantity: true } },
        workOrder: { select: { id: true, orderNumber: true, orderedQuantity: true, producedQuantity: true } },
        product: { select: { id: true, code: true, name: true, boxType: true, dimensions: true } },
        bom: { select: { id: true, bomNumber: true, name: true } },
        customer: { select: { id: true, name: true } },
        productionOrders: {
          where: { isDeleted: false },
          select: { id: true, orderNumber: true, plannedQuantity: true, actualQuantity: true, status: true },
        },
      },
    });
  }

  static async createProductionPlan(data: CreateProductionPlanInput) {
    const prisma = getPrisma();
    const planNumber = data.planNumber || (await generateNextCode('productionPlan', 'PLAN-2025-', 'planNumber', 3));

    let totalSalesOrderQty = data.totalSalesOrderQty || 0;
    let previouslyProducedQty = data.previouslyProducedQty || 0;
    let remainingQty = data.remainingQty || 0;
    let customerId = data.customerId;
    let customerName = data.customerName;
    let productId = data.productId;
    let bomId = data.bomId;

    // Validate and auto-calculate remaining quantities from Sales Order if linked
    if (data.salesOrderId) {
      const so = await prisma.salesOrderEntity.findUnique({
        where: { id: data.salesOrderId },
        include: { product: true, customer: true, workOrders: true },
      });

      if (so) {
        totalSalesOrderQty = so.quantity || 0;
        customerId = customerId || so.customerId || undefined;
        customerName = customerName || so.customerName;
        productId = productId || so.productId || undefined;

        // Calculate sum of already produced units across completed work orders / production orders
        const producedSum = so.workOrders.reduce((sum, wo) => sum + (wo.producedQuantity || 0), 0);
        previouslyProducedQty = producedSum;
        remainingQty = Math.max(0, totalSalesOrderQty - previouslyProducedQty);

        // Validation Rule: Planned quantity must not exceed remaining Sales Order quantity
        if (data.targetQuantity > remainingQty && remainingQty > 0) {
          throw new Error(
            `Planned quantity (${data.targetQuantity}) cannot exceed remaining Sales Order quantity (${remainingQty}). Total SO Qty: ${totalSalesOrderQty}, Produced: ${previouslyProducedQty}`
          );
        }
      }
    } else if (data.workOrderId) {
      const wo = await prisma.workOrder.findUnique({
        where: { id: data.workOrderId },
        include: { product: true, salesOrder: true },
      });
      if (wo) {
        totalSalesOrderQty = wo.orderedQuantity;
        previouslyProducedQty = wo.producedQuantity;
        remainingQty = Math.max(0, wo.orderedQuantity - wo.producedQuantity);
        productId = productId || wo.productId;
        bomId = bomId || wo.bomId || undefined;
        if (wo.salesOrder) {
          customerName = customerName || wo.salesOrder.customerName;
        }
      }
    }

    const selectedProcessesStr = Array.isArray(data.selectedProcesses)
      ? JSON.stringify(data.selectedProcesses)
      : data.selectedProcesses || JSON.stringify(DEFAULT_PRODUCTION_PROCESSES);

    return prisma.productionPlan.create({
      data: {
        planNumber,
        planDate: data.planDate,
        shift: data.shift || 'Shift A (Morning)',
        line: data.line,
        salesOrderId: data.salesOrderId || null,
        workOrderId: data.workOrderId || null,
        productId: productId || null,
        bomId: bomId || null,
        customerId: customerId || null,
        customerName: customerName || null,
        totalSalesOrderQty,
        previouslyProducedQty,
        remainingQty,
        targetQuantity: data.targetQuantity,
        scheduledHours: data.scheduledHours || 8,
        priority: data.priority || 'Medium',
        selectedProcesses: selectedProcessesStr,
        status: data.status || 'Scheduled',
        supervisor: data.supervisor || null,
        notes: data.notes || null,
        remarks: data.remarks || null,
      },
      include: {
        salesOrder: true,
        workOrder: true,
        product: true,
        bom: true,
      },
    });
  }

  static async updateProductionPlan(id: string, data: Partial<CreateProductionPlanInput>) {
    const prisma = getPrisma();
    const existing = await prisma.productionPlan.findUnique({ where: { id } });
    if (!existing) throw new Error('Production plan not found');

    const selectedProcessesStr = Array.isArray(data.selectedProcesses)
      ? JSON.stringify(data.selectedProcesses)
      : data.selectedProcesses !== undefined
      ? data.selectedProcesses
      : existing.selectedProcesses;

    return prisma.productionPlan.update({
      where: { id },
      data: {
        planDate: data.planDate,
        shift: data.shift,
        line: data.line,
        salesOrderId: data.salesOrderId,
        workOrderId: data.workOrderId,
        productId: data.productId,
        bomId: data.bomId,
        customerId: data.customerId,
        customerName: data.customerName,
        totalSalesOrderQty: data.totalSalesOrderQty,
        previouslyProducedQty: data.previouslyProducedQty,
        remainingQty: data.remainingQty,
        targetQuantity: data.targetQuantity,
        scheduledHours: data.scheduledHours,
        priority: data.priority,
        selectedProcesses: selectedProcessesStr,
        status: data.status,
        supervisor: data.supervisor,
        notes: data.notes,
        remarks: data.remarks,
      },
      include: {
        salesOrder: true,
        workOrder: true,
        product: true,
        bom: true,
      },
    });
  }

  static async deleteProductionPlan(id: string, user?: string) {
    const prisma = getPrisma();
    return prisma.productionPlan.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user || 'System',
      },
    });
  }

  // =========================================================================
  // 5. PRODUCTION ORDERS & PROCESS EXECUTION
  // =========================================================================
  static async getProductionOrders(query?: {
    productionPlanId?: string;
    workOrderId?: string;
    salesOrderId?: string;
    productId?: string;
    status?: string;
    date?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const prisma = getPrisma();
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (query?.productionPlanId) where.productionPlanId = query.productionPlanId;
    if (query?.workOrderId) where.workOrderId = query.workOrderId;
    if (query?.salesOrderId) where.salesOrderId = query.salesOrderId;
    if (query?.productId) where.productId = query.productId;
    if (query?.status && query.status !== 'All') where.status = query.status;
    if (query?.date) where.productionDate = query.date;
    if (query?.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { product: { name: { contains: query.search, mode: 'insensitive' } } },
        { workOrder: { orderNumber: { contains: query.search, mode: 'insensitive' } } },
        { salesOrder: { soNumber: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [productionOrders, total] = await Promise.all([
      prisma.productionOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ productionDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          product: true,
          workOrder: true,
          salesOrder: true,
          bom: true,
          productionPlan: true,
          processSteps: { orderBy: { sequence: 'asc' }, include: { machine: true } },
          materialRequests: { where: { isDeleted: false }, include: { rawMaterial: true } },
          materialAllocations: { include: { rawMaterial: true, sourceWarehouse: true, destinationWarehouse: true } },
          materialIssues: { include: { rawMaterial: true, warehouse: true } },
          materialConsumptions: { include: { rawMaterial: true } },
          materialReturns: { include: { rawMaterial: true, destinationWarehouse: true } },
          dailyReports: { where: { isDeleted: false } },
        },
      }),
      prisma.productionOrder.count({ where }),
    ]);

    return { productionOrders, total, page, limit };
  }

  static async getProductionOrderById(id: string) {
    const prisma = getPrisma();
    return prisma.productionOrder.findUnique({
      where: { id },
      include: {
        product: true,
        workOrder: {
          include: { salesOrder: true, operations: { orderBy: { sequence: 'asc' } } },
        },
        salesOrder: {
          include: { customer: true },
        },
        bom: {
          include: { items: { include: { material: true } } },
        },
        productionPlan: true,
        processSteps: {
          orderBy: { sequence: 'asc' },
          include: { machine: true },
        },
        materialRequests: {
          where: { isDeleted: false },
          include: { rawMaterial: true, allocations: true },
        },
        materialAllocations: {
          include: { rawMaterial: true, sourceWarehouse: true, destinationWarehouse: true, rawMaterialStock: true },
        },
        materialIssues: {
          include: { rawMaterial: true, warehouse: true },
        },
        materialConsumptions: {
          include: { rawMaterial: true },
        },
        materialReturns: {
          include: { rawMaterial: true, destinationWarehouse: true },
        },
        dailyReports: {
          where: { isDeleted: false },
          orderBy: { productionDate: 'desc' },
        },
        qcInspections: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async createProductionOrder(data: CreateProductionOrderInput) {
    const prisma = getPrisma();
    const orderNumber = data.orderNumber || (await generateNextCode('productionOrder', 'PO-PRD-2025-', 'orderNumber', 3));
    const today = data.productionDate || new Date().toISOString().split('T')[0];

    // Determine process steps: from input, or plan's selected processes, or standard packaging processes
    let processNames = data.processNames;
    if (!processNames || processNames.length === 0) {
      if (data.productionPlanId) {
        const plan = await prisma.productionPlan.findUnique({ where: { id: data.productionPlanId } });
        if (plan?.selectedProcesses) {
          try {
            processNames = JSON.parse(plan.selectedProcesses);
          } catch {
            processNames = plan.selectedProcesses.split(',').map((s) => s.trim());
          }
        }
      }
    }
    if (!processNames || processNames.length === 0) {
      processNames = DEFAULT_PRODUCTION_PROCESSES;
    }

    // Resolve SalesOrder and BOM from WorkOrder if not explicitly given
    const wo = await prisma.workOrder.findUnique({
      where: { id: data.workOrderId },
      include: { product: true, salesOrder: true, bom: true },
    });
    if (!wo) throw new Error('Work Order not found');

    const salesOrderId = data.salesOrderId || wo.salesOrderId || null;
    const productId = data.productId || wo.productId;
    const bomId = data.bomId || wo.bomId || null;

    const plannedQty = Number(data.plannedQuantity) || wo.orderedQuantity;

    const createdOrder = await prisma.productionOrder.create({
      data: {
        orderNumber,
        productionDate: today,
        productionPlanId: data.productionPlanId || null,
        workOrderId: data.workOrderId,
        salesOrderId,
        productId,
        bomId,
        plannedQuantity: plannedQty,
        actualQuantity: data.actualQuantity || 0,
        balanceQuantity: plannedQty - (data.actualQuantity || 0),
        scrapQuantity: 0,
        wastageQuantity: 0,
        status: data.status || 'Planned',
        supervisor: data.supervisor || wo.supervisor || null,
        remarks: data.remarks || null,
        processSteps: {
          create: processNames.map((name, index) => ({
            sequence: index + 1,
            processName: name,
            status: index === 0 ? 'In Progress' : 'Pending',
            plannedQuantity: plannedQty,
            inputQuantity: index === 0 ? plannedQty : 0,
            materialConsumed: 0,
            actualProducedQuantity: 0,
            pendingQuantity: plannedQty,
            scrapQuantity: 0,
            wastageQuantity: 0,
            startTime: index === 0 ? new Date() : null,
          })),
        },
      },
      include: {
        product: true,
        workOrder: true,
        salesOrder: true,
        bom: true,
        processSteps: { orderBy: { sequence: 'asc' } },
      },
    });

    // Update WorkOrder status if Planned
    await prisma.workOrder.update({
      where: { id: data.workOrderId },
      data: { status: 'In Production', currentStage: processNames[0] || 'In Production' },
    });

    return createdOrder;
  }

  static async updateProductionOrderStatus(id: string, status: string, remarks?: string) {
    const prisma = getPrisma();
    return prisma.productionOrder.update({
      where: { id },
      data: {
        status,
        ...(remarks && { remarks }),
      },
    });
  }

  // =========================================================================
  // 6. PROCESS EXECUTION, STEP ADVANCEMENT & QC INTEGRATION
  // =========================================================================
  static async updateProcessExecution(
    stepId: string,
    data: {
      status?: string;
      inputQuantity?: number;
      materialConsumed?: number;
      actualProducedQuantity?: number;
      scrapQuantity?: number;
      wastageQuantity?: number;
      operatorName?: string;
      machineId?: string;
      machineName?: string;
      qcStatus?: string;
      qcRemarks?: string;
      remarks?: string;
      autoAdvance?: boolean;
    }
  ) {
    const prisma = getPrisma();
    const step = await prisma.productionProcessExecution.findUnique({
      where: { id: stepId },
      include: {
        productionOrder: {
          include: {
            processSteps: { orderBy: { sequence: 'asc' } },
            workOrder: true,
            product: true,
          },
        },
      },
    });

    if (!step) throw new Error('Process step not found');

    const updateData: any = {
      ...(data.status && { status: data.status }),
      ...(data.inputQuantity !== undefined && { inputQuantity: data.inputQuantity }),
      ...(data.materialConsumed !== undefined && { materialConsumed: data.materialConsumed }),
      ...(data.actualProducedQuantity !== undefined && { actualProducedQuantity: data.actualProducedQuantity }),
      ...(data.scrapQuantity !== undefined && { scrapQuantity: data.scrapQuantity }),
      ...(data.wastageQuantity !== undefined && { wastageQuantity: data.wastageQuantity }),
      ...(data.operatorName !== undefined && { operatorName: data.operatorName }),
      ...(data.machineId !== undefined && { machineId: data.machineId }),
      ...(data.machineName !== undefined && { machineName: data.machineName }),
      ...(data.qcStatus !== undefined && { qcStatus: data.qcStatus }),
      ...(data.qcRemarks !== undefined && { qcRemarks: data.qcRemarks }),
      ...(data.remarks !== undefined && { remarks: data.remarks }),
    };

    if (data.actualProducedQuantity !== undefined) {
      const input = data.inputQuantity !== undefined ? data.inputQuantity : step.inputQuantity;
      updateData.pendingQuantity = Math.max(0, input - data.actualProducedQuantity - (data.scrapQuantity || step.scrapQuantity));
    }

    if (data.status === 'In Progress' && !step.startTime) {
      updateData.startTime = new Date();
    } else if (data.status === 'Completed' || data.qcStatus === 'Passed') {
      updateData.endTime = new Date();
      if (!data.status) updateData.status = 'Completed';
    }

    const updatedStep = await prisma.productionProcessExecution.update({
      where: { id: stepId },
      data: updateData,
    });

    // Record scrap into ScrapLog if scrap is reported
    if (data.scrapQuantity && data.scrapQuantity > 0) {
      try {
        const scrapNumber = await generateNextCode('scrapLog', 'SCRAP-2025-', 'scrapNumber', 3);
        await prisma.scrapLog.create({
          data: {
            scrapNumber,
            workOrderId: step.productionOrder.workOrderId,
            stage: step.processName,
            materialType: 'Corrugated Waste / Scrap',
            weightKg: Number(data.scrapQuantity),
            reason: data.remarks || `Scrap reported during ${step.processName}`,
            recordedBy: data.operatorName || 'Floor Operator',
            date: new Date().toISOString().split('T')[0],
          },
        });
      } catch (err) {
        console.error('Failed to log scrap:', err);
      }
    }

    // Sequence Advancement: If process step completed or approved, feed output into next process
    const steps = step.productionOrder.processSteps;
    const currentIndex = steps.findIndex((s) => s.id === stepId);
    const nextStep = steps[currentIndex + 1];

    if ((data.status === 'Completed' || data.qcStatus === 'Passed') && data.autoAdvance !== false) {
      const producedQty = data.actualProducedQuantity !== undefined ? data.actualProducedQuantity : step.actualProducedQuantity;

      if (nextStep) {
        await prisma.productionProcessExecution.update({
          where: { id: nextStep.id },
          data: {
            inputQuantity: producedQty > 0 ? producedQty : step.inputQuantity,
            status: nextStep.status === 'Pending' ? 'In Progress' : nextStep.status,
            startTime: nextStep.status === 'Pending' ? new Date() : nextStep.startTime,
          },
        });

        await prisma.productionOrder.update({
          where: { id: step.productionOrderId },
          data: {
            status: 'In Production',
            currentProcessIndex: currentIndex + 1,
          },
        });

        await prisma.workOrder.update({
          where: { id: step.productionOrder.workOrderId },
          data: { currentStage: nextStep.processName },
        });
      } else {
        // Final Process Step completed!
        const finalProduced = producedQty > 0 ? producedQty : step.actualProducedQuantity;
        const totalScrap = steps.reduce((sum, s) => sum + (s.id === stepId ? (data.scrapQuantity || s.scrapQuantity) : s.scrapQuantity), 0);
        const totalWastage = steps.reduce((sum, s) => sum + (s.id === stepId ? (data.wastageQuantity || s.wastageQuantity) : s.wastageQuantity), 0);

        await prisma.productionOrder.update({
          where: { id: step.productionOrderId },
          data: {
            status: 'QC Pending',
            actualQuantity: finalProduced,
            balanceQuantity: Math.max(0, step.productionOrder.plannedQuantity - finalProduced),
            scrapQuantity: totalScrap,
            wastageQuantity: totalWastage,
          },
        });

        await prisma.workOrder.update({
          where: { id: step.productionOrder.workOrderId },
          data: {
            status: 'Production Completed',
            currentStage: 'QC',
            producedQuantity: finalProduced,
          },
        });
      }
    }

    return updatedStep;
  }

  // =========================================================================
  // 7. MATERIAL INDENTS / REQUESTS
  // =========================================================================
  static async getMaterialRequests(query?: {
    productionOrderId?: string;
    workOrderId?: string;
    status?: string;
    rawMaterialId?: string;
  }) {
    const prisma = getPrisma();
    const where: any = { isDeleted: false };
    if (query?.productionOrderId) where.productionOrderId = query.productionOrderId;
    if (query?.workOrderId) where.workOrderId = query.workOrderId;
    if (query?.status && query.status !== 'All') where.status = query.status;
    if (query?.rawMaterialId) where.rawMaterialId = query.rawMaterialId;

    return prisma.materialRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        rawMaterial: true,
        product: true,
        productionOrder: { select: { id: true, orderNumber: true, plannedQuantity: true } },
        workOrder: { select: { id: true, orderNumber: true } },
        allocations: {
          include: { sourceWarehouse: true, destinationWarehouse: true },
        },
      },
    });
  }

  static async createMaterialRequest(data: CreateMaterialRequestInput) {
    const prisma = getPrisma();
    const indentNumber = data.indentNumber || (await generateNextCode('materialRequest', 'IND-2025-', 'indentNumber', 3));
    const today = data.requiredDate || new Date().toISOString().split('T')[0];

    const request = await prisma.materialRequest.create({
      data: {
        indentNumber,
        productionOrderId: data.productionOrderId || null,
        workOrderId: data.workOrderId || null,
        productId: data.productId || null,
        rawMaterialId: data.rawMaterialId,
        requiredQuantity: Number(data.requiredQuantity),
        allocatedQuantity: 0,
        issuedQuantity: 0,
        uom: data.uom || 'Kg',
        requiredDate: today,
        requestedBy: data.requestedBy || 'Production Supervisor',
        status: 'Requested',
        remarks: data.remarks || null,
      },
      include: {
        rawMaterial: true,
        productionOrder: true,
      },
    });

    if (data.productionOrderId) {
      await prisma.productionOrder.update({
        where: { id: data.productionOrderId },
        data: { status: 'Material Pending' },
      });
    }

    return request;
  }

  static async updateMaterialRequestStatus(id: string, status: string, remarks?: string) {
    const prisma = getPrisma();
    return prisma.materialRequest.update({
      where: { id },
      data: {
        status,
        ...(remarks && { remarks }),
      },
    });
  }

  // =========================================================================
  // 8. MATERIAL ALLOCATION (GODOWN 1 -> GODOWN 2)
  // =========================================================================
  static async getMaterialAllocations(query?: {
    productionOrderId?: string;
    materialRequestId?: string;
    status?: string;
  }) {
    const prisma = getPrisma();
    const where: any = {};
    if (query?.productionOrderId) where.productionOrderId = query.productionOrderId;
    if (query?.materialRequestId) where.materialRequestId = query.materialRequestId;
    if (query?.status && query.status !== 'All') where.status = query.status;

    return prisma.materialAllocation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        rawMaterial: true,
        sourceWarehouse: true,
        destinationWarehouse: true,
        rawMaterialStock: true,
        materialRequest: true,
        productionOrder: { select: { id: true, orderNumber: true } },
      },
    });
  }

  /**
   * Allocate stock from Godown 1 (Main Store) to Godown 2 (Production Floor Store).
   * Moves inventory physically/systemically between warehouses and logs transaction.
   */
  static async allocateMaterial(data: CreateMaterialAllocationInput) {
    const prisma = getPrisma();
    const allocationNumber = await generateNextCode('materialAllocation', 'ALC-2025-', 'allocationNumber', 3);
    const today = data.allocationDate || new Date().toISOString().split('T')[0];

    // 1. Perform stock transfer from Godown 1 to Godown 2 via real InventoryService
    const transferTransaction = await InventoryService.warehouseTransfer({
      materialId: data.rawMaterialId,
      sourceWarehouseId: data.sourceWarehouseId,
      destinationWarehouseId: data.destinationWarehouseId,
      quantity: Number(data.quantity),
      user: data.allocatedBy || 'Store Keeper',
      remarks: `Material Allocation ${allocationNumber} (Godown 1 -> Godown 2). Batch: ${data.batchLotNumber || 'N/A'}`,
    });

    // 2. Create allocation record
    const allocation = await prisma.materialAllocation.create({
      data: {
        allocationNumber,
        materialRequestId: data.materialRequestId || null,
        productionOrderId: data.productionOrderId || null,
        rawMaterialId: data.rawMaterialId,
        rawMaterialStockId: data.rawMaterialStockId || null,
        batchLotNumber: data.batchLotNumber || null,
        supplierName: data.supplierName || null,
        quantity: Number(data.quantity),
        sourceWarehouseId: data.sourceWarehouseId,
        destinationWarehouseId: data.destinationWarehouseId,
        allocationDate: today,
        allocatedBy: data.allocatedBy || 'Store Keeper',
        status: 'Allocated',
      },
      include: {
        rawMaterial: true,
        sourceWarehouse: true,
        destinationWarehouse: true,
      },
    });

    // 3. Update Material Request allocated quantity
    if (data.materialRequestId) {
      const mr = await prisma.materialRequest.findUnique({ where: { id: data.materialRequestId } });
      if (mr) {
        const newAllocated = mr.allocatedQuantity + Number(data.quantity);
        const newStatus = newAllocated >= mr.requiredQuantity ? 'Allocated' : 'Partially Issued';
        await prisma.materialRequest.update({
          where: { id: data.materialRequestId },
          data: { allocatedQuantity: newAllocated, status: newStatus },
        });
      }
    }

    // 4. Update Production Order status to Material Allocated
    if (data.productionOrderId) {
      await prisma.productionOrder.update({
        where: { id: data.productionOrderId },
        data: { status: 'Material Allocated' },
      });
    }

    return { allocation, transferTransaction };
  }

  /**
   * Release or Return Allocation from Godown 2 back to Godown 1
   * (allowed ONLY when material is allocated but NOT yet issued to production team).
   */
  static async releaseOrReturnAllocation(id: string, user?: string, reason?: string) {
    const prisma = getPrisma();
    const allocation = await prisma.materialAllocation.findUnique({
      where: { id },
      include: { rawMaterial: true, sourceWarehouse: true, destinationWarehouse: true },
    });

    if (!allocation) throw new Error('Allocation record not found');
    if (allocation.status === 'IssuedToProduction') {
      throw new Error('Cannot release allocation that has already been issued to the production team. Please use Material Return instead.');
    }
    if (allocation.status === 'ReturnedToGodown1' || allocation.status === 'Released') {
      throw new Error('Allocation is already released or returned.');
    }

    // Transfer stock back from Godown 2 (destination) to Godown 1 (source)
    const returnTransfer = await InventoryService.warehouseTransfer({
      materialId: allocation.rawMaterialId,
      sourceWarehouseId: allocation.destinationWarehouseId,
      destinationWarehouseId: allocation.sourceWarehouseId,
      quantity: allocation.quantity,
      user: user || 'Store Keeper',
      remarks: `Allocation Release / Return to Main Store (${allocation.allocationNumber}). Reason: ${reason || 'Cancelled/Reallocated'}`,
    });

    const updatedAllocation = await prisma.materialAllocation.update({
      where: { id },
      data: {
        status: 'ReturnedToGodown1',
        releasedAt: new Date(),
        releasedBy: user || 'Store Keeper',
        releaseReason: reason || 'Returned to Godown 1',
      },
    });

    // Reconcile MaterialRequest allocated quantity if linked
    if (allocation.materialRequestId) {
      const mr = await prisma.materialRequest.findUnique({ where: { id: allocation.materialRequestId } });
      if (mr) {
        const newAllocated = Math.max(0, mr.allocatedQuantity - allocation.quantity);
        await prisma.materialRequest.update({
          where: { id: allocation.materialRequestId },
          data: { allocatedQuantity: newAllocated, status: newAllocated > 0 ? 'Requested' : 'Requested' },
        });
      }
    }

    return { updatedAllocation, returnTransfer };
  }

  // =========================================================================
  // 9. MATERIAL ISSUE TO PRODUCTION (GODOWN 2 -> PRODUCTION TEAM)
  // =========================================================================
  static async getMaterialIssues(query?: { productionOrderId?: string; warehouseId?: string }) {
    const prisma = getPrisma();
    const where: any = {};
    if (query?.productionOrderId) where.productionOrderId = query.productionOrderId;
    if (query?.warehouseId) where.warehouseId = query.warehouseId;

    return prisma.productionMaterialIssue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        rawMaterial: true,
        warehouse: true,
        productionOrder: { select: { id: true, orderNumber: true } },
      },
    });
  }

  /**
   * Issues material from Godown 2 (Production Store) to Floor Production Team.
   * Performs real Inventory Stock Out from Godown 2.
   */
  static async issueMaterialToProduction(data: CreateMaterialIssueInput) {
    const prisma = getPrisma();
    const issueNumber = await generateNextCode('productionMaterialIssue', 'ISS-2025-', 'issueNumber', 3);
    const today = data.issueDate || new Date().toISOString().split('T')[0];

    const po = await prisma.productionOrder.findUnique({
      where: { id: data.productionOrderId },
      include: { product: true, workOrder: true },
    });
    if (!po) throw new Error('Production Order not found');

    const material = await prisma.rawMaterial.findUnique({ where: { id: data.rawMaterialId } });
    if (!material) throw new Error('Raw Material not found');

    // 1. Stock Out from Godown 2 via InventoryService
    const stockOutTransaction = await InventoryService.stockOut({
      materialId: data.rawMaterialId,
      warehouseId: data.warehouseId,
      quantity: Number(data.quantityIssued),
      user: data.issuedBy || 'Store Keeper',
      reason: `Material Issued to Production Team for ${po.orderNumber}`,
      referenceNumber: po.orderNumber,
      referenceType: 'Production Order',
      remarks: `Issue #${issueNumber} | Batch: ${data.batchLotNumber || 'N/A'} | Team: ${data.operatorTeam || 'Floor Line'}`,
    });

    // 2. Create Issue record
    const issue = await prisma.productionMaterialIssue.create({
      data: {
        issueNumber,
        productionOrderId: data.productionOrderId,
        allocationId: data.allocationId || null,
        rawMaterialId: data.rawMaterialId,
        batchLotNumber: data.batchLotNumber || null,
        quantityIssued: Number(data.quantityIssued),
        warehouseId: data.warehouseId,
        operatorTeam: data.operatorTeam || 'Production Floor Team',
        issueDate: today,
        issuedBy: data.issuedBy || 'Store Keeper',
        reference: data.reference || po.orderNumber,
        remarks: data.remarks || null,
      },
      include: {
        rawMaterial: true,
        warehouse: true,
      },
    });

    // 3. Mark Allocation as IssuedToProduction if linked
    if (data.allocationId) {
      await prisma.materialAllocation.update({
        where: { id: data.allocationId },
        data: { status: 'IssuedToProduction' },
      });
    }

    // 4. Update / Create Material Consumption record
    const existingConsumption = await prisma.materialConsumption.findFirst({
      where: { productionOrderId: data.productionOrderId, rawMaterialId: data.rawMaterialId },
    });

    if (existingConsumption) {
      const newIssued = existingConsumption.issuedQuantity + Number(data.quantityIssued);
      const newBalance = newIssued - existingConsumption.usedQuantity - existingConsumption.returnedQuantity - existingConsumption.wastageQuantity;
      await prisma.materialConsumption.update({
        where: { id: existingConsumption.id },
        data: { issuedQuantity: newIssued, balanceQuantity: newBalance },
      });
    } else {
      await prisma.materialConsumption.create({
        data: {
          productionOrderId: data.productionOrderId,
          rawMaterialId: data.rawMaterialId,
          batchLotNumber: data.batchLotNumber || null,
          issuedQuantity: Number(data.quantityIssued),
          usedQuantity: 0,
          returnedQuantity: 0,
          wastageQuantity: 0,
          balanceQuantity: Number(data.quantityIssued),
          recordedBy: data.issuedBy || 'Store Keeper',
          date: today,
        },
      });
    }

    // 5. Update Production Order status to 'In Production' / 'Material Issued'
    await prisma.productionOrder.update({
      where: { id: data.productionOrderId },
      data: { status: 'In Production' },
    });

    return { issue, stockOutTransaction };
  }

  // =========================================================================
  // 10. MATERIAL CONSUMPTION & PRODUCTION RETURN
  // =========================================================================
  static async getMaterialConsumptions(productionOrderId: string) {
    const prisma = getPrisma();
    return prisma.materialConsumption.findMany({
      where: { productionOrderId },
      include: { rawMaterial: true },
    });
  }

  static async recordMaterialConsumption(data: {
    productionOrderId: string;
    rawMaterialId: string;
    usedQuantity: number;
    wastageQuantity?: number;
    notes?: string;
    recordedBy?: string;
  }) {
    const prisma = getPrisma();
    const today = new Date().toISOString().split('T')[0];

    const consumption = await prisma.materialConsumption.findFirst({
      where: { productionOrderId: data.productionOrderId, rawMaterialId: data.rawMaterialId },
    });

    if (!consumption) throw new Error('Material consumption record not found for this production order');

    const newUsed = consumption.usedQuantity + Number(data.usedQuantity);
    const newWastage = consumption.wastageQuantity + Number(data.wastageQuantity || 0);
    const newBalance = Math.max(0, consumption.issuedQuantity - newUsed - consumption.returnedQuantity - newWastage);

    return prisma.materialConsumption.update({
      where: { id: consumption.id },
      data: {
        usedQuantity: newUsed,
        wastageQuantity: newWastage,
        balanceQuantity: newBalance,
        recordedBy: data.recordedBy || consumption.recordedBy,
        date: today,
        notes: data.notes || consumption.notes,
      },
      include: { rawMaterial: true },
    });
  }

  /**
   * Return unused material from Production Team back to Godown 2 or Main Store.
   * Performs real Inventory Stock In to warehouse.
   */
  static async returnMaterialFromProduction(data: CreateMaterialReturnInput) {
    const prisma = getPrisma();
    const returnNumber = await generateNextCode('productionMaterialReturn', 'RET-2025-', 'returnNumber', 3);
    const today = data.returnDate || new Date().toISOString().split('T')[0];

    const po = await prisma.productionOrder.findUnique({
      where: { id: data.productionOrderId },
      include: { product: true },
    });
    if (!po) throw new Error('Production Order not found');

    // 1. Stock In back to warehouse via InventoryService
    const stockInTransaction = await InventoryService.stockIn({
      materialId: data.rawMaterialId,
      warehouseId: data.destinationWarehouseId,
      quantity: Number(data.quantityReturned),
      user: data.returnedBy || 'Production Supervisor',
      reason: `Unused Material Returned from Production Order ${po.orderNumber}`,
      referenceNumber: po.orderNumber,
      referenceType: 'Production Return',
      remarks: `Return #${returnNumber} | Reason: ${data.reason}`,
    });

    // 2. Create Return record
    const returnRecord = await prisma.productionMaterialReturn.create({
      data: {
        returnNumber,
        productionOrderId: data.productionOrderId,
        rawMaterialId: data.rawMaterialId,
        batchLotNumber: data.batchLotNumber || null,
        quantityReturned: Number(data.quantityReturned),
        destinationWarehouseId: data.destinationWarehouseId,
        returnDate: today,
        returnedBy: data.returnedBy || 'Production Supervisor',
        receivedBy: data.receivedBy || 'Store Keeper',
        reason: data.reason,
        status: 'Received',
      },
      include: {
        rawMaterial: true,
        destinationWarehouse: true,
      },
    });

    // 3. Update Material Consumption
    const consumption = await prisma.materialConsumption.findFirst({
      where: { productionOrderId: data.productionOrderId, rawMaterialId: data.rawMaterialId },
    });

    if (consumption) {
      const newReturned = consumption.returnedQuantity + Number(data.quantityReturned);
      const newBalance = Math.max(0, consumption.issuedQuantity - consumption.usedQuantity - newReturned - consumption.wastageQuantity);
      await prisma.materialConsumption.update({
        where: { id: consumption.id },
        data: { returnedQuantity: newReturned, balanceQuantity: newBalance },
      });
    }

    return { returnRecord, stockInTransaction };
  }

  // =========================================================================
  // 11. DAILY PRODUCTION REPORTS & MANAGER APPROVAL WORKFLOW
  // =========================================================================
  static async getDailyProductionReports(query?: {
    productionDate?: string;
    status?: string;
    productionOrderId?: string;
    workOrderId?: string;
    page?: number;
    limit?: number;
  }) {
    const prisma = getPrisma();
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (query?.productionDate) where.productionDate = query.productionDate;
    if (query?.status && query.status !== 'All') where.status = query.status;
    if (query?.productionOrderId) where.productionOrderId = query.productionOrderId;
    if (query?.workOrderId) where.workOrderId = query.workOrderId;

    const [reports, total] = await Promise.all([
      prisma.dailyProductionReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ productionDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          product: true,
          productionOrder: true,
          workOrder: true,
          salesOrder: true,
        },
      }),
      prisma.dailyProductionReport.count({ where }),
    ]);

    return { reports, total, page, limit };
  }

  static async createDailyProductionReport(data: CreateDailyReportInput) {
    const prisma = getPrisma();
    const reportNumber = data.reportNumber || (await generateNextCode('dailyProductionReport', 'DPR-2025-', 'reportNumber', 3));
    const plannedQty = Number(data.plannedQuantity) || 1;
    const producedQty = Number(data.actualProducedQuantity) || 0;
    const balanceQty = data.balanceQuantity !== undefined ? data.balanceQuantity : Math.max(0, plannedQty - producedQty);
    const achievementPercent = Math.min(100, Math.round((producedQty / plannedQty) * 100));

    return prisma.dailyProductionReport.create({
      data: {
        reportNumber,
        productionDate: data.productionDate,
        workOrderId: data.workOrderId || null,
        productionOrderId: data.productionOrderId || null,
        salesOrderId: data.salesOrderId || null,
        productId: data.productId,
        plannedQuantity: plannedQty,
        actualProducedQuantity: producedQty,
        balanceQuantity: balanceQty,
        scrapQuantity: Number(data.scrapQuantity) || 0,
        wastageQuantity: Number(data.wastageQuantity) || 0,
        materialIssued: Number(data.materialIssued) || 0,
        materialConsumed: Number(data.materialConsumed) || 0,
        materialReturned: Number(data.materialReturned) || 0,
        achievementPercent,
        reasonForNonCompletion: data.reasonForNonCompletion || null,
        operator: data.operator || null,
        supervisor: data.supervisor || null,
        status: 'Pending Manager Approval',
        remarks: data.remarks || null,
      },
      include: {
        product: true,
        productionOrder: true,
        workOrder: true,
        salesOrder: true,
      },
    });
  }

  static async approveDailyReport(id: string, managerName: string, remarks?: string) {
    const prisma = getPrisma();
    return prisma.dailyProductionReport.update({
      where: { id },
      data: {
        status: 'Approved',
        approvedBy: managerName || 'Plant Manager',
        approvalDate: new Date(),
        managerRemarks: remarks || 'Approved by Production Manager',
      },
      include: {
        product: true,
        productionOrder: true,
      },
    });
  }

  static async rejectDailyReport(id: string, managerName: string, reason: string) {
    const prisma = getPrisma();
    return prisma.dailyProductionReport.update({
      where: { id },
      data: {
        status: 'Rejected',
        approvedBy: managerName || 'Plant Manager',
        approvalDate: new Date(),
        managerRemarks: reason || 'Report rejected by Production Manager',
      },
      include: {
        product: true,
        productionOrder: true,
      },
    });
  }

  static async getDailyProductionReportById(id: string) {
    const prisma = getPrisma();
    return prisma.dailyProductionReport.findFirst({
      where: { id, isDeleted: false },
      include: {
        product: true,
        productionOrder: true,
        workOrder: true,
        salesOrder: true,
      },
    });
  }

  static async updateDailyProductionReport(
    id: string,
    data: Partial<CreateDailyReportInput> & {
      status?: string;
      approvedBy?: string;
      approvalDate?: Date | string | null;
      managerRemarks?: string;
    }
  ) {
    const prisma = getPrisma();

    const existing = await prisma.dailyProductionReport.findUnique({
      where: { id },
    });
    if (!existing || existing.isDeleted) {
      throw new Error('Daily Production Report not found');
    }

    const plannedQty = data.plannedQuantity !== undefined ? Number(data.plannedQuantity) : existing.plannedQuantity;
    const producedQty = data.actualProducedQuantity !== undefined ? Number(data.actualProducedQuantity) : existing.actualProducedQuantity;
    const balanceQty = data.balanceQuantity !== undefined
      ? Number(data.balanceQuantity)
      : Math.max(0, plannedQty - producedQty);
    const achievementPercent = plannedQty > 0
      ? Math.min(100, Math.round((producedQty / plannedQty) * 100))
      : 0;

    const updatePayload: any = {
      ...(data.productionDate !== undefined && { productionDate: data.productionDate }),
      ...(data.workOrderId !== undefined && { workOrderId: data.workOrderId || null }),
      ...(data.productionOrderId !== undefined && { productionOrderId: data.productionOrderId || null }),
      ...(data.salesOrderId !== undefined && { salesOrderId: data.salesOrderId || null }),
      ...(data.productId !== undefined && { productId: data.productId }),
      ...(data.plannedQuantity !== undefined && { plannedQuantity: plannedQty }),
      ...(data.actualProducedQuantity !== undefined && { actualProducedQuantity: producedQty }),
      ...(data.balanceQuantity !== undefined || data.plannedQuantity !== undefined || data.actualProducedQuantity !== undefined
        ? { balanceQuantity: balanceQty, achievementPercent }
        : {}),
      ...(data.scrapQuantity !== undefined && { scrapQuantity: Number(data.scrapQuantity) }),
      ...(data.wastageQuantity !== undefined && { wastageQuantity: Number(data.wastageQuantity) }),
      ...(data.materialIssued !== undefined && { materialIssued: Number(data.materialIssued) }),
      ...(data.materialConsumed !== undefined && { materialConsumed: Number(data.materialConsumed) }),
      ...(data.materialReturned !== undefined && { materialReturned: Number(data.materialReturned) }),
      ...(data.reasonForNonCompletion !== undefined && { reasonForNonCompletion: data.reasonForNonCompletion || null }),
      ...(data.operator !== undefined && { operator: data.operator || null }),
      ...(data.supervisor !== undefined && { supervisor: data.supervisor || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.approvedBy !== undefined && { approvedBy: data.approvedBy || null }),
      ...(data.approvalDate !== undefined && { approvalDate: data.approvalDate ? new Date(data.approvalDate) : null }),
      ...(data.managerRemarks !== undefined && { managerRemarks: data.managerRemarks || null }),
      ...(data.remarks !== undefined && { remarks: data.remarks || null }),
    };

    if (data.status === 'Approved' && data.approvalDate === undefined && !existing.approvalDate) {
      updatePayload.approvalDate = new Date();
    }

    return prisma.dailyProductionReport.update({
      where: { id },
      data: updatePayload,
      include: {
        product: true,
        productionOrder: true,
        workOrder: true,
        salesOrder: true,
      },
    });
  }

  static async deleteDailyProductionReport(id: string, user?: string) {
    const prisma = getPrisma();
    const existing = await prisma.dailyProductionReport.findUnique({
      where: { id },
    });
    if (!existing || existing.isDeleted) {
      throw new Error('Daily Production Report not found');
    }

    return prisma.dailyProductionReport.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user || 'System',
      },
    });
  }

  // =========================================================================
  // 12. MACHINES & DOWNTIME
  // =========================================================================
  static async getMachines(query?: { status?: string; type?: string; line?: string }) {
    const prisma = getPrisma();
    const where: any = { isDeleted: false };
    if (query?.status && query.status !== 'All') where.status = query.status;
    if (query?.type && query.type !== 'All') where.type = query.type;
    if (query?.line && query.line !== 'All') where.line = query.line;

    return prisma.machine.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        downtimes: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async updateMachineStatus(id: string, data: { status: string; operator?: string; notes?: string }) {
    const prisma = getPrisma();
    return prisma.machine.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.operator !== undefined && { operator: data.operator }),
      },
    });
  }

  static async getDowntimeLogs(query?: { machineId?: string; date?: string }) {
    const prisma = getPrisma();
    const where: any = {};
    if (query?.machineId) where.machineId = query.machineId;
    if (query?.date) where.date = query.date;

    return prisma.downtimeLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { machine: true },
    });
  }

  static async createDowntimeLog(data: CreateDowntimeInput) {
    const prisma = getPrisma();
    const today = new Date().toISOString().split('T')[0];

    const log = await prisma.downtimeLog.create({
      data: {
        machineId: data.machineId,
        reasonCategory: data.reasonCategory,
        durationMinutes: data.durationMinutes,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        resolvedBy: data.resolvedBy || null,
        actionTaken: data.actionTaken || null,
        date: data.date || today,
      },
      include: { machine: true },
    });

    await prisma.machine.update({
      where: { id: data.machineId },
      data: { status: 'Breakdown' },
    });

    return log;
  }

  // =========================================================================
  // 13. SCRAP LOGS
  // =========================================================================
  static async getScrapLogs(query?: { workOrderId?: string; date?: string; stage?: string }) {
    const prisma = getPrisma();
    const where: any = {};
    if (query?.workOrderId) where.workOrderId = query.workOrderId;
    if (query?.date) where.date = query.date;
    if (query?.stage && query.stage !== 'All') where.stage = query.stage;

    return prisma.scrapLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        workOrder: {
          select: { id: true, orderNumber: true, product: { select: { name: true, code: true } } },
        },
      },
    });
  }

  static async createScrapLog(data: CreateScrapInput) {
    const prisma = getPrisma();
    const scrapNumber = data.scrapNumber || (await generateNextCode('scrapLog', 'SCRAP-2025-', 'scrapNumber', 3));
    const today = new Date().toISOString().split('T')[0];

    return prisma.scrapLog.create({
      data: {
        scrapNumber,
        workOrderId: data.workOrderId || null,
        stage: data.stage,
        materialType: data.materialType,
        weightKg: Number(data.weightKg),
        reason: data.reason,
        recordedBy: data.recordedBy,
        date: data.date || today,
      },
      include: { workOrder: true },
    });
  }

  // =========================================================================
  // 14. QUALITY CONTROL & FINISHED GOODS RECEIPT
  // =========================================================================
  static async getQCInspections(query?: {
    workOrderId?: string;
    productionOrderId?: string;
    status?: string;
    stage?: string;
    page?: number;
    limit?: number;
  }) {
    const prisma = getPrisma();
    const page = query?.page || 1;
    const limit = query?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.workOrderId) where.workOrderId = query.workOrderId;
    if (query?.productionOrderId) where.productionOrderId = query.productionOrderId;
    if (query?.status && query.status !== 'All') where.status = query.status;
    if (query?.stage && query.stage !== 'All') where.stage = query.stage;

    const [inspections, total] = await Promise.all([
      prisma.productionQC.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          workOrder: {
            include: {
              product: { select: { id: true, code: true, name: true, dimensions: true } },
              salesOrder: { select: { id: true, soNumber: true, customerName: true } },
            },
          },
        },
      }),
      prisma.productionQC.count({ where }),
    ]);

    return { inspections, total, page, limit };
  }

  static async createQCInspection(data: CreateQCInput) {
    const prisma = getPrisma();
    const qcNumber = data.qcNumber || (await generateNextCode('productionQC', 'PQC-2025-', 'qcNumber', 3));
    const today = new Date().toISOString().split('T')[0];

    const inspection = await prisma.productionQC.create({
      data: {
        qcNumber,
        workOrderId: data.workOrderId || '',
        stage: data.stage,
        inspectorName: data.inspectorName,
        sampleSize: data.sampleSize || 5,
        burstingFactor: data.burstingFactor || null,
        burstingStrength: data.burstingStrength || null,
        moisturePercent: data.moisturePercent || null,
        boxCompressionTest: data.boxCompressionTest || null,
        caliperThicknessMm: data.caliperThicknessMm || null,
        dimensionCheck: data.dimensionCheck || 'Pass',
        printQuality: data.printQuality || 'Pass',
        status: data.status || 'Passed',
        rejectedQty: data.rejectedQty || 0,
        remarks: data.remarks || null,
        inspectionDate: data.inspectionDate || today,
      },
      include: {
        workOrder: { include: { product: true } },
      },
    });

    if (data.productionOrderId && data.status === 'Passed') {
      await prisma.productionOrder.update({
        where: { id: data.productionOrderId },
        data: { status: 'QC Approved' },
      });
    }

    return inspection;
  }

  /**
   * Final QC Approval & Finished Goods Receipt:
   * Moves finished boxes into Finished Goods Warehouse and updates Inventory!
   */
  static async approveAndReceiveFinishedGoods(data: {
    workOrderId?: string;
    productionOrderId?: string;
    warehouseId: string;
    quantity: number;
    user?: string;
    remarks?: string;
  }) {
    const prisma = getPrisma();

    let productId = '';
    let referenceNumber = '';
    let salesOrderId: string | null = null;
    let productName = '';

    if (data.productionOrderId) {
      const po = await prisma.productionOrder.findUnique({
        where: { id: data.productionOrderId },
        include: { product: true, workOrder: true },
      });
      if (!po) throw new Error('Production Order not found');
      productId = po.productId;
      productName = po.product.name;
      referenceNumber = po.orderNumber;
      salesOrderId = po.salesOrderId || po.workOrder?.salesOrderId || null;

      await prisma.productionOrder.update({
        where: { id: data.productionOrderId },
        data: { status: 'Completed', actualQuantity: data.quantity },
      });
    } else if (data.workOrderId) {
      const wo = await prisma.workOrder.findUnique({
        where: { id: data.workOrderId },
        include: { product: true, salesOrder: true },
      });
      if (!wo) throw new Error('Work Order not found');
      productId = wo.productId;
      productName = wo.product.name;
      referenceNumber = wo.orderNumber;
      salesOrderId = wo.salesOrderId;

      const today = new Date().toISOString().split('T')[0];
      await prisma.workOrder.update({
        where: { id: data.workOrderId },
        data: {
          status: 'Completed',
          currentStage: 'Finished Goods',
          producedQuantity: data.quantity,
          actualEndDate: today,
          warehouseId: data.warehouseId,
        },
      });
    } else {
      throw new Error('Either workOrderId or productionOrderId is required');
    }

    const warehouse = await prisma.warehouse.findUnique({ where: { id: data.warehouseId } });
    if (!warehouse) throw new Error('Warehouse not found');

    // 1. Stock In to Finished Goods Warehouse
    const transaction = await InventoryService.stockIn({
      productId,
      warehouseId: data.warehouseId,
      quantity: data.quantity,
      user: data.user || 'Production QC Supervisor',
      reason: `Finished Goods Receipt from Production ${referenceNumber}`,
      referenceNumber,
      referenceType: 'Production Order',
      remarks: data.remarks || `Passed Final QC. Received ${data.quantity} units into ${warehouse.name}`,
    });

    // 2. Update Sales Order status
    if (salesOrderId) {
      await prisma.salesOrderEntity.update({
        where: { id: salesOrderId },
        data: { productionStatus: 'QC Passed', dispatchStatus: 'Ready for Dispatch' },
      });
    }

    return {
      success: true,
      transaction,
      message: `Successfully received ${data.quantity} units of ${productName} into ${warehouse.name}.`,
    };
  }
}
