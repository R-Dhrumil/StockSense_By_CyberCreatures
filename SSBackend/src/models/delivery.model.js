import { query, transaction } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Pre-seeded fallback data for offline / resilient dev mode
let memoryDeliveries = [
  {
    id: 'op-del-001',
    operationNumber: 'DEL-2026-001',
    operation_number: 'DEL-2026-001',
    type: 'DELIVERY',
    status: 'READY',
    partnerName: 'Global Robotics Industries',
    partner_name: 'Global Robotics Industries',
    sourceLocationId: 'b1021111-1111-4111-8111-111111111111',
    source_location_id: 'b1021111-1111-4111-8111-111111111111',
    sourceLocationName: 'Rack A (Sensors & Robotics)',
    sourceLocationCode: 'RCK-A',
    warehouseName: 'Main Central Hub',
    warehouseCode: 'WH-MAIN',
    destLocationId: null,
    dest_location_id: null,
    referenceNote: 'SO-9012 Outbound high-priority order',
    reference_note: 'SO-9012 Outbound high-priority order',
    itemCount: 1,
    totalDemanded: 20,
    totalDone: 0,
    createdAt: new Date('2026-03-22T09:00:00Z'),
    created_at: new Date('2026-03-22T09:00:00Z'),
    validatedAt: null,
    validated_at: null
  }
];

let memoryDeliveryItems = [
  {
    id: 'del-item-001',
    operationId: 'op-del-001',
    productId: 'c1010000-0000-4000-8000-000000000001',
    productName: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    demandedQty: 20,
    doneQty: 0,
    unitPrice: 349.00
  }
];

/**
 * OPERATION 2: DELIVERY MODEL (Outbound Customer Deliveries / Sales Orders)
 */
export class Delivery {
  /**
   * List all Deliveries
   */
  static async findAll({ status, customer, search, limit = 50, offset = 0 } = {}) {
    try {
      const conditions = ["o.type = 'DELIVERY'"];
      const params = [];
      let idx = 1;

      if (status && status !== 'ALL') {
        conditions.push(`o.status = $${idx++}`);
        params.push(status.toUpperCase());
      }

      if (customer) {
        conditions.push(`o.partner_name ILIKE $${idx++}`);
        params.push(`%${customer}%`);
      }

      if (search) {
        conditions.push(`(o.operation_number ILIKE $${idx} OR o.partner_name ILIKE $${idx})`);
        params.push(`%${search}%`);
        idx++;
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      const text = `
        SELECT 
          o.id,
          o.operation_number AS "operationNumber",
          o.type,
          o.status,
          o.partner_name AS "partnerName",
          o.source_location_id AS "sourceLocationId",
          sl.name AS "sourceLocationName",
          sl.code AS "sourceLocationCode",
          w.name AS "warehouseName",
          w.code AS "warehouseCode",
          o.reference_note AS "referenceNote",
          o.created_at AS "createdAt",
          o.validated_at AS "validatedAt",
          COUNT(oi.id)::int AS "itemCount",
          COALESCE(SUM(oi.demanded_qty), 0)::int AS "totalDemanded",
          COALESCE(SUM(oi.done_qty), 0)::int AS "totalDone"
        FROM operations o
        LEFT JOIN locations sl ON sl.id = o.source_location_id
        LEFT JOIN warehouses w ON w.id = sl.warehouse_id
        LEFT JOIN operation_items oi ON oi.operation_id = o.id
        ${whereClause}
        GROUP BY o.id, sl.name, sl.code, w.name, w.code
        ORDER BY o.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `;

      params.push(limit, offset);
      const res = await query(text, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      logger.warn('Direct SQL Delivery.findAll failed or DB offline, using memory store:', err.message);
    }

    return memoryDeliveries;
  }

  /**
   * Find Delivery by ID with items
   */
  static async findById(id) {
    try {
      const text = `
        SELECT 
          o.id,
          o.operation_number AS "operationNumber",
          o.type,
          o.status,
          o.partner_name AS "partnerName",
          o.source_location_id AS "sourceLocationId",
          sl.name AS "sourceLocationName",
          sl.code AS "sourceLocationCode",
          w.name AS "warehouseName",
          o.reference_note AS "referenceNote",
          o.created_at AS "createdAt",
          o.validated_at AS "validatedAt"
        FROM operations o
        LEFT JOIN locations sl ON sl.id = o.source_location_id
        LEFT JOIN warehouses w ON w.id = sl.warehouse_id
        WHERE o.id = $1 AND o.type = 'DELIVERY'
      `;
      const res = await query(text, [id]);
      if (res.rows && res.rows[0]) {
        const header = res.rows[0];
        const itemsRes = await query(
          `SELECT oi.*, p.name AS "productName", p.sku FROM operation_items oi JOIN products p ON p.id = oi.product_id WHERE oi.operation_id = $1`,
          [id]
        );
        return { ...header, items: itemsRes.rows || [] };
      }
    } catch (err) {
      logger.warn('Direct SQL Delivery.findById failed:', err.message);
    }

    const del = memoryDeliveries.find(d => d.id === id);
    if (!del) return null;
    return { ...del, items: memoryDeliveryItems.filter(it => it.operationId === id) };
  }
}
