import { prisma } from '../lib/prisma';
import { InventoryService } from './inventory.service';
import { generateNextCode } from '../utils/code-generator';
import { AuditService } from './audit.service';

export class GateEntryService {
  static async getAll(query?: { poId?: string; status?: string; search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.poId) {
      where.OR = [
        { poId: query.poId },
        { purchaseOrders: { some: { purchaseOrderId: query.poId } } }
      ];
    }
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { gateEntryNumber: { contains: query.search, mode: 'insensitive' } },
        { vehicleNumber: { contains: query.search, mode: 'insensitive' } },
        { poNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [entries, total] = await Promise.all([
      prisma.gateEntry.findMany({
        where,
        include: {
          purchaseOrder: { include: { supplier: true } },
          purchaseOrders: { include: { purchaseOrder: { include: { supplier: true } } } },
          items: { include: { purchaseOrder: true, purchaseOrderItem: true, material: true } },
          qualityChecks: true,
          warehouse: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.gateEntry.count({ where }),
    ]);

    return { entries, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.gateEntry.findUnique({
      where: { id },
      include: {
        purchaseOrder: { include: { supplier: true } },
        purchaseOrders: { include: { purchaseOrder: { include: { supplier: true, items: true } } } },
        items: { include: { purchaseOrder: true, purchaseOrderItem: true, material: true } },
        qualityChecks: true,
        warehouse: true
      },
    });
  }

  static async create(data: any) {
    console.log("GATE ENTRY REQUEST BODY", data);

    const { items, purchaseOrderIds, ...entryData } = data;

    // Collect all PO IDs involved
    const poIdsSet = new Set<string>();
    if (entryData.poId) poIdsSet.add(entryData.poId);
    if (purchaseOrderIds && Array.isArray(purchaseOrderIds)) {
      purchaseOrderIds.forEach((id: string) => poIdsSet.add(id));
    }
    if (items && Array.isArray(items)) {
      items.forEach((it: any) => {
        if (it.purchaseOrderId) poIdsSet.add(it.purchaseOrderId);
        if (it.poId) poIdsSet.add(it.poId);
      });
    }

    const uniquePoIds = Array.from(poIdsSet);

    // Validate POs exist and load their items
    const validatedPOs = await Promise.all(
      uniquePoIds.map(async (poId) => {
        const po = await prisma.purchaseOrder.findUnique({
          where: { id: poId },
          include: { items: true, supplier: true }
        });
        if (!po) throw new Error(`Purchase Order not found: ${poId}`);
        return po;
      })
    );

    const primaryPO = validatedPOs[0] || null;

    // Validate Warehouse ID if provided
    if (entryData.warehouseId) {
      const warehouseExists = await prisma.warehouse.findUnique({
        where: { id: entryData.warehouseId }
      });
      if (!warehouseExists) {
        throw new Error(`Warehouse ID not found: ${entryData.warehouseId}`);
      }
    }

    // Process and validate items
    const mappedItems: any[] = [];
    if (items && items.length > 0) {
      for (const item of items) {
        const qtyReceived = Number(item.quantityReceived || item.receivedQty || 0);
        const qtyVerified = Number(item.quantityVerified || item.verifiedQty || qtyReceived);

        if (qtyReceived < 0 || qtyVerified < 0) {
          throw new Error('Quantities cannot be negative.');
        }
        if (qtyVerified > qtyReceived) {
          throw new Error('Verified quantity cannot exceed received quantity.');
        }

        let materialId = item.materialId;
        let materialCode = item.materialCode;
        let materialName = item.materialName;

        if (materialId) {
          const mat = await prisma.rawMaterial.findUnique({ where: { id: materialId } });
          if (mat) {
            materialCode = mat.code || materialCode;
            materialName = mat.name || materialName;
          }
        } else if (materialCode && materialCode !== 'RM-CUSTOM') {
          const mat = await prisma.rawMaterial.findFirst({ where: { code: materialCode } });
          if (mat) {
            materialId = mat.id;
            materialName = mat.name || materialName;
          }
        }

        // Validate remaining quantity against PO item ordered quantity
        const poItemId = item.purchaseOrderItemId || item.poItemId;
        const targetPoId = item.purchaseOrderId || item.poId || primaryPO?.id;

        if (poItemId) {
          const poItem = await prisma.purchaseOrderItem.findUnique({ where: { id: poItemId } });
          if (poItem) {
            const existingGEItems = await prisma.gateEntryItem.findMany({
              where: { purchaseOrderItemId: poItemId }
            });
            const totalAlreadyReceived = existingGEItems.reduce((sum, gei) => sum + gei.quantityReceived, 0);
            const remaining = poItem.quantityOrdered - totalAlreadyReceived;

            if (qtyReceived > remaining + 0.0001) {
              throw new Error(`Received quantity (${qtyReceived}) exceeds remaining quantity (${remaining}) for PO Item ${poItem.materialName}`);
            }
          }
        }

        mappedItems.push({
          purchaseOrderId: targetPoId || null,
          purchaseOrderItemId: poItemId || null,
          materialId: materialId || null,
          materialCode: materialCode || 'RM-CUSTOM',
          materialName: materialName || 'Raw Material',
          quantityReceived: qtyReceived,
          quantityVerified: qtyVerified,
          unit: item.unit || 'Kg'
        });
      }
    }

    let finalRemarks = entryData.remarks || '';
    if (entryData.driverPhone) {
      finalRemarks = `[Driver Phone: ${entryData.driverPhone}] ` + finalRemarks;
    }
    if (entryData.transportCompany) {
      finalRemarks = `[Transporter: ${entryData.transportCompany}] ` + finalRemarks;
    }

    const validatedData: any = {
      poId: primaryPO?.id || null,
      poNumber: entryData.poNumber || primaryPO?.poNumber || (validatedPOs.length > 1 ? 'Multiple POs' : null),
      vehicleNumber: entryData.vehicleNumber || null,
      driverName: entryData.driverName || null,
      challanNumber: entryData.challanNumber || null,
      challanDate: entryData.challanDate || null,
      entryTime: entryData.entryTime || null,
      status: entryData.status || 'Entered',
      remarks: finalRemarks || null,
      warehouseId: entryData.warehouseId || null,
    };

    try {
      const result = await prisma.$transaction(async (tx) => {
        const gateEntryNumber = await generateNextCode('gateEntry', 'GE-', 'gateEntryNumber', 4, tx);

        // 1. Create Gate Entry
        const entry = await tx.gateEntry.create({
          data: {
            ...validatedData,
            gateEntryNumber,
            purchaseOrders: uniquePoIds.length > 0 ? {
              create: uniquePoIds.map(poId => ({
                purchaseOrderId: poId
              }))
            } : undefined,
            items: mappedItems.length ? {
              create: mappedItems.map(it => ({
                purchaseOrderId: it.purchaseOrderId,
                purchaseOrderItemId: it.purchaseOrderItemId,
                materialId: it.materialId,
                materialCode: it.materialCode,
                materialName: it.materialName,
                quantityReceived: it.quantityReceived,
                quantityVerified: it.quantityVerified,
                unit: it.unit
              }))
            } : undefined,
          },
          include: { items: true, purchaseOrders: { include: { purchaseOrder: true } } },
        });

        // 2. Update Purchase Order Items received quantity and PO Statuses
        for (const poId of uniquePoIds) {
          const poItems = await tx.purchaseOrderItem.findMany({ where: { poId } });
          let allReceived = true;
          let anyReceived = false;

          for (const poi of poItems) {
            const allGeiForPoi = await tx.gateEntryItem.findMany({ where: { purchaseOrderItemId: poi.id } });
            const totalRec = allGeiForPoi.reduce((s, x) => s + x.quantityReceived, 0);

            await tx.purchaseOrderItem.update({
              where: { id: poi.id },
              data: { quantityReceived: totalRec }
            });

            if (totalRec >= poi.quantityOrdered) {
              anyReceived = true;
            } else {
              allReceived = false;
            }
            if (totalRec > 0) anyReceived = true;
          }

          const newPoStatus = allReceived ? 'Received' : (anyReceived ? 'Partially Received' : 'Approved');
          await tx.purchaseOrder.update({
            where: { id: poId },
            data: { status: newPoStatus }
          });
        }

        // 3. Audit Log
        await AuditService.safeCreate(tx, {
          action: 'GATE_ENTRY_CREATED',
          module: 'Procurement',
          entity: 'GateEntry',
          entityId: entry.id,
          details: `Recorded Gate Entry ${entry.gateEntryNumber} for vehicle ${entry.vehicleNumber || 'N/A'} linking ${uniquePoIds.length} PO(s)`,
        });

        return entry;
      });

      return result;
    } catch (error) {
      console.error("GATE ENTRY CREATION ERROR", error);
      throw error;
    }
  }

  static async updateInventory(id: string) {
    const entry = await prisma.gateEntry.findUnique({
      where: { id },
      include: { items: true, purchaseOrders: { include: { purchaseOrder: true } } }
    });

    if (!entry) throw new Error('Gate Entry not found');

    return prisma.$transaction(async (tx) => {
      let totalStockAdded = 0;

      for (const item of entry.items) {
        if (!item.materialId) continue;

        const verifiedQty = item.quantityVerified;
        const alreadyAdded = item.inventoryAddedQty;
        const delta = verifiedQty - alreadyAdded;

        if (delta !== 0) {
          const material = await tx.rawMaterial.findUnique({ where: { id: item.materialId } });
          if (!material) continue;

          const previousStock = material.currentStock;
          const currentStock = previousStock + delta;

          await tx.rawMaterial.update({
            where: { id: material.id },
            data: { currentStock }
          });

          // Create Inventory Transaction
          await tx.inventoryTransaction.create({
            data: {
              itemCode: material.code || item.materialCode,
              itemName: material.name || item.materialName,
              itemType: 'Raw Material',
              rawMaterialId: material.id,
              warehouseId: entry.warehouseId || material.warehouseId,
              quantity: Math.abs(delta),
              previousStock,
              currentStock,
              transactionType: delta > 0 ? 'Stock In' : 'Stock Adjustment',
              referenceNumber: entry.gateEntryNumber,
              referenceType: 'Gate Entry',
              remarks: `${delta > 0 ? 'Stock In' : 'Adjustment'} via Gate Entry ${entry.gateEntryNumber} (Verified Qty Update)`,
              date: new Date().toISOString().split('T')[0],
              time: new Date().toLocaleTimeString()
            }
          });

          // Update StockLevel
          const warehouseId = entry.warehouseId || material.warehouseId;
          if (warehouseId) {
            const existingSL = await tx.stockLevel.findFirst({
              where: {
                itemType: 'RAW_MATERIAL',
                rawMaterialId: material.id,
                warehouseId: warehouseId,
              },
            });

            if (existingSL) {
              await tx.stockLevel.update({
                where: { id: existingSL.id },
                data: { currentStock: existingSL.currentStock + delta },
              });
            } else if (delta > 0) {
              await tx.stockLevel.create({
                data: {
                  itemType: 'RAW_MATERIAL',
                  rawMaterialId: material.id,
                  warehouseId: warehouseId,
                  currentStock: delta,
                },
              });
            }
          }

          // Update item's inventoryAddedQty
          await tx.gateEntryItem.update({
            where: { id: item.id },
            data: { inventoryAddedQty: verifiedQty }
          });

          totalStockAdded += delta;
        }
      }

      const updatedGe = await tx.gateEntry.update({
        where: { id },
        data: { inventoryUpdated: true, status: 'Verified' },
        include: { items: true, purchaseOrders: { include: { purchaseOrder: true } }, warehouse: true }
      });

      await AuditService.safeCreate(tx, {
        action: 'GATE_ENTRY_INVENTORY_UPDATED',
        module: 'Procurement',
        entity: 'GateEntry',
        entityId: entry.id,
        details: `Updated inventory for Gate Entry ${entry.gateEntryNumber}. Stock delta posted: ${totalStockAdded}`,
      });

      return updatedGe;
    });
  }

  static async update(id: string, data: any) {
    const { items, ...entryData } = data;

    return prisma.$transaction(async (tx) => {
      if (items) {
        await tx.gateEntryItem.deleteMany({ where: { gateEntryId: id } });
      }

      const updated = await tx.gateEntry.update({
        where: { id },
        data: {
          ...entryData,
          items: items?.length ? {
            create: items.map((it: any) => ({
              purchaseOrderId: it.purchaseOrderId || it.poId,
              purchaseOrderItemId: it.purchaseOrderItemId || it.poItemId,
              materialId: it.materialId,
              materialCode: it.materialCode,
              materialName: it.materialName,
              quantityReceived: it.quantityReceived,
              quantityVerified: it.quantityVerified !== undefined ? it.quantityVerified : it.quantityReceived,
              unit: it.unit || 'Kg'
            }))
          } : undefined,
        },
        include: { items: true, purchaseOrders: { include: { purchaseOrder: true } } },
      });

      return updated;
    });
  }

  static async delete(id: string) {
    return prisma.gateEntry.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      }
    });
  }
}
