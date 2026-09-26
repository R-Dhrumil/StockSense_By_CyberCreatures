import { query } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Pre-seeded fallback data if database is initializing or running in offline mode
let memoryWarehouses = [
  {
    id: 'b819f07a-4c28-4e89-8d76-11f8b417c001',
    name: 'Main Central Hub',
    code: 'WH-MAIN',
    address: '100 Logistics Blvd, Oakland, CA',
    manager_name: 'Sarah Jenkins',
    managerName: 'Sarah Jenkins',
    is_active: true,
    isActive: true,
    capacity: 15000,
    created_at: new Date('2026-01-15T08:00:00Z'),
    createdAt: new Date('2026-01-15T08:00:00Z'),
  },
  {
    id: 'b819f07a-4c28-4e89-8d76-11f8b417c002',
    name: 'Production Facility East',
    code: 'WH-PROD',
    address: '450 Industrial Parkway, Allentown, PA',
    manager_name: 'Marcus Vance',
    managerName: 'Marcus Vance',
    is_active: true,
    isActive: true,
    capacity: 12000,
    created_at: new Date('2026-02-10T08:00:00Z'),
    createdAt: new Date('2026-02-10T08:00:00Z'),
  },
  {
    id: 'b819f07a-4c28-4e89-8d76-11f8b417c003',
    name: 'Southern Logistics Depot',
    code: 'WH-SOUTH',
    address: '780 Freight Way, Dallas, TX',
    manager_name: 'Elena Rostova',
    managerName: 'Elena Rostova',
    is_active: true,
    isActive: true,
    capacity: 10000,
    created_at: new Date('2026-03-01T08:00:00Z'),
    createdAt: new Date('2026-03-01T08:00:00Z'),
  }
];

let memoryLocations = [
  {
    id: 'loc-001',
    warehouse_id: 'b819f07a-4c28-4e89-8d76-11f8b417c001',
    warehouseId: 'b819f07a-4c28-4e89-8d76-11f8b417c001',
    name: 'Inbound Dock & Receiving',
    code: 'DOCK-IN',
    type: 'INTERNAL',
    totalQuantity: 240,
    totalReservedQuantity: 20,
    totalStockValue: 36200.00,
    productCount: 4,
    created_at: new Date('2026-01-15T08:30:00Z')
  },
  {
    id: 'loc-002',
    warehouse_id: 'b819f07a-4c28-4e89-8d76-11f8b417c001',
    warehouseId: 'b819f07a-4c28-4e89-8d76-11f8b417c001',
    name: 'Rack A (Sensors & Robotics)',
    code: 'RCK-A',
    type: 'INTERNAL',
    totalQuantity: 580,
    totalReservedQuantity: 45,
    totalStockValue: 124500.00,
    productCount: 8,
    created_at: new Date('2026-01-15T08:45:00Z')
  },
  {
    id: 'loc-003',
    warehouse_id: 'b819f07a-4c28-4e89-8d76-11f8b417c001',
    warehouseId: 'b819f07a-4c28-4e89-8d76-11f8b417c001',
    name: 'Rack B (Controllers & PLC)',
    code: 'RCK-B',
    type: 'INTERNAL',
    totalQuantity: 420,
    totalReservedQuantity: 30,
    totalStockValue: 98400.00,
    productCount: 6,
    created_at: new Date('2026-01-15T09:00:00Z')
  },
  {
    id: 'loc-004',
    warehouse_id: 'b819f07a-4c28-4e89-8d76-11f8b417c001',
    warehouseId: 'b819f07a-4c28-4e89-8d76-11f8b417c001',
    name: 'Quality Assurance Quarantine',
    code: 'QA-HOLD',
    type: 'SCRAP',
    totalQuantity: 15,
    totalReservedQuantity: 0,
    totalStockValue: 4200.00,
    productCount: 2,
    created_at: new Date('2026-01-16T10:00:00Z')
  },
  {
    id: 'loc-005',
    warehouse_id: 'b819f07a-4c28-4e89-8d76-11f8b417c002',
    warehouseId: 'b819f07a-4c28-4e89-8d76-11f8b417c002',
    name: 'Production Assembly Floor',
    code: 'PROD-FLR',
    type: 'INTERNAL',
    totalQuantity: 620,
    totalReservedQuantity: 50,
    totalStockValue: 142000.00,
    productCount: 7,
    created_at: new Date('2026-02-10T09:00:00Z')
  },
  {
    id: 'loc-006',
    warehouse_id: 'b819f07a-4c28-4e89-8d76-11f8b417c002',
    warehouseId: 'b819f07a-4c28-4e89-8d76-11f8b417c002',
    name: 'Raw Materials Bin Staging',
    code: 'RAW-BIN',
    type: 'INTERNAL',
    totalQuantity: 840,
    totalReservedQuantity: 120,
    totalStockValue: 88500.00,
    productCount: 9,
    created_at: new Date('2026-02-10T09:15:00Z')
  },
  {
    id: 'loc-007',
    warehouse_id: 'b819f07a-4c28-4e89-8d76-11f8b417c003',
    warehouseId: 'b819f07a-4c28-4e89-8d76-11f8b417c003',
    name: 'Outbound Transit Bay',
    code: 'TRANSIT-BAY',
    type: 'TRANSIT',
    totalQuantity: 310,
    totalReservedQuantity: 80,
    totalStockValue: 74200.00,
    productCount: 5,
    created_at: new Date('2026-03-01T09:30:00Z')
  }
];

let memoryStock = [
  {
    id: 'stk-1',
    productId: 'PRD-1001',
    productName: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    locationId: 'loc-002',
    quantity: 142,
    reservedQuantity: 18,
    unitPrice: 349.00,
    status: 'In Stock'
  },
  {
    id: 'stk-2',
    productId: 'PRD-1002',
    productName: 'Precision Stepper Motor 24V',
    sku: 'MOT-STP-24',
    locationId: 'loc-002',
    quantity: 28,
    reservedQuantity: 12,
    unitPrice: 89.50,
    status: 'Low Stock'
  },
  {
    id: 'stk-3',
    productId: 'PRD-1005',
    productName: 'Programmable Logic Controller (PLC)',
    sku: 'CTL-PLC-16',
    locationId: 'loc-003',
    quantity: 14,
    reservedQuantity: 8,
    unitPrice: 890.00,
    status: 'Low Stock'
  },
  {
    id: 'stk-4',
    productId: 'PRD-1007',
    productName: 'Industrial Ethernet Switch 8-Port',
    sku: 'NET-SWT-08',
    locationId: 'loc-003',
    quantity: 195,
    reservedQuantity: 25,
    unitPrice: 275.00,
    status: 'In Stock'
  }
];

export class Warehouse {
  /**
   * List all warehouses with sub-location counts and calculated stock valuations
   */
  static async findAll() {
    try {
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
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(row => ({
          ...row,
          capacity: 15000,
          usedCapacity: row.totalQuantity || 0
        }));
      }
    } catch (err) {
      logger.warn('Direct SQL query failed or DB uninitialized, serving managed store:', err.message);
    }

    // Fallback data mapping
    return memoryWarehouses.map(wh => {
      const locs = memoryLocations.filter(l => l.warehouseId === wh.id);
      const totalQty = locs.reduce((acc, l) => acc + (l.totalQuantity || 0), 0);
      const totalVal = locs.reduce((acc, l) => acc + (l.totalStockValue || 0), 0);
      return {
        ...wh,
        locationCount: locs.length,
        totalQuantity: totalQty,
        totalStockValue: totalVal,
        capacity: wh.capacity || 15000,
        usedCapacity: totalQty
      };
    });
  }

  /**
   * Find a single warehouse by UUID ID
   */
  static async findById(id) {
    try {
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
      if (res.rows && res.rows[0]) {
        return res.rows[0];
      }
    } catch (err) {
      logger.warn('Direct SQL findById failed:', err.message);
    }

    return memoryWarehouses.find(w => w.id === id) || null;
  }

  /**
   * Create a new warehouse
   */
  static async create({ name, code, address, manager_name, is_active = true }) {
    try {
      const text = `
        INSERT INTO warehouses (name, code, address, manager_name, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, code, address, manager_name AS "managerName", is_active AS "isActive", created_at AS "createdAt"
      `;
      const values = [name.trim(), code.trim().toUpperCase(), address || null, manager_name || null, is_active];
      const res = await query(text, values);
      if (res.rows && res.rows[0]) {
        const created = res.rows[0];
        // Automatically create a default internal location
        try {
          await query(
            `INSERT INTO locations (warehouse_id, name, code, type) VALUES ($1, $2, $3, 'INTERNAL')`,
            [created.id, `${created.name} - Receiving Dock`, `${created.code}-DOCK`]
          );
        } catch (e) {}
        return created;
      }
    } catch (err) {
      logger.warn('Direct SQL create failed, persisting to store:', err.message);
    }

    const newWh = {
      id: `wh-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address || 'Primary Logistics Depot',
      manager_name: manager_name || 'Operations Lead',
      managerName: manager_name || 'Operations Lead',
      is_active: is_active ?? true,
      isActive: is_active ?? true,
      capacity: 12000,
      createdAt: new Date(),
      created_at: new Date()
    };

    memoryWarehouses.push(newWh);

    // Add default initial location
    memoryLocations.push({
      id: `loc-${Date.now()}`,
      warehouseId: newWh.id,
      warehouse_id: newWh.id,
      name: `${newWh.name} - Main Floor`,
      code: `${newWh.code}-MAIN`,
      type: 'INTERNAL',
      totalQuantity: 0,
      totalReservedQuantity: 0,
      totalStockValue: 0,
      productCount: 0,
      created_at: new Date()
    });

    return newWh;
  }

  /**
   * List sub-locations and racks for a specific warehouse
   */
  static async findLocations(warehouseId) {
    try {
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
      if (res.rows) {
        return res.rows;
      }
    } catch (err) {
      logger.warn('Direct SQL findLocations failed:', err.message);
    }

    return memoryLocations.filter(loc => loc.warehouseId === warehouseId || loc.warehouse_id === warehouseId);
  }

  /**
   * Create a sub-location or rack inside a warehouse
   */
  static async createLocation({ warehouseId, name, code, type = 'INTERNAL' }) {
    try {
      const text = `
        INSERT INTO locations (warehouse_id, name, code, type)
        VALUES ($1, $2, $3, $4)
        RETURNING id, warehouse_id AS "warehouseId", name, code, type, created_at AS "createdAt"
      `;
      const values = [warehouseId, name.trim(), code.trim().toUpperCase(), type.toUpperCase()];
      const res = await query(text, values);
      if (res.rows && res.rows[0]) {
        return {
          ...res.rows[0],
          totalQuantity: 0,
          totalReservedQuantity: 0,
          totalStockValue: 0,
          productCount: 0
        };
      }
    } catch (err) {
      logger.warn('Direct SQL createLocation failed, persisting to store:', err.message);
    }

    const newLoc = {
      id: `loc-${Date.now()}`,
      warehouseId,
      warehouse_id: warehouseId,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      type: (type || 'INTERNAL').toUpperCase(),
      totalQuantity: 0,
      totalReservedQuantity: 0,
      totalStockValue: 0,
      productCount: 0,
      created_at: new Date()
    };

    memoryLocations.push(newLoc);
    return newLoc;
  }

  /**
   * Query stock items stored at a specific sub-location
   */
  static async findLocationStock(warehouseId, locationId) {
    try {
      const text = `
        SELECT 
          sl.id,
          sl.product_id AS "productId",
          p.name AS "productName",
          p.sku,
          p.category,
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
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      logger.warn('Direct SQL findLocationStock failed:', err.message);
    }

    return memoryStock.filter(stk => stk.locationId === locationId);
  }
}
