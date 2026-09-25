import { prisma } from '../lib/prisma';
import { generateNextCode } from '../utils/code-generator';
import { AuditService } from './audit.service';

export class RFQService {
  static async getAll(query?: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.status) where.status = query.status;
    if (query?.search) {
      where.OR = [
        { rfqNumber: { contains: query.search, mode: 'insensitive' } },
        { department: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [rfqs, total] = await Promise.all([
      prisma.rFQ.findMany({
        where,
        include: { materials: true, suppliers: true, quotations: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rFQ.count({ where }),
    ]);

    return { rfqs, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.rFQ.findUnique({
      where: { id },
      include: { materials: true, suppliers: true, quotations: true, purchaseOrders: true },
    });
  }

  static async create(data: any) {
    const { materials, suppliers, ...rfqData } = data;
    console.log('RFQService.create called with data:', JSON.stringify(data, null, 2));

    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const rfqNumber = await generateNextCode('rFQ', 'RFQ-', 'rfqNumber', 4, tx, attempt);
          console.log(`[RFQService] Attempt ${attempt + 1}: Generated RFQ number: ${rfqNumber}`);

          const rfq = await tx.rFQ.create({
            data: {
              ...rfqData,
              rfqNumber,
              materials: materials?.length ? { create: materials } : undefined,
              suppliers: suppliers?.length ? { create: suppliers } : undefined,
            },
            include: { materials: true, suppliers: true },
          });
          console.log('RFQ record created successfully:', rfq.id);

          await AuditService.safeCreate(tx, {
            action: 'RFQ_CREATED',
            module: 'Procurement',
            entity: 'RFQ',
            entityId: rfq.id,
            details: `Created RFQ ${rfq.rfqNumber}`,
          });
          console.log('Audit log created successfully.');

          return rfq;
        });
      } catch (error: any) {
        const isUniqueError = error?.code === 'P2002' || 
          error?.message?.includes('Unique constraint failed') ||
          error?.message?.includes('unique constraint') ||
          error?.message?.includes('rfqs_rfq_number_key');

        if (isUniqueError && attempt < maxAttempts - 1) {
          console.warn(`[RFQService] Unique constraint conflict on RFQ number. Retrying with next code (attempt ${attempt + 1}/${maxAttempts})...`);
          await new Promise((res) => setTimeout(res, 50 * (attempt + 1)));
          continue;
        }

        console.error('Error in RFQService.create:', error);
        throw error;
      }
    }
  }

  static async update(id: string, data: any, userName?: string) {
    const { materials, suppliers, ...rfqData } = data;

    const existingRfq = await prisma.rFQ.findUnique({ where: { id } });

    return prisma.$transaction(async (tx) => {
      if (materials) {
        await tx.rFQMaterial.deleteMany({ where: { rfqId: id } });
      }
      if (suppliers) {
        await tx.rFQSupplier.deleteMany({ where: { rfqId: id } });
      }

      const updated = await tx.rFQ.update({
        where: { id },
        data: {
          ...rfqData,
          materials: materials?.length ? { create: materials } : undefined,
          suppliers: suppliers?.length ? { create: suppliers } : undefined,
        },
        include: { materials: true, suppliers: true },
      });

      if (existingRfq && rfqData.status && existingRfq.status !== rfqData.status) {
        await AuditService.safeCreate(tx, {
          action: 'STATUS_CHANGE',
          module: 'Procurement',
          entity: 'RFQ',
          entityId: id,
          fieldName: 'status',
          oldValue: existingRfq.status,
          newValue: rfqData.status,
          user: userName || 'Administrator',
          details: `RFQ status changed from "${existingRfq.status}" to "${rfqData.status}"`,
        });
      } else if (existingRfq) {
        await AuditService.safeCreate(tx, {
          action: 'RFQ_UPDATED',
          module: 'Procurement',
          entity: 'RFQ',
          entityId: id,
          user: userName || 'Administrator',
          details: `Updated RFQ ${updated.rfqNumber}`,
        });
      }

      return updated;
    });
  }

  static async delete(id: string, userId?: string, userName?: string) {
    try {
      return await prisma.rFQ.update({ 
        where: { id }, 
        data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
      });
    } catch (error) {
      console.error('Error deleting RFQ:', error);
      throw error;
    }
  }
}
