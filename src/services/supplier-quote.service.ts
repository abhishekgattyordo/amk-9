import { prisma } from '../lib/prisma';
import { generateNextCode } from '../utils/code-generator';

export class SupplierQuoteService {
  static async getAll(query?: { rfqId?: string; supplierId?: string; search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (query?.rfqId) where.rfqId = query.rfqId;
    if (query?.supplierId) where.supplierId = query.supplierId;
    if (query?.search) {
      where.OR = [
        { quoteNumber: { contains: query.search, mode: 'insensitive' } },
        { supplier: { supplierName: { contains: query.search, mode: 'insensitive' } } },
        { supplier: { millName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.supplierQuotation.findMany({
        where,
        include: { supplier: true, rfq: true, items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supplierQuotation.count({ where }),
    ]);

    return { quotes, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.supplierQuotation.findUnique({
      where: { id },
      include: { supplier: true, rfq: true, items: true, purchaseOrders: true },
    });
  }

  static async create(data: any) {
    const { items, supplierName, ...rawQuoteData } = data;

    return prisma.$transaction(async (tx) => {
      // 1. Resolve Supplier ID gracefully
      let supplierId = rawQuoteData.supplierId;
      let validSupplier = null;

      if (supplierId && supplierId !== 'NO_SUPPLIER_ID') {
        validSupplier = await tx.supplier.findFirst({
          where: {
            OR: [
              { id: supplierId },
              { supplierCode: supplierId },
            ],
            isDeleted: false,
          },
        });
      }

      // If supplierId was not found by direct ID/Code, search by supplier name or mill name
      if (!validSupplier && (supplierName || rawQuoteData.supplierName)) {
        const nameToFind = supplierName || rawQuoteData.supplierName;
        validSupplier = await tx.supplier.findFirst({
          where: {
            OR: [
              { supplierName: { equals: nameToFind, mode: 'insensitive' } },
              { millName: { equals: nameToFind, mode: 'insensitive' } },
            ],
            isDeleted: false,
          },
        });
      }

      // If still no valid supplier, find any active supplier or create a default one
      if (!validSupplier) {
        validSupplier = await tx.supplier.findFirst({
          where: { isDeleted: false },
        });

        if (!validSupplier) {
          validSupplier = await tx.supplier.create({
            data: {
              supplierName: supplierName || rawQuoteData.supplierName || 'General Supplier',
              millName: 'Main Mill',
              category: 'Paper & Raw Materials',
            },
          });
        }
      }

      supplierId = validSupplier.id;

      // 2. Sanitize line items to only include valid SupplierQuoteItem Prisma fields
      const sanitizedItems = Array.isArray(items) ? items.map((it: any) => {
        const qty = Number(it.quantity) || 1;
        const price = Number(it.unitPrice ?? it.price ?? it.expectedPrice) || 0;
        const discount = Number(it.discount) || 0;
        const tax = Number(it.tax) || 0;
        const total = Number(it.totalPrice ?? it.total) || (qty * price * (1 - discount / 100) * (1 + tax / 100));

        return {
          materialCode: String(it.materialCode || it.code || 'RM-ITEM'),
          materialName: it.materialName ? String(it.materialName) : (it.name ? String(it.name) : null),
          quantity: qty,
          unitPrice: price,
          discount: discount,
          tax: tax,
          totalPrice: total,
        };
      }) : [];

      // 3. Calculate total amount
      const totalAmount = rawQuoteData.totalAmount !== undefined 
        ? Number(rawQuoteData.totalAmount) 
        : sanitizedItems.reduce((acc: number, item: any) => acc + item.totalPrice, 0);

      // 4. Generate next Quote code and create quotation
      const quoteNumber = await generateNextCode('supplierQuotation', 'SQ-', 'quoteNumber', 4, tx);

      // Resolve valid RFQ ID if passed
      let resolvedRfqId: string | null = null;
      if (rawQuoteData.rfqId) {
        const existingRfq = await tx.rFQ.findFirst({
          where: {
            OR: [
              { id: rawQuoteData.rfqId },
              { rfqNumber: rawQuoteData.rfqId }
            ]
          }
        });
        if (existingRfq) {
          resolvedRfqId = existingRfq.id;
        }
      }

      const quote = await tx.supplierQuotation.create({
        data: {
          quoteNumber,
          rfqId: resolvedRfqId,
          supplierId: supplierId,
          quoteDate: rawQuoteData.quoteDate || new Date().toISOString().slice(0, 10),
          validityDate: rawQuoteData.validityDate || null,
          status: rawQuoteData.status || 'Submitted',
          totalAmount: totalAmount,
          remarks: rawQuoteData.remarks || null,
          items: sanitizedItems.length ? { create: sanitizedItems } : undefined,
        },
        include: { supplier: true, items: true },
      });

      if (resolvedRfqId) {
        await tx.rFQ.update({
          where: { id: resolvedRfqId },
          data: { status: 'Awarded' },
        });
      }

      try {
        await tx.auditLog.create({
          data: {
            action: 'SUPPLIER_QUOTE_CREATED',
            module: 'Procurement',
            entity: 'SupplierQuotation',
            entityId: quote.id,
            details: `Created quotation ${quote.quoteNumber}`,
          },
        });
      } catch (logErr) {
        console.warn('Audit log creation failed in quote create:', logErr);
      }

      return quote;
    }, {
      maxWait: 10000,
      timeout: 20000,
    });
  }

  static async update(id: string, data: any, userName?: string) {
    const existingQuote = await prisma.supplierQuotation.findUnique({ where: { id } });
    if (!existingQuote) {
      throw new Error('Supplier Quotation not found');
    }

    const { items, supplier, rfq, purchaseOrders, supplierName, ...rawQuoteData } = data || {};

    const updateData: any = {};

    if (rawQuoteData.status !== undefined) updateData.status = String(rawQuoteData.status);
    if (rawQuoteData.remarks !== undefined) updateData.remarks = rawQuoteData.remarks ? String(rawQuoteData.remarks) : null;

    if (rawQuoteData.quoteNumber || rawQuoteData.quotationNumber) {
      updateData.quoteNumber = String(rawQuoteData.quoteNumber || rawQuoteData.quotationNumber);
    }

    if (rawQuoteData.quoteDate || rawQuoteData.quotationDate) {
      updateData.quoteDate = String(rawQuoteData.quoteDate || rawQuoteData.quotationDate);
    }

    if (rawQuoteData.validityDate !== undefined || rawQuoteData.validUntil !== undefined) {
      const vDate = rawQuoteData.validityDate ?? rawQuoteData.validUntil;
      updateData.validityDate = vDate ? String(vDate) : null;
    }

    if (rawQuoteData.totalAmount !== undefined || rawQuoteData.totalPrice !== undefined) {
      const tot = rawQuoteData.totalAmount ?? rawQuoteData.totalPrice;
      if (tot !== null && tot !== undefined && !isNaN(Number(tot))) {
        updateData.totalAmount = Number(tot);
      }
    }

    if (rawQuoteData.rfqId && typeof rawQuoteData.rfqId === 'string' && rawQuoteData.rfqId.trim() !== '') {
      const existingRfq = await prisma.rFQ.findFirst({
        where: {
          OR: [
            { id: rawQuoteData.rfqId },
            { rfqNumber: rawQuoteData.rfqId }
          ]
        }
      });
      if (existingRfq) {
        updateData.rfqId = existingRfq.id;
      }
    } else if (rawQuoteData.rfqId === null || rawQuoteData.rfqId === '') {
      updateData.rfqId = null;
    }

    if (rawQuoteData.supplierId && typeof rawQuoteData.supplierId === 'string' && rawQuoteData.supplierId.trim() !== '' && rawQuoteData.supplierId !== 'NO_SUPPLIER_ID') {
      const validSup = await prisma.supplier.findFirst({
        where: {
          OR: [
            { id: rawQuoteData.supplierId },
            { supplierCode: rawQuoteData.supplierId }
          ],
          isDeleted: false
        }
      });
      if (validSup) {
        updateData.supplierId = validSup.id;
      }
    }

    // Sanitize line items if provided
    let sanitizedItems: any[] | undefined = undefined;
    if (items && Array.isArray(items)) {
      sanitizedItems = items.map((it: any) => {
        const qty = Number(it.quantity) || 1;
        const price = Number(it.unitPrice ?? it.price ?? it.expectedPrice) || 0;
        const discount = Number(it.discount) || 0;
        const tax = Number(it.tax) || 0;
        const total = Number(it.totalPrice ?? it.totalAmount ?? it.total) || (qty * price * (1 - discount / 100) * (1 + tax / 100));

        return {
          materialCode: String(it.materialCode || it.code || 'RM-ITEM'),
          materialName: it.materialName ? String(it.materialName) : (it.name ? String(it.name) : null),
          quantity: qty,
          unitPrice: price,
          discount: discount,
          tax: tax,
          totalPrice: total,
        };
      });
    }

    return prisma.$transaction(async (tx) => {
      if (sanitizedItems) {
        await tx.supplierQuoteItem.deleteMany({ where: { quotationId: id } });
      }

      const updated = await tx.supplierQuotation.update({
        where: { id },
        data: {
          ...updateData,
          items: sanitizedItems?.length ? { create: sanitizedItems } : undefined,
        },
        include: { supplier: true, items: true, rfq: true },
      });

      if (updateData.status && existingQuote.status !== updateData.status) {
        await tx.auditLog.create({
          data: {
            action: 'STATUS_CHANGE',
            module: 'Procurement',
            entity: 'SupplierQuotation',
            entityId: id,
            fieldName: 'status',
            oldValue: existingQuote.status,
            newValue: updateData.status,
            user: userName || 'Administrator',
            details: `Supplier Quotation status changed from "${existingQuote.status}" to "${updateData.status}"`,
          },
        });
      } else {
        await tx.auditLog.create({
          data: {
            action: 'SUPPLIER_QUOTE_UPDATED',
            module: 'Procurement',
            entity: 'SupplierQuotation',
            entityId: id,
            user: userName || 'Administrator',
            details: `Updated Supplier Quotation ${updated.quoteNumber}`,
          },
        });
      }

      return updated;
    }, {
      maxWait: 10000,
      timeout: 20000,
    });
  }

  static async delete(id: string, userId?: string, userName?: string) {
    const existing = await prisma.supplierQuotation.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Supplier Quotation not found');
    }

    const updated = await prisma.supplierQuotation.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
    });

    try {
      await prisma.auditLog.create({
        data: {
          action: 'SUPPLIER_QUOTE_DELETED',
          module: 'Procurement',
          entity: 'SupplierQuotation',
          entityId: id,
          user: userName || 'Administrator',
          details: `Moved Supplier Quotation ${existing.quoteNumber || id} to Recycle Bin`,
        }
      });
    } catch (e) {
      console.warn('Audit log write failed on quote delete:', e);
    }

    return updated;
  }
}
