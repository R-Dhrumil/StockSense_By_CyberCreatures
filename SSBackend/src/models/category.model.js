import { query } from '../config/db.js';

export class Category {
  /**
   * Create a new product category
   */
  static async create({ name, code, description = '', icon = 'Layers', status = 'Active' }) {
    const text = `
      INSERT INTO categories (name, code, description, icon, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, code, description, icon, status, created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const genCode = code || name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const values = [name.trim(), genCode, description, icon, status];
    const res = await query(text, values);
    return res.rows[0];
  }

  /**
   * Find all categories with aggregated product count and stock value
   */
  static async findAll() {
    const text = `
      SELECT 
        c.id, 
        c.name, 
        c.code, 
        c.description, 
        c.icon, 
        c.status,
        COUNT(p.id)::int AS count,
        COALESCE(SUM(p.available_qty * p.price), 0)::numeric(12,2) AS "stockValue",
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt"
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name, c.code, c.description, c.icon, c.status, c.created_at, c.updated_at
      ORDER BY c.name ASC
    `;
    const res = await query(text);
    return res.rows;
  }

  /**
   * Find category by ID
   */
  static async findById(id) {
    const text = `
      SELECT id, name, code, description, icon, status, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM categories
      WHERE id = $1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  }

  /**
   * Find category by Name
   */
  static async findByName(name) {
    const text = `
      SELECT id, name, code, description, icon, status
      FROM categories
      WHERE LOWER(name) = LOWER($1)
    `;
    const res = await query(text, [name.trim()]);
    return res.rows[0] || null;
  }

  /**
   * Update category
   */
  static async update(id, { name, code, description, icon, status }) {
    const text = `
      UPDATE categories
      SET 
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        description = COALESCE($3, description),
        icon = COALESCE($4, icon),
        status = COALESCE($5, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, name, code, description, icon, status, updated_at AS "updatedAt"
    `;
    const res = await query(text, [name, code, description, icon, status, id]);
    return res.rows[0] || null;
  }

  /**
   * Delete category
   */
  static async delete(id) {
    const text = `DELETE FROM categories WHERE id = $1 RETURNING id`;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  }
}
