import { query } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Pre-seeded fallback data for offline / resilient dev mode
let memoryLedger = [
  {
    id: 'mov-001',
    timestamp: new Date('2026-03-24T14:30:00Z'),
    created_at: new Date('2026-03-24T14:30:00Z'),
    type: 'Adjusted',
    moveType: 'ADJUSTMENT',
    move_type: 'ADJUSTMENT',
    productId: 'c1010000-0000-4000-8000-000000000001',
    productName: 'Industrial Torque Sensor TS-90',
    product_name: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    quantityChange: -3,
    quantity_change: -3,
    balanceAfter: 42,
    balance_after: 42,
    sourceLocation: 'Rack A (Sensors & Robotics)',
    destLocation: 'Quality Inspection / Scrap',
    reference: 'ADJ-2026-001',
    reference_number: 'ADJ-2026-001',
    reason: 'Damaged during forklift handling',
    notes: 'Damaged during forklift handling',
    user: 'Kunj Patel (Manager)'
  },
  {
    id: 'mov-002',
    timestamp: new Date('2026-03-24T11:00:00Z'),
    created_at: new Date('2026-03-24T11:00:00Z'),
    type: 'Transferred',
    moveType: 'INTERNAL',
    move_type: 'INTERNAL',
    productId: 'c1010000-0000-4000-8000-000000000001',
    productName: 'Industrial Torque Sensor TS-90',
    product_name: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    quantityChange: 0,
    quantity_change: 0,
    balanceAfter: 45,
    balance_after: 45,
    sourceLocation: 'Inbound Dock & Receiving',
    destLocation: 'Rack A (Sensors & Robotics)',
    reference: 'TRF-2026-001',
    reference_number: 'TRF-2026-001',
    reason: 'Putaway internal transfer to high-bay storage',
    notes: 'Putaway internal transfer to high-bay storage',
    user: 'Dhrumil Rana (Staff)'
  },
  {
    id: 'mov-003',
    timestamp: new Date('2026-03-23T16:00:00Z'),
    created_at: new Date('2026-03-23T16:00:00Z'),
    type: 'Delivered',
    moveType: 'DELIVERY',
    move_type: 'DELIVERY',
    productId: 'c1010000-0000-4000-8000-000000000001',
    productName: 'Industrial Torque Sensor TS-90',
    product_name: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    quantityChange: -15,
    quantity_change: -15,
    balanceAfter: 45,
    balance_after: 45,
    sourceLocation: 'Rack A (Sensors & Robotics)',
    destLocation: 'Customer Dispatch (Global Robotics)',
    reference: 'DEL-2026-001',
    reference_number: 'DEL-2026-001',
    reason: 'Customer Delivery Order Outbound',
    notes: 'Customer Delivery Order Outbound',
    user: 'Aarav Mehta (Staff)'
  },
  {
    id: 'mov-004',
    timestamp: new Date('2026-03-22T10:15:00Z'),
    created_at: new Date('2026-03-22T10:15:00Z'),
    type: 'Received',
    moveType: 'RECEIPT',
    move_type: 'RECEIPT',
    productId: 'c1010000-0000-4000-8000-000000000001',
    productName: 'Industrial Torque Sensor TS-90',
    product_name: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    quantityChange: 60,
    quantity_change: 60,
    balanceAfter: 60,
    balance_after: 60,
    sourceLocation: 'Vendor (Apex Sensors GmbH)',
    destLocation: 'Inbound Dock & Receiving',
    reference: 'REC-2026-001',
    reference_number: 'REC-2026-001',
    reason: 'Inbound PO-9012 Supplier Receipt',
    notes: 'Inbound PO-9012 Supplier Receipt',
    user: 'Kunj Patel (Manager)'
  }
];

export class StockLedger {
  /**
   * Find paginated immutable stock ledger records with rich filters
   */
  static async findAll({ productId, warehouseId, operationType, search, dateFrom, dateTo, limit = 100, offset = 0 } = {}) {
    try {
      const conditions = [];
      const params = [];
      let idx = 1;

      if (productId) {
        conditions.push(`sl.product_id = $${idx++}`);
        params.push(productId);
      }

      if (operationType && operationType !== 'ALL') {
        conditions.push(`(sl.move_type ILIKE $${idx} OR sl.move_type ILIKE $${idx + 1})`);
        params.push(operationType, `%${operationType}%`);
        idx += 2;
      }

      if (search) {
        conditions.push(`(
          p.name ILIKE $${idx} OR 
          p.sku ILIKE $${idx} OR 
          COALESCE(sl.reference_number, sl.reference) ILIKE $${idx} OR 
          COALESCE(sl.reason, sl.notes) ILIKE $${idx}
        )`);
        params.push(`%${search}%`);
        idx++;
      }

      if (dateFrom) {
        conditions.push(`sl.created_at >= $${idx++}`);
        params.push(new Date(dateFrom));
      }

      if (dateTo) {
        conditions.push(`sl.created_at <= $${idx++}`);
        params.push(new Date(dateTo));
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const text = `
        SELECT 
          sl.id,
          sl.created_at AS "timestamp",
          sl.created_at,
          sl.product_id AS "productId",
          p.name AS "productName",
          p.name AS "product_name",
          p.sku,
          sl.quantity_change AS "quantityChange",
          sl.quantity_change,
          sl.balance_after AS "balanceAfter",
          sl.balance_after,
          sl.move_type AS "moveType",
          sl.move_type,
          CASE 
            WHEN sl.move_type = 'RECEIPT' THEN 'Received'
            WHEN sl.move_type = 'DELIVERY' THEN 'Delivered'
            WHEN sl.move_type = 'INTERNAL' THEN 'Transferred'
            WHEN sl.move_type = 'ADJUSTMENT' THEN 'Adjusted'
            ELSE sl.move_type
          END AS "type",
          COALESCE(sl.reference_number, sl.reference, 'N/A') AS "reference",
          COALESCE(sl.reference_number, sl.reference, 'N/A') AS "reference_number",
          COALESCE(sl.reason, sl.notes, 'Inventory transaction posted') AS "reason",
          COALESCE(sl.reason, sl.notes, 'Inventory transaction posted') AS "notes",
          COALESCE(src_l.name, 'Origin Location / Supplier') AS "sourceLocation",
          COALESCE(dest_l.name, loc.name, 'Destination Rack / Customer') AS "destLocation",
          COALESCE(u.name, 'System Auditor') AS "user"
        FROM stock_ledger sl
        LEFT JOIN products p ON p.id = sl.product_id
        LEFT JOIN locations loc ON loc.id = sl.location_id
        LEFT JOIN locations src_l ON src_l.id = sl.source_location_id
        LEFT JOIN locations dest_l ON dest_l.id = sl.dest_location_id
        LEFT JOIN users u ON u.id = sl.created_by OR u.id = sl.user_id
        ${whereClause}
        ORDER BY sl.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `;

      params.push(limit, offset);
      const res = await query(text, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      logger.warn('Direct SQL StockLedger.findAll failed or DB offline, using memory store:', err.message);
    }

    let list = [...memoryLedger];
    if (operationType && operationType !== 'ALL') {
      list = list.filter(m => m.moveType?.toLowerCase() === operationType.toLowerCase() || m.type?.toLowerCase() === operationType.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => 
        m.productName?.toLowerCase().includes(q) || 
        m.sku?.toLowerCase().includes(q) || 
        m.reference?.toLowerCase().includes(q) ||
        m.reason?.toLowerCase().includes(q)
      );
    }
    return list;
  }
}
