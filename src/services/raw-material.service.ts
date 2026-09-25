import { prisma } from '../lib/prisma';
import { AuditService } from './audit.service';
import { createWithUniqueCode } from '../utils/code-generator';
import { 
  normalizeRawMaterialRow, 
  detectRawMaterialHeaders,
  HeaderDetectionResult
} from '../utils/import-normalization';

export interface NormalizedRawMaterialData {
  code: string;
  name: string;
  category: string;
  subCategory?: string;
  grade?: string;
  gsm?: number;
  thickness?: number;
  uom: string;
  hsnCode?: string;
  purchasePrice: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  supplierId?: string | null;
  supplierName?: string;
  warehouseId?: string | null;
  warehouseName?: string;
  description?: string;
  status: string;
}

export interface RawMaterialValidationItem {
  rowNumber: number;
  code: string;
  name: string;
  category: string;
  subCategory: string;
  uom: string;
  purchasePrice: number;
  grade?: string;
  gsm?: number;
  thickness?: number;
  hsnCode?: string;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  supplierName?: string;
  warehouseName?: string;
  description?: string;
  status: string;
  isValid: boolean;
  errors: string[];
  isDuplicateInDb: boolean;
  existingId?: string;
  normalizedData: NormalizedRawMaterialData;
  rawData: Record<string, any>;
}

export function normalizeRawMaterialInput(row: Record<string, any>, rowIndex = 0) {
  return normalizeRawMaterialRow(row, rowIndex);
}

export class RawMaterialService {
  static async getAll(query?: { search?: string; categoryId?: string; supplierId?: string; warehouseId?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 1000;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false, deletedAt: null };
    if (query?.categoryId) where.category = query.categoryId;
    if (query?.supplierId) where.supplierId = query.supplierId;
    if (query?.warehouseId) where.warehouseId = query.warehouseId;
    if (query?.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { grade: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
        { subCategory: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { hsnCode: { contains: searchTerm, mode: 'insensitive' } },
        { uom: { contains: searchTerm, mode: 'insensitive' } },
        { supplier: { supplierName: { contains: searchTerm, mode: 'insensitive' } } },
        { warehouse: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [materials, total] = await Promise.all([
      prisma.rawMaterial.findMany({
        where,
        include: {
          group: true,
          supplier: true,
          warehouse: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rawMaterial.count({ where }),
    ]);

    return { materials, total, page, limit };
  }

  static async getById(id: string) {
    return prisma.rawMaterial.findUnique({
      where: { id },
      include: {
        group: true,
        supplier: true,
        warehouse: true,
        stocks: {
          where: { isDeleted: false },
          include: { supplier: true, warehouse: true, bin: true, purchaseOrder: true },
          orderBy: { purchaseDate: 'desc' },
        },
        stockLevels: true,
        transactions: true,
      },
    });
  }

  static async create(data: any, userId?: string, userName?: string) {
    const { supplierId, warehouseId, ...rest } = data;
    delete rest.supplier;
    delete rest.warehouse;

    if (supplierId) {
       const supplierExists = await prisma.supplier.findUnique({ where: { id: supplierId } });
       if (!supplierExists) throw new Error('Supplier not found');
       rest.supplier = { connect: { id: supplierId } };
    }

    if (warehouseId) {
       const warehouseExists = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
       if (!warehouseExists) throw new Error('Warehouse not found');
       rest.warehouse = { connect: { id: warehouseId } };
    }

    const material = await createWithUniqueCode('rawMaterial', 'RM-', 'code', (code) => {
      return prisma.rawMaterial.create({ 
        data: {
          ...rest,
          code,
        },
        include: {
          supplier: true,
          warehouse: true,
          group: true
        }
      });
    });

    // Log creation
    await AuditService.logCreate('RawMaterial', material.id, material, userId, userName);

    return material;
  }

  static async update(id: string, data: any, userId?: string, userName?: string) {
    const oldMaterial = await prisma.rawMaterial.findUnique({ where: { id } });
    if (!oldMaterial) throw new Error('Raw Material not found');

    const { supplierId, warehouseId, ...rest } = data;
    delete rest.supplier;
    delete rest.warehouse;

    if (supplierId) {
      const supplierExists = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (!supplierExists) throw new Error('Supplier not found');
      rest.supplier = { connect: { id: supplierId } };
    }

    if (warehouseId) {
      const warehouseExists = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!warehouseExists) throw new Error('Warehouse not found');
      rest.warehouse = { connect: { id: warehouseId } };
    }

    const updatedMaterial = await prisma.rawMaterial.update({ 
      where: { id }, 
      data: rest,
      include: {
        supplier: true,
        warehouse: true,
        group: true
      }
    });

    // Log changes
    await AuditService.logChanges('RawMaterial', id, oldMaterial, updatedMaterial, userId, userName);

    return updatedMaterial;
  }

  static async delete(id: string, userId?: string, userName?: string) {
    const oldMaterial = await prisma.rawMaterial.findUnique({ where: { id } });
    if (!oldMaterial) throw new Error('Raw Material not found');

    const updatedMaterial = await prisma.rawMaterial.update({ 
      where: { id }, 
      data: { isDeleted: true, deletedAt: new Date(), deletedBy: userName || 'Administrator' } 
    });

    await AuditService.logChanges('RawMaterial', id, oldMaterial, updatedMaterial, userId, userName);
    return updatedMaterial;
  }

  /**
   * Bulk validate Raw Materials from uploaded Excel/CSV data.
   * Checks required business fields, category/subcategory master data, duplicates in batch & DB, and numeric validation.
   */
  static async bulkValidate(
    rows: any[],
    options: { duplicateHandling?: 'skip' | 'update' | 'stop' } = {}
  ) {
    const duplicateHandling = options.duplicateHandling || 'skip';

    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        total: 0,
        validCount: 0,
        invalidCount: 0,
        duplicateCount: 0,
        items: [],
        errors: [{ row: 0, reason: 'The uploaded file contains no rows or is empty.' }],
      };
    }

    // 1. Pre-fetch master data
    const [categories, suppliers, warehouses, existingMaterials] = await Promise.all([
      prisma.category.findMany({
        where: { isDeleted: false },
        include: {
          subCategories: { where: { isDeleted: false } },
        },
      }),
      prisma.supplier.findMany({ where: { isDeleted: false } }),
      prisma.warehouse.findMany({ where: { isDeleted: false } }),
      prisma.rawMaterial.findMany({
        where: { isDeleted: false },
        select: { id: true, code: true, name: true, category: true, subCategory: true, currentStock: true },
      }),
    ]);

    // Extract all unique headers present in the uploaded dataset
    const allHeaderKeys = Array.from(
      new Set(rows.flatMap(r => (typeof r === 'object' && r ? Object.keys(r) : [])))
    );
    const headerDetection = detectRawMaterialHeaders(allHeaderKeys);

    // Fast lookup maps (normalized lowercase)
    const catMap = new Map<string, { cat: any; subMap: Map<string, any> }>();
    const allSubsMap = new Map<string, { sub: any; cat: any }>();

    for (const c of categories) {
      const subMap = new Map<string, any>();
      if (c.subCategories) {
        for (const sub of c.subCategories) {
          subMap.set(sub.name.trim().toLowerCase(), sub);
          if (sub.code) subMap.set(sub.code.trim().toLowerCase(), sub);
          allSubsMap.set(sub.name.trim().toLowerCase(), { sub, cat: c });
        }
      }
      catMap.set(c.name.trim().toLowerCase(), { cat: c, subMap });
      if (c.code) catMap.set(c.code.trim().toLowerCase(), { cat: c, subMap });
    }

    const supplierMap = new Map<string, any>();
    for (const s of suppliers) {
      if (s.supplierName) supplierMap.set(s.supplierName.trim().toLowerCase(), s);
      if (s.millName) supplierMap.set(s.millName.trim().toLowerCase(), s);
      if (s.supplierName && s.millName) {
        supplierMap.set(`${s.supplierName} - ${s.millName}`.trim().toLowerCase(), s);
      }
    }

    const warehouseMap = new Map<string, any>();
    for (const w of warehouses) {
      if (w.name) warehouseMap.set(w.name.trim().toLowerCase(), w);
      if (w.code) warehouseMap.set(w.code.trim().toLowerCase(), w);
    }

    const existingCodeMap = new Map<string, any>();
    for (const m of existingMaterials) {
      if (m.code) existingCodeMap.set(m.code.trim().toLowerCase(), m);
    }

    const seenCodesInBatch = new Set<string>();
    const items: RawMaterialValidationItem[] = [];

    for (let index = 0; index < rows.length; index++) {
      const rawRow = rows[index];
      const rowNumber = index + 2; // Row number in typical Excel (1-indexed + header row)
      const errors: string[] = [];
      const norm = normalizeRawMaterialInput(rawRow, index);

      // Validate Material Code (generate default if omitted in sheet)
      const code = norm.code ? String(norm.code).trim() : `RM-${1000 + index + 1}`;

      // Validate Material Name
      const name = norm.name ? String(norm.name).trim() : '';
      if (!name) {
        errors.push(`Row ${rowNumber}: Name/Material Name is required.`);
      }

      // Check duplicates in uploaded batch
      if (code) {
        const lowerCode = code.toLowerCase();
        if (seenCodesInBatch.has(lowerCode)) {
          errors.push(`Row ${rowNumber}: Duplicate material code ${code} in uploaded file.`);
        } else {
          seenCodesInBatch.add(lowerCode);
        }
      }

      // Check duplicates in database
      let isDuplicateInDb = false;
      let existingRecord: any = null;
      if (code) {
        existingRecord = existingCodeMap.get(code.toLowerCase());
        if (existingRecord) {
          isDuplicateInDb = true;
          if (duplicateHandling === 'stop') {
            errors.push(`Row ${rowNumber}: Material Code ${code} already exists in database.`);
          }
        }
      }

      // Resolve Category and Subcategory
      let resolvedCategory = '';
      let resolvedSubcategory = '';

      if (norm.category) {
        const rawCatStr = String(norm.category).trim();
        const catEntry = catMap.get(rawCatStr.toLowerCase());
        if (catEntry) {
          resolvedCategory = catEntry.cat.name;
          if (norm.subCategory) {
            const rawSubStr = String(norm.subCategory).trim();
            const matchedSub = catEntry.subMap.get(rawSubStr.toLowerCase());
            resolvedSubcategory = matchedSub ? matchedSub.name : rawSubStr;
          }
        } else {
          // Check fuzzy matching or accept raw category name
          const fuzzyCat = categories.find(c => 
            c.name.toLowerCase().includes(rawCatStr.toLowerCase()) || 
            rawCatStr.toLowerCase().includes(c.name.toLowerCase())
          );
          if (fuzzyCat) {
            resolvedCategory = fuzzyCat.name;
            resolvedSubcategory = norm.subCategory ? String(norm.subCategory).trim() : '';
          } else {
            // Accept the category as-is
            resolvedCategory = rawCatStr;
            resolvedSubcategory = norm.subCategory ? String(norm.subCategory).trim() : '';
          }
        }
      } else if (norm.subCategory) {
        // Infer category from subcategory if possible
        const rawSubStr = String(norm.subCategory).trim();
        const subEntry = allSubsMap.get(rawSubStr.toLowerCase());
        if (subEntry) {
          resolvedCategory = subEntry.cat.name;
          resolvedSubcategory = subEntry.sub.name;
        } else {
          const firstRawCat = categories.find(c => c.type === 'Raw Material' || !c.type);
          resolvedCategory = firstRawCat ? firstRawCat.name : 'Printing Inks';
          resolvedSubcategory = rawSubStr;
        }
      } else {
        // If neither is provided, check if default categories exist
        const firstRawCat = categories.find(c => c.type === 'Raw Material' || !c.type);
        if (firstRawCat) {
          resolvedCategory = firstRawCat.name;
        } else if (categories.length > 0) {
          resolvedCategory = categories[0].name;
        } else {
          resolvedCategory = 'Printing Inks';
        }
      }

      // Validate Numeric Fields
      let purchasePrice = 0;
      if (norm.purchasePrice !== undefined && norm.purchasePrice !== null) {
        const parsed = Number(norm.purchasePrice);
        if (isNaN(parsed) || parsed < 0) {
          errors.push(`Row ${rowNumber}: Purchase Price must be a valid number.`);
        } else {
          purchasePrice = parsed;
        }
      }

      let gsm: number | undefined = undefined;
      if (norm.gsm !== undefined && norm.gsm !== null) {
        const parsed = Number(norm.gsm);
        if (isNaN(parsed) || parsed < 0) {
          errors.push(`Row ${rowNumber}: GSM must be a valid number.`);
        } else {
          gsm = parsed;
        }
      }

      let thickness: number | undefined = undefined;
      if (norm.thickness !== undefined && norm.thickness !== null) {
        const parsed = Number(norm.thickness);
        if (isNaN(parsed) || parsed < 0) {
          errors.push(`Row ${rowNumber}: Thickness must be a valid number.`);
        } else {
          thickness = parsed;
        }
      }

      let minStock = 0;
      if (norm.minStock !== undefined && norm.minStock !== null) {
        const parsed = Number(norm.minStock);
        if (isNaN(parsed) || parsed < 0) {
          errors.push(`Row ${rowNumber}: Min Stock must be a valid number.`);
        } else {
          minStock = parsed;
        }
      }

      let maxStock = 0;
      if (norm.maxStock !== undefined && norm.maxStock !== null) {
        const parsed = Number(norm.maxStock);
        if (isNaN(parsed) || parsed < 0) {
          errors.push(`Row ${rowNumber}: Max Stock must be a valid number.`);
        } else {
          maxStock = parsed;
        }
      }

      let reorderLevel = 0;
      if (norm.reorderLevel !== undefined && norm.reorderLevel !== null) {
        const parsed = Number(norm.reorderLevel);
        if (isNaN(parsed) || parsed < 0) {
          errors.push(`Row ${rowNumber}: Reorder Level must be a valid number.`);
        } else {
          reorderLevel = parsed;
        }
      }

      // Resolve Supplier
      let supplierId: string | null = null;
      let resolvedSupplierName: string | undefined = undefined;
      if (norm.supplierName) {
        const sup = supplierMap.get(String(norm.supplierName).trim().toLowerCase());
        if (sup) {
          supplierId = sup.id;
          resolvedSupplierName = sup.supplierName;
        }
      }

      // Resolve Warehouse
      let warehouseId: string | null = null;
      let resolvedWarehouseName: string | undefined = undefined;
      if (norm.warehouseName) {
        const wh = warehouseMap.get(String(norm.warehouseName).trim().toLowerCase());
        if (wh) {
          warehouseId = wh.id;
          resolvedWarehouseName = wh.name;
        }
      }

      // Default warehouse if none matched
      if (!warehouseId && warehouses.length > 0) {
        warehouseId = warehouses[0].id;
        resolvedWarehouseName = warehouses[0].name;
      }

      const uom = norm.uom ? String(norm.uom).trim() : 'Kg';
      const grade = norm.grade ? String(norm.grade).trim() : 'Standard';
      const hsnCode = norm.hsnCode ? String(norm.hsnCode).trim() : '';
      const description = norm.description ? String(norm.description).trim() : '';
      const status = norm.status ? String(norm.status).trim() : 'Active';

      const isValid = errors.length === 0;

      const normalizedData: NormalizedRawMaterialData = {
        code,
        name,
        category: resolvedCategory,
        subCategory: resolvedSubcategory,
        grade,
        gsm: gsm ?? 0,
        thickness: thickness ?? 0,
        uom,
        hsnCode,
        purchasePrice,
        minStock,
        maxStock,
        reorderLevel,
        supplierId,
        supplierName: resolvedSupplierName,
        warehouseId,
        warehouseName: resolvedWarehouseName,
        description,
        status,
      };

      items.push({
        rowNumber,
        code,
        name,
        category: resolvedCategory,
        subCategory: resolvedSubcategory,
        uom,
        purchasePrice,
        grade,
        gsm,
        thickness,
        hsnCode,
        minStock,
        maxStock,
        reorderLevel,
        supplierName: resolvedSupplierName,
        warehouseName: resolvedWarehouseName,
        description,
        status,
        isValid,
        errors,
        isDuplicateInDb,
        existingId: existingRecord?.id,
        normalizedData,
        rawData: rawRow,
      });
    }

    const validCount = items.filter(i => i.isValid && (!i.isDuplicateInDb || duplicateHandling !== 'stop')).length;
    const invalidCount = items.filter(i => !i.isValid || (i.isDuplicateInDb && duplicateHandling === 'stop')).length;
    const duplicateCount = items.filter(i => i.isDuplicateInDb).length;

    const allErrors = items.flatMap(item =>
      item.errors.map(reason => ({
        row: item.rowNumber,
        code: item.code,
        name: item.name,
        reason,
      }))
    );

    return {
      total: items.length,
      validCount,
      invalidCount,
      duplicateCount,
      detectedHeaders: headerDetection.detectedHeaders,
      mappings: headerDetection.mappings,
      unmappedHeaders: headerDetection.unmappedHeaders,
      hasNameColumn: headerDetection.hasNameColumn,
      hasCodeColumn: headerDetection.hasCodeColumn,
      items,
      errors: allErrors,
    };
  }

  /**
   * Bulk import Raw Materials with database transaction safety and stock protection.
   * New materials are always created with currentStock = 0.
   */
  static async bulkImport(
    rows: any[],
    options: { duplicateHandling?: 'skip' | 'update' | 'stop' } = {},
    userId?: string,
    userName?: string
  ) {
    const { duplicateHandling = 'skip' } = options;
    const validation = await this.bulkValidate(rows, { duplicateHandling });

    if (duplicateHandling === 'stop' && validation.invalidCount > 0) {
      throw new Error(`Import aborted: ${validation.errors[0]?.reason || 'Validation errors encountered'}`);
    }

    const itemsToProcess = validation.items.filter(i => i.isValid);
    if (itemsToProcess.length === 0) {
      return {
        total: rows.length,
        imported: 0,
        updated: 0,
        skipped: validation.duplicateCount,
        failed: validation.invalidCount,
        errors: validation.errors,
      };
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const runtimeErrors: { row: number; code?: string; name?: string; reason: string }[] = [...validation.errors];

    await prisma.$transaction(async (tx) => {
      // 1. Ensure a default warehouse exists if none is linked
      let defaultWarehouse = await tx.warehouse.findFirst({ where: { isDeleted: false } });
      if (!defaultWarehouse) {
        defaultWarehouse = await tx.warehouse.create({
          data: {
            code: 'WH-MAIN',
            name: 'Main Plant Warehouse',
            location: 'Manufacturing Facility - Bay 1',
            status: 'Operational',
          },
        });
      }

      // 2. Pre-fetch existing suppliers into memory map to avoid repeated round trips
      const existingSuppliers = await tx.supplier.findMany({ where: { isDeleted: false } });
      const supplierMap = new Map<string, string>(); // lowercase name -> id
      existingSuppliers.forEach(s => {
        if (s.supplierName) supplierMap.set(s.supplierName.toLowerCase().trim(), s.id);
        if (s.millName) supplierMap.set(s.millName.toLowerCase().trim(), s.id);
      });

      for (const item of itemsToProcess) {
        try {
          const d = item.normalizedData;

          // Resolve or auto-create supplier with in-memory caching
          let resolvedSupplierId = d.supplierId;
          if (!resolvedSupplierId && d.supplierName) {
            const cleanSupName = d.supplierName.trim();
            const supKey = cleanSupName.toLowerCase();
            
            if (supplierMap.has(supKey)) {
              resolvedSupplierId = supplierMap.get(supKey);
            } else {
              const newSup = await tx.supplier.create({
                data: {
                  supplierName: cleanSupName,
                  millName: cleanSupName,
                  category: d.category || 'Printing Inks & Chemicals',
                },
              });
              resolvedSupplierId = newSup.id;
              supplierMap.set(supKey, newSup.id);
            }
          }

          const resolvedWarehouseId = d.warehouseId || defaultWarehouse?.id || null;

          if (item.isDuplicateInDb) {
            if (duplicateHandling === 'skip') {
              skipped++;
              continue;
            } else if (duplicateHandling === 'update' && item.existingId) {
              // Update existing record without modifying currentStock
              await tx.rawMaterial.update({
                where: { id: item.existingId },
                data: {
                  name: d.name,
                  category: d.category,
                  subCategory: d.subCategory,
                  grade: d.grade,
                  gsm: d.gsm,
                  thickness: d.thickness,
                  uom: d.uom,
                  hsnCode: d.hsnCode || null,
                  purchasePrice: d.purchasePrice,
                  minStock: d.minStock,
                  maxStock: d.maxStock,
                  reorderLevel: d.reorderLevel,
                  supplierId: resolvedSupplierId || null,
                  warehouseId: resolvedWarehouseId,
                  description: d.description || null,
                  status: d.status,
                  // NOTE: currentStock is intentionally untouched to preserve inventory integrity!
                },
              });
              updated++;
              imported++;
              continue;
            }
          }

          // Create new Raw Material with currentStock = 0
          await tx.rawMaterial.create({
            data: {
              code: d.code,
              name: d.name,
              category: d.category,
              subCategory: d.subCategory,
              grade: d.grade,
              gsm: d.gsm,
              thickness: d.thickness,
              uom: d.uom,
              hsnCode: d.hsnCode || null,
              purchasePrice: d.purchasePrice,
              currentStock: 0, // ALWAYS 0 for newly imported raw materials!
              minStock: d.minStock,
              maxStock: d.maxStock,
              reorderLevel: d.reorderLevel,
              supplierId: resolvedSupplierId || null,
              warehouseId: resolvedWarehouseId,
              description: d.description || null,
              status: d.status,
            },
          });
          imported++;
        } catch (err: any) {
          failed++;
          runtimeErrors.push({
            row: item.rowNumber,
            code: item.code,
            name: item.name,
            reason: err.message || 'Database error during record insertion',
          });
          if (duplicateHandling === 'stop') {
            throw err;
          }
        }
      }

      await AuditService.logAction(
        'BulkImport',
        'raw_materials',
        'bulk-import-batch',
        `Bulk imported ${imported} raw materials (${updated} updated, ${skipped} skipped, ${failed} failed)`,
        userId,
        userName || 'Administrator'
      );
    }, {
      maxWait: 20000,
      timeout: 60000,
    });

    return {
      total: rows.length,
      imported,
      updated,
      skipped,
      failed,
      errors: runtimeErrors,
    };
  }
}

