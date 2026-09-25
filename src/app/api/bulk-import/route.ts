import { NextRequest } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { successResponse, errorResponse } from '../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../middleware/auth.middleware';
import { AuditService } from '../../../services/audit.service';
import { RawMaterialService } from '../../../services/raw-material.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    const body = await req.json();
    const { module, rows, action = 'import', duplicateHandling = 'skip' } = body;

    if (!module || !Array.isArray(rows)) {
      return errorResponse('Module and rows array are required', 400);
    }

    let permissionRequired = '';
    if (module === 'suppliers') permissionRequired = 'suppliers:write';
    else if (module === 'raw_materials') permissionRequired = 'inventory:write';
    else if (module === 'products') permissionRequired = 'inventory:write';

    if (permissionRequired && !hasApiPermission(user, permissionRequired) && user?.role !== 'Administrator') {
      return errorResponse('Forbidden: Insufficient permissions for bulk import', 403);
    }

    // 1. Raw Materials Module - Delegate to RawMaterialService
    if (module === 'raw_materials') {
      if (action === 'validate') {
        const validation = await RawMaterialService.bulkValidate(rows, { duplicateHandling });
        return successResponse(validation);
      } else {
        const result = await RawMaterialService.bulkImport(
          rows,
          { duplicateHandling },
          user?.id,
          user?.name || 'Administrator'
        );
        return successResponse(result);
      }
    }

    // 2. Suppliers Module
    if (module === 'suppliers') {
      if (action === 'validate') {
        const existingSuppliers = await prisma.supplier.findMany({ where: { isDeleted: false } });
        const existingNames = new Set(
          existingSuppliers.map(s => `${s.supplierName}::${s.millName || s.supplierName}`.toLowerCase().trim())
        );
        const seenInBatch = new Set<string>();

        const items = rows.map((r: any, idx: number) => {
          const rowNumber = idx + 2;
          const errors: string[] = [];
          const supplierName = (r.supplierName || r.name || r.SupplierName || r.Supplier || r['Supplier Name'] || '').toString().trim();
          const millName = (r.millName || r.MillName || r['Mill Name'] || supplierName).toString().trim();
          const category = (r.category || r.Category || 'Kraft Paper & Reels').toString().trim();

          if (!supplierName) {
            errors.push(`Row ${rowNumber}: Supplier Name is required.`);
          }

          const key = `${supplierName}::${millName}`.toLowerCase().trim();
          if (supplierName) {
            if (seenInBatch.has(key)) {
              errors.push(`Row ${rowNumber}: Duplicate supplier "${supplierName}" in file.`);
            } else {
              seenInBatch.add(key);
            }
          }

          const isDuplicateInDb = supplierName ? existingNames.has(key) : false;
          if (isDuplicateInDb && duplicateHandling === 'stop') {
            errors.push(`Row ${rowNumber}: Supplier "${supplierName}" already exists in database.`);
          }

          return {
            rowNumber,
            supplierName,
            millName,
            category,
            isValid: errors.length === 0,
            errors,
            isDuplicateInDb,
            rawData: r,
          };
        });

        return successResponse({
          total: items.length,
          validCount: items.filter(i => i.isValid).length,
          invalidCount: items.filter(i => !i.isValid).length,
          duplicateCount: items.filter(i => i.isDuplicateInDb).length,
          items,
          errors: items.flatMap(i => i.errors.map(err => ({ row: i.rowNumber, reason: err }))),
        });
      }

      // Execute Suppliers Import
      let imported = 0;
      let skipped = 0;
      let failed = 0;
      const errors: { row: number; data: any; reason: string }[] = [];

      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < rows.length; i++) {
          const rowNum = i + 2;
          const r = rows[i];
          try {
            const supplierName = (r.supplierName || r.name || r.SupplierName || r.Supplier || r['Supplier Name'] || '').toString().trim();
            const millName = (r.millName || r.MillName || r['Mill Name'] || supplierName).toString().trim();
            const category = (r.category || r.Category || 'Kraft Paper & Reels').toString().trim();

            if (!supplierName) {
              failed++;
              errors.push({ row: rowNum, data: r, reason: 'Supplier Name is required' });
              continue;
            }

            const existing = await tx.supplier.findFirst({
              where: {
                isDeleted: false,
                supplierName: { equals: supplierName, mode: 'insensitive' },
                millName: { equals: millName, mode: 'insensitive' },
              },
            });

            if (existing) {
              if (duplicateHandling === 'stop') {
                throw new Error(`Duplicate supplier found: ${supplierName} (${millName}) at row ${rowNum}`);
              } else if (duplicateHandling === 'skip') {
                skipped++;
                continue;
              } else if (duplicateHandling === 'update') {
                await tx.supplier.update({
                  where: { id: existing.id },
                  data: {
                    category: category || existing.category,
                  },
                });
                imported++;
                continue;
              }
            }

            await tx.supplier.create({
              data: {
                supplierName,
                millName,
                category,
              },
            });
            imported++;
          } catch (rowErr: any) {
            failed++;
            errors.push({ row: rowNum, data: r, reason: rowErr.message || 'Unknown error' });
          }
        }

        await AuditService.logAction(
          'BulkImport',
          'suppliers',
          'bulk-import-batch',
          `Imported ${imported} suppliers (${skipped} skipped, ${failed} failed)`,
          user?.id,
          user?.name || 'Administrator'
        );
      }, {
        maxWait: 20000,
        timeout: 60000,
      });

      return successResponse({
        total: rows.length,
        imported,
        skipped,
        failed,
        errors,
      });
    }

    // 3. Products Module
    if (module === 'products') {
      const [warehousesList] = await Promise.all([prisma.warehouse.findMany()]);
      const warehouseMap = new Map<string, string>();
      warehousesList.forEach(w => {
        warehouseMap.set(w.name.toLowerCase().trim(), w.id);
        if (w.code) warehouseMap.set(w.code.toLowerCase().trim(), w.id);
      });

      if (action === 'validate') {
        const existingProducts = await prisma.product.findMany({
          where: { isDeleted: false },
          select: { id: true, code: true, name: true },
        });
        const existingCodes = new Set(existingProducts.map(p => p.code.toLowerCase().trim()));
        const seenInBatch = new Set<string>();

        const items = rows.map((r: any, idx: number) => {
          const rowNumber = idx + 2;
          const errors: string[] = [];
          const code = (r.code || r.ProductCode || r['Product Code'] || r.ItemCode || r['Item Code'] || '').toString().trim();
          const name = (r.name || r.ProductName || r['Product Name'] || r.ItemName || r['Item Name'] || '').toString().trim();
          const category = (r.category || r.Category || 'Cartons').toString().trim();
          const subCategory = (r.subCategory || r.SubCategory || r['Sub Category'] || 'RSC').toString().trim();
          const boxType = (r.boxType || r.BoxType || r['Box Type'] || 'RSC (Regular Slotted Carton)').toString().trim();
          const dimensions = (r.dimensions || r.Dimensions || '400 x 300 x 250 mm').toString().trim();
          const sellingPrice = Number(r.sellingPrice || r.SellingPrice || r['Selling Price'] || r.price || 0);

          if (!name) {
            errors.push(`Row ${rowNumber}: Product Name is required.`);
          }

          if (code) {
            const lower = code.toLowerCase();
            if (seenInBatch.has(lower)) {
              errors.push(`Row ${rowNumber}: Duplicate product code "${code}" in file.`);
            } else {
              seenInBatch.add(lower);
            }
          }

          const isDuplicateInDb = code ? existingCodes.has(code.toLowerCase()) : false;
          if (isDuplicateInDb && duplicateHandling === 'stop') {
            errors.push(`Row ${rowNumber}: Product Code "${code}" already exists in database.`);
          }

          return {
            rowNumber,
            code: code || '(Auto-generated)',
            name,
            category,
            subCategory,
            boxType,
            dimensions,
            sellingPrice,
            isValid: errors.length === 0,
            errors,
            isDuplicateInDb,
            rawData: r,
          };
        });

        return successResponse({
          total: items.length,
          validCount: items.filter(i => i.isValid).length,
          invalidCount: items.filter(i => !i.isValid).length,
          duplicateCount: items.filter(i => i.isDuplicateInDb).length,
          items,
          errors: items.flatMap(i => i.errors.map(err => ({ row: i.rowNumber, reason: err }))),
        });
      }

      // Execute Products Import
      let imported = 0;
      let skipped = 0;
      let failed = 0;
      const errors: { row: number; data: any; reason: string }[] = [];

      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < rows.length; i++) {
          const rowNum = i + 2;
          const r = rows[i];
          try {
            const code = (r.code || r.ProductCode || r['Product Code'] || r.ItemCode || `PRD-${Date.now().toString().slice(-5)}${i}`).toString().trim();
            const name = (r.name || r.ProductName || r['Product Name'] || r.ItemName || '').toString().trim();

            if (!name) {
              failed++;
              errors.push({ row: rowNum, data: r, reason: 'Product Name is required' });
              continue;
            }

            let warehouseId = r.warehouseId;
            const whNameKey = (r.warehouseName || r.Warehouse || r['Warehouse Name'] || '').toString().toLowerCase().trim();
            if (!warehouseId && whNameKey && warehouseMap.has(whNameKey)) {
              warehouseId = warehouseMap.get(whNameKey);
            }
            if (!warehouseId && warehousesList.length > 0) {
              warehouseId = warehousesList[0].id;
            }

            const existing = await tx.product.findFirst({
              where: { isDeleted: false, code: { equals: code, mode: 'insensitive' } },
            });

            if (existing) {
              if (duplicateHandling === 'stop') {
                throw new Error(`Duplicate product code found: ${code} at row ${rowNum}`);
              } else if (duplicateHandling === 'skip') {
                skipped++;
                continue;
              } else if (duplicateHandling === 'update') {
                await tx.product.update({
                  where: { id: existing.id },
                  data: {
                    name,
                    category: r.category || existing.category,
                    subCategory: r.subCategory || existing.subCategory,
                    boxType: r.boxType || existing.boxType,
                    dimensions: r.dimensions || existing.dimensions,
                    gsm: Number(r.gsm || existing.gsm || 0),
                    unit: r.unit || r.uom || existing.unit || 'Pcs',
                    hsnCode: r.hsnCode || existing.hsnCode,
                    costPrice: Number(r.costPrice || existing.costPrice || 0),
                    sellingPrice: Number(r.sellingPrice || existing.sellingPrice || 0),
                    warehouseId: warehouseId || existing.warehouseId,
                  },
                });
                imported++;
                continue;
              }
            }

            await tx.product.create({
              data: {
                code,
                name,
                category: r.category || 'Cartons',
                subCategory: r.subCategory || 'RSC',
                boxType: r.boxType || 'RSC (Regular Slotted Carton)',
                dimensions: r.dimensions || '400 x 300 x 250 mm',
                gsm: Number(r.gsm || 250),
                unit: r.unit || r.uom || 'Pcs',
                hsnCode: r.hsnCode || '48191010',
                costPrice: Number(r.costPrice || 0),
                sellingPrice: Number(r.sellingPrice || 0),
                availableStock: 0, // Stock safe default
                warehouseId: warehouseId || null,
                specifications: r.specifications || r.description || '',
              },
            });
            imported++;
          } catch (rowErr: any) {
            failed++;
            errors.push({ row: rowNum, data: r, reason: rowErr.message || 'Unknown error' });
          }
        }

        await AuditService.logAction(
          'BulkImport',
          'products',
          'bulk-import-batch',
          `Imported ${imported} products (${skipped} skipped, ${failed} failed)`,
          user?.id,
          user?.name || 'Administrator'
        );
      }, {
        maxWait: 20000,
        timeout: 60000,
      });

      return successResponse({
        total: rows.length,
        imported,
        skipped,
        failed,
        errors,
      });
    }

    // 4. Warehouses Module
    if (module === 'warehouses') {
      let imported = 0;
      let skipped = 0;
      let failed = 0;
      const errors: { row: number; data: any; reason: string }[] = [];

      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < rows.length; i++) {
          const rowNum = i + 2;
          const r = rows[i];
          try {
            const code = (r.code || r.WarehouseCode || r['Warehouse Code'] || `WH-${Date.now().toString().slice(-4)}${i}`).toString().trim();
            const name = (r.name || r.warehouseName || r.WarehouseName || r['Warehouse Name'] || '').toString().trim();
            const location = (r.location || r.Location || 'Plant Floor').toString().trim();
            const manager = (r.manager || r.Manager || '').toString().trim();

            if (!name) {
              failed++;
              errors.push({ row: rowNum, data: r, reason: 'Warehouse Name is required' });
              continue;
            }

            const existing = await tx.warehouse.findFirst({
              where: {
                isDeleted: false,
                OR: [
                  { code: { equals: code, mode: 'insensitive' } },
                  { name: { equals: name, mode: 'insensitive' } }
                ]
              }
            });

            if (existing) {
              if (duplicateHandling === 'stop') {
                throw new Error(`Duplicate warehouse found: ${name} (${code}) at row ${rowNum}`);
              } else if (duplicateHandling === 'skip') {
                skipped++;
                continue;
              } else if (duplicateHandling === 'update') {
                await tx.warehouse.update({
                  where: { id: existing.id },
                  data: {
                    location,
                    manager: manager || existing.manager,
                    capacitySqFt: Number(r.capacitySqFt || existing.capacitySqFt || 0),
                  }
                });
                imported++;
                continue;
              }
            }

            await tx.warehouse.create({
              data: {
                code,
                name,
                location,
                manager: manager || null,
                capacitySqFt: Number(r.capacitySqFt || 10000),
                status: r.status || 'Operational',
              }
            });
            imported++;
          } catch (rowErr: any) {
            failed++;
            errors.push({ row: rowNum, data: r, reason: rowErr.message || 'Unknown error' });
          }
        }

        await AuditService.logAction(
          'BulkImport',
          'warehouses',
          'bulk-import-batch',
          `Imported ${imported} warehouses (${skipped} skipped, ${failed} failed)`,
          user?.id,
          user?.name || 'Administrator'
        );
      }, {
        maxWait: 20000,
        timeout: 60000,
      });

      return successResponse({
        total: rows.length,
        imported,
        skipped,
        failed,
        errors,
      });
    }

    // 5. Categories Module
    if (module === 'categories') {
      let imported = 0;
      let skipped = 0;
      let failed = 0;
      const errors: { row: number; data: any; reason: string }[] = [];

      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < rows.length; i++) {
          const rowNum = i + 2;
          const r = rows[i];
          try {
            const code = (r.code || r.CategoryCode || r['Category Code'] || `CAT-${Date.now().toString().slice(-4)}${i}`).toString().trim();
            const name = (r.name || r.categoryName || r.CategoryName || r['Category Name'] || '').toString().trim();
            const type = (r.type || r.Type || 'Raw Material').toString().trim();
            const description = (r.description || r.Description || '').toString().trim();

            if (!name) {
              failed++;
              errors.push({ row: rowNum, data: r, reason: 'Category Name is required' });
              continue;
            }

            const existing = await tx.category.findFirst({
              where: {
                isDeleted: false,
                name: { equals: name, mode: 'insensitive' }
              }
            });

            if (existing) {
              if (duplicateHandling === 'stop') {
                throw new Error(`Duplicate category found: ${name} at row ${rowNum}`);
              } else if (duplicateHandling === 'skip') {
                skipped++;
                continue;
              } else if (duplicateHandling === 'update') {
                await tx.category.update({
                  where: { id: existing.id },
                  data: {
                    type,
                    description: description || existing.description,
                  }
                });
                imported++;
                continue;
              }
            }

            await tx.category.create({
              data: {
                code,
                name,
                type,
                description,
                status: 'Active',
              }
            });
            imported++;
          } catch (rowErr: any) {
            failed++;
            errors.push({ row: rowNum, data: r, reason: rowErr.message || 'Unknown error' });
          }
        }

        await AuditService.logAction(
          'BulkImport',
          'categories',
          'bulk-import-batch',
          `Imported ${imported} categories (${skipped} skipped, ${failed} failed)`,
          user?.id,
          user?.name || 'Administrator'
        );
      }, {
        maxWait: 20000,
        timeout: 60000,
      });

      return successResponse({
        total: rows.length,
        imported,
        skipped,
        failed,
        errors,
      });
    }

    return errorResponse(`Unsupported module: ${module}`, 400);
  } catch (err: any) {
    console.error('Bulk import error:', err);
    return errorResponse(err.message || 'Internal Server Error', 500);
  }
}

