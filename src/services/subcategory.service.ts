import { prisma } from '../lib/prisma';
import { createWithUniqueCode } from '../utils/code-generator';

export class SubcategoryService {
  static async getAll(query?: { categoryId?: string; search?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (query?.categoryId && query.categoryId !== 'all') {
      where.categoryId = query.categoryId;
    }
    if (query?.search && query.search.trim()) {
      where.OR = [
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
        { code: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    try {
      const [subcategories, total] = await Promise.all([
        prisma.subCategory.findMany({
          where,
          include: { category: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.subCategory.count({ where }),
      ]);

      return { subcategories, total, page, limit };
    } catch (err: any) {
      console.warn('Error fetching subcategories:', err.message);
      return { subcategories: [], total: 0, page, limit };
    }
  }

  static async getById(id: string) {
    return prisma.subCategory.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  static async create(data: any) {
    return createWithUniqueCode('subCategory', 'SUB-', 'code', (code) => {
      return prisma.subCategory.create({
        data: {
          ...data,
          code,
        },
      });
    });
  }

  static async update(id: string, data: any) {
    return prisma.subCategory.update({ where: { id }, data });
  }

  static async delete(id: string, userId?: string, userName?: string) {
    return prisma.subCategory.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
    });
  }
}
