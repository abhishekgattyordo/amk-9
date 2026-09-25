import pg from 'pg';

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    return;
  }
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const pool = new pg.Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });

  console.log('Running raw SQL schema sync for raw_material_stocks and inventory_transactions...');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "raw_material_stocks" (
      "id" TEXT PRIMARY KEY,
      "raw_material_id" TEXT NOT NULL REFERENCES "raw_materials"("id") ON DELETE CASCADE,
      "supplier_id" TEXT NOT NULL REFERENCES "suppliers"("id"),
      "purchase_order_id" TEXT REFERENCES "purchase_orders"("id"),
      "batch_lot_number" TEXT,
      "purchase_date" TEXT NOT NULL,
      "purchase_time" TEXT,
      "original_quantity" DOUBLE PRECISION NOT NULL,
      "remaining_quantity" DOUBLE PRECISION NOT NULL,
      "purchase_price" DOUBLE PRECISION NOT NULL,
      "warehouse_id" TEXT REFERENCES "warehouses"("id"),
      "bin_id" TEXT REFERENCES "bin_locations"("id"),
      "reference_number" TEXT,
      "status" TEXT NOT NULL DEFAULT 'Available',
      "remarks" TEXT,
      "created_by" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "deleted_at" TIMESTAMP(3),
      "is_deleted" BOOLEAN NOT NULL DEFAULT false
    );

    ALTER TABLE "raw_material_stocks" ADD COLUMN IF NOT EXISTS "purchase_time" TEXT;
    ALTER TABLE "raw_material_stocks" ADD COLUMN IF NOT EXISTS "reference_number" TEXT;
    ALTER TABLE "raw_material_stocks" ADD COLUMN IF NOT EXISTS "created_by" TEXT;

    CREATE INDEX IF NOT EXISTS "raw_material_stocks_raw_material_id_idx" ON "raw_material_stocks"("raw_material_id");
    CREATE INDEX IF NOT EXISTS "raw_material_stocks_supplier_id_idx" ON "raw_material_stocks"("supplier_id");
    CREATE INDEX IF NOT EXISTS "raw_material_stocks_warehouse_id_idx" ON "raw_material_stocks"("warehouse_id");
    CREATE INDEX IF NOT EXISTS "raw_material_stocks_batch_lot_number_idx" ON "raw_material_stocks"("batch_lot_number");
  `);

  await pool.query(`
    ALTER TABLE "inventory_transactions"
    ADD COLUMN IF NOT EXISTS "raw_material_stock_id" TEXT REFERENCES "raw_material_stocks"("id");
  `);

  console.log('Raw SQL migration completed successfully!');
  await pool.end();
}

migrate().catch(console.error);
