import { prisma } from '../lib/prisma';
import { generateNextCode } from '../utils/code-generator';
import { AuditService } from './audit.service';

export interface CreateRawMaterialStockInput {
  rawMaterialId: string;
  supplierId: string;
  purchaseOrderId?: string | null;
  batchLotNumber?: string | null;
  purchaseDate?: string;
  purchaseTime?: string | null;
  originalQuantity: number;
  purchasePrice: number;
  warehouseId?: string | null;
  binId?: string | null;
  referenceNumber?: string | null;
  remarks?: string | null;
  user?: string;
}

export interface DeductRawMaterialStockInput {
  stockId: string;
  quantity: number;
  reason?: string;
  remarks?: string;
  referenceNumber?: string;
  referenceType?: string;
  user?: string;
}

export interface AdjustRawMaterialStockInput {
  stockId: string;
  newRemainingQuantity: number;
  reason: string;
  remarks?: string;
  user?: string;
}

export class RawMaterialStockService {
  /**
   * Get all stock entries for a specific raw material (or filtered by supplier/warehouse/bin/status/dates)
   */
  static async getAll(query?: {
    rawMaterialId?: string;
    supplierId?: string;
    warehouseId?: string;
    binId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    date?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.rawMaterialId) {
      const mat = await prisma.rawMaterial.findFirst({
        where: {
          OR: [{ id: query.rawMaterialId }, { code: query.rawMaterialId }],
        },
        select: { id: true },
      });
      where.rawMaterialId = mat ? mat.id : query.rawMaterialId;
    }
    if (query?.supplierId && query.supplierId !== 'All') where.supplierId = query.supplierId;
    if (query?.warehouseId && query.warehouseId !== 'All') where.warehouseId = query.warehouseId;
    if (query?.binId && query.binId !== 'All') where.binId = query.binId;
    if (query?.status && query.status !== 'All') where.status = query.status;

    if (query?.date) {
      where.purchaseDate = query.date;
    } else {
      if (query?.startDate && query?.endDate) {
        where.purchaseDate = { gte: query.startDate, lte: query.endDate };
      } else if (query?.startDate) {
        where.purchaseDate = { gte: query.startDate };
      } else if (query?.endDate) {
        where.purchaseDate = { lte: query.endDate };
      }
    }

    if (query?.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { batchLotNumber: { contains: searchTerm, mode: 'insensitive' } },
        { referenceNumber: { contains: searchTerm, mode: 'insensitive' } },
        { remarks: { contains: searchTerm, mode: 'insensitive' } },
        { supplier: { supplierName: { contains: searchTerm, mode: 'insensitive' } } },
        { supplier: { millName: { contains: searchTerm, mode: 'insensitive' } } },
        { rawMaterial: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { rawMaterial: { code: { contains: searchTerm, mode: 'insensitive' } } },
        { purchaseOrder: { poNumber: { contains: searchTerm, mode: 'insensitive' } } },
        { warehouse: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { bin: { code: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [stocks, total] = await Promise.all([
      prisma.rawMaterialStock.findMany({
        where,
        include: {
          rawMaterial: true,
          supplier: true,
          purchaseOrder: true,
          warehouse: true,
          bin: true,
        },
        orderBy: [{ purchaseDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.rawMaterialStock.count({ where }),
    ]);

    return { stocks, total, page, limit };
  }

  /**
   * Get single stock record by ID with full relations and transaction history
   */
  static async getById(id: string) {
    return prisma.rawMaterialStock.findUnique({
      where: { id },
      include: {
        rawMaterial: true,
        supplier: true,
        purchaseOrder: true,
        warehouse: true,
        bin: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
  }

  /**
   * Create a new purchase stock entry for a Raw Material.
   * Everything executes in an atomic database transaction:
   * 1. Validate raw material and mandatory supplier.
   * 2. Create the RawMaterialStock entry with unique lot tracking.
   * 3. Calculate synchronized total stock across all active lots and update RawMaterial.currentStock.
   * 4. Update / Upsert StockLevel for warehouse & bin.
   * 5. Record InventoryTransaction (Stock In) linked to rawMaterialStockId.
   * 6. Create Audit Log.
   */
  static async createStock(data: CreateRawMaterialStockInput) {
    if (!data.rawMaterialId) {
      throw new Error('Raw Material ID is required');
    }
    if (!data.supplierId) {
      throw new Error('Supplier is mandatory for every Raw Material Stock record');
    }
    if (data.originalQuantity <= 0) {
      throw new Error('Stock Quantity must be greater than 0');
    }
    if (data.purchasePrice < 0) {
      throw new Error('Purchase Price cannot be negative');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Verify Raw Material & Supplier exist
      const material = await tx.rawMaterial.findFirst({
        where: {
          OR: [{ id: data.rawMaterialId }, { code: data.rawMaterialId }],
        },
      });
      if (!material) throw new Error('Raw Material not found');

      const supplier = await tx.supplier.findUnique({
        where: { id: data.supplierId },
      });
      if (!supplier) throw new Error('Supplier not found');

      const warehouseId = data.warehouseId || material.warehouseId;
      if (warehouseId) {
        const wh = await tx.warehouse.findUnique({ where: { id: warehouseId } });
        if (!wh) throw new Error('Warehouse not found');
      }

      if (data.binId) {
        const bin = await tx.binLocation.findUnique({ where: { id: data.binId } });
        if (!bin) throw new Error('Bin location not found');
      }

      const now = new Date();
      const purchaseDate = data.purchaseDate || now.toISOString().split('T')[0];
      const purchaseTime = data.purchaseTime || now.toLocaleTimeString('en-US', { hour12: false });
      const previousTotalStock = material.currentStock || 0;

      // 2. Create RawMaterialStock record
      const stockRecord = await tx.rawMaterialStock.create({
        data: {
          rawMaterialId: material.id,
          supplierId: data.supplierId,
          purchaseOrderId: data.purchaseOrderId || null,
          batchLotNumber: data.batchLotNumber || `LOT-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
          purchaseDate,
          purchaseTime,
          originalQuantity: data.originalQuantity,
          remainingQuantity: data.originalQuantity,
          purchasePrice: data.purchasePrice,
          warehouseId: warehouseId || null,
          binId: data.binId || null,
          referenceNumber: data.referenceNumber || data.batchLotNumber || null,
          status: 'Available',
          remarks: data.remarks || null,
          createdBy: data.user || 'Administrator',
        },
        include: {
          rawMaterial: true,
          supplier: true,
          purchaseOrder: true,
          warehouse: true,
          bin: true,
        },
      });

      // 3. Recalculate total available stock across all active stock records
      const allActiveStocks = await tx.rawMaterialStock.findMany({
        where: {
          rawMaterialId: material.id,
          isDeleted: false,
          deletedAt: null,
        },
        select: { remainingQuantity: true },
      });
      const newTotalStock = allActiveStocks.reduce((acc, s) => acc + (s.remainingQuantity || 0), 0);

      // 4. Update parent RawMaterial currentStock & preserve purchase price
      await tx.rawMaterial.update({
        where: { id: material.id },
        data: {
          currentStock: newTotalStock,
          purchasePrice: data.purchasePrice > 0 ? data.purchasePrice : material.purchasePrice,
        },
      });

      // 5. Update / Upsert StockLevel
      if (warehouseId) {
        const existingSL = await tx.stockLevel.findFirst({
          where: {
            itemType: 'RAW_MATERIAL',
            rawMaterialId: material.id,
            warehouseId,
            binId: data.binId || null,
          },
        });

        if (existingSL) {
          await tx.stockLevel.update({
            where: { id: existingSL.id },
            data: { currentStock: existingSL.currentStock + data.originalQuantity },
          });
        } else {
          await tx.stockLevel.create({
            data: {
              itemType: 'RAW_MATERIAL',
              rawMaterialId: data.rawMaterialId,
              warehouseId,
              binId: data.binId || null,
              currentStock: data.originalQuantity,
            },
          });
        }
      }

      // 6. Create InventoryTransaction (Stock In)
      const transactionNumber = await generateNextCode('inventoryTransaction', 'SM-', 'transactionNumber', 4, tx);
      await tx.inventoryTransaction.create({
        data: {
          transactionNumber,
          itemCode: material.code || 'RM',
          itemName: material.name,
          itemType: 'Raw Material',
          rawMaterialId: material.id,
          rawMaterialStockId: stockRecord.id,
          warehouseId: warehouseId || null,
          quantity: data.originalQuantity,
          previousStock: previousTotalStock,
          currentStock: newTotalStock,
          transactionType: 'Stock In',
          user: data.user || 'Administrator',
          date: purchaseDate,
          time: purchaseTime,
          reason: 'Raw Material Stock Purchase / Lot Inward',
          remarks: `Supplier: ${supplier.supplierName} | Batch: ${stockRecord.batchLotNumber} | Rate: ₹${data.purchasePrice} | Qty: ${data.originalQuantity} ${material.uom}`,
          referenceNumber: data.referenceNumber || stockRecord.batchLotNumber || stockRecord.id.slice(0, 8),
          referenceType: 'Purchase Stock',
        },
      });

      // 7. Audit Log
      await AuditService.safeCreate(tx, {
        action: 'RAW_MATERIAL_STOCK_ADDED',
        module: 'Inventory',
        entity: 'RawMaterialStock',
        entityId: stockRecord.id,
        user: data.user || 'Administrator',
        details: `Added ${data.originalQuantity} ${material.uom} from ${supplier.supplierName} (Batch: ${stockRecord.batchLotNumber}). Rate: ₹${data.purchasePrice}. Previous Total Stock: ${previousTotalStock}, New Total Stock: ${newTotalStock}`,
      });

      return stockRecord;
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Deduct stock from a specific batch/purchase record (e.g. for Production Issue, Consumption, or Scrap).
   * Validates that remainingQuantity >= deduction quantity (never allows negative stock).
   * Atomically updates batch remainingQuantity, recalculates parent RawMaterial.currentStock,
   * updates StockLevel, and logs an auditable InventoryTransaction & AuditLog.
   */
  static async deductStock(data: DeductRawMaterialStockInput) {
    if (!data.stockId) throw new Error('Stock Record ID is required');
    if (data.quantity <= 0) throw new Error('Deduction quantity must be greater than 0');

    return prisma.$transaction(async (tx) => {
      const stock = await tx.rawMaterialStock.findUnique({
        where: { id: data.stockId },
        include: { rawMaterial: true, supplier: true, warehouse: true, bin: true },
      });

      if (!stock || stock.isDeleted) throw new Error('Raw Material Stock record not found');
      if (stock.remainingQuantity < data.quantity) {
        throw new Error(
          `Insufficient stock in batch ${stock.batchLotNumber || stock.id}. Available: ${stock.remainingQuantity}, Requested: ${data.quantity}`
        );
      }

      const material = stock.rawMaterial;
      if (!material) throw new Error('Associated Raw Material not found');

      const previousRemaining = stock.remainingQuantity;
      const newRemaining = previousRemaining - data.quantity;
      const previousTotalStock = material.currentStock || 0;

      // Determine new batch stock status
      let newStatus = stock.status;
      if (newRemaining === 0) {
        newStatus = 'Depleted';
      } else if (newRemaining <= (stock.originalQuantity * 0.2)) {
        newStatus = 'Low';
      } else {
        newStatus = 'Available';
      }

      // 1. Update RawMaterialStock
      const updatedStock = await tx.rawMaterialStock.update({
        where: { id: data.stockId },
        data: {
          remainingQuantity: newRemaining,
          status: newStatus,
        },
        include: { rawMaterial: true, supplier: true, warehouse: true, bin: true },
      });

      // 2. Recalculate total available stock across all active lots of this raw material
      const allActiveStocks = await tx.rawMaterialStock.findMany({
        where: {
          rawMaterialId: stock.rawMaterialId,
          isDeleted: false,
          deletedAt: null,
        },
        select: { remainingQuantity: true },
      });
      const newTotalStock = allActiveStocks.reduce((acc, s) => acc + (s.remainingQuantity || 0), 0);

      // 3. Update main RawMaterial currentStock
      await tx.rawMaterial.update({
        where: { id: stock.rawMaterialId },
        data: { currentStock: newTotalStock },
      });

      // 4. Update StockLevel
      if (stock.warehouseId) {
        const existingSL = await tx.stockLevel.findFirst({
          where: {
            itemType: 'RAW_MATERIAL',
            rawMaterialId: stock.rawMaterialId,
            warehouseId: stock.warehouseId,
            binId: stock.binId || null,
          },
        });

        if (existingSL) {
          await tx.stockLevel.update({
            where: { id: existingSL.id },
            data: { currentStock: Math.max(0, existingSL.currentStock - data.quantity) },
          });
        }
      }

      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false });

      // 5. Create InventoryTransaction (Stock Out)
      const transactionNumber = await generateNextCode('inventoryTransaction', 'SM-', 'transactionNumber', 4, tx);
      await tx.inventoryTransaction.create({
        data: {
          transactionNumber,
          itemCode: material.code || 'RM',
          itemName: material.name,
          itemType: 'Raw Material',
          rawMaterialId: material.id,
          rawMaterialStockId: stock.id,
          warehouseId: stock.warehouseId,
          quantity: data.quantity,
          previousStock: previousTotalStock,
          currentStock: newTotalStock,
          transactionType: 'Stock Out',
          user: data.user || 'Administrator',
          date: currentDate,
          time: currentTime,
          reason: data.reason || 'Production Issue / Batch Consumption',
          remarks: data.remarks || `Deducted ${data.quantity} ${material.uom} from Batch ${stock.batchLotNumber || stock.id} (Supplier: ${stock.supplier?.supplierName}). Remaining Batch: ${newRemaining} ${material.uom}`,
          referenceNumber: data.referenceNumber || stock.batchLotNumber || stock.id.slice(0, 8),
          referenceType: data.referenceType || 'Batch Deduction',
        },
      });

      // 6. Audit Log
      await AuditService.safeCreate(tx, {
        action: 'RAW_MATERIAL_STOCK_DEDUCTED',
        module: 'Inventory',
        entity: 'RawMaterialStock',
        entityId: stock.id,
        user: data.user || 'Administrator',
        details: `Deducted ${data.quantity} ${material.uom} from Batch ${stock.batchLotNumber || stock.id}. Remaining in batch: ${newRemaining}. Total RM stock updated from ${previousTotalStock} to ${newTotalStock}`,
      });

      return updatedStock;
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Adjust remaining stock quantity for a batch (e.g. physical count audit discrepancy).
   */
  static async adjustStock(data: AdjustRawMaterialStockInput) {
    if (!data.stockId) throw new Error('Stock Record ID is required');
    if (data.newRemainingQuantity < 0) throw new Error('Stock quantity cannot be negative');

    return prisma.$transaction(async (tx) => {
      const stock = await tx.rawMaterialStock.findUnique({
        where: { id: data.stockId },
        include: { rawMaterial: true, supplier: true, warehouse: true, bin: true },
      });

      if (!stock || stock.isDeleted) throw new Error('Raw Material Stock record not found');
      const material = stock.rawMaterial;
      if (!material) throw new Error('Associated Raw Material not found');

      const delta = data.newRemainingQuantity - stock.remainingQuantity;
      if (delta === 0) return stock;

      const previousTotalStock = material.currentStock || 0;

      let newStatus = stock.status;
      if (data.newRemainingQuantity === 0) {
        newStatus = 'Depleted';
      } else if (data.newRemainingQuantity <= (stock.originalQuantity * 0.2)) {
        newStatus = 'Low';
      } else {
        newStatus = 'Available';
      }

      // 1. Update batch
      const updatedStock = await tx.rawMaterialStock.update({
        where: { id: data.stockId },
        data: {
          remainingQuantity: data.newRemainingQuantity,
          status: newStatus,
        },
        include: { rawMaterial: true, supplier: true, warehouse: true, bin: true },
      });

      // 2. Recalculate total available stock across all active stock records
      const allActiveStocks = await tx.rawMaterialStock.findMany({
        where: {
          rawMaterialId: stock.rawMaterialId,
          isDeleted: false,
          deletedAt: null,
        },
        select: { remainingQuantity: true },
      });
      const newTotalStock = allActiveStocks.reduce((acc, s) => acc + (s.remainingQuantity || 0), 0);

      // 3. Update main RawMaterial stock
      await tx.rawMaterial.update({
        where: { id: stock.rawMaterialId },
        data: { currentStock: newTotalStock },
      });

      // 4. Update StockLevel
      if (stock.warehouseId) {
        const existingSL = await tx.stockLevel.findFirst({
          where: {
            itemType: 'RAW_MATERIAL',
            rawMaterialId: stock.rawMaterialId,
            warehouseId: stock.warehouseId,
            binId: stock.binId || null,
          },
        });

        if (existingSL) {
          await tx.stockLevel.update({
            where: { id: existingSL.id },
            data: { currentStock: Math.max(0, existingSL.currentStock + delta) },
          });
        }
      }

      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toLocaleTimeString('en-US', { hour12: false });

      // 5. Inventory Transaction (Stock Adjustment)
      const transactionNumber = await generateNextCode('inventoryTransaction', 'SM-', 'transactionNumber', 4, tx);
      await tx.inventoryTransaction.create({
        data: {
          transactionNumber,
          itemCode: material.code || 'RM',
          itemName: material.name,
          itemType: 'Raw Material',
          rawMaterialId: material.id,
          rawMaterialStockId: stock.id,
          warehouseId: stock.warehouseId,
          quantity: Math.abs(delta),
          previousStock: previousTotalStock,
          currentStock: newTotalStock,
          transactionType: 'Stock Adjustment',
          user: data.user || 'Administrator',
          date: currentDate,
          time: currentTime,
          reason: data.reason || 'Physical Count Adjustment',
          remarks: data.remarks || `Batch ${stock.batchLotNumber || stock.id} adjusted from ${stock.remainingQuantity} to ${data.newRemainingQuantity} (Delta: ${delta > 0 ? '+' : ''}${delta})`,
          referenceNumber: stock.batchLotNumber || stock.id.slice(0, 8),
          referenceType: 'Stock Adjustment',
        },
      });

      // 6. Audit Log
      await AuditService.safeCreate(tx, {
        action: 'RAW_MATERIAL_STOCK_ADJUSTED',
        module: 'Inventory',
        entity: 'RawMaterialStock',
        entityId: stock.id,
        user: data.user || 'Administrator',
        details: `Adjusted Batch ${stock.batchLotNumber || stock.id} remaining from ${stock.remainingQuantity} to ${data.newRemainingQuantity} (${delta > 0 ? '+' : ''}${delta}). Reason: ${data.reason}`,
      });

      return updatedStock;
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Soft delete a stock record and update total Raw Material stock
   */
  static async deleteStock(id: string, user?: string) {
    return prisma.$transaction(async (tx) => {
      const stock = await tx.rawMaterialStock.findUnique({
        where: { id },
        include: { rawMaterial: true },
      });
      if (!stock) throw new Error('Stock record not found');

      // 1. Soft delete the stock entry
      const deleted = await tx.rawMaterialStock.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          status: 'Depleted',
        },
      });

      // 2. Recalculate total available stock across remaining active lots
      const allActiveStocks = await tx.rawMaterialStock.findMany({
        where: {
          rawMaterialId: stock.rawMaterialId,
          isDeleted: false,
          deletedAt: null,
        },
        select: { remainingQuantity: true },
      });
      const newTotalStock = allActiveStocks.reduce((acc, s) => acc + (s.remainingQuantity || 0), 0);

      // 3. Update parent Raw Material
      await tx.rawMaterial.update({
        where: { id: stock.rawMaterialId },
        data: { currentStock: newTotalStock },
      });

      // 4. Update StockLevel
      if (stock.warehouseId && stock.remainingQuantity > 0) {
        const existingSL = await tx.stockLevel.findFirst({
          where: {
            itemType: 'RAW_MATERIAL',
            rawMaterialId: stock.rawMaterialId,
            warehouseId: stock.warehouseId,
          },
        });
        if (existingSL) {
          await tx.stockLevel.update({
            where: { id: existingSL.id },
            data: { currentStock: Math.max(0, existingSL.currentStock - stock.remainingQuantity) },
          });
        }
      }

      // 5. Audit Log
      await AuditService.safeCreate(tx, {
        action: 'RAW_MATERIAL_STOCK_DELETED',
        module: 'Inventory',
        entity: 'RawMaterialStock',
        entityId: id,
        user: user || 'Administrator',
        details: `Deleted batch stock entry ${stock.batchLotNumber || id}. Total stock recalculated to ${newTotalStock}`,
      });

      return deleted;
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Synchronize RawMaterial.currentStock with the sum of its active RawMaterialStock records
   */
  static async syncRawMaterialTotalStock(rawMaterialId: string) {
    return prisma.$transaction(async (tx) => {
      const activeStocks = await tx.rawMaterialStock.findMany({
        where: {
          rawMaterialId,
          isDeleted: false,
          deletedAt: null,
        },
        select: { remainingQuantity: true },
      });
      const totalAvailable = activeStocks.reduce((sum, s) => sum + (s.remainingQuantity || 0), 0);

      return tx.rawMaterial.update({
        where: { id: rawMaterialId },
        data: { currentStock: totalAvailable },
      });
    });
  }
}
