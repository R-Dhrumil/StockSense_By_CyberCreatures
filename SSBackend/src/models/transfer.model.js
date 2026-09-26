import { query, transaction } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Pre-seeded fallback data for offline / resilient dev mode
let memoryTransfers = [
  {
    id: 'op-trf-001',
    operationNumber: 'TRF-2026-001',
    operation_number: 'TRF-2026-001',
    type: 'INTERNAL',
    status: 'READY',
    sourceLocationId: 'b1011111-1111-4111-8111-111111111111',
    source_location_id: 'b1011111-1111-4111-8111-111111111111',
    sourceLocationName: 'Inbound Dock & Receiving',
    sourceLocationCode: 'DOCK-IN',
    destLocationId: 'b1021111-1111-4111-8111-111111111111',
    dest_location_id: 'b1021111-1111-4111-8111-111111111111',
    destLocationName: 'Rack A (Sensors & Robotics)',
    destLocationCode: 'RCK-A',
    warehouseName: 'Main Central Hub',
    warehouseCode: 'WH-MAIN',
    referenceNote: 'Putaway internal transfer to high-bay storage',
    reference_note: 'Putaway internal transfer to high-bay storage',
    itemCount: 1,
    totalDemanded: 20,
    totalDone: 0,
    createdAt: new Date('2026-03-24T11:00:00Z'),
    created_at: new Date('2026-03-24T11:00:00Z'),
    validatedAt: null,
    validated_at: null
  }
];

let memoryTransferItems = [
  {
    id: 'trf-item-001',
    operationId: 'op-trf-001',
    productId: 'c1010000-0000-4000-8000-000000000001',
    productName: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    demandedQty: 20,
    doneQty: 0
  }
];

/**
 * OPERATION 3: TRANSFER MODEL (Internal Inter-Rack / Inter-Hub Transfers & Adjustments)
 */
export class Transfer {
  /**
   * List all Transfers
   */
  static async findAll({ status, search, limit = 50, offset = 0 } = {}) {
    try {
      const conditions = ["o.type IN ('INTERNAL', 'ADJUSTMENT')"];
      const params = [];
      let idx = 1;

      if (status && status !== 'ALL') {
        conditions.push(`o.status = $${idx++}`);
        params.push(status.toUpperCase());
      }

      if (search) {
        conditions.push(`(o.operation_number ILIKE $${idx} OR o.reference_note ILIKE $${idx})`);
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
          o.source_location_id AS "sourceLocationId",
          sl.name AS "sourceLocationName",
          sl.code AS "sourceLocationCode",
          o.dest_location_id AS "destLocationId",
          dl.name AS "destLocationName",
          dl.code AS "destLocationCode",
          w.name AS "warehouseName",
          o.reference_note AS "referenceNote",
          o.created_at AS "createdAt",
          o.validated_at AS "validatedAt",
          COUNT(oi.id)::int AS "itemCount",
          COALESCE(SUM(oi.demanded_qty), 0)::int AS "totalDemanded",
          COALESCE(SUM(oi.done_qty), 0)::int AS "totalDone"
        FROM operations o
        LEFT JOIN locations sl ON sl.id = o.source_location_id
        LEFT JOIN locations dl ON dl.id = o.dest_location_id
        LEFT JOIN warehouses w ON w.id = dl.warehouse_id OR w.id = sl.warehouse_id
        LEFT JOIN operation_items oi ON oi.operation_id = o.id
        ${whereClause}
        GROUP BY o.id, sl.name, sl.code, dl.name, dl.code, w.name
        ORDER BY o.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `;

      params.push(limit, offset);
      const res = await query(text, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      logger.warn('Direct SQL Transfer.findAll failed or DB offline, using memory store:', err.message);
    }

    return memoryTransfers;
  }
}
