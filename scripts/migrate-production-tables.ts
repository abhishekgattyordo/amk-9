import { getPrisma } from '../src/lib/prisma';

async function migrate() {
  const prisma = getPrisma();
  console.log('🚀 Starting Production & Planning database migration...');

  // 1. Create bills_of_material
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "bills_of_material" (
      "id" TEXT PRIMARY KEY,
      "bom_number" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
      "flute_type" TEXT,
      "ply" INTEGER NOT NULL DEFAULT 5,
      "deckle_size_mm" DOUBLE PRECISION,
      "cut_size_mm" DOUBLE PRECISION,
      "total_weight_grams" DOUBLE PRECISION,
      "estimated_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'Active',
      "notes" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "deleted_at" TIMESTAMP(3),
      "is_deleted" BOOLEAN NOT NULL DEFAULT false,
      "deleted_by" TEXT
    );
  `);
  console.log('✔ bills_of_material table verified.');

  // 2. Create bom_items
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "bom_items" (
      "id" TEXT PRIMARY KEY,
      "bom_id" TEXT NOT NULL REFERENCES "bills_of_material"("id") ON DELETE CASCADE,
      "layer" TEXT NOT NULL,
      "material_id" TEXT REFERENCES "raw_materials"("id") ON DELETE SET NULL,
      "material_code" TEXT,
      "material_name" TEXT NOT NULL,
      "gsm" DOUBLE PRECISION,
      "quantity_per_unit" DOUBLE PRECISION NOT NULL,
      "unit" TEXT NOT NULL DEFAULT 'Kg',
      "unit_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "total_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✔ bom_items table verified.');

  // 3. Create machines
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "machines" (
      "id" TEXT PRIMARY KEY,
      "code" TEXT UNIQUE NOT NULL,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "line" TEXT NOT NULL,
      "capacity_per_hour" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "unit" TEXT NOT NULL DEFAULT 'Sheets/Hr',
      "status" TEXT NOT NULL DEFAULT 'Available',
      "operator" TEXT,
      "last_maintenance_date" TEXT,
      "next_maintenance_date" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "deleted_at" TIMESTAMP(3),
      "is_deleted" BOOLEAN NOT NULL DEFAULT false,
      "deleted_by" TEXT
    );
  `);
  console.log('✔ machines table verified.');

  // 4. Create production_plans
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "production_plans" (
      "id" TEXT PRIMARY KEY,
      "plan_number" TEXT UNIQUE NOT NULL,
      "plan_date" TEXT NOT NULL,
      "shift" TEXT NOT NULL DEFAULT 'Shift A (Morning)',
      "line" TEXT NOT NULL,
      "target_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "scheduled_hours" DOUBLE PRECISION NOT NULL DEFAULT 8,
      "status" TEXT NOT NULL DEFAULT 'Scheduled',
      "supervisor" TEXT,
      "notes" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "deleted_at" TIMESTAMP(3),
      "is_deleted" BOOLEAN NOT NULL DEFAULT false,
      "deleted_by" TEXT
    );
  `);
  console.log('✔ production_plans table verified.');

  // 5. Create work_orders
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "work_orders" (
      "id" TEXT PRIMARY KEY,
      "order_number" TEXT UNIQUE NOT NULL,
      "sales_order_id" TEXT REFERENCES "sales_orders"("id") ON DELETE SET NULL,
      "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
      "bom_id" TEXT REFERENCES "bills_of_material"("id") ON DELETE SET NULL,
      "ordered_quantity" DOUBLE PRECISION NOT NULL,
      "produced_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "rejected_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "start_date" TEXT,
      "target_date" TEXT,
      "actual_end_date" TEXT,
      "priority" TEXT NOT NULL DEFAULT 'Medium',
      "status" TEXT NOT NULL DEFAULT 'Draft',
      "current_stage" TEXT NOT NULL DEFAULT 'Planning',
      "warehouse_id" TEXT REFERENCES "warehouses"("id") ON DELETE SET NULL,
      "assigned_line" TEXT,
      "supervisor" TEXT,
      "remarks" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "deleted_at" TIMESTAMP(3),
      "is_deleted" BOOLEAN NOT NULL DEFAULT false,
      "deleted_by" TEXT
    );
  `);
  console.log('✔ work_orders table verified.');

  // 6. Create work_order_operations
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "work_order_operations" (
      "id" TEXT PRIMARY KEY,
      "work_order_id" TEXT NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
      "sequence" INTEGER NOT NULL,
      "stage_name" TEXT NOT NULL,
      "machine_id" TEXT REFERENCES "machines"("id") ON DELETE SET NULL,
      "machine_name" TEXT,
      "operator_name" TEXT,
      "status" TEXT NOT NULL DEFAULT 'Pending',
      "input_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "output_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "scrap_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "start_time" TIMESTAMP(3),
      "end_time" TIMESTAMP(3),
      "notes" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✔ work_order_operations table verified.');

  // 7. Create production_qc_inspections
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "production_qc_inspections" (
      "id" TEXT PRIMARY KEY,
      "qc_number" TEXT UNIQUE NOT NULL,
      "work_order_id" TEXT NOT NULL REFERENCES "work_orders"("id") ON DELETE CASCADE,
      "stage" TEXT NOT NULL,
      "inspector_name" TEXT NOT NULL,
      "sample_size" INTEGER NOT NULL DEFAULT 5,
      "bursting_factor" DOUBLE PRECISION,
      "bursting_strength" DOUBLE PRECISION,
      "moisture_percent" DOUBLE PRECISION,
      "box_compression_test" DOUBLE PRECISION,
      "caliper_thickness_mm" DOUBLE PRECISION,
      "dimension_check" TEXT DEFAULT 'Pass',
      "print_quality" TEXT DEFAULT 'Pass',
      "status" TEXT NOT NULL DEFAULT 'Passed',
      "rejected_qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "remarks" TEXT,
      "inspection_date" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✔ production_qc_inspections table verified.');

  // 8. Create production_scrap_logs
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "production_scrap_logs" (
      "id" TEXT PRIMARY KEY,
      "scrap_number" TEXT UNIQUE NOT NULL,
      "work_order_id" TEXT REFERENCES "work_orders"("id") ON DELETE SET NULL,
      "stage" TEXT NOT NULL,
      "material_type" TEXT NOT NULL,
      "weight_kg" DOUBLE PRECISION NOT NULL,
      "reason" TEXT NOT NULL,
      "recorded_by" TEXT NOT NULL,
      "date" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✔ production_scrap_logs table verified.');

  // 9. Create production_downtime_logs
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "production_downtime_logs" (
      "id" TEXT PRIMARY KEY,
      "machine_id" TEXT NOT NULL REFERENCES "machines"("id") ON DELETE CASCADE,
      "reason_category" TEXT NOT NULL,
      "duration_minutes" INTEGER NOT NULL,
      "start_time" TIMESTAMP(3) NOT NULL,
      "end_time" TIMESTAMP(3),
      "resolved_by" TEXT,
      "action_taken" TEXT,
      "date" TEXT NOT NULL,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✔ production_downtime_logs table verified.');

  // Seed default machines if table is empty
  const machineCount = await prisma.machine.count();
  if (machineCount === 0) {
    console.log('🌱 Seeding standard corrugated manufacturing machines...');
    await prisma.machine.createMany({
      data: [
        {
          id: 'mch-corr-01',
          code: 'MCH-CORR-01',
          name: '5-Ply High-Speed Auto Corrugation Line',
          type: 'Corrugator',
          line: 'Corrugator Line 1',
          capacityPerHour: 8500,
          unit: 'Sheets/Hr',
          status: 'Running',
          operator: 'Rajesh Kumar',
          lastMaintenanceDate: '2025-05-15',
          nextMaintenanceDate: '2025-06-15',
        },
        {
          id: 'mch-corr-02',
          code: 'MCH-CORR-02',
          name: '3-Ply High-Precision Single Facer',
          type: 'Corrugator',
          line: 'Corrugator Line 2',
          capacityPerHour: 6000,
          unit: 'Sheets/Hr',
          status: 'Available',
          operator: 'Amit Sharma',
          lastMaintenanceDate: '2025-05-10',
          nextMaintenanceDate: '2025-06-10',
        },
        {
          id: 'mch-prnt-01',
          code: 'MCH-PRNT-01',
          name: 'Flexo Printer & Slotter 4-Color High Graphic',
          type: 'Flexo Printer',
          line: 'Printing Line A',
          capacityPerHour: 4500,
          unit: 'Boxes/Hr',
          status: 'Running',
          operator: 'Sunil Verma',
          lastMaintenanceDate: '2025-05-18',
          nextMaintenanceDate: '2025-06-18',
        },
        {
          id: 'mch-die-01',
          code: 'MCH-DIE-01',
          name: 'Heavy Duty Rotary Die-Cutter Unit',
          type: 'Rotary Die-Cutter',
          line: 'Finishing Line 1',
          capacityPerHour: 3500,
          unit: 'Boxes/Hr',
          status: 'Available',
          operator: 'Vikram Singh',
          lastMaintenanceDate: '2025-05-05',
          nextMaintenanceDate: '2025-06-05',
        },
        {
          id: 'mch-glue-01',
          code: 'MCH-GLUE-01',
          name: 'Automatic Folder Gluer & Pasting Unit',
          type: 'Pasting Machine',
          line: 'Pasting Line 1',
          capacityPerHour: 5000,
          unit: 'Boxes/Hr',
          status: 'Running',
          operator: 'Manoj Patel',
          lastMaintenanceDate: '2025-05-20',
          nextMaintenanceDate: '2025-06-20',
        },
        {
          id: 'mch-stch-01',
          code: 'MCH-STCH-01',
          name: 'Semi-Automatic Double Head Box Stitcher',
          type: 'Automatic Stitcher',
          line: 'Stitching Line 1',
          capacityPerHour: 2500,
          unit: 'Boxes/Hr',
          status: 'Available',
          operator: 'Dinesh Yadav',
          lastMaintenanceDate: '2025-05-12',
          nextMaintenanceDate: '2025-06-12',
        },
      ],
    });
    console.log('✔ Standard machines seeded successfully.');
  }

  // Seed default BOM if product exists
  const existingProduct = await prisma.product.findFirst();
  const bomCount = await prisma.billOfMaterial.count();
  if (existingProduct && bomCount === 0) {
    console.log('🌱 Seeding standard 5-Ply Corrugated Box BOM...');
    const rawMaterials = await prisma.rawMaterial.findMany({ take: 5 });
    const topLiner = rawMaterials[0] || null;
    const fluting = rawMaterials[1] || null;

    const bom = await prisma.billOfMaterial.create({
      data: {
        id: 'bom-std-5ply-01',
        bomNumber: 'BOM-2025-001',
        name: `5-Ply Universal RSC Box (${existingProduct.code || existingProduct.name})`,
        productId: existingProduct.id,
        fluteType: 'BC-Flute (5-Ply)',
        ply: 5,
        deckleSizeMm: 1600,
        cutSizeMm: 1250,
        totalWeightGrams: 420,
        estimatedCost: 28.5,
        status: 'Active',
        notes: 'Standard 5-Ply Heavy RSC for FMCG packaging. Top liner Kraft 180 GSM, Fluting medium 150 GSM with Maize Starch adhesion.',
        items: {
          create: [
            {
              layer: 'Top Liner (Outer)',
              materialId: topLiner?.id,
              materialCode: topLiner?.code || 'RM-KRAFT-180',
              materialName: topLiner?.name || 'Kraft Paper 180 GSM',
              gsm: 180,
              quantityPerUnit: 0.125,
              unit: 'Kg',
              unitCost: 45,
              totalCost: 5.62,
            },
            {
              layer: 'Fluting Medium 1 (B-Flute)',
              materialId: fluting?.id,
              materialCode: fluting?.code || 'RM-FLUT-150',
              materialName: fluting?.name || 'Fluting Medium Paper 150 GSM',
              gsm: 150,
              quantityPerUnit: 0.145,
              unit: 'Kg',
              unitCost: 38,
              totalCost: 5.51,
            },
            {
              layer: 'Center Liner',
              materialId: topLiner?.id,
              materialCode: topLiner?.code || 'RM-KRAFT-150',
              materialName: topLiner?.name || 'Kraft Paper 150 GSM',
              gsm: 150,
              quantityPerUnit: 0.110,
              unit: 'Kg',
              unitCost: 40,
              totalCost: 4.40,
            },
            {
              layer: 'Fluting Medium 2 (C-Flute)',
              materialId: fluting?.id,
              materialCode: fluting?.code || 'RM-FLUT-150',
              materialName: fluting?.name || 'Fluting Medium Paper 150 GSM',
              gsm: 150,
              quantityPerUnit: 0.155,
              unit: 'Kg',
              unitCost: 38,
              totalCost: 5.89,
            },
            {
              layer: 'Bottom Liner (Inner)',
              materialId: topLiner?.id,
              materialCode: topLiner?.code || 'RM-KRAFT-140',
              materialName: topLiner?.name || 'Kraft Paper 140 GSM',
              gsm: 140,
              quantityPerUnit: 0.105,
              unit: 'Kg',
              unitCost: 38,
              totalCost: 3.99,
            },
            {
              layer: 'Adhesive / Starch Gum',
              materialCode: 'RM-STARCH-MOD',
              materialName: 'Modified Maize Starch Adhesive Powder',
              gsm: 0,
              quantityPerUnit: 0.045,
              unit: 'Kg',
              unitCost: 32,
              totalCost: 1.44,
            },
            {
              layer: 'Stitching Wire / Glue',
              materialCode: 'RM-WIRE-FLAT',
              materialName: 'Galvanized Flat Stitching Wire 12x25',
              gsm: 0,
              quantityPerUnit: 0.015,
              unit: 'Kg',
              unitCost: 110,
              totalCost: 1.65,
            },
          ],
        },
      },
    });
    console.log('✔ Standard BOM seeded with 7 component layers.');

    // Seed sample Work Order
    const woCount = await prisma.workOrder.count();
    if (woCount === 0) {
      console.log('🌱 Seeding initial active Work Orders...');
      const today = new Date().toISOString().split('T')[0];
      const targetDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
      const so = await prisma.salesOrderEntity.findFirst();

      const wo = await prisma.workOrder.create({
        data: {
          id: 'wo-2025-0001',
          orderNumber: 'WO-2025-001',
          salesOrderId: so?.id || null,
          productId: existingProduct.id,
          bomId: bom.id,
          orderedQuantity: 2500,
          producedQuantity: 1800,
          rejectedQuantity: 35,
          startDate: today,
          targetDate: targetDate,
          priority: 'High',
          status: 'In Production',
          currentStage: 'Die-Cutting & Pasting',
          assignedLine: 'Corrugator Line 1',
          supervisor: 'Rajesh Kumar',
          remarks: 'Target completion for priority customer dispatch.',
          operations: {
            create: [
              {
                sequence: 1,
                stageName: 'Corrugation Line',
                machineName: '5-Ply High-Speed Auto Corrugation Line',
                operatorName: 'Rajesh Kumar',
                status: 'Completed',
                inputQuantity: 2550,
                outputQuantity: 2500,
                scrapQuantity: 50,
                startTime: new Date(Date.now() - 36 * 3600000),
                endTime: new Date(Date.now() - 28 * 3600000),
                notes: 'Sheets corrugated cleanly at 140 m/min with uniform moisture.',
              },
              {
                sequence: 2,
                stageName: 'Printing & Slotting',
                machineName: 'Flexo Printer & Slotter 4-Color High Graphic',
                operatorName: 'Sunil Verma',
                status: 'Completed',
                inputQuantity: 2500,
                outputQuantity: 2470,
                scrapQuantity: 30,
                startTime: new Date(Date.now() - 24 * 3600000),
                endTime: new Date(Date.now() - 18 * 3600000),
                notes: '2-color branding print aligned and slotting verified.',
              },
              {
                sequence: 3,
                stageName: 'Die-Cutting & Pasting',
                machineName: 'Automatic Folder Gluer & Pasting Unit',
                operatorName: 'Manoj Patel',
                status: 'In Progress',
                inputQuantity: 2470,
                outputQuantity: 1800,
                scrapQuantity: 15,
                startTime: new Date(Date.now() - 6 * 3600000),
                notes: 'Pasting glue adhesion test OK. 1,800 units processed so far.',
              },
              {
                sequence: 4,
                stageName: 'Stitching & Bundling',
                machineName: 'Semi-Automatic Double Head Box Stitcher',
                operatorName: 'Dinesh Yadav',
                status: 'Pending',
                inputQuantity: 0,
                outputQuantity: 0,
                scrapQuantity: 0,
                notes: 'Bundling in packs of 25 with strapping wire.',
              },
            ],
          },
          qcInspections: {
            create: [
              {
                qcNumber: 'PQC-2025-001',
                stage: 'Corrugation',
                inspectorName: 'Kavita Joshi',
                sampleSize: 10,
                burstingFactor: 18.5,
                burstingStrength: 12.4,
                moisturePercent: 7.2,
                boxCompressionTest: 480,
                caliperThicknessMm: 4.8,
                dimensionCheck: 'Pass',
                printQuality: 'Pass',
                status: 'Passed',
                rejectedQty: 0,
                remarks: 'Flute height and adhesive penetration within optimal tolerances.',
                inspectionDate: today,
              },
            ],
          },
          scrapLogs: {
            create: [
              {
                scrapNumber: 'SCRAP-2025-001',
                stage: 'Corrugator Trimming',
                materialType: 'Kraft Paper Waste',
                weightKg: 42.5,
                reason: 'Edge trim and deckle width adjustment',
                recordedBy: 'Rajesh Kumar',
                date: today,
              },
            ],
          },
        },
      });

      // Seed another planned work order
      await prisma.workOrder.create({
        data: {
          id: 'wo-2025-0002',
          orderNumber: 'WO-2025-002',
          productId: existingProduct.id,
          bomId: bom.id,
          orderedQuantity: 5000,
          producedQuantity: 0,
          rejectedQuantity: 0,
          startDate: today,
          targetDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
          priority: 'Urgent',
          status: 'Planned',
          currentStage: 'Planning',
          assignedLine: 'Corrugator Line 1',
          supervisor: 'Amit Sharma',
          remarks: 'Scheduled for upcoming Shift A.',
          operations: {
            create: [
              { sequence: 1, stageName: 'Corrugation Line', status: 'Pending', inputQuantity: 5100, outputQuantity: 0, scrapQuantity: 0 },
              { sequence: 2, stageName: 'Printing & Slotting', status: 'Pending', inputQuantity: 0, outputQuantity: 0, scrapQuantity: 0 },
              { sequence: 3, stageName: 'Die-Cutting & Pasting', status: 'Pending', inputQuantity: 0, outputQuantity: 0, scrapQuantity: 0 },
              { sequence: 4, stageName: 'Stitching & Bundling', status: 'Pending', inputQuantity: 0, outputQuantity: 0, scrapQuantity: 0 },
            ],
          },
        },
      });

      // Seed production plans
      await prisma.productionPlan.createMany({
        data: [
          {
            id: 'plan-2025-001',
            planNumber: 'PLAN-2025-001',
            planDate: today,
            shift: 'Shift A (Morning)',
            line: 'Corrugator Line 1',
            targetQuantity: 7500,
            scheduledHours: 8,
            status: 'Running',
            supervisor: 'Rajesh Kumar',
            notes: 'High speed corrugation run for WO-2025-001 and stock replenishment.',
          },
          {
            id: 'plan-2025-002',
            planNumber: 'PLAN-2025-002',
            planDate: today,
            shift: 'Shift B (Evening)',
            line: 'Printing Line A',
            targetQuantity: 4000,
            scheduledHours: 8,
            status: 'Scheduled',
            supervisor: 'Sunil Verma',
            notes: 'Color changeover to cyan/black flexo ink scheduled at 14:00.',
          },
        ],
      });

      // Seed downtime log
      const mch1 = await prisma.machine.findFirst({ where: { code: 'MCH-CORR-01' } });
      if (mch1) {
        await prisma.downtimeLog.create({
          data: {
            id: 'dt-2025-001',
            machineId: mch1.id,
            reasonCategory: 'Roll Change',
            durationMinutes: 25,
            startTime: new Date(Date.now() - 14 * 3600000),
            endTime: new Date(Date.now() - 13.5 * 3600000),
            resolvedBy: 'Rajesh Kumar',
            actionTaken: 'Kraft paper reel spliced and tension recalibrated smoothly.',
            date: today,
          },
        });
      }

      console.log('✔ Initial Work Orders, Plans, QC tests, and Downtime seeded successfully.');
    }
  }

  console.log('🎉 Production & Planning database migration completed successfully!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
