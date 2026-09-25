import { prisma } from '../lib/prisma';
import { generateNextCode } from '../utils/code-generator';
import { AuditService } from './audit.service';

export class PurchaseOrderService {
  static async getAll(query?: { supplierId?: string; status?: string; search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.supplierId) where.supplierId = query.supplierId;
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { poNumber: { contains: query.search, mode: 'insensitive' } },
        { rfqNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [pos, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: { supplier: true, items: true, gateEntries: true, reelInwards: true, attachments: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { pos, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, items: true, gateEntries: true, reelInwards: true, attachments: true },
    });
  }

  static async getAttachments(purchaseOrderId: string) {
    return prisma.purchaseOrderAttachment.findMany({
      where: { purchaseOrderId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async addAttachment(purchaseOrderId: string, data: { fileName: string; fileType: string; fileSize: number; fileData: string; uploadedBy?: string }) {
    return prisma.$transaction(async (tx) => {
      const attachment = await tx.purchaseOrderAttachment.create({
        data: {
          purchaseOrderId,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          fileData: data.fileData,
          uploadedBy: data.uploadedBy || 'Administrator'
        }
      });

      await AuditService.safeCreate(tx, {
        action: 'PURCHASE_ORDER_DOCUMENT_UPLOADED',
        module: 'Procurement',
        entity: 'PurchaseOrder',
        entityId: purchaseOrderId,
        details: `Uploaded document ${data.fileName} to Purchase Order`,
      });

      return attachment;
    });
  }

  static async deleteAttachment(attachmentId: string) {
    return prisma.purchaseOrderAttachment.delete({
      where: { id: attachmentId }
    });
  }

  static async create(data: any) {
    const { 
      items, supplier, rfq, quote, gateEntries, gateEntryLinks, gateEntryItems, 
      reelInwards, attachments, supplierName, id, createdAt, updatedAt, ...rawPoData 
    } = data;

    const createData: any = {
      supplierId: rawPoData.supplierId,
      date: rawPoData.date || new Date().toISOString().slice(0, 10),
      deliveryDate: rawPoData.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: rawPoData.status || 'Approved',
      rfqNumber: rawPoData.rfqNumber || null,
      rfqId: rawPoData.rfqId || null,
      quoteId: rawPoData.quoteId || null,
      remarks: rawPoData.remarks || null,
      totalAmount: Number(rawPoData.totalAmount) || 0,
    };

    const sanitizedItems = Array.isArray(items) ? items.map((it: any) => ({
      materialCode: String(it.materialCode || 'RM-ITEM'),
      materialName: String(it.materialName || 'Material Item'),
      quantityOrdered: Number(it.quantityOrdered || it.quantity || 1),
      quantityReceived: Number(it.quantityReceived || 0),
      unitPrice: Number(it.unitPrice || 0),
      total: Number(it.total || (Number(it.quantityOrdered || 1) * Number(it.unitPrice || 0)))
    })) : [];

    return prisma.$transaction(async (tx) => {
      const poNumber = await generateNextCode('purchaseOrder', 'PO-', 'poNumber', 4, tx);

      const po = await tx.purchaseOrder.create({
        data: {
          ...createData,
          poNumber,
          items: sanitizedItems.length ? { create: sanitizedItems } : undefined,
        },
        include: { supplier: true, items: true },
      });

      await AuditService.safeCreate(tx, {
        action: 'PURCHASE_ORDER_CREATED',
        module: 'Procurement',
        entity: 'PurchaseOrder',
        entityId: po.id,
        details: `Created Purchase Order ${po.poNumber}`,
      });

      return po;
    });
  }

  static async update(id: string, data: any) {
    const { 
      items, supplier, rfq, quote, gateEntries, gateEntryLinks, gateEntryItems, 
      reelInwards, attachments, supplierName, id: _poId, createdAt, updatedAt, ...rawPoData 
    } = data;

    const updateData: any = {};
    if (rawPoData.supplierId !== undefined) updateData.supplierId = rawPoData.supplierId;
    if (rawPoData.date !== undefined) updateData.date = rawPoData.date;
    if (rawPoData.deliveryDate !== undefined) updateData.deliveryDate = rawPoData.deliveryDate;
    if (rawPoData.status !== undefined) updateData.status = rawPoData.status;
    if (rawPoData.rfqNumber !== undefined) updateData.rfqNumber = rawPoData.rfqNumber || null;
    if (rawPoData.rfqId !== undefined) updateData.rfqId = rawPoData.rfqId || null;
    if (rawPoData.quoteId !== undefined) updateData.quoteId = rawPoData.quoteId || null;
    if (rawPoData.remarks !== undefined) updateData.remarks = rawPoData.remarks || null;
    if (rawPoData.totalAmount !== undefined) updateData.totalAmount = Number(rawPoData.totalAmount) || 0;

    const sanitizedItems = Array.isArray(items) ? items.map((it: any) => ({
      materialCode: String(it.materialCode || 'RM-ITEM'),
      materialName: String(it.materialName || 'Material Item'),
      quantityOrdered: Number(it.quantityOrdered || it.quantity || 1),
      quantityReceived: Number(it.quantityReceived || 0),
      unitPrice: Number(it.unitPrice || 0),
      total: Number(it.total || (Number(it.quantityOrdered || 1) * Number(it.unitPrice || 0)))
    })) : undefined;

    return prisma.$transaction(async (tx) => {
      if (sanitizedItems) {
        await tx.purchaseOrderItem.deleteMany({ where: { poId: id } });
      }

      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: {
          ...updateData,
          items: sanitizedItems?.length ? { create: sanitizedItems } : undefined,
        },
        include: { supplier: true, items: true },
      });

      return updated;
    });
  }

  static async delete(id: string, userId?: string, userName?: string) {
    return prisma.purchaseOrder.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
    });
  }
}
