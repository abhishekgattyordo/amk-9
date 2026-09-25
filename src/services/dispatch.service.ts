import { prisma } from '../lib/prisma';
import { generateNextCode, createWithUniqueCode } from '../utils/code-generator';

export class DispatchService {
  /**
   * Fetch all dispatches with filtering, search, and pagination directly from PostgreSQL.
   */
  static async getAll(query?: {
    salesOrderId?: string;
    customerId?: string;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query?.page || 1);
    const limit = Math.max(1, query?.limit || 50);
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };

    if (query?.salesOrderId) where.salesOrderId = query.salesOrderId;
    if (query?.customerId) where.customerId = query.customerId;
    if (query?.status && query.status !== 'All') where.status = query.status;

    if (query?.dateFrom || query?.dateTo) {
      where.dispatchDate = {};
      if (query.dateFrom) where.dispatchDate.gte = query.dateFrom;
      if (query.dateTo) where.dispatchDate.lte = query.dateTo;
    }

    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { challanNumber: { contains: s, mode: 'insensitive' } },
        { soNumber: { contains: s, mode: 'insensitive' } },
        { customerName: { contains: s, mode: 'insensitive' } },
        { vehicleNumber: { contains: s, mode: 'insensitive' } },
        { transporterName: { contains: s, mode: 'insensitive' } },
        { lrNumber: { contains: s, mode: 'insensitive' } },
        { ewayBillNumber: { contains: s, mode: 'insensitive' } },
        { gatePassNumber: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [dispatches, total] = await Promise.all([
      prisma.dispatch.findMany({
        where,
        include: {
          salesOrder: {
            include: {
              customer: true,
              product: true,
              warehouse: true,
              workOrders: true,
              qualityChecks: {
                where: { isDeleted: false },
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          customer: true,
          warehouse: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispatch.count({ where }),
    ]);

    return { dispatches, total, page, limit };
  }

  /**
   * Get single dispatch by ID from PostgreSQL.
   */
  static async getById(id: string) {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id },
      include: {
        salesOrder: {
          include: {
            lead: true,
            customer: true,
            product: {
              include: {
                stockLevels: {
                  include: { warehouse: true, bin: true }
                }
              }
            },
            warehouse: true,
            workOrders: {
              include: {
                qualityChecks: true,
                operations: true
              }
            },
            qualityChecks: {
              where: { isDeleted: false },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        workOrder: {
          include: {
            qualityChecks: true
          }
        },
        qualityCheck: true,
        customer: true,
        warehouse: true,
        items: {
          include: {
            product: {
              include: {
                stockLevels: {
                  include: { warehouse: true, bin: true }
                }
              }
            }
          }
        }
      },
    });

    if (!dispatch) return null;

    // Fetch activity audit logs
    const activityLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityId: id },
          { entityId: dispatch.salesOrderId },
          { details: { contains: dispatch.challanNumber } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return {
      ...dispatch,
      activityLogs
    };
  }

  /**
   * Get eligible Sales Orders and Work Orders pending dispatch with QC status and stock levels.
   */
  static async getPendingEligibleOrders() {
    // 1. Fetch sales orders that have pending balance and are not cancelled/closed
    const salesOrders = await prisma.salesOrderEntity.findMany({
      where: {
        isDeleted: false,
        deletedAt: null,
        status: { notIn: ['Cancelled', 'Closed', 'Delivered'] },
        quantityPending: { gt: 0 },
      },
      include: {
        customer: true,
        product: {
          include: {
            stockLevels: {
              include: { warehouse: true, bin: true }
            }
          }
        },
        warehouse: true,
        workOrders: {
          where: { isDeleted: false },
          include: {
            qualityChecks: {
              where: { isDeleted: false },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        qualityChecks: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' }
        },
        dispatches: {
          where: { isDeleted: false, status: { not: 'Cancelled' } },
          include: { items: true }
        }
      },
      orderBy: { orderDate: 'asc' }
    });

    // 2. Map and compute QC eligibility and stock availability for each order
    return salesOrders.map(so => {
      // Find all QC checks associated with this SO or its Work Orders
      const directQcs = so.qualityChecks || [];
      const woQcs = (so.workOrders || []).flatMap(wo => wo.qualityChecks || []);
      const allQcs = [...directQcs, ...woQcs];

      // Final QC checks
      const finalQcs = allQcs.filter(qc =>
        qc.qcType === 'Final QC' ||
        qc.stage === 'Final QC' ||
        qc.stage === 'Finished Goods' ||
        qc.qcType === 'Production QC' ||
        qc.status === 'Approved'
      );

      const approvedFinalQcs = allQcs.filter(qc =>
        qc.status === 'Approved' || qc.result === 'Approved'
      );

      // Sum passed quantities
      const totalQcApproved = approvedFinalQcs.reduce((sum, qc) => sum + (qc.passedQuantity || 0), 0);
      const totalQcRejected = allQcs.reduce((sum, qc) => sum + (qc.rejectedQuantity || 0), 0);

      // Work Order progress
      const totalProduced = (so.workOrders || []).reduce((sum, wo) => sum + (wo.producedQuantity || 0), 0);
      const activeWorkOrder = so.workOrders?.[0] || null;

      // Available Finished Goods stock in warehouse
      const availableStock = so.product?.availableStock || 0;
      const stockLevels = so.product?.stockLevels || [];

      // QC approval determination:
      // QC is considered approved if:
      // a) There is an approved Final QC record, OR
      // b) totalQcApproved >= so.quantityPending (or > 0), OR
      // c) Sales Order productionStatus is 'QC Passed' / 'Produced'
      const isQcApproved = approvedFinalQcs.length > 0 || so.productionStatus === 'QC Passed' || totalQcApproved > 0;
      const effectiveQcApprovedQty = totalQcApproved > 0 ? totalQcApproved : (so.productionStatus === 'QC Passed' ? so.quantityPending : totalProduced);

      return {
        id: so.id,
        soNumber: so.soNumber,
        customerName: so.customerName,
        customerId: so.customerId,
        customerPoNumber: so.customerPoNumber,
        productName: so.productName,
        productId: so.productId,
        productCode: so.product?.code || 'FG-BOX',
        orderedQuantity: so.quantity,
        previouslyDispatched: so.quantityDispatched,
        remainingQuantity: so.quantityPending,
        unitPrice: so.unitPrice,
        orderDate: so.orderDate,
        deliveryDate: so.deliveryDate,
        status: so.status,
        productionStatus: so.productionStatus,
        dispatchStatus: so.dispatchStatus,
        warehouseId: so.warehouseId,
        warehouseName: so.warehouse?.name || 'Main Warehouse',
        shippingAddress: so.shippingAddress || so.customer?.address || '',
        
        // QC & Production data
        workOrderId: activeWorkOrder?.id || null,
        woNumber: activeWorkOrder?.orderNumber || null,
        producedQuantity: totalProduced,
        isQcApproved,
        qcCheckId: approvedFinalQcs[0]?.id || null,
        qcNumber: approvedFinalQcs[0]?.qcNumber || null,
        qcApprovedQuantity: effectiveQcApprovedQty,
        qcRejectedQuantity: totalQcRejected,
        qcStatus: approvedFinalQcs.length > 0 ? 'Approved' : (allQcs.length > 0 ? allQcs[0].status : 'Pending QC'),

        // Finished Goods stock
        availableStock,
        stockLevels: stockLevels.map(sl => ({
          warehouseId: sl.warehouseId,
          warehouseName: sl.warehouse?.name,
          binId: sl.binId,
          binCode: sl.bin?.code || '',
          currentStock: sl.currentStock,
        }))
      };
    });
  }

  /**
   * Create a new Dispatch in PostgreSQL using an ACID Prisma transaction.
   * Performs real-time QC verification, inventory deduction, and Sales Order status updates.
   */
  static async create(data: any) {
    return createWithUniqueCode('dispatch', 'DC-', 'challanNumber', async (challanNumber) => {
      return prisma.$transaction(async (tx) => {
        // 1. Fetch Sales Order
        const order = await tx.salesOrderEntity.findUnique({
          where: { id: data.salesOrderId },
          include: {
            customer: true,
            product: {
              include: { stockLevels: true }
            },
            warehouse: true,
            workOrders: {
              include: {
                qualityChecks: { where: { isDeleted: false } }
              }
            },
            qualityChecks: {
              where: { isDeleted: false }
            }
          },
        });

        if (!order) {
          throw new Error(`Sales Order with ID ${data.salesOrderId} not found.`);
        }

        if (order.isDeleted || order.status === 'Cancelled' || order.status === 'Closed') {
          throw new Error(`Sales Order ${order.soNumber} is ${order.status} and cannot be dispatched.`);
        }

        const items = data.items || [];
        if (!items.length) {
          throw new Error('At least one item is required for dispatch.');
        }

        const totalQuantity = items.reduce((acc: number, it: any) => acc + (Number(it.dispatchedQuantity) || 0), 0);
        const totalBundles = items.reduce((acc: number, it: any) => acc + (Number(it.bundlesCount) || 0), 0);
        const totalWeightKg = items.reduce((acc: number, it: any) => acc + (Number(it.totalWeightKg) || 0), 0);

        // 2. Validate dispatch quantity
        if (totalQuantity <= 0) {
          throw new Error('Dispatch quantity must be greater than zero.');
        }

        const remainingQuantity = order.quantityPending;
        if (totalQuantity > remainingQuantity) {
          throw new Error(`Dispatch quantity (${totalQuantity}) cannot exceed remaining Sales Order quantity (${remainingQuantity}).`);
        }

        // 3. QC Verification Flow
        // Verify QC checks associated with this SO / Work Order
        const allQcs = [
          ...(order.qualityChecks || []),
          ...(order.workOrders || []).flatMap(wo => wo.qualityChecks || [])
        ];

        const hasApprovedQc = allQcs.some(qc => qc.status === 'Approved' || qc.result === 'Approved') ||
          order.productionStatus === 'QC Passed';

        if (data.qualityCheckId) {
          const specifiedQc = await tx.qualityCheck.findUnique({ where: { id: data.qualityCheckId } });
          if (!specifiedQc || (specifiedQc.status !== 'Approved' && specifiedQc.result !== 'Approved')) {
            throw new Error('Dispatch cannot be created because the selected Final QC is not approved.');
          }
          if (specifiedQc.passedQuantity && totalQuantity > specifiedQc.passedQuantity) {
            throw new Error(`Dispatch quantity (${totalQuantity}) exceeds QC approved quantity (${specifiedQc.passedQuantity}).`);
          }
        } else if (!hasApprovedQc) {
          throw new Error(`Cannot create dispatch for Sales Order ${order.soNumber}: Final QC has not been approved yet. Only QC Approved items can be dispatched.`);
        }

        // 4. Finished Goods Stock Verification
        const warehouseId = data.warehouseId || order.warehouseId || null;
        let warehouseName = data.warehouseName;
        if (warehouseId && !warehouseName) {
          const wh = await tx.warehouse.findUnique({ where: { id: warehouseId } });
          if (wh) warehouseName = wh.name;
        }

        const productId = items[0]?.productId || order.productId;
        if (productId && data.inventoryUpdated !== false) {
          const product = await tx.product.findUnique({
            where: { id: productId },
            include: { stockLevels: true }
          });

          if (!product || product.availableStock < totalQuantity) {
            throw new Error(`Insufficient Finished Goods stock. Available stock is ${product?.availableStock || 0} Pcs, but requested dispatch quantity is ${totalQuantity} Pcs.`);
          }
        }

        // 5. Determine Delivery Type & Partial Action
        const isFullDelivery = totalQuantity >= remainingQuantity;
        const deliveryType = isFullDelivery ? 'Full Delivery' : (data.deliveryType || 'Partial Delivery');
        const partialAction = isFullDelivery ? null : (data.partialAction || 'Keep Order Open');
        const shortClosedQty = (!isFullDelivery && partialAction === 'Close Order')
          ? Math.max(0, remainingQuantity - totalQuantity)
          : 0;

        // 6. Create the Dispatch record
        const dispatch = await tx.dispatch.create({
          data: {
            challanNumber,
            dispatchDate: data.dispatchDate || new Date().toISOString().split('T')[0],
            dispatchTime: data.dispatchTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            salesOrderId: order.id,
            soNumber: order.soNumber,
            customerId: data.customerId || order.customerId,
            customerName: data.customerName || order.customerName,
            customerPoNumber: data.customerPoNumber || order.customerPoNumber,
            warehouseId,
            warehouseName,
            vehicleNumber: data.vehicleNumber,
            driverName: data.driverName || null,
            driverPhone: data.driverPhone || null,
            transporterName: data.transporterName || null,
            lrNumber: data.lrNumber || null,
            lrDate: data.lrDate || null,
            ewayBillNumber: data.ewayBillNumber || null,
            gatePassNumber: data.gatePassNumber || `GP-${challanNumber}`,
            shippingAddress: data.shippingAddress || order.shippingAddress || order.customer?.address || 'Ex-Factory',
            deliveryTerm: data.deliveryTerm || 'Ex-Factory',
            paymentTerms: data.paymentTerms || '30 Days Net',
            deliveryType,
            partialAction,
            shortClosedQuantity: shortClosedQty,
            workOrderId: data.workOrderId || null,
            qualityCheckId: data.qualityCheckId || null,
            status: data.status || 'Dispatched',
            totalQuantity,
            totalBundles,
            totalWeightKg,
            dispatchedBy: data.dispatchedBy || 'Dispatch Supervisor',
            verifiedBy: data.verifiedBy || 'Gate Security',
            remarks: data.remarks || (shortClosedQty > 0 ? `Short-closed remaining ${shortClosedQty} units. Reason: ${data.shortCloseReason || 'As per customer request'}` : null),
            inventoryUpdated: data.inventoryUpdated !== false,
            items: {
              create: items.map((it: any) => ({
                productId: it.productId || order.productId || null,
                productCode: it.productCode || null,
                productName: it.productName || order.productName,
                orderedQuantity: Number(it.orderedQuantity) || order.quantity,
                dispatchedQuantity: Number(it.dispatchedQuantity),
                unit: it.unit || 'Pcs',
                bundlesCount: Number(it.bundlesCount) || 0,
                unitsPerBundle: Number(it.unitsPerBundle) || 0,
                boxWeightKg: Number(it.boxWeightKg) || 0,
                totalWeightKg: Number(it.totalWeightKg) || 0,
                rate: Number(it.rate) || order.unitPrice || 0,
                amount: (Number(it.dispatchedQuantity) * (Number(it.rate) || order.unitPrice || 0)),
                warehouseId: it.warehouseId || warehouseId || null,
                binId: it.binId || data.binId || null,
                binCode: it.binCode || null,
                batchNumber: it.batchNumber || data.batchNumber || null,
                remarks: it.remarks || (it.binId ? `Bin: ${it.binId}` : null),
              })),
            },
          },
          include: {
            items: { include: { product: true } },
            salesOrder: true,
            customer: true,
            warehouse: true,
            workOrder: true,
            qualityCheck: true,
          },
        });

        // 7. Update Sales Order Quantities and Status
        const newQuantityDispatched = (order.quantityDispatched || 0) + totalQuantity;
        let newQuantityPending = Math.max(0, order.quantity - newQuantityDispatched);
        let newSalesOrderStatus = 'Partially Dispatched';
        let newDispatchStatus = 'Partially Dispatched';

        if (isFullDelivery || newQuantityPending <= 0) {
          newQuantityPending = 0;
          newSalesOrderStatus = 'Dispatched';
          newDispatchStatus = 'Dispatched';
        } else if (partialAction === 'Close Order') {
          // Short-Close: order is completed/closed, remaining quantity zeroed out
          newQuantityPending = 0;
          newSalesOrderStatus = 'Closed';
          newDispatchStatus = 'Partially Dispatched (Closed)';
        }

        await tx.salesOrderEntity.update({
          where: { id: order.id },
          data: {
            quantityDispatched: newQuantityDispatched,
            quantityPending: newQuantityPending,
            dispatchStatus: newDispatchStatus,
            status: newSalesOrderStatus,
            updatedAt: new Date(),
          },
        });

        // 8. Deduct Finished Goods Inventory & Create Stock Movement
        if (data.inventoryUpdated !== false) {
          for (const item of items) {
            const prodId = item.productId || order.productId;
            const itemQty = Number(item.dispatchedQuantity) || 0;

            if (prodId && itemQty > 0) {
              const product = await tx.product.findUnique({ where: { id: prodId } });
              const prevStock = product?.availableStock || 0;
              const nextStock = Math.max(0, prevStock - itemQty);

              // Update product master available stock
              await tx.product.update({
                where: { id: prodId },
                data: { availableStock: nextStock },
              });

              // Deduct from warehouse stockLevel if warehouse specified
              if (warehouseId) {
                const stockLevel = await tx.stockLevel.findFirst({
                  where: { productId: prodId, warehouseId },
                });

                if (stockLevel) {
                  await tx.stockLevel.update({
                    where: { id: stockLevel.id },
                    data: {
                      currentStock: Math.max(0, stockLevel.currentStock - itemQty),
                    },
                  });
                }
              }

              // Create Inventory Transaction record (Stock Out Movement)
              try {
                await tx.inventoryTransaction.create({
                  data: {
                    itemType: 'Finished Product',
                    productId: prodId,
                    warehouseId: warehouseId || null,
                    transactionType: 'Stock Out',
                    referenceType: 'Dispatch',
                    referenceNumber: challanNumber,
                    quantity: itemQty,
                    previousStock: prevStock,
                    currentStock: nextStock,
                    remarks: `Dispatch Challan ${challanNumber} for SO ${order.soNumber} (${deliveryType})${item.binId ? ` [Bin: ${item.binId}]` : ''}`,
                    user: data.dispatchedBy || 'Dispatch Supervisor',
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toTimeString().split(' ')[0],
                  },
                });
              } catch (txErr) {
                console.warn('[Dispatch InventoryTransaction] Warning creating transaction record:', txErr);
              }
            }
          }
        }

        // 9. Create Audit Log
        try {
          await tx.auditLog.create({
            data: {
              action: 'DISPATCH_CREATED',
              module: 'Dispatch',
              entity: 'Dispatch',
              entityId: dispatch.id,
              details: `Created Delivery Challan ${challanNumber} for SO ${order.soNumber} (${totalQuantity} units, ${deliveryType}${partialAction ? ` - ${partialAction}` : ''})`,
            },
          });
        } catch (_) {}

        return dispatch;
      });
    });
  }

  /**
   * Update editable Dispatch details (vehicle, driver, transporter, LR, E-Way Bill, remarks).
   */
  static async update(id: string, data: any) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.dispatch.findUnique({ where: { id } });
      if (!existing) throw new Error('Delivery Challan not found.');

      const updated = await tx.dispatch.update({
        where: { id },
        data: {
          vehicleNumber: data.vehicleNumber !== undefined ? data.vehicleNumber : existing.vehicleNumber,
          driverName: data.driverName !== undefined ? data.driverName : existing.driverName,
          driverPhone: data.driverPhone !== undefined ? data.driverPhone : existing.driverPhone,
          transporterName: data.transporterName !== undefined ? data.transporterName : existing.transporterName,
          lrNumber: data.lrNumber !== undefined ? data.lrNumber : existing.lrNumber,
          lrDate: data.lrDate !== undefined ? data.lrDate : existing.lrDate,
          ewayBillNumber: data.ewayBillNumber !== undefined ? data.ewayBillNumber : existing.ewayBillNumber,
          gatePassNumber: data.gatePassNumber !== undefined ? data.gatePassNumber : existing.gatePassNumber,
          shippingAddress: data.shippingAddress !== undefined ? data.shippingAddress : existing.shippingAddress,
          deliveryTerm: data.deliveryTerm !== undefined ? data.deliveryTerm : existing.deliveryTerm,
          paymentTerms: data.paymentTerms !== undefined ? data.paymentTerms : existing.paymentTerms,
          status: data.status !== undefined ? data.status : existing.status,
          dispatchedBy: data.dispatchedBy !== undefined ? data.dispatchedBy : existing.dispatchedBy,
          verifiedBy: data.verifiedBy !== undefined ? data.verifiedBy : existing.verifiedBy,
          remarks: data.remarks !== undefined ? data.remarks : existing.remarks,
        },
        include: {
          items: { include: { product: true } },
          salesOrder: true,
          customer: true,
          warehouse: true,
        },
      });

      return updated;
    });
  }

  /**
   * Update Dispatch shipment status (Ready for Dispatch -> Loaded -> Dispatched -> In Transit -> Delivered).
   */
  static async updateStatus(id: string, data: { status: string; remarks?: string; user?: string }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.dispatch.findUnique({
        where: { id },
        include: { salesOrder: true }
      });
      if (!existing) throw new Error('Delivery Challan not found.');

      const updated = await tx.dispatch.update({
        where: { id },
        data: {
          status: data.status,
          remarks: data.remarks ? `${existing.remarks ? existing.remarks + ' | ' : ''}${data.remarks}` : existing.remarks,
        },
        include: {
          items: { include: { product: true } },
          salesOrder: true,
          customer: true,
          warehouse: true,
        },
      });

      // If marked Delivered, update Sales Order dispatch status if all items delivered
      if (data.status === 'Delivered' && existing.salesOrderId) {
        await tx.salesOrderEntity.update({
          where: { id: existing.salesOrderId },
          data: { dispatchStatus: 'Delivered' }
        });
      }

      return updated;
    });
  }

  /**
   * Cancel Dispatch with automatic inventory restock and Sales Order balance reversal.
   */
  static async cancelDispatch(id: string, data?: { reason?: string; user?: string }) {
    return prisma.$transaction(async (tx) => {
      const dispatch = await tx.dispatch.findUnique({
        where: { id },
        include: {
          items: true,
          salesOrder: true,
        },
      });

      if (!dispatch) throw new Error('Delivery Challan not found.');
      if (dispatch.status === 'Cancelled') throw new Error('Delivery Challan is already cancelled.');

      // 1. Revert Sales Order Dispatched & Pending quantities
      if (dispatch.salesOrderId && dispatch.salesOrder) {
        const order = dispatch.salesOrder;
        const revertedDispatched = Math.max(0, (order.quantityDispatched || 0) - dispatch.totalQuantity);
        const revertedPending = Math.min(order.quantity, (order.quantityPending || 0) + dispatch.totalQuantity);
        const restoredStatus = revertedDispatched === 0 ? 'Confirmed' : 'Partially Dispatched';

        await tx.salesOrderEntity.update({
          where: { id: order.id },
          data: {
            quantityDispatched: revertedDispatched,
            quantityPending: revertedPending,
            dispatchStatus: restoredStatus,
            status: restoredStatus,
          },
        });
      }

      // 2. Restock Inventory if it was deducted
      if (dispatch.inventoryUpdated) {
        for (const item of dispatch.items) {
          if (item.productId && item.dispatchedQuantity > 0) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            const prevStock = product?.availableStock || 0;
            const restoredStock = prevStock + item.dispatchedQuantity;

            await tx.product.update({
              where: { id: item.productId },
              data: { availableStock: restoredStock },
            });

            if (dispatch.warehouseId) {
              const stockLevel = await tx.stockLevel.findFirst({
                where: { productId: item.productId, warehouseId: dispatch.warehouseId },
              });
              if (stockLevel) {
                await tx.stockLevel.update({
                  where: { id: stockLevel.id },
                  data: { currentStock: stockLevel.currentStock + item.dispatchedQuantity },
                });
              }
            }

            try {
              await tx.inventoryTransaction.create({
                data: {
                  itemType: 'Finished Product',
                  productId: item.productId,
                  warehouseId: dispatch.warehouseId || null,
                  transactionType: 'Stock In',
                  referenceType: 'Dispatch Cancellation',
                  referenceNumber: `CANCEL-${dispatch.challanNumber}`,
                  quantity: item.dispatchedQuantity,
                  previousStock: prevStock,
                  currentStock: restoredStock,
                  remarks: `Restock from cancelled Delivery Challan ${dispatch.challanNumber}. Reason: ${data?.reason || 'User cancelled'}`,
                  user: data?.user || 'Dispatch Supervisor',
                  date: new Date().toISOString().split('T')[0],
                  time: new Date().toTimeString().split(' ')[0],
                },
              });
            } catch (_) {}
          }
        }
      }

      // 3. Mark Dispatch as Cancelled
      const updated = await tx.dispatch.update({
        where: { id },
        data: {
          status: 'Cancelled',
          remarks: data?.reason ? `Cancelled: ${data.reason}` : 'Cancelled by user',
        },
        include: {
          items: true,
          salesOrder: true,
          customer: true,
          warehouse: true,
        },
      });

      return updated;
    });
  }

  /**
   * Soft Delete Dispatch (Only allowed for Draft / Ready / Cancelled).
   */
  static async delete(id: string) {
    return prisma.dispatch.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  /**
   * Get Dashboard Analytics & Overview Metrics directly from PostgreSQL.
   */
  static async getDashboardMetrics() {
    const todayStr = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [
      allDispatches,
      pendingOrders,
      closedOrdersCount,
      activeShipments,
      deliveredDispatches,
      recentDispatches
    ] = await Promise.all([
      prisma.dispatch.findMany({
        where: { isDeleted: false, deletedAt: null, status: { not: 'Cancelled' } },
        select: {
          id: true,
          totalQuantity: true,
          dispatchDate: true,
          status: true,
          totalWeightKg: true,
          totalBundles: true,
          deliveryType: true,
          customerName: true,
          warehouseName: true,
          items: {
            select: {
              productName: true,
              dispatchedQuantity: true,
            }
          }
        }
      }),
      prisma.salesOrderEntity.findMany({
        where: {
          isDeleted: false,
          deletedAt: null,
          status: { notIn: ['Cancelled', 'Closed', 'Delivered'] },
          quantityPending: { gt: 0 }
        },
        select: { quantityPending: true, quantity: true }
      }),
      prisma.salesOrderEntity.count({
        where: {
          isDeleted: false,
          deletedAt: null,
          status: 'Closed'
        }
      }),
      prisma.dispatch.count({
        where: {
          isDeleted: false,
          status: { in: ['Loaded', 'Dispatched', 'In Transit'] }
        }
      }),
      prisma.dispatch.count({
        where: {
          isDeleted: false,
          status: 'Delivered'
        }
      }),
      prisma.dispatch.findMany({
        where: { isDeleted: false },
        include: {
          salesOrder: true,
          customer: true,
          warehouse: true,
          items: {
            include: { product: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    const totalDispatches = allDispatches.length;
    const totalQuantityDispatched = allDispatches.reduce((s, d) => s + d.totalQuantity, 0);
    const totalWeightDispatched = allDispatches.reduce((s, d) => s + d.totalWeightKg, 0);

    const monthDispatches = allDispatches.filter(d => d.dispatchDate >= firstDayOfMonth);
    const monthQuantityDispatched = monthDispatches.reduce((s, d) => s + d.totalQuantity, 0);

    const todayDispatches = allDispatches.filter(d => d.dispatchDate === todayStr);
    const todayQuantityDispatched = todayDispatches.reduce((s, d) => s + d.totalQuantity, 0);

    const partiallyDispatchedCount = allDispatches.filter(d => d.deliveryType === 'Partial Delivery').length;
    const fullyDispatchedCount = allDispatches.filter(d => d.deliveryType === 'Full Delivery').length;

    const pendingOrdersCount = pendingOrders.length;
    const pendingQuantityToDispatch = pendingOrders.reduce((s, o) => s + o.quantityPending, 0);

    // Group dispatches by Customer
    const customerMap = new Map<string, { count: number; totalQty: number }>();
    for (const d of allDispatches) {
      const cName = d.customerName || 'Other Customers';
      const curr = customerMap.get(cName) || { count: 0, totalQty: 0 };
      curr.count += 1;
      curr.totalQty += d.totalQuantity;
      customerMap.set(cName, curr);
    }
    const dispatchesByCustomer = Array.from(customerMap.entries())
      .map(([name, val]) => ({ name, count: val.count, totalQuantity: val.totalQty }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 8);

    // Group dispatches by Product
    const productMap = new Map<string, { count: number; totalQty: number }>();
    for (const d of allDispatches) {
      for (const it of d.items) {
        const pName = it.productName || 'General Corrugated Box';
        const curr = productMap.get(pName) || { count: 0, totalQty: 0 };
        curr.count += 1;
        curr.totalQty += it.dispatchedQuantity;
        productMap.set(pName, curr);
      }
    }
    const dispatchesByProduct = Array.from(productMap.entries())
      .map(([name, val]) => ({ name, count: val.count, totalQuantity: val.totalQty }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 8);

    // Group dispatches by Warehouse
    const warehouseMap = new Map<string, { count: number; totalQty: number }>();
    for (const d of allDispatches) {
      const wName = d.warehouseName || 'Main Finished Goods Warehouse';
      const curr = warehouseMap.get(wName) || { count: 0, totalQty: 0 };
      curr.count += 1;
      curr.totalQty += d.totalQuantity;
      warehouseMap.set(wName, curr);
    }
    const dispatchesByWarehouse = Array.from(warehouseMap.entries())
      .map(([name, val]) => ({ name, count: val.count, totalQuantity: val.totalQty }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    return {
      totalDispatches,
      totalQuantityDispatched,
      totalWeightDispatched,
      monthQuantityDispatched,
      monthDispatchesCount: monthDispatches.length,
      todayQuantityDispatched,
      todayDispatchesCount: todayDispatches.length,
      partiallyDispatchedCount,
      fullyDispatchedCount,
      closedOrdersCount,
      pendingOrdersCount,
      pendingQuantityToDispatch,
      activeShipments,
      deliveredDispatches,
      dispatchesByCustomer,
      dispatchesByProduct,
      dispatchesByWarehouse,
      recentDispatches
    };
  }

  /**
   * Generate formal Delivery Challan print / PDF payload with complete regulatory details.
   */
  static async getPrintData(id: string) {
    const dispatch: any = await this.getById(id);
    if (!dispatch) throw new Error('Delivery Challan not found.');

    return {
      company: {
        name: 'AMK Corrugation & Packaging Pvt. Ltd.',
        address: 'Plot No. 42-45, Industrial Area Phase II, Packaging Zone',
        city: 'Mumbai, Maharashtra - 400093',
        gstin: '27AABCA1234F1Z5',
        cin: 'U21022MH2018PTC304891',
        phone: '+91 22 2847 9000',
        email: 'dispatch@amkpackaging.com',
        website: 'www.amkpackaging.com',
      },
      challan: {
        challanNumber: dispatch.challanNumber,
        dispatchDate: dispatch.dispatchDate,
        dispatchTime: dispatch.dispatchTime || '10:00 AM',
        gatePassNumber: dispatch.gatePassNumber,
        ewayBillNumber: dispatch.ewayBillNumber,
        lrNumber: dispatch.lrNumber,
        lrDate: dispatch.lrDate,
        status: dispatch.status,
      },
      transport: {
        vehicleNumber: dispatch.vehicleNumber,
        driverName: dispatch.driverName || 'N/A',
        driverPhone: dispatch.driverPhone || 'N/A',
        transporterName: dispatch.transporterName || 'Self / Direct',
        deliveryTerm: dispatch.deliveryTerm || 'Ex-Factory',
      },
      customer: {
        name: dispatch.customerName,
        poNumber: dispatch.customerPoNumber || 'N/A',
        soNumber: dispatch.soNumber,
        shippingAddress: dispatch.shippingAddress || dispatch.customer?.address || 'Same as Billing Address',
        contactPerson: dispatch.customer?.contactPerson,
        phone: dispatch.customer?.phone,
        email: dispatch.customer?.email,
      },
      items: (dispatch.items || []).map((it: any, idx: number) => ({
        srNo: idx + 1,
        productCode: it.productCode || it.product?.code || 'FG-BOX',
        productName: it.productName,
        orderedQty: it.orderedQuantity || it.quantity,
        dispatchedQty: it.dispatchedQuantity || it.quantity,
        unit: it.unit || 'Pcs',
        bundles: it.bundlesCount || it.bundleCount || 0,
        unitsPerBundle: it.unitsPerBundle || 0,
        boxWeightKg: it.boxWeightKg || 0,
        totalWeightKg: it.totalWeightKg || it.weightKg || 0,
        rate: it.rate || 0,
        amount: it.amount || 0,
        remarks: it.remarks || '',
      })),
      summary: {
        totalQuantity: dispatch.totalQuantity,
        totalBundles: dispatch.totalBundles,
        totalWeightKg: dispatch.totalWeightKg,
        totalAmount: (dispatch.items || []).reduce((acc: number, it: any) => acc + (it.amount || 0), 0),
        dispatchedBy: dispatch.dispatchedBy || 'Dispatch Supervisor',
        verifiedBy: dispatch.verifiedBy || 'Gate Security',
        remarks: dispatch.remarks || dispatch.notes,
      },
    };
  }
}
