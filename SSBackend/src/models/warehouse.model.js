import { query } from '../config/db.js';
import { logger } from '../utils/logger.js';

export class Warehouse {
  /**
   * List all warehouses with sub-location counts and calculated stock valuations directly from DB
   */
  static async findAll() {
    const text = `
      SELECT 
        w.id,
        w.name,
        w.code,
        w.address,
        w.manager_name AS "managerName",
        w.is_active AS "isActive",
        w.created_at AS "createdAt",
        COUNT(DISTINCT l.id)::int AS "locationCount",
        COALESCE(SUM(sl.quantity), 0)::int AS "totalQuantity",
        COALESCE(SUM(sl.reserved_quantity), 0)::int AS "totalReservedQuantity",
        COALESCE(SUM(sl.quantity * COALESCE(p.price, 0)), 0)::numeric(12, 2) AS "totalStockValue"
      FROM warehouses w
      LEFT JOIN locations l ON l.warehouse_id = w.id
      LEFT JOIN stock_levels sl ON sl.location_id = l.id
      LEFT JOIN products p ON p.id = sl.product_id
      GROUP BY w.id
      ORDER BY w.created_at ASC
    `;
    const res = await query(text);
    return (res.rows || []).map(row => ({
      ...row,
      capacity: 15000,
      usedCapacity: row.totalQuantity || 0
    }));
  }

  /**
   * Find a single warehouse by UUID ID
   */
  static async findById(id) {
    const text = `
      SELECT 
        w.id,
        w.name,
        w.code,
        w.address,
        w.manager_name AS "managerName",
        w.is_active AS "isActive",
        w.created_at AS "createdAt"
      FROM warehouses w
      WHERE w.id = $1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  }

  /**
   * Create a new warehouse facility
   */
  static async create({ name, code, address, manager_name, is_active = true }) {
    const text = `
      INSERT INTO warehouses (name, code, address, manager_name, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, code, address, manager_name AS "managerName", is_active AS "isActive", created_at AS "createdAt"
    `;
    const values = [name.trim(), code.trim().toUpperCase(), address || null, manager_name || null, is_active];
    const res = await query(text, values);
    const created = res.rows[0];

    // Automatically create a default internal location dock
    if (created?.id) {
      try {
        await query(
          `INSERT INTO locations (warehouse_id, name, code, type) VALUES ($1, $2, $3, 'INTERNAL')`,
          [created.id, `${created.name} - Receiving Dock`, `${created.code}-DOCK`]
        );
      } catch (err) {
        logger.warn('Initial receiving dock auto-creation notice:', err.message);
      }
    }

    return created;
  }

  /**
   * List sub-locations and racks for a specific warehouse
   */
  static async findLocations(warehouseId) {
    const text = `
      SELECT 
        l.id,
        l.warehouse_id AS "warehouseId",
        l.name,
        l.code,
        l.type,
        l.created_at AS "createdAt",
        COALESCE(SUM(sl.quantity), 0)::int AS "totalQuantity",
        COALESCE(SUM(sl.reserved_quantity), 0)::int AS "totalReservedQuantity",
        COALESCE(SUM(sl.quantity * COALESCE(p.price, 0)), 0)::numeric(12, 2) AS "totalStockValue",
        COUNT(DISTINCT sl.product_id)::int AS "productCount"
      FROM locations l
      LEFT JOIN stock_levels sl ON sl.location_id = l.id
      LEFT JOIN products p ON p.id = sl.product_id
      WHERE l.warehouse_id = $1
      GROUP BY l.id
      ORDER BY l.code ASC, l.name ASC
    `;
    const res = await query(text, [warehouseId]);
    return res.rows || [];
  }

  /**
   * Create a sub-location or rack inside a warehouse
   */
  static async createLocation({ warehouseId, name, code, type = 'INTERNAL' }) {
    const text = `
      INSERT INTO locations (warehouse_id, name, code, type)
      VALUES ($1, $2, $3, $4)
      RETURNING id, warehouse_id AS "warehouseId", name, code, type, created_at AS "createdAt"
    `;
    const values = [warehouseId, name.trim(), code.trim().toUpperCase(), type.toUpperCase()];
    const res = await query(text, values);
    return {
      ...(res.rows[0] || {}),
      totalQuantity: 0,
      totalReservedQuantity: 0,
      totalStockValue: 0,
      productCount: 0
    };
  }

  /**
   * Query stock items stored at a specific sub-location
   */
  static async findLocationStock(warehouseId, locationId) {
    const text = `
      SELECT 
        sl.id,
        sl.product_id AS "productId",
        p.name AS "productName",
        p.sku,
        COALESCE(p.category_name, p.category, 'General') AS category,
        p.price AS "unitPrice",
        sl.location_id AS "locationId",
        l.name AS "locationName",
        l.code AS "locationCode",
        sl.quantity,
        sl.reserved_quantity AS "reservedQuantity",
        sl.updated_at AS "updatedAt"
      FROM stock_levels sl
      JOIN products p ON p.id = sl.product_id
      JOIN locations l ON l.id = sl.location_id
      WHERE l.id = $1 AND l.warehouse_id = $2
      ORDER BY p.name ASC
    `;
    const res = await query(text, [locationId, warehouseId]);
    return res.rows || [];
  }
}
