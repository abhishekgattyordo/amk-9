import { prisma } from '../lib/prisma';
import { createWithUniqueCode } from '../utils/code-generator';

export class SupplierService {
  static async getAll(query?: { search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.search) {
      where.OR = [
        { supplierName: { contains: query.search, mode: 'insensitive' } },
        { millName: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          rawMaterials: true,
          categories: true,
          subCategories: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    return { suppliers, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
      include: { 
        quotations: true, 
        purchaseOrders: true, 
        rawMaterials: true,
        categories: true,
        subCategories: true,
      },
    });
  }

  static async create(data: any) {
    const { categoryIds, subCategoryIds, ...rest } = data;
    return createWithUniqueCode('supplier', 'SUP-', 'supplierCode', (supplierCode) => {
      return prisma.supplier.create({ 
        data: {
          ...rest,
          supplierCode,
          categories: categoryIds ? { connect: categoryIds.map((id: string) => ({ id })) } : undefined,
          subCategories: subCategoryIds ? { connect: subCategoryIds.map((id: string) => ({ id })) } : undefined,
        },
        include: { categories: true, subCategories: true }
      });
    });
  }

  static async findDuplicate(supplierName: string, millName: string, category?: string) {
    if (!supplierName || !millName) return null;
    return prisma.supplier.findFirst({
      where: {
        isDeleted: false, deletedAt: null,
        supplierName: { equals: supplierName, mode: 'insensitive' },
        millName: { equals: millName, mode: 'insensitive' },
        ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
      },
    });
  }

  static async update(id: string, data: any) {
    const { categoryIds, subCategoryIds, ...rest } = data;
    return prisma.supplier.update({ 
      where: { id }, 
      data: {
        ...rest,
        categories: categoryIds ? { set: categoryIds.map((id: string) => ({ id })) } : undefined,
        subCategories: subCategoryIds ? { set: subCategoryIds.map((id: string) => ({ id })) } : undefined,
      },
      include: { categories: true, subCategories: true }
    });
  }

  static async delete(id: string, userId?: string, userName?: string) {
    return prisma.supplier.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
    });
  }
}
