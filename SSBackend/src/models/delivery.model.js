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
    totalCost: 6980.00,
    createdAt: new Date('2026-03-22T09:00:00Z'),
    created_at: new Date('2026-03-22T09:00:00Z'),
    validatedAt: null,
    validated_at: null
  },
  {
    id: 'op-del-002',
    operationNumber: 'DEL-2026-002',
    operation_number: 'DEL-2026-002',
    type: 'DELIVERY',
    status: 'WAITING',
    partnerName: 'Apex Automation Ltd',
    partner_name: 'Apex Automation Ltd',
    sourceLocationId: 'b1031111-1111-4111-8111-111111111111',
    source_location_id: 'b1031111-1111-4111-8111-111111111111',
    sourceLocationName: 'Rack B (Controllers & PLC)',
    sourceLocationCode: 'RCK-B',
    warehouseName: 'Main Central Hub',
    warehouseCode: 'WH-MAIN',
    destLocationId: null,
    dest_location_id: null,
    referenceNote: 'SO-9045 Automation controllers dispatch',
    reference_note: 'SO-9045 Automation controllers dispatch',
    itemCount: 1,
    totalDemanded: 10,
    totalDone: 0,
    totalCost: 8900.00,
    createdAt: new Date('2026-03-23T11:00:00Z'),
    created_at: new Date('2026-03-23T11:00:00Z'),
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
  },
  {
    id: 'del-item-002',
    operationId: 'op-del-002',
    productId: 'c1050000-0000-4000-8000-000000000005',
    productName: 'Programmable Logic Controller (PLC)',
    sku: 'CTL-PLC-16',
    demandedQty: 10,
    doneQty: 0,
    unitPrice: 890.00
  }
];

/**
 * OPERATION 2: DELIVERY MODEL (Outbound Customer Deliveries / Sales Orders)
 */
export class Delivery {
  /**
   * List all Deliveries with status, customer, and search filtering
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
        conditions.push(`(o.operation_number ILIKE $${idx} OR o.partner_name ILIKE $${idx} OR o.reference_note ILIKE $${idx})`);
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
          COALESCE(SUM(oi.done_qty), 0)::int AS "totalDone",
          COALESCE(SUM(oi.demanded_qty * COALESCE(p.price, 0)), 0)::numeric(12, 2) AS "totalCost"
        FROM operations o
        LEFT JOIN locations sl ON sl.id = o.source_location_id
        LEFT JOIN warehouses w ON w.id = sl.warehouse_id
        LEFT JOIN operation_items oi ON oi.operation_id = o.id
        LEFT JOIN products p ON p.id = oi.product_id
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

    let filtered = [...memoryDeliveries];
    if (status && status !== 'ALL') {
      filtered = filtered.filter(d => d.status === status.toUpperCase());
    }
    if (customer) {
      filtered = filtered.filter(d => d.partnerName.toLowerCase().includes(customer.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(d => 
        d.operationNumber.toLowerCase().includes(q) || 
        d.partnerName.toLowerCase().includes(q) ||
        (d.referenceNote && d.referenceNote.toLowerCase().includes(q))
      );
    }
    return filtered;
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
          w.code AS "warehouseCode",
          o.reference_note AS "referenceNote",
          o.created_by AS "createdBy",
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
          `SELECT oi.id, oi.operation_id AS "operationId", oi.product_id AS "productId",
                  oi.demanded_qty AS "demandedQty", oi.done_qty AS "doneQty",
                  p.name AS "productName", p.sku, p.barcode, p.uom AS unit,
                  COALESCE(p.price, 0)::float AS "unitPrice"
           FROM operation_items oi
           JOIN products p ON p.id = oi.product_id
           WHERE oi.operation_id = $1
           ORDER BY p.name ASC`,
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

  /**
   * Create an Outbound Delivery Order (Status: DRAFT or WAITING)
   */
  static async create({ partner_name, source_location_id, reference_note = '', created_by = null, items = [], status = 'WAITING' }) {
    const opNumber = `DEL-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

    try {
      return await transaction(async (client) => {
        const opInsertText = `
          INSERT INTO operations (operation_number, type, status, partner_name, source_location_id, reference_note, created_by)
          VALUES ($1, 'DELIVERY', $2, $3, $4, $5, $6)
          RETURNING id, operation_number AS "operationNumber", type, status, partner_name AS "partnerName",
                    source_location_id AS "sourceLocationId", reference_note AS "referenceNote", created_at AS "createdAt"
        `;
        const opRes = await client.query(opInsertText, [
          opNumber,
          status.toUpperCase(),
          partner_name.trim(),
          source_location_id,
          reference_note.trim(),
          created_by
        ]);
        const createdOp = opRes.rows[0];

        const createdItems = [];
        for (const item of items) {
          const itemRes = await client.query(
            `INSERT INTO operation_items (operation_id, product_id, demanded_qty, done_qty)
             VALUES ($1, $2, $3, 0)
             RETURNING id, operation_id AS "operationId", product_id AS "productId", demanded_qty AS "demandedQty", done_qty AS "doneQty"`,
            [createdOp.id, item.productId || item.product_id, parseInt(item.demandedQty || item.qty || 1, 10)]
          );
          createdItems.push(itemRes.rows[0]);
        }

        return { ...createdOp, items: createdItems };
      });
    } catch (err) {
      logger.warn('Direct SQL Delivery.create failed, storing in memory fallback:', err.message);
    }

    // In-memory fallback
    const newId = `op-del-${Date.now()}`;
    const newDel = {
      id: newId,
      operationNumber: opNumber,
      operation_number: opNumber,
      type: 'DELIVERY',
      status: status.toUpperCase(),
      partnerName: partner_name.trim(),
      partner_name: partner_name.trim(),
      sourceLocationId: source_location_id,
      source_location_id: source_location_id,
      sourceLocationName: 'Rack A (Sensors & Robotics)',
      sourceLocationCode: 'RCK-A',
      warehouseName: 'Main Central Hub',
      warehouseCode: 'WH-MAIN',
      referenceNote: reference_note,
      reference_note: reference_note,
      itemCount: items.length,
      totalDemanded: items.reduce((sum, it) => sum + (parseInt(it.demandedQty || it.qty || 1, 10)), 0),
      totalDone: 0,
      totalCost: items.reduce((sum, it) => sum + ((parseInt(it.demandedQty || it.qty || 1, 10)) * (parseFloat(it.unitPrice || 100))), 0),
      createdAt: new Date(),
      created_at: new Date(),
      validatedAt: null,
      validated_at: null
    };

    memoryDeliveries.unshift(newDel);

    const newItems = items.map((it, idx) => ({
      id: `del-item-${Date.now()}-${idx}`,
      operationId: newId,
      productId: it.productId || it.product_id || `prod-${idx}`,
      productName: it.productName || it.product || 'Industrial Part',
      sku: it.sku || `SKU-${idx}`,
      demandedQty: parseInt(it.demandedQty || it.qty || 1, 10),
      doneQty: 0,
      unitPrice: parseFloat(it.unitPrice || 100)
    }));

    memoryDeliveryItems.push(...newItems);
    return { ...newDel, items: newItems };
  }

  /**
   * Step 1: Pick items & reserve stock (WAITING -> READY)
   */
  static async pick(id) {
    try {
      return await transaction(async (client) => {
        const opRes = await client.query(`SELECT * FROM operations WHERE id = $1 AND type = 'DELIVERY' FOR UPDATE`, [id]);
        if (!opRes.rows[0]) throw new Error('Delivery order not found');
        const op = opRes.rows[0];

        if (op.status !== 'WAITING' && op.status !== 'DRAFT') {
          throw new Error(`Cannot pick delivery in ${op.status} status`);
        }

        // Reserve stock on stock_levels & products
        const itemsRes = await client.query(`SELECT * FROM operation_items WHERE operation_id = $1`, [id]);
        for (const it of itemsRes.rows) {
          await client.query(
            `UPDATE stock_levels 
             SET reserved_quantity = reserved_quantity + $1, updated_at = NOW() 
             WHERE product_id = $2 AND location_id = $3`,
            [it.demanded_qty, it.product_id, op.source_location_id]
          );
          await client.query(
            `UPDATE products 
             SET reserved_qty = reserved_qty + $1, updated_at = NOW() 
             WHERE id = $2`,
            [it.demanded_qty, it.product_id]
          );
        }

        const updateRes = await client.query(
          `UPDATE operations SET status = 'READY' WHERE id = $1 RETURNING id, operation_number AS "operationNumber", status`,
          [id]
        );
        return updateRes.rows[0];
      });
    } catch (err) {
      logger.warn('Direct SQL Delivery.pick failed, updating memory store:', err.message);
    }

    const del = memoryDeliveries.find(d => d.id === id);
    if (!del) throw new Error('Delivery order not found');
    del.status = 'READY';
    return del;
  }

  /**
   * Step 2: Pack items into shipping parcel (READY -> PACKED)
   */
  static async pack(id) {
    try {
      const res = await query(
        `UPDATE operations SET status = 'PACKED' WHERE id = $1 AND type = 'DELIVERY' RETURNING id, operation_number AS "operationNumber", status`,
        [id]
      );
      if (res.rows && res.rows[0]) return res.rows[0];
    } catch (err) {
      logger.warn('Direct SQL Delivery.pack failed, updating memory store:', err.message);
    }

    const del = memoryDeliveries.find(d => d.id === id);
    if (!del) throw new Error('Delivery order not found');
    del.status = 'PACKED';
    return del;
  }

  /**
   * Step 3: Validate & Dispatch Delivery (PACKED/READY -> DONE)
   * Decrements physical stock & ledger entry (-qty)
   */
  static async validate(id, itemsDelivered = [], validatedBy = null) {
    try {
      return await transaction(async (client) => {
        const opRes = await client.query(`SELECT * FROM operations WHERE id = $1 AND type = 'DELIVERY' FOR UPDATE`, [id]);
        if (!opRes.rows[0]) throw new Error('Delivery order not found');
        const op = opRes.rows[0];

        if (op.status === 'DONE') throw new Error('Delivery order is already validated');
        if (op.status === 'CANCELED') throw new Error('Cannot validate a canceled delivery order');

        const itemsRes = await client.query(`SELECT * FROM operation_items WHERE operation_id = $1`, [id]);
        let totalDeducted = 0;
        const processedItems = [];

        for (const item of itemsRes.rows) {
          const passedItem = itemsDelivered.find(it => it.id === item.id || it.productId === item.product_id);
          const actualDoneQty = passedItem && passedItem.doneQty !== undefined ? parseInt(passedItem.doneQty, 10) : item.demanded_qty;

          await client.query(`UPDATE operation_items SET done_qty = $1 WHERE id = $2`, [actualDoneQty, item.id]);

          if (actualDoneQty > 0) {
            totalDeducted += actualDoneQty;

            // Decrement location stock & release reserved
            await client.query(
              `UPDATE stock_levels 
               SET quantity = GREATEST(0, quantity - $1),
                   reserved_quantity = GREATEST(0, reserved_quantity - $1),
                   updated_at = NOW()
               WHERE product_id = $2 AND location_id = $3`,
              [actualDoneQty, item.product_id, op.source_location_id]
            );

            // Record negative movement in stock_ledger
            await client.query(
              `INSERT INTO stock_ledger (product_id, location_id, quantity_change, move_type, reference_number, notes, created_by)
               VALUES ($1, $2, -$3, 'DELIVERY', $4, $5, $6)`,
              [item.product_id, op.source_location_id, actualDoneQty, op.operation_number, `Dispatched to ${op.partner_name}`, validatedBy]
            );

            // Decrement master product available_qty
            await client.query(
              `UPDATE products 
               SET available_qty = GREATEST(0, available_qty - $1),
                   reserved_qty = GREATEST(0, reserved_qty - $1),
                   status = CASE WHEN (available_qty - $1) <= 0 THEN 'Out of Stock' WHEN (available_qty - $1) <= reorder_level THEN 'Low Stock' ELSE status END,
                   updated_at = NOW()
               WHERE id = $2`,
              [actualDoneQty, item.product_id]
            );
          }

          processedItems.push({ id: item.id, productId: item.product_id, demandedQty: item.demanded_qty, doneQty: actualDoneQty });
        }

        const updatedRes = await client.query(
          `UPDATE operations SET status = 'DONE', validated_at = NOW() WHERE id = $1 RETURNING id, operation_number AS "operationNumber", status, validated_at AS "validatedAt"`,
          [id]
        );

        return {
          ...updatedRes.rows[0],
          totalUnitsDispatched: totalDeducted,
          items: processedItems
        };
      });
    } catch (err) {
      logger.warn('Direct SQL Delivery.validate failed, updating memory store:', err.message);
    }

    const del = memoryDeliveries.find(d => d.id === id);
    if (!del) throw new Error('Delivery order not found');
    del.status = 'DONE';
    del.validatedAt = new Date();
    del.validated_at = new Date();
    return { ...del, totalUnitsDispatched: del.totalDemanded };
  }

  /**
   * Cancel Delivery Order (Releases reserved stock)
   */
  static async cancel(id) {
    try {
      return await transaction(async (client) => {
        const opRes = await client.query(`SELECT * FROM operations WHERE id = $1 AND type = 'DELIVERY' FOR UPDATE`, [id]);
        if (!opRes.rows[0]) throw new Error('Delivery order not found');
        const op = opRes.rows[0];

        if (op.status === 'DONE') throw new Error('Cannot cancel a validated/dispatched delivery');

        // If items were reserved (READY/PACKED), release reservations
        if (op.status === 'READY' || op.status === 'PACKED') {
          const itemsRes = await client.query(`SELECT * FROM operation_items WHERE operation_id = $1`, [id]);
          for (const it of itemsRes.rows) {
            await client.query(
              `UPDATE stock_levels SET reserved_quantity = GREATEST(0, reserved_quantity - $1) WHERE product_id = $2 AND location_id = $3`,
              [it.demanded_qty, it.product_id, op.source_location_id]
            );
            await client.query(
              `UPDATE products SET reserved_qty = GREATEST(0, reserved_qty - $1) WHERE id = $2`,
              [it.demanded_qty, it.product_id]
            );
          }
        }

        const updateRes = await client.query(`UPDATE operations SET status = 'CANCELED' WHERE id = $1 RETURNING id, operation_number AS "operationNumber", status`, [id]);
        return updateRes.rows[0];
      });
    } catch (err) {
      logger.warn('Direct SQL Delivery.cancel failed, updating memory store:', err.message);
    }

    const del = memoryDeliveries.find(d => d.id === id);
    if (!del) throw new Error('Delivery order not found');
    del.status = 'CANCELED';
    return del;
  }
}
