import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB, pool } from '../src/config/db.js';
import { logger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedCatalogOnly = async () => {
  try {
    // 1. Ensure tables exist (without clearing any users!)
    await initDB();

    // 2. Read and execute seed_catalog.sql
    logger.info('📦 Seeding product categories & master products catalog...');
    const catalogSqlPath = path.resolve(__dirname, '../src/database/seed_catalog.sql');
    
    if (!fs.existsSync(catalogSqlPath)) {
      throw new Error(`Catalog SQL file not found at ${catalogSqlPath}`);
    }

    const catalogSql = fs.readFileSync(catalogSqlPath, 'utf8');
    await pool.query(catalogSql);

    // 3. Verify counts
    const catCount = await pool.query('SELECT COUNT(*) AS total FROM categories');
    const prodCount = await pool.query('SELECT COUNT(*) AS total FROM products');

    logger.success('✅ Categories and Products successfully seeded into Railway PostgreSQL!');
    console.log('\n--------------------------------------------------');
    console.log(`📁 Categories in DB: ${catCount.rows[0].total}`);
    console.log(`📦 Products in DB:   ${prodCount.rows[0].total}`);
    console.log('--------------------------------------------------\n');
    console.log('🎉 Your users remain completely untouched!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding catalog:', error);
    await pool.end();
    process.exit(1);
  }
};

seedCatalogOnly();
