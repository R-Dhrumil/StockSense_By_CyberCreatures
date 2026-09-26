import { query, transaction } from '../config/db.js';

export const Operation = {
  /**
   * Find operations with optional filter (type, status, search)
   */
  async findAll({ type = 'DELIVERY', status, search, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT 
        o.id,
        o.operation_number AS "operationNumber",
        o.operation_number AS "id_code",
        o.type,
        o.source_location_id AS "sourceLocationId",
        o.dest_location_id AS "destLocationId",
        o.partner_name AS "partnerName",
        o.partner_name AS "customer",
        o.partner_contact AS "partnerContact",
        o.partner_contact AS "contact",
        o.shipping_carrier AS "shippingCarrier",
        o.tracking_number AS "trackingNumber",
        o.expected_date AS "expectedDate",
        o.expected_date AS "expectedDispatch",
        o.status,
        o.status AS "fulfillmentStatus",
        o.notes,
        o.total_amount AS "totalAmount",
        o.total_amount AS "total",
        o.created_at AS "createdAt",
        o.created_at AS "date",
        o.validated_at AS "validatedAt",
        COALESCE(
          (SELECT COUNT(*) FROM operation_lines ol WHERE ol.operation_id = o.id), 0
        ) AS "itemCount",
        COALESCE(
          json_agg(
            json_build_object(
              'id', ol.id,
              'productId', ol.product_id,
              'productName', p.name,
              'sku', p.sku,
              'demandedQty', ol.demanded_qty,
              'doneQty', ol.done_qty,
              'unitPrice', ol.unit_price,
              'availableQty', p.available_qty,
              'reservedQty', p.reserved_qty
            )
          ) FILTER (WHERE ol.id IS NOT NULL), '[]'
        ) AS items
      FROM operations o
      LEFT JOIN operation_lines ol ON ol.operation_id = o.id
      LEFT JOIN products p ON p.id = ol.product_id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      params.push(type.toUpperCase());
      sql += ` AND o.type = $${params.length}`;
    }

    if (status) {
      params.push(status.toUpperCase());
      sql += ` AND o.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (o.operation_number ILIKE $${params.length} OR o.partner_name ILIKE $${params.length} OR o.tracking_number ILIKE $${params.length})`;
    }

    sql += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const res = await query(sql, params);
    return res.rows;
  },

  /**
   * Find single operation by ID with item lines
   */
  async findById(id) {
    const sql = `
      SELECT 
        o.id,
        o.operation_number AS "operationNumber",
        o.type,
        o.source_location_id AS "sourceLocationId",
        o.dest_location_id AS "destLocationId",
        o.partner_name AS "partnerName",
        o.partner_contact AS "partnerContact",
        o.shipping_carrier AS "shippingCarrier",
        o.tracking_number AS "trackingNumber",
        o.expected_date AS "expectedDate",
        o.status,
        o.notes,
        o.total_amount AS "totalAmount",
        o.created_at AS "createdAt",
        o.validated_at AS "validatedAt",
        COALESCE(
          json_agg(
            json_build_object(
              'id', ol.id,
              'productId', ol.product_id,
              'productName', p.name,
              'sku', p.sku,
              'demandedQty', ol.demanded_qty,
              'doneQty', ol.done_qty,
              'unitPrice', ol.unit_price,
              'availableQty', p.available_qty,
              'reservedQty', p.reserved_qty
            )
          ) FILTER (WHERE ol.id IS NOT NULL), '[]'
        ) AS items
      FROM operations o
      LEFT JOIN operation_lines ol ON ol.operation_id = o.id
      LEFT JOIN products p ON p.id = ol.product_id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  /**
   * Create a new Delivery Order
   */
  async createDelivery({
    partner_name,
    partner_contact,
    shipping_carrier = 'FedEx Priority',
    expected_date,
    notes,
    source_location_id = null,
    items = [],
    created_by = null
  }) {
    return await transaction(async (client) => {
      // 1. Generate unique operation number: SO-YYYY-XXXX
      const countRes = await client.query(`SELECT COUNT(*) FROM operations WHERE type = 'DELIVERY'`);
      const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
      const operation_number = `SO-88${String(nextNum).padStart(2, '0')}`;

      // Calculate total
      const total_amount = items.reduce((sum, it) => sum + (Number(it.demanded_qty || it.qty || 1) * Number(it.unit_price || it.price || 0)), 0);

      const opSql = `
        INSERT INTO operations (
          operation_number,
          type,
          source_location_id,
          partner_name,
          partner_contact,
          shipping_carrier,
          tracking_number,
          expected_date,
          status,
          notes,
          total_amount,
          created_by
        ) VALUES ($1, 'DELIVERY', $2, $3, $4, $5, 'Pending', $6, 'WAITING', $7, $8, $9)
        RETURNING *
      `;
      const opRes = await client.query(opSql, [
        operation_number,
        source_location_id,
        partner_name,
        partner_contact,
        shipping_carrier,
        expected_date || new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
        notes || '',
        total_amount,
        created_by
      ]);
      const operation = opRes.rows[0];

      // Insert line items
      const createdLines = [];
      for (const item of items) {
        // Resolve product ID if given by SKU or name
        let prodId = item.product_id || item.productId;
        if (!prodId && item.sku) {
          const pRes = await client.query(`SELECT id, price FROM products WHERE sku = $1`, [item.sku]);
          if (pRes.rows[0]) {
            prodId = pRes.rows[0].id;
            item.unit_price = item.unit_price || pRes.rows[0].price;
          }
        }
        if (!prodId) {
          // Fallback to first product
          const firstP = await client.query(`SELECT id, price FROM products LIMIT 1`);
          if (firstP.rows[0]) {
            prodId = firstP.rows[0].id;
            item.unit_price = item.unit_price || firstP.rows[0].price;
          }
        }

        const demandedQty = parseInt(item.demanded_qty || item.qty || 1, 10);
        const unitPrice = parseFloat(item.unit_price || item.price || 0);

        const lineRes = await client.query(
          `INSERT INTO operation_lines (operation_id, product_id, demanded_qty, done_qty, unit_price)
           VALUES ($1, $2, $3, 0, $4)
           RETURNING *`,
          [operation.id, prodId, demandedQty, unitPrice]
        );
        createdLines.push(lineRes.rows[0]);
      }

      return {
        ...operation,
        items: createdLines
      };
    });
  },

  /**
   * Pick items for Delivery Order (reserves stock: checks available stock, sets reserved_quantity)
   */
  async pickDelivery(id, userId = null) {
    return await transaction(async (client) => {
      // 1. Fetch operation and lines
      const opRes = await client.query(`SELECT * FROM operations WHERE id = $1 FOR UPDATE`, [id]);
      if (!opRes.rows[0]) {
        throw new Error('Delivery order not found.');
      }
      const operation = opRes.rows[0];
      if (operation.status === 'DONE') {
        throw new Error('Delivery order is already completed and validated.');
      }
      if (operation.status === 'CANCELLED') {
        throw new Error('Cannot pick a cancelled delivery order.');
      }

      const linesRes = await client.query(
        `SELECT ol.*, p.name AS product_name, p.sku, p.available_qty, p.reserved_qty
         FROM operation_lines ol
         JOIN products p ON p.id = ol.product_id
         WHERE ol.operation_id = $1
         FOR UPDATE OF p`,
        [id]
      );

      // 2. Validate availability and reserve stock
      for (const line of linesRes.rows) {
        if (line.available_qty < line.demanded_qty) {
          throw new Error(
            `Insufficient stock for "${line.product_name}" (SKU: ${line.sku}). Required: ${line.demanded_qty} units, but only ${line.available_qty} available in stock.`
          );
        }

        // Only reserve if not already picked
        if (operation.status === 'WAITING' || operation.status === 'DRAFT') {
          await client.query(
            `UPDATE products 
             SET reserved_qty = reserved_qty + $1, updated_at = NOW() 
             WHERE id = $2`,
            [line.demanded_qty, line.product_id]
          );

          // Update stock_levels if present
          await client.query(
            `UPDATE stock_levels 
             SET reserved_quantity = reserved_quantity + $1, updated_at = NOW() 
             WHERE product_id = $2`,
            [line.demanded_qty, line.product_id]
          );
        }
      }

      // 3. Progress status to READY
      const updatedOp = await client.query(
        `UPDATE operations 
         SET status = 'READY', updated_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [id]
      );

      return updatedOp.rows[0];
    });
  },

  /**
   * Pack items for Delivery Order (marks packaging complete)
   */
  async packDelivery(id, userId = null) {
    const res = await query(
      `UPDATE operations 
       SET status = 'PACKED', updated_at = NOW() 
       WHERE id = $1 AND status IN ('WAITING', 'READY', 'DRAFT')
       RETURNING *`,
      [id]
    );
    if (!res.rows[0]) {
      throw new Error('Delivery order could not be packed (must be in WAITING or READY status).');
    }
    return res.rows[0];
  },

  /**
   * Validate Delivery Order (Atomic SQL Transaction):
   * 1. Checks available stock.
   * 2. Decrements products.available_qty = available_qty - done_qty.
   * 3. Releases products.reserved_qty = reserved_qty - done_qty.
   * 4. Updates product status ('In Stock', 'Low Stock', 'Out of Stock').
   * 5. Decrements stock_levels.quantity and releases reserved_quantity.
   * 6. Inserts into stock_ledger (-done_qty, type: 'DELIVERY', ref: operation_number).
   * 7. Sets operation status = 'DONE'.
   */
  async validateDelivery(id, { trackingNumber, carrier, doneQuantities = {}, userId = null } = {}) {
    return await transaction(async (client) => {
      // 1. Fetch and lock operation
      const opRes = await client.query(`SELECT * FROM operations WHERE id = $1 FOR UPDATE`, [id]);
      if (!opRes.rows[0]) {
        throw new Error('Delivery order not found.');
      }
      const operation = opRes.rows[0];
      if (operation.status === 'DONE') {
        throw new Error('Delivery order is already validated.');
      }

      // 2. Fetch lines & products with row lock
      const linesRes = await client.query(
        `SELECT ol.*, p.name AS product_name, p.sku, p.available_qty, p.reserved_qty, p.reorder_level
         FROM operation_lines ol
         JOIN products p ON p.id = ol.product_id
         WHERE ol.operation_id = $1
         FOR UPDATE OF p`,
        [id]
      );

      let totalItemsDispatched = 0;

      for (const line of linesRes.rows) {
        const doneQty = doneQuantities[line.id] !== undefined
          ? parseInt(doneQuantities[line.id], 10)
          : line.demanded_qty;

        if (doneQty <= 0) continue;

        if (line.available_qty < doneQty) {
          throw new Error(
            `Cannot dispatch: Insufficient stock for "${line.product_name}". Requested ${doneQty}, available ${line.available_qty}.`
          );
        }

        const newAvailableQty = line.available_qty - doneQty;
        const newReservedQty = Math.max(0, line.reserved_qty - doneQty);
        
        let newStatus = 'In Stock';
        if (newAvailableQty === 0) newStatus = 'Out of Stock';
        else if (newAvailableQty <= line.reorder_level) newStatus = 'Low Stock';

        // 3. Decrement product stock & release reserved qty
        await client.query(
          `UPDATE products 
           SET available_qty = $1, reserved_qty = $2, status = $3, updated_at = NOW() 
           WHERE id = $4`,
          [newAvailableQty, newReservedQty, newStatus, line.product_id]
        );

        // 4. Update stock_levels per location if records exist
        await client.query(
          `UPDATE stock_levels 
           SET quantity = GREATEST(0, quantity - $1),
               reserved_quantity = GREATEST(0, reserved_quantity - $1),
               updated_at = NOW() 
           WHERE product_id = $2`,
          [doneQty, line.product_id]
        );

        // 5. Insert immutable audit movement into stock_ledger
        await client.query(
          `INSERT INTO stock_ledger (
            product_id,
            location_id,
            operation_id,
            quantity_change,
            balance_after,
            type,
            reference,
            notes,
            created_by
          ) VALUES ($1, $2, $3, $4, $5, 'DELIVERY', $6, $7, $8)`,
          [
            line.product_id,
            line.location_id,
            operation.id,
            -doneQty,
            newAvailableQty,
            operation.operation_number,
            `Customer Delivery dispatched to ${operation.partner_name || 'Client'}`,
            userId
          ]
        );

        // 6. Update line item done_qty
        await client.query(
          `UPDATE operation_lines SET done_qty = $1 WHERE id = $2`,
          [doneQty, line.id]
        );

        totalItemsDispatched += doneQty;
      }

      const finalTrackingNumber = trackingNumber || operation.tracking_number || `FDX-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const finalCarrier = carrier || operation.shipping_carrier || 'FedEx Priority';

      // 7. Update operation status to DONE
      const doneRes = await client.query(
        `UPDATE operations 
         SET status = 'DONE', 
             tracking_number = $1, 
             shipping_carrier = $2, 
             validated_by = $3, 
             validated_at = NOW(), 
             updated_at = NOW() 
         WHERE id = $4 
         RETURNING *`,
        [finalTrackingNumber, finalCarrier, userId, id]
      );

      return {
        ...doneRes.rows[0],
        totalItemsDispatched
      };
    });
  },

  /**
   * Cancel Delivery Order & Release Any Reserved Inventory
   */
  async cancelDelivery(id, userId = null) {
    return await transaction(async (client) => {
      const opRes = await client.query(`SELECT * FROM operations WHERE id = $1 FOR UPDATE`, [id]);
      if (!opRes.rows[0]) throw new Error('Delivery order not found.');
      const operation = opRes.rows[0];

      if (operation.status === 'DONE') {
        throw new Error('Cannot cancel an already completed and dispatched delivery order.');
      }

      // Release reserved stock if operation was in READY or PACKED state
      if (operation.status === 'READY' || operation.status === 'PACKED') {
        const lines = await client.query(`SELECT * FROM operation_lines WHERE operation_id = $1`, [id]);
        for (const line of lines.rows) {
          await client.query(
            `UPDATE products SET reserved_qty = GREATEST(0, reserved_qty - $1) WHERE id = $2`,
            [line.demanded_qty, line.product_id]
          );
          await client.query(
            `UPDATE stock_levels SET reserved_quantity = GREATEST(0, reserved_quantity - $1) WHERE product_id = $2`,
            [line.demanded_qty, line.product_id]
          );
        }
      }

      const cancelRes = await client.query(
        `UPDATE operations SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );
      return cancelRes.rows[0];
    });
  }
};
