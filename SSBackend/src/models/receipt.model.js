import { query, transaction } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Pre-seeded fallback data for offline / resilient dev mode
let memoryReceipts = [
  {
    id: 'op-rec-001',
    operationNumber: 'REC-2026-001',
    operation_number: 'REC-2026-001',
    type: 'RECEIPT',
    status: 'DONE',
    partnerName: 'Apex Dynamics Corp',
    partner_name: 'Apex Dynamics Corp',
    sourceLocationId: null,
    source_location_id: null,
    destLocationId: 'b1021111-1111-4111-8111-111111111111',
    dest_location_id: 'b1021111-1111-4111-8111-111111111111',
    destLocationName: 'Rack A (Sensors & Robotics)',
    destLocationCode: 'RCK-A',
    warehouseName: 'Main Central Hub',
    warehouseCode: 'WH-MAIN',
    referenceNote: 'PO-8821 Initial Q1 stock intake',
    reference_note: 'PO-8821 Initial Q1 stock intake',
    itemCount: 2,
    totalDemanded: 205,
    totalDone: 205,
    createdAt: new Date('2026-01-15T08:00:00Z'),
    created_at: new Date('2026-01-15T08:00:00Z'),
    validatedAt: new Date('2026-01-15T08:45:00Z'),
    validated_at: new Date('2026-01-15T08:45:00Z')
  },
  {
    id: 'op-rec-002',
    operationNumber: 'REC-2026-002',
    operation_number: 'REC-2026-002',
    type: 'RECEIPT',
    status: 'READY',
    partnerName: 'ElectroCore Global',
    partner_name: 'ElectroCore Global',
    sourceLocationId: null,
    source_location_id: null,
    destLocationId: 'b1031111-1111-4111-8111-111111111111',
    dest_location_id: 'b1031111-1111-4111-8111-111111111111',
    destLocationName: 'Rack B (Controllers & PLC)',
    destLocationCode: 'RCK-B',
    warehouseName: 'Main Central Hub',
    warehouseCode: 'WH-MAIN',
    referenceNote: 'PO-8842 Monthly industrial compute modules batch',
    reference_note: 'PO-8842 Monthly industrial compute modules batch',
    itemCount: 1,
    totalDemanded: 50,
    totalDone: 0,
    createdAt: new Date('2026-03-20T10:00:00Z'),
    created_at: new Date('2026-03-20T10:00:00Z'),
    validatedAt: null,
    validated_at: null
  },
  {
    id: 'op-rec-003',
    operationNumber: 'REC-2026-003',
    operation_number: 'REC-2026-003',
    type: 'RECEIPT',
    status: 'READY',
    partnerName: 'Titanium Mechanical Inc',
    partner_name: 'Titanium Mechanical Inc',
    sourceLocationId: null,
    source_location_id: null,
    destLocationId: 'b2021111-2222-4222-8222-222222222222',
    dest_location_id: 'b2021111-2222-4222-8222-222222222222',
    destLocationName: 'Raw Materials Bin Staging',
    destLocationCode: 'RAW-BIN',
    warehouseName: 'Production Facility East',
    warehouseCode: 'WH-PROD',
    referenceNote: 'PO-8890 Structural raw steel rods restock',
    reference_note: 'PO-8890 Structural raw steel rods restock',
    itemCount: 1,
    totalDemanded: 100,
    totalDone: 0,
    createdAt: new Date('2026-03-24T14:30:00Z'),
    created_at: new Date('2026-03-24T14:30:00Z'),
    validatedAt: null,
    validated_at: null
  }
];

let memoryReceiptItems = [
  {
    id: 'item-001',
    operationId: 'op-rec-001',
    productId: 'c1010000-0000-4000-8000-000000000001',
    productName: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    demandedQty: 120,
    doneQty: 120,
    unitPrice: 349.00
  },
  {
    id: 'item-002',
    operationId: 'op-rec-001',
    productId: 'c1020000-0000-4000-8000-000000000002',
    productName: 'Precision Stepper Motor 24V',
    sku: 'MOT-STP-24',
    demandedQty: 85,
    doneQty: 85,
    unitPrice: 89.50
  },
  {
    id: 'item-003',
    operationId: 'op-rec-002',
    productId: 'c1050000-0000-4000-8000-000000000005',
    productName: 'Programmable Logic Controller (PLC)',
    sku: 'CTL-PLC-16',
    demandedQty: 50,
    doneQty: 0,
    unitPrice: 890.00
  },
  {
    id: 'item-004',
    operationId: 'op-rec-003',
    productId: 'c1110000-0000-4000-8000-000000000011',
    productName: 'Carbon Steel Round Rods 25mm x 2m',
    sku: 'STL-ROD-01',
    demandedQty: 100,
    doneQty: 0,
    unitPrice: 45.00
  }
];

let memoryStockLedger = [
  {
    id: 'ledg-001',
    productId: 'c1010000-0000-4000-8000-000000000001',
    productName: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    locationId: 'b1021111-1111-4111-8111-111111111111',
    locationName: 'Rack A (Sensors & Robotics)',
    quantityChange: 120,
    moveType: 'RECEIPT',
    referenceNumber: 'REC-2026-001',
    notes: 'PO-8821 Initial Q1 stock intake',
    createdAt: new Date('2026-01-15T08:45:00Z')
  },
  {
    id: 'ledg-002',
    productId: 'c1020000-0000-4000-8000-000000000002',
    productName: 'Precision Stepper Motor 24V',
    sku: 'MOT-STP-24',
    locationId: 'b1021111-1111-4111-8111-111111111111',
    locationName: 'Rack A (Sensors & Robotics)',
    quantityChange: 85,
    moveType: 'RECEIPT',
    referenceNumber: 'REC-2026-001',
    notes: 'PO-8821 Initial Q1 stock intake',
    createdAt: new Date('2026-01-15T08:45:00Z')
  }
];

/**
 * OPERATION 1: RECEIPT MODEL (Incoming Goods from Vendors)
 */
export class Receipt {
  /**
   * List all Receipts with filters (status, supplier, search)
   */
  static async findAll({ status, supplier, search, limit = 50, offset = 0 } = {}) {
    try {
      const conditions = ["o.type = 'RECEIPT'"];
      const params = [];
      let idx = 1;

      if (status && status !== 'ALL') {
        conditions.push(`o.status = $${idx++}`);
        params.push(status.toUpperCase());
      }

      if (supplier) {
        conditions.push(`o.partner_name ILIKE $${idx++}`);
        params.push(`%${supplier}%`);
      }

      if (search) {
        conditions.push(`(o.operation_number ILIKE $${idx} OR o.partner_name ILIKE $${idx} OR o.reference_note ILIKE $${idx})`);
        params.push(`%${search}%`);
        idx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const text = `
        SELECT 
          o.id,
          o.operation_number AS "operationNumber",
          o.type,
          o.status,
          o.partner_name AS "partnerName",
          o.source_location_id AS "sourceLocationId",
          o.dest_location_id AS "destLocationId",
          l.name AS "destLocationName",
          l.code AS "destLocationCode",
          w.name AS "warehouseName",
          w.code AS "warehouseCode",
          o.reference_note AS "referenceNote",
          o.created_at AS "createdAt",
          o.validated_at AS "validatedAt",
          COUNT(oi.id)::int AS "itemCount",
          COALESCE(SUM(oi.demanded_qty), 0)::int AS "totalDemanded",
          COALESCE(SUM(oi.done_qty), 0)::int AS "totalDone",
          COALESCE(SUM(oi.demanded_qty * COALESCE(p.cost_price, p.price, 0)), 0)::numeric(12, 2) AS "totalCost"
        FROM operations o
        LEFT JOIN locations l ON l.id = o.dest_location_id
        LEFT JOIN warehouses w ON w.id = l.warehouse_id
        LEFT JOIN operation_items oi ON oi.operation_id = o.id
        LEFT JOIN products p ON p.id = oi.product_id
        ${whereClause}
        GROUP BY o.id, l.name, l.code, w.name, w.code
        ORDER BY o.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `;

      params.push(limit, offset);
      const res = await query(text, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      logger.warn('Direct SQL Receipt.findAll failed or DB offline, using memory store:', err.message);
    }

    // Fallback store
    let filtered = [...memoryReceipts];
    if (status && status !== 'ALL') {
      filtered = filtered.filter(o => o.status === status.toUpperCase());
    }
    if (supplier) {
      filtered = filtered.filter(o => o.partnerName.toLowerCase().includes(supplier.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(o => 
        o.operationNumber.toLowerCase().includes(q) || 
        o.partnerName.toLowerCase().includes(q) ||
        (o.referenceNote && o.referenceNote.toLowerCase().includes(q))
      );
    }

    return filtered;
  }

  /**
   * Find Receipt by ID with nested line items
   */
  static async findById(id) {
    try {
      const textHeader = `
        SELECT 
          o.id,
          o.operation_number AS "operationNumber",
          o.type,
          o.status,
          o.partner_name AS "partnerName",
          o.source_location_id AS "sourceLocationId",
          o.dest_location_id AS "destLocationId",
          l.name AS "destLocationName",
          l.code AS "destLocationCode",
          w.id AS "warehouseId",
          w.name AS "warehouseName",
          w.code AS "warehouseCode",
          o.reference_note AS "referenceNote",
          o.created_by AS "createdBy",
          o.created_at AS "createdAt",
          o.validated_at AS "validatedAt"
        FROM operations o
        LEFT JOIN locations l ON l.id = o.dest_location_id
        LEFT JOIN warehouses w ON w.id = l.warehouse_id
        WHERE o.id = $1 AND o.type = 'RECEIPT'
      `;
      const resHeader = await query(textHeader, [id]);
      if (resHeader.rows && resHeader.rows[0]) {
        const header = resHeader.rows[0];

        const textItems = `
          SELECT 
            oi.id,
            oi.operation_id AS "operationId",
            oi.product_id AS "productId",
            p.name AS "productName",
            p.sku,
            p.barcode,
            p.uom AS unit,
            COALESCE(p.cost_price, 0)::float AS "unitCost",
            oi.demanded_qty AS "demandedQty",
            oi.done_qty AS "doneQty"
          FROM operation_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.operation_id = $1
          ORDER BY p.name ASC
        `;
        const resItems = await query(textItems, [id]);
        return {
          ...header,
          items: resItems.rows || []
        };
      }
    } catch (err) {
      logger.warn('Direct SQL Receipt.findById failed:', err.message);
    }

    const op = memoryReceipts.find(o => o.id === id);
    if (!op) return null;
    const items = memoryReceiptItems.filter(item => item.operationId === id);
    return {
      ...op,
      items
    };
  }

  /**
   * Create a new Receipt in DRAFT or READY state
   */
  static async create({ partner_name, dest_location_id, reference_note = '', created_by = null, items = [], status = 'READY' }) {
    const opNumber = `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

    try {
      return await transaction(async (client) => {
        const opInsertText = `
          INSERT INTO operations (operation_number, type, status, partner_name, dest_location_id, reference_note, created_by)
          VALUES ($1, 'RECEIPT', $2, $3, $4, $5, $6)
          RETURNING id, operation_number AS "operationNumber", type, status, partner_name AS "partnerName",
                    dest_location_id AS "destLocationId", reference_note AS "referenceNote", created_at AS "createdAt"
        `;
        const opRes = await client.query(opInsertText, [
          opNumber,
          status.toUpperCase(),
          partner_name.trim(),
          dest_location_id,
          reference_note.trim(),
          created_by
        ]);
        const createdOp = opRes.rows[0];

        const createdItems = [];
        for (const item of items) {
          const itemInsertText = `
            INSERT INTO operation_items (operation_id, product_id, demanded_qty, done_qty)
            VALUES ($1, $2, $3, 0)
            RETURNING id, operation_id AS "operationId", product_id AS "productId", demanded_qty AS "demandedQty", done_qty AS "doneQty"
          `;
          const itemRes = await client.query(itemInsertText, [
            createdOp.id,
            item.productId || item.product_id,
            parseInt(item.demandedQty || item.qty || 1, 10)
          ]);
          createdItems.push(itemRes.rows[0]);
        }

        return {
          ...createdOp,
          items: createdItems
        };
      });
    } catch (err) {
      logger.warn('Direct SQL Receipt.create failed, storing in memory fallback:', err.message);
    }

    // In-memory fallback
    const newId = `op-rec-${Date.now()}`;
    const newOp = {
      id: newId,
      operationNumber: opNumber,
      operation_number: opNumber,
      type: 'RECEIPT',
      status: status.toUpperCase(),
      partnerName: partner_name.trim(),
      partner_name: partner_name.trim(),
      destLocationId: dest_location_id,
      dest_location_id: dest_location_id,
      destLocationName: 'Inbound Dock & Receiving',
      destLocationCode: 'DOCK-IN',
      warehouseName: 'Main Central Hub',
      warehouseCode: 'WH-MAIN',
      referenceNote: reference_note,
      reference_note: reference_note,
      itemCount: items.length,
      totalDemanded: items.reduce((sum, it) => sum + (parseInt(it.demandedQty || it.qty || 1, 10)), 0),
      totalDone: 0,
      createdAt: new Date(),
      created_at: new Date(),
      validatedAt: null,
      validated_at: null
    };

    memoryReceipts.unshift(newOp);

    const newItems = items.map((it, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      operationId: newId,
      productId: it.productId || it.product_id || `prod-${idx}`,
      productName: it.productName || it.product || 'Industrial Part',
      sku: it.sku || `SKU-${idx}`,
      demandedQty: parseInt(it.demandedQty || it.qty || 1, 10),
      doneQty: 0,
      unitPrice: parseFloat(it.unitCost || it.unitPrice || 50)
    }));

    memoryReceiptItems.push(...newItems);

    return {
      ...newOp,
      items: newItems
    };
  }

  /**
   * Validate a Receipt via Atomic SQL Transaction
   * 1. Lock operation row FOR UPDATE (prevents double validation)
   * 2. Upsert stock_levels (+done_qty at target rack)
   * 3. Insert into stock_ledger (immutable audit log)
   * 4. Sync master products.available_qty
   * 5. Set status = 'DONE' and stamp validated_at
   */
  static async validate(id, itemsReceived = [], validatedBy = null) {
    try {
      return await transaction(async (client) => {
        // 1. Lock operation and guard against double validation
        const checkText = `
          SELECT id, operation_number, status, dest_location_id, partner_name
          FROM operations
          WHERE id = $1 AND type = 'RECEIPT'
          FOR UPDATE
        `;
        const checkRes = await client.query(checkText, [id]);
        if (!checkRes.rows || checkRes.rows.length === 0) {
          throw new Error('Receipt operation not found');
        }

        const op = checkRes.rows[0];
        if (op.status === 'DONE') {
          throw new Error('Receipt is already validated and processed');
        }
        if (op.status === 'CANCELED') {
          throw new Error('Cannot validate a canceled receipt');
        }

        // 2. Fetch line items
        const itemsText = `SELECT * FROM operation_items WHERE operation_id = $1`;
        const itemsRes = await client.query(itemsText, [id]);
        const existingItems = itemsRes.rows;

        let totalUnitsIncremented = 0;
        const processedItems = [];

        for (const item of existingItems) {
          // Check if custom received quantity was passed in payload
          const passedItem = itemsReceived.find(it => (it.id === item.id || it.productId === item.product_id));
          const actualDoneQty = passedItem && passedItem.doneQty !== undefined 
            ? parseInt(passedItem.doneQty, 10) 
            : item.demanded_qty;

          if (actualDoneQty < 0) {
            throw new Error(`Invalid done quantity (${actualDoneQty}) for item ${item.id}`);
          }

          // Update operation_items with actual received qty
          await client.query(
            `UPDATE operation_items SET done_qty = $1 WHERE id = $2`,
            [actualDoneQty, item.id]
          );

          if (actualDoneQty > 0) {
            totalUnitsIncremented += actualDoneQty;

            // 3. Upsert stock_levels for destination rack
            const upsertStockText = `
              INSERT INTO stock_levels (product_id, location_id, quantity, reserved_quantity)
              VALUES ($1, $2, $3, 0)
              ON CONFLICT (product_id, location_id)
              DO UPDATE SET 
                quantity = stock_levels.quantity + $3,
                updated_at = CURRENT_TIMESTAMP
            `;
            await client.query(upsertStockText, [item.product_id, op.dest_location_id, actualDoneQty]);

            // 4. Insert into immutable stock_ledger
            const ledgerText = `
              INSERT INTO stock_ledger (product_id, location_id, quantity_change, move_type, reference_number, notes, created_by)
              VALUES ($1, $2, $3, 'RECEIPT', $4, $5, $6)
            `;
            await client.query(ledgerText, [
              item.product_id,
              op.dest_location_id,
              actualDoneQty,
              op.operation_number,
              `Receipt from ${op.partner_name}`,
              validatedBy
            ]);

            // 5. Update cached master products available_qty
            await client.query(
              `UPDATE products 
               SET available_qty = available_qty + $1,
                   status = CASE WHEN (available_qty + $1) > reorder_level THEN 'In Stock' ELSE status END,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $2`,
              [actualDoneQty, item.product_id]
            );
          }

          processedItems.push({
            id: item.id,
            productId: item.product_id,
            demandedQty: item.demanded_qty,
            doneQty: actualDoneQty
          });
        }

        // 6. Mark operation as DONE
        const updateOpText = `
          UPDATE operations 
          SET status = 'DONE', validated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING id, operation_number AS "operationNumber", type, status, validated_at AS "validatedAt"
        `;
        const updatedOpRes = await client.query(updateOpText, [id]);

        return {
          ...updatedOpRes.rows[0],
          destLocationId: op.dest_location_id,
          totalUnitsIncremented,
          items: processedItems
        };
      });
    } catch (err) {
      logger.warn('Direct SQL Receipt.validate failed, updating memory store:', err.message);
    }

    // In-memory fallback validation
    const op = memoryReceipts.find(o => o.id === id);
    if (!op) throw new Error('Receipt operation not found');
    if (op.status === 'DONE') throw new Error('Receipt is already validated');

    const opItems = memoryReceiptItems.filter(it => it.operationId === id);
    let totalUnits = 0;

    for (const item of opItems) {
      const passed = itemsReceived.find(it => it.id === item.id || it.productId === item.productId);
      const actualQty = passed && passed.doneQty !== undefined ? parseInt(passed.doneQty, 10) : item.demandedQty;
      item.doneQty = actualQty;
      totalUnits += actualQty;

      // Add to memory stock ledger
      memoryStockLedger.unshift({
        id: `ledg-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        locationId: op.destLocationId,
        locationName: op.destLocationName || 'Inbound Dock & Receiving',
        quantityChange: actualQty,
        moveType: 'RECEIPT',
        referenceNumber: op.operationNumber,
        notes: `Receipt from ${op.partnerName}`,
        createdAt: new Date()
      });
    }

    op.status = 'DONE';
    op.totalDone = totalUnits;
    op.validatedAt = new Date();
    op.validated_at = new Date();

    return {
      id: op.id,
      operationNumber: op.operationNumber,
      type: 'RECEIPT',
      status: 'DONE',
      validatedAt: op.validatedAt,
      destLocationId: op.destLocationId,
      totalUnitsIncremented: totalUnits,
      items: opItems
    };
  }

  /**
   * Find stock ledger audit trail entries
   */
  static async findLedger({ productId, locationId, limit = 50 } = {}) {
    try {
      const conditions = [];
      const params = [];
      let idx = 1;

      if (productId) {
        conditions.push(`sl.product_id = $${idx++}`);
        params.push(productId);
      }

      if (locationId) {
        conditions.push(`sl.location_id = $${idx++}`);
        params.push(locationId);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const text = `
        SELECT 
          sl.id,
          sl.product_id AS "productId",
          p.name AS "productName",
          p.sku,
          sl.location_id AS "locationId",
          l.name AS "locationName",
          l.code AS "locationCode",
          w.name AS "warehouseName",
          sl.quantity_change AS "quantityChange",
          sl.move_type AS "moveType",
          sl.reference_number AS "referenceNumber",
          sl.notes,
          sl.created_at AS "createdAt"
        FROM stock_ledger sl
        JOIN products p ON p.id = sl.product_id
        JOIN locations l ON l.id = sl.location_id
        JOIN warehouses w ON w.id = l.warehouse_id
        ${whereClause}
        ORDER BY sl.created_at DESC
        LIMIT $${idx}
      `;
      params.push(limit);
      const res = await query(text, params);
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      logger.warn('Direct SQL Receipt.findLedger failed:', err.message);
    }

    return memoryStockLedger.slice(0, limit);
  }
}
