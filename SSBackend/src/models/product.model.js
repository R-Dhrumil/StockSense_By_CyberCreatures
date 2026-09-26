import { query } from '../config/db.js';

export class Product {
  /**
   * Helper to determine stock status based on quantities and reorder thresholds
   */
  static computeStatus(availableQty, reorderLevel = 10) {
    const qty = parseInt(availableQty, 10) || 0;
    const threshold = parseInt(reorderLevel, 10) || 10;
    if (qty === 0) return 'Out of Stock';
    if (qty <= threshold) return 'Low Stock';
    return 'In Stock';
  }

  /**
   * Create a new product in master catalog
   */
  static async create({
    name,
    sku,
    barcode = '',
    category_id = null,
    category_name = 'General',
    uom = 'pcs',
    price = 0,
    cost_price = 0,
    available_qty = 0,
    reserved_qty = 0,
    reorder_level = 10,
    warehouse = 'Main Store',
    supplier = '',
    description = '',
    image = 'Package'
  }) {
    const computedStatus = this.computeStatus(available_qty, reorder_level);
    const cleanSku = sku ? sku.trim().toUpperCase() : `SKU-${Date.now().toString().slice(-6)}`;
    const cleanBarcode = barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const text = `
      INSERT INTO products (
        name, sku, barcode, category_id, category_name, uom, price, cost_price,
        available_qty, reserved_qty, reorder_level, warehouse, status, supplier, description, image
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING 
        id, name, sku, barcode, category_id AS "categoryId", category_name AS category,
        uom AS unit, price::float, cost_price::float AS "costPrice",
        available_qty AS "availableQty", reserved_qty AS "reservedQty",
        reorder_level AS "reorderLevel", warehouse, status, supplier,
        description, image, created_at AS "createdAt", updated_at AS "updatedAt"
    `;

    const values = [
      name.trim(),
      cleanSku,
      cleanBarcode,
      category_id,
      category_name,
      uom,
      parseFloat(price) || 0,
      parseFloat(cost_price) || 0,
      parseInt(available_qty, 10) || 0,
      parseInt(reserved_qty, 10) || 0,
      parseInt(reorder_level, 10) || 10,
      warehouse,
      computedStatus,
      supplier,
      description,
      image
    ];

    const res = await query(text, values);
    return res.rows[0];
  }

  /**
   * Find products with multi-filter query (search, category, status, warehouse, low-stock)
   */
  static async findAll({
    search = '',
    category = '',
    status = '',
    warehouse = '',
    lowStockOnly = false,
    limit = 200,
    offset = 0
  } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(p.name ILIKE $${idx} OR p.sku ILIKE $${idx} OR p.barcode ILIKE $${idx})`);
      params.push(`%${search.trim()}%`);
      idx++;
    }

    if (category && category !== 'ALL') {
      conditions.push(`(p.category_name = $${idx} OR p.category_id::text = $${idx})`);
      params.push(category);
      idx++;
    }

    if (status && status !== 'ALL') {
      conditions.push(`p.status = $${idx}`);
      params.push(status);
      idx++;
    }

    if (warehouse && warehouse !== 'All') {
      conditions.push(`p.warehouse ILIKE $${idx}`);
      params.push(`%${warehouse}%`);
      idx++;
    }

    if (lowStockOnly) {
      conditions.push(`p.available_qty <= p.reorder_level`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const text = `
      SELECT 
        p.id, 
        p.name, 
        p.sku, 
        p.barcode, 
        p.category_id AS "categoryId", 
        p.category_name AS category,
        p.uom AS unit, 
        p.price::float, 
        p.cost_price::float AS "costPrice",
        p.available_qty AS "availableQty", 
        p.reserved_qty AS "reservedQty",
        p.reorder_level AS "reorderLevel", 
        p.warehouse, 
        p.status, 
        p.supplier,
        p.description, 
        p.image, 
        p.created_at AS "createdAt", 
        p.updated_at AS "updatedAt"
      FROM products p
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    params.push(limit, offset);
    const res = await query(text, params);
    return res.rows;
  }

  /**
   * Find product by ID
   */
  static async findById(id) {
    const text = `
      SELECT 
        p.id, p.name, p.sku, p.barcode, p.category_id AS "categoryId", p.category_name AS category,
        p.uom AS unit, p.price::float, p.cost_price::float AS "costPrice",
        p.available_qty AS "availableQty", p.reserved_qty AS "reservedQty",
        p.reorder_level AS "reorderLevel", p.warehouse, p.status, p.supplier,
        p.description, p.image, p.created_at AS "createdAt", p.updated_at AS "updatedAt"
      FROM products p
      WHERE p.id = $1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  }

  /**
   * Find product by SKU
   */
  static async findBySku(sku) {
    const text = `
      SELECT id, name, sku, available_qty AS "availableQty", reorder_level AS "reorderLevel"
      FROM products
      WHERE LOWER(sku) = LOWER($1)
    `;
    const res = await query(text, [sku.trim()]);
    return res.rows[0] || null;
  }

  /**
   * Update product
   */
  static async update(id, fields) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const newAvailableQty = fields.available_qty !== undefined ? parseInt(fields.available_qty, 10) : (fields.availableQty !== undefined ? parseInt(fields.availableQty, 10) : existing.availableQty);
    const newReorderLevel = fields.reorder_level !== undefined ? parseInt(fields.reorder_level, 10) : (fields.reorderLevel !== undefined ? parseInt(fields.reorderLevel, 10) : existing.reorderLevel);
    const computedStatus = this.computeStatus(newAvailableQty, newReorderLevel);

    const text = `
      UPDATE products
      SET 
        name = COALESCE($1, name),
        sku = COALESCE($2, sku),
        barcode = COALESCE($3, barcode),
        category_id = COALESCE($4, category_id),
        category_name = COALESCE($5, category_name),
        uom = COALESCE($6, uom),
        price = COALESCE($7, price),
        cost_price = COALESCE($8, cost_price),
        available_qty = $9,
        reserved_qty = COALESCE($10, reserved_qty),
        reorder_level = $11,
        warehouse = COALESCE($12, warehouse),
        status = $13,
        supplier = COALESCE($14, supplier),
        description = COALESCE($15, description),
        image = COALESCE($16, image),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING 
        id, name, sku, barcode, category_id AS "categoryId", category_name AS category,
        uom AS unit, price::float, cost_price::float AS "costPrice",
        available_qty AS "availableQty", reserved_qty AS "reservedQty",
        reorder_level AS "reorderLevel", warehouse, status, supplier,
        description, image, updated_at AS "updatedAt"
    `;

    const values = [
      fields.name,
      fields.sku ? fields.sku.trim().toUpperCase() : null,
      fields.barcode,
      fields.category_id || fields.categoryId,
      fields.category_name || fields.category,
      fields.uom || fields.unit,
      fields.price !== undefined ? parseFloat(fields.price) : null,
      fields.cost_price !== undefined ? parseFloat(fields.cost_price) : (fields.costPrice !== undefined ? parseFloat(fields.costPrice) : null),
      newAvailableQty,
      fields.reserved_qty !== undefined ? parseInt(fields.reserved_qty, 10) : (fields.reservedQty !== undefined ? parseInt(fields.reservedQty, 10) : null),
      newReorderLevel,
      fields.warehouse,
      computedStatus,
      fields.supplier,
      fields.description,
      fields.image,
      id
    ];

    const res = await query(text, values);
    return res.rows[0];
  }

  /**
   * Delete product
   */
  static async delete(id) {
    const text = `DELETE FROM products WHERE id = $1 RETURNING id, name, sku`;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  }
}
