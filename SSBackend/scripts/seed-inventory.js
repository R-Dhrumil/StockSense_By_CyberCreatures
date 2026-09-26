import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB, pool } from '../src/config/db.js';
import { logger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Seed Enterprise Multi-Warehouse & Granular Rack-Level Inventory Data
 */
const seedWarehouseAndInventory = async () => {
  try {
    logger.info('🚀 Starting Enterprise Multi-Warehouse & Inventory Data Seeding...');

    // 1. Ensure database schema and tables exist
    await initDB();

    // 2. Read and execute seed_inventory.sql
    const sqlFilePath = path.resolve(__dirname, '../src/database/seed_inventory.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Inventory seed SQL file not found at: ${sqlFilePath}`);
    }

    logger.info('📂 Executing src/database/seed_inventory.sql...');
    const seedSql = fs.readFileSync(sqlFilePath, 'utf8');
    await pool.query(seedSql);

    // 3. Query seeded summary stats
    const whCountRes = await pool.query('SELECT COUNT(*) AS total FROM warehouses');
    const locCountRes = await pool.query('SELECT COUNT(*) AS total FROM locations');
    const prodCountRes = await pool.query('SELECT COUNT(*) AS total FROM products');
    const stockCountRes = await pool.query('SELECT COUNT(*) AS total, SUM(quantity)::int AS "totalUnits", SUM(quantity * price)::numeric(12,2) AS "totalValuation" FROM stock_levels sl JOIN products p ON p.id = sl.product_id');

    const whRows = await pool.query(`
      SELECT 
        w.name, 
        w.code, 
        w.manager_name AS manager,
        COUNT(l.id)::int AS "locationCount"
      FROM warehouses w
      LEFT JOIN locations l ON l.warehouse_id = w.id
      GROUP BY w.id, w.name, w.code, w.manager_name
      ORDER BY w.code ASC
    `);

    logger.success('✅ Multi-Warehouse & Rack Inventory Seed Completed Successfully!\n');

    console.log('╔═════════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                   🏭 STOCKSENSE MULTI-WAREHOUSE & RACK SEED SUMMARY                     ║');
    console.log('╠═════════════════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║ 🏢 Warehouses Seeded:   ${String(whCountRes.rows[0].total).padEnd(64)}║`);
    console.log(`║ 📍 Sub-Locations/Racks: ${String(locCountRes.rows[0].total).padEnd(64)}║`);
    console.log(`║ 📦 Products Catalog:    ${String(prodCountRes.rows[0].total).padEnd(64)}║`);
    console.log(`║ 📊 Stock Level Links:   ${String(stockCountRes.rows[0].total).padEnd(64)}║`);
    console.log(`║ 🔢 Total Tracked Units: ${String(stockCountRes.rows[0].totalUnits || 0).padEnd(64)}║`);
    console.log(`║ 💰 Total Stock Value:   $${String(stockCountRes.rows[0].totalValuation || 0).padEnd(63)}║`);
    console.log('╠═════════════════════════════════════════════════════════════════════════════════════════╣');
    console.log('║ Code     │ Warehouse Facility                │ Manager              │ Sub-Locations/Racks ║');
    console.log('╠══════════╪═══════════════════════════════════╪══════════════════════╪═════════════════════╣');
    for (const row of whRows.rows) {
      const code = (row.code || '').padEnd(8);
      const name = (row.name || '').slice(0, 33).padEnd(33);
      const manager = (row.manager || '').slice(0, 20).padEnd(20);
      const locs = `${row.locationCount} zones/racks`.padEnd(19);
      console.log(`║ ${code} │ ${name} │ ${manager} │ ${locs} ║`);
    }
    console.log('╚═════════════════════════════════════════════════════════════════════════════════════════╝');
    console.log('\n💡 Endpoints Ready:');
    console.log('   - Warehouses List:          GET /api/v1/warehouses');
    console.log('   - Sub-Locations / Racks:    GET /api/v1/warehouses/:id/locations');
    console.log('   - Rack-Level Live Stock:    GET /api/v1/warehouses/:id/locations/:locId/stock\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error executing inventory seed script:', error.message);
    if (error.code) {
      logger.error(`Database error code: ${error.code} | detail: ${error.detail || error.hint || 'N/A'}`);
    }
    console.log('\n💡 Connection Troubleshooting Tip:');
    console.log('   1. Verify your PostgreSQL password in SSBackend/.env (e.g., postgresql://postgres:<password>@localhost:5432/hackathon_db)');
    console.log('   2. You can also point DATABASE_URL to a free cloud PostgreSQL (Supabase, Neon.tech, Railway, or Render)');
    console.log('   3. The SQL seed file is ready at: src/database/seed_inventory.sql');
    console.log('      You can run it anytime directly via psql:');
    console.log('      psql -U postgres -d hackathon_db -f src/database/seed_inventory.sql\n');
    console.log('✨ Note: The backend application also includes an active in-memory sync store with the exact same 5 warehouses, 21 racks, and inventory stock so the frontend functions seamlessly even without an active DB!\n');

    await pool.end();
    process.exit(1);
  }
};

seedWarehouseAndInventory();
