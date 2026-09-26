import { query } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Pre-seeded fallback data if database is initializing or running in offline mode
let memoryWarehouses = [
  {
    id: 'a1111111-1111-4111-8111-111111111111',
    name: 'Main Central Hub',
    code: 'WH-MAIN',
    address: '100 Logistics Blvd, Oakland, CA 94607',
    manager_name: 'Sarah Jenkins',
    managerName: 'Sarah Jenkins',
    is_active: true,
    isActive: true,
    capacity: 15000,
    created_at: new Date('2026-01-15T08:00:00Z'),
    createdAt: new Date('2026-01-15T08:00:00Z'),
  },
  {
    id: 'a2222222-2222-4222-8222-222222222222',
    name: 'Production Facility East',
    code: 'WH-PROD',
    address: '450 Industrial Parkway, Allentown, PA 18109',
    manager_name: 'Marcus Vance',
    managerName: 'Marcus Vance',
    is_active: true,
    isActive: true,
    capacity: 12000,
    created_at: new Date('2026-02-10T08:00:00Z'),
    createdAt: new Date('2026-02-10T08:00:00Z'),
  },
  {
    id: 'a3333333-3333-4333-8333-333333333333',
    name: 'Southern Logistics Depot',
    code: 'WH-SOUTH',
    address: '780 Freight Way, Dallas, TX 75261',
    manager_name: 'Elena Rostova',
    managerName: 'Elena Rostova',
    is_active: true,
    isActive: true,
    capacity: 10000,
    created_at: new Date('2026-03-01T08:00:00Z'),
    createdAt: new Date('2026-03-01T08:00:00Z'),
  },
  {
    id: 'a4444444-4444-4444-8444-444444444444',
    name: 'West Coast Distribution',
    code: 'WH-WEST',
    address: '1200 Pacific Gateway, Seattle, WA 98101',
    manager_name: 'Alexandria Vance',
    managerName: 'Alexandria Vance',
    is_active: true,
    isActive: true,
    capacity: 18000,
    created_at: new Date('2026-03-15T08:00:00Z'),
    createdAt: new Date('2026-03-15T08:00:00Z'),
  },
  {
    id: 'a5555555-5555-4555-8555-555555555555',
    name: 'European Gateway Hub',
    code: 'WH-EUR',
    address: 'Rotterdam Port Sector 4, Maasvlakte, Netherlands',
    manager_name: 'Lars Van Der Berg',
    managerName: 'Lars Van Der Berg',
    is_active: true,
    isActive: true,
    capacity: 25000,
    created_at: new Date('2026-04-01T08:00:00Z'),
    createdAt: new Date('2026-04-01T08:00:00Z'),
  }
];

let memoryLocations = [
  // Main Central Hub (WH-MAIN)
  {
    id: 'b1011111-1111-4111-8111-111111111111',
    warehouse_id: 'a1111111-1111-4111-8111-111111111111',
    warehouseId: 'a1111111-1111-4111-8111-111111111111',
    name: 'Inbound Dock & Receiving',
    code: 'DOCK-IN',
    type: 'INTERNAL',
    totalQuantity: 45,
    totalReservedQuantity: 5,
    totalStockValue: 19980.00,
    productCount: 2,
    created_at: new Date('2026-01-15T08:30:00Z')
  },
  {
    id: 'b1021111-1111-4111-8111-111111111111',
    warehouse_id: 'a1111111-1111-4111-8111-111111111111',
    warehouseId: 'a1111111-1111-4111-8111-111111111111',
    name: 'Rack A (Sensors & Robotics)',
    code: 'RCK-A',
    type: 'INTERNAL',
    totalQuantity: 205,
    totalReservedQuantity: 30,
    totalStockValue: 49487.50,
    productCount: 2,
    created_at: new Date('2026-01-15T08:45:00Z')
  },
  {
    id: 'b1031111-1111-4111-8111-111111111111',
    warehouse_id: 'a1111111-1111-4111-8111-111111111111',
    warehouseId: 'a1111111-1111-4111-8111-111111111111',
    name: 'Rack B (Controllers & PLC)',
    code: 'RCK-B',
    type: 'INTERNAL',
    totalQuantity: 42,
    totalReservedQuantity: 8,
    totalStockValue: 37380.00,
    productCount: 1,
    created_at: new Date('2026-01-15T09:00:00Z')
  },
  {
    id: 'b1041111-1111-4111-8111-111111111111',
    warehouse_id: 'a1111111-1111-4111-8111-111111111111',
    warehouseId: 'a1111111-1111-4111-8111-111111111111',
    name: 'Rack C (Networking & Comm)',
    code: 'RCK-C',
    type: 'INTERNAL',
    totalQuantity: 195,
    totalReservedQuantity: 25,
    totalStockValue: 53625.00,
    productCount: 1,
    created_at: new Date('2026-01-15T09:15:00Z')
  },
  {
    id: 'b1051111-1111-4111-8111-111111111111',
    warehouse_id: 'a1111111-1111-4111-8111-111111111111',
    warehouseId: 'a1111111-1111-4111-8111-111111111111',
    name: 'Quality Assurance Quarantine',
    code: 'QA-HOLD',
    type: 'SCRAP',
    totalQuantity: 5,
    totalReservedQuantity: 0,
    totalStockValue: 966.50,
    productCount: 2,
    created_at: new Date('2026-01-16T10:00:00Z')
  },
  {
    id: 'b1061111-1111-4111-8111-111111111111',
    warehouse_id: 'a1111111-1111-4111-8111-111111111111',
    warehouseId: 'a1111111-1111-4111-8111-111111111111',
    name: 'Outbound Shipping Staging',
    code: 'SHIP-BAY',
    type: 'TRANSIT',
    totalQuantity: 0,
    totalReservedQuantity: 0,
    totalStockValue: 0.00,
    productCount: 0,
    created_at: new Date('2026-01-16T10:15:00Z')
  },

  // Production Facility East (WH-PROD)
  {
    id: 'b2011111-2222-4222-8222-222222222222',
    warehouse_id: 'a2222222-2222-4222-8222-222222222222',
    warehouseId: 'a2222222-2222-4222-8222-222222222222',
    name: 'Production Assembly Floor',
    code: 'PROD-FLR',
    type: 'INTERNAL',
    totalQuantity: 95,
    totalReservedQuantity: 15,
    totalStockValue: 13775.00,
    productCount: 1,
    created_at: new Date('2026-02-10T09:00:00Z')
  },
  {
    id: 'b2021111-2222-4222-8222-222222222222',
    warehouse_id: 'a2222222-2222-4222-8222-222222222222',
    warehouseId: 'a2222222-2222-4222-8222-222222222222',
    name: 'Raw Materials Bin Staging',
    code: 'RAW-BIN',
    type: 'INTERNAL',
    totalQuantity: 260,
    totalReservedQuantity: 20,
    totalStockValue: 11700.00,
    productCount: 1,
    created_at: new Date('2026-02-10T09:15:00Z')
  },
  {
    id: 'b2031111-2222-4222-8222-222222222222',
    warehouse_id: 'a2222222-2222-4222-8222-222222222222',
    warehouseId: 'a2222222-2222-4222-8222-222222222222',
    name: 'Work In Progress (WIP) Rack',
    code: 'WIP-RACK',
    type: 'INTERNAL',
    totalQuantity: 15,
    totalReservedQuantity: 0,
    totalStockValue: 2175.00,
    productCount: 1,
    created_at: new Date('2026-02-10T09:30:00Z')
  },
  {
    id: 'b2041111-2222-4222-8222-222222222222',
    warehouse_id: 'a2222222-2222-4222-8222-222222222222',
    warehouseId: 'a2222222-2222-4222-8222-222222222222',
    name: 'Salvage & Scrap Bin',
    code: 'SCRAP-BAY',
    type: 'SCRAP',
    totalQuantity: 0,
    totalReservedQuantity: 0,
    totalStockValue: 0.00,
    productCount: 0,
    created_at: new Date('2026-02-10T09:45:00Z')
  },

  // Southern Logistics Depot (WH-SOUTH)
  {
    id: 'b3011111-3333-4333-8333-333333333333',
    warehouse_id: 'a3333333-3333-4333-8333-333333333333',
    warehouseId: 'a3333333-3333-4333-8333-333333333333',
    name: 'Bulk Inbound Receiving',
    code: 'DOCK-SOUTH',
    type: 'INTERNAL',
    totalQuantity: 0,
    totalReservedQuantity: 0,
    totalStockValue: 0.00,
    productCount: 0,
    created_at: new Date('2026-03-01T09:00:00Z')
  },
  {
    id: 'b3021111-3333-4333-8333-333333333333',
    warehouse_id: 'a3333333-3333-4333-8333-333333333333',
    warehouseId: 'a3333333-3333-4333-8333-333333333333',
    name: 'High-Bay Pallet Racking A1',
    code: 'HIGH-BAY-1',
    type: 'INTERNAL',
    totalQuantity: 138,
    totalReservedQuantity: 18,
    totalStockValue: 55980.00,
    productCount: 2,
    created_at: new Date('2026-03-01T09:15:00Z')
  },
  {
    id: 'b3031111-3333-4333-8333-333333333333',
    warehouse_id: 'a3333333-3333-4333-8333-333333333333',
    warehouseId: 'a3333333-3333-4333-8333-333333333333',
    name: 'High-Bay Pallet Racking B2',
    code: 'HIGH-BAY-2',
    type: 'INTERNAL',
    totalQuantity: 15,
    totalReservedQuantity: 2,
    totalStockValue: 2970.00,
    productCount: 1,
    created_at: new Date('2026-03-01T09:30:00Z')
  },
  {
    id: 'b3041111-3333-4333-8333-333333333333',
    warehouse_id: 'a3333333-3333-4333-8333-333333333333',
    warehouseId: 'a3333333-3333-4333-8333-333333333333',
    name: 'Cross-Dock Transit Bay',
    code: 'TRANSIT-BAY',
    type: 'TRANSIT',
    totalQuantity: 0,
    totalReservedQuantity: 0,
    totalStockValue: 0.00,
    productCount: 0,
    created_at: new Date('2026-03-01T09:45:00Z')
  },

  // West Coast Distribution (WH-WEST)
  {
    id: 'b4011111-4444-4444-8444-444444444444',
    warehouse_id: 'a4444444-4444-4444-8444-444444444444',
    warehouseId: 'a4444444-4444-4444-8444-444444444444',
    name: 'Fast-Moving Pick Zone 1',
    code: 'PAC-RACK-1',
    type: 'INTERNAL',
    totalQuantity: 150,
    totalReservedQuantity: 14,
    totalStockValue: 87620.00,
    productCount: 2,
    created_at: new Date('2026-03-15T09:00:00Z')
  },
  {
    id: 'b4021111-4444-4444-8444-444444444444',
    warehouse_id: 'a4444444-4444-4444-8444-444444444444',
    warehouseId: 'a4444444-4444-4444-8444-444444444444',
    name: 'Bulk Storage Zone 2',
    code: 'PAC-RACK-2',
    type: 'INTERNAL',
    totalQuantity: 0,
    totalReservedQuantity: 0,
    totalStockValue: 0.00,
    productCount: 0,
    created_at: new Date('2026-03-15T09:15:00Z')
  },
  {
    id: 'b4031111-4444-4444-8444-444444444444',
    warehouse_id: 'a4444444-4444-4444-8444-444444444444',
    warehouseId: 'a4444444-4444-4444-8444-444444444444',
    name: 'Customer Order Staging Area',
    code: 'CUST-STAGE',
    type: 'CUSTOMER',
    totalQuantity: 0,
    totalReservedQuantity: 0,
    totalStockValue: 0.00,
    productCount: 0,
    created_at: new Date('2026-03-15T09:30:00Z')
  },

  // European Gateway Hub (WH-EUR)
  {
    id: 'b5011111-5555-4555-8555-555555555555',
    warehouse_id: 'a5555555-5555-4555-8555-555555555555',
    warehouseId: 'a5555555-5555-4555-8555-555555555555',
    name: 'Bonded Customs Staging',
    code: 'EUR-BOND-1',
    type: 'TRANSIT',
    totalQuantity: 0,
    totalReservedQuantity: 0,
    totalStockValue: 0.00,
    productCount: 0,
    created_at: new Date('2026-04-01T09:00:00Z')
  },
  {
    id: 'b5021111-5555-4555-8555-555555555555',
    warehouse_id: 'a5555555-5555-4555-8555-555555555555',
    warehouseId: 'a5555555-5555-4555-8555-555555555555',
    name: 'Automated Shuttle Rack A',
    code: 'EUR-RCK-A',
    type: 'INTERNAL',
    totalQuantity: 105,
    totalReservedQuantity: 10,
    totalStockValue: 47325.00,
    productCount: 2,
    created_at: new Date('2026-04-01T09:15:00Z')
  }
];

let memoryStock = [
  // Main Central Hub -> Inbound Dock (DOCK-IN)
  {
    id: 'stk-001',
    productId: 'c1030000-0000-4000-8000-000000000003',
    productName: 'Optical Laser Distance Gauge',
    sku: 'SEN-OPT-04',
    category: 'Sensors & IoT',
    locationId: 'b1011111-1111-4111-8111-111111111111',
    locationName: 'Inbound Dock & Receiving',
    locationCode: 'DOCK-IN',
    quantity: 25,
    reservedQuantity: 5,
    unitPrice: 520.00,
    status: 'Low Stock'
  },
  {
    id: 'stk-002',
    productId: 'c1010000-0000-4000-8000-000000000001',
    productName: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    category: 'Sensors & IoT',
    locationId: 'b1011111-1111-4111-8111-111111111111',
    locationName: 'Inbound Dock & Receiving',
    locationCode: 'DOCK-IN',
    quantity: 20,
    reservedQuantity: 0,
    unitPrice: 349.00,
    status: 'In Stock'
  },

  // Main Central Hub -> Rack A (RCK-A)
  {
    id: 'stk-003',
    productId: 'c1010000-0000-4000-8000-000000000001',
    productName: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    category: 'Sensors & IoT',
    locationId: 'b1021111-1111-4111-8111-111111111111',
    locationName: 'Rack A (Sensors & Robotics)',
    locationCode: 'RCK-A',
    quantity: 120,
    reservedQuantity: 18,
    unitPrice: 349.00,
    status: 'In Stock'
  },
  {
    id: 'stk-004',
    productId: 'c1020000-0000-4000-8000-000000000002',
    productName: 'Precision Stepper Motor 24V',
    sku: 'MOT-STP-24',
    category: 'Actuators',
    locationId: 'b1021111-1111-4111-8111-111111111111',
    locationName: 'Rack A (Sensors & Robotics)',
    locationCode: 'RCK-A',
    quantity: 85,
    reservedQuantity: 12,
    unitPrice: 89.50,
    status: 'In Stock'
  },

  // Main Central Hub -> Rack B (RCK-B)
  {
    id: 'stk-005',
    productId: 'c1050000-0000-4000-8000-000000000005',
    productName: 'Programmable Logic Controller (PLC)',
    sku: 'CTL-PLC-16',
    category: 'Controllers',
    locationId: 'b1031111-1111-4111-8111-111111111111',
    locationName: 'Rack B (Controllers & PLC)',
    locationCode: 'RCK-B',
    quantity: 42,
    reservedQuantity: 8,
    unitPrice: 890.00,
    status: 'In Stock'
  },

  // Main Central Hub -> Rack C (RCK-C)
  {
    id: 'stk-006',
    productId: 'c1070000-0000-4000-8000-000000000007',
    productName: 'Industrial Ethernet Switch 8-Port',
    sku: 'NET-SWT-08',
    category: 'Networking',
    locationId: 'b1041111-1111-4111-8111-111111111111',
    locationName: 'Rack C (Networking & Comm)',
    locationCode: 'RCK-C',
    quantity: 195,
    reservedQuantity: 25,
    unitPrice: 275.00,
    status: 'In Stock'
  },

  // Main Central Hub -> QA Quarantine (QA-HOLD)
  {
    id: 'stk-007',
    productId: 'c1010000-0000-4000-8000-000000000001',
    productName: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    category: 'Sensors & IoT',
    locationId: 'b1051111-1111-4111-8111-111111111111',
    locationName: 'Quality Assurance Quarantine',
    locationCode: 'QA-HOLD',
    quantity: 2,
    reservedQuantity: 0,
    unitPrice: 349.00,
    status: 'Scrap/Defect'
  },
  {
    id: 'stk-008',
    productId: 'c1020000-0000-4000-8000-000000000002',
    productName: 'Precision Stepper Motor 24V',
    sku: 'MOT-STP-24',
    category: 'Actuators',
    locationId: 'b1051111-1111-4111-8111-111111111111',
    locationName: 'Quality Assurance Quarantine',
    locationCode: 'QA-HOLD',
    quantity: 3,
    reservedQuantity: 0,
    unitPrice: 89.50,
    status: 'Scrap/Defect'
  },

  // Production Facility East
  {
    id: 'stk-009',
    productId: 'c1040000-0000-4000-8000-000000000004',
    productName: 'Heavy Duty Pneumatic Cylinder',
    sku: 'PNE-CYL-80',
    category: 'Pneumatics',
    locationId: 'b2011111-2222-4222-8222-222222222222',
    locationName: 'Production Assembly Floor',
    locationCode: 'PROD-FLR',
    quantity: 95,
    reservedQuantity: 15,
    unitPrice: 145.00,
    status: 'In Stock'
  },
  {
    id: 'stk-010',
    productId: 'c1110000-0000-4000-8000-000000000011',
    productName: 'Carbon Steel Round Rods 25mm x 2m',
    sku: 'STL-ROD-01',
    category: 'Raw Materials',
    locationId: 'b2021111-2222-4222-8222-222222222222',
    locationName: 'Raw Materials Bin Staging',
    locationCode: 'RAW-BIN',
    quantity: 260,
    reservedQuantity: 20,
    unitPrice: 45.00,
    status: 'In Stock'
  },
  {
    id: 'stk-011',
    productId: 'c1040000-0000-4000-8000-000000000004',
    productName: 'Heavy Duty Pneumatic Cylinder',
    sku: 'PNE-CYL-80',
    category: 'Pneumatics',
    locationId: 'b2031111-2222-4222-8222-222222222222',
    locationName: 'Work In Progress (WIP) Rack',
    locationCode: 'WIP-RACK',
    quantity: 15,
    reservedQuantity: 0,
    unitPrice: 145.00,
    status: 'In Stock'
  },

  // Southern Logistics Depot
  {
    id: 'stk-012',
    productId: 'c1080000-0000-4000-8000-000000000008',
    productName: 'High-Torque Planetary Gearbox 10:1',
    sku: 'GBX-PLN-10',
    category: 'Actuators',
    locationId: 'b3021111-3333-4333-8333-333333333333',
    locationName: 'High-Bay Pallet Racking A1',
    locationCode: 'HIGH-BAY-1',
    quantity: 28,
    reservedQuantity: 3,
    unitPrice: 310.00,
    status: 'Low Stock'
  },
  {
    id: 'stk-013',
    productId: 'c1100000-0000-4000-8000-000000000010',
    productName: 'Brushless DC Servo Drive 48V',
    sku: 'DRV-BLDC-48',
    category: 'Controllers',
    locationId: 'b3021111-3333-4333-8333-333333333333',
    locationName: 'High-Bay Pallet Racking A1',
    locationCode: 'HIGH-BAY-1',
    quantity: 110,
    reservedQuantity: 15,
    unitPrice: 430.00,
    status: 'In Stock'
  },
  {
    id: 'stk-014',
    productId: 'c1090000-0000-4000-8000-000000000009',
    productName: 'Reinforced Hydraulic Hose 50m',
    sku: 'HYD-HSE-50',
    category: 'Pneumatics',
    locationId: 'b3031111-3333-4333-8333-333333333333',
    locationName: 'High-Bay Pallet Racking B2',
    locationCode: 'HIGH-BAY-2',
    quantity: 15,
    reservedQuantity: 2,
    unitPrice: 198.00,
    status: 'Low Stock'
  },

  // West Coast Distribution
  {
    id: 'stk-015',
    productId: 'c1060000-0000-4000-8000-000000000006',
    productName: 'Thermal Imaging Camera Module',
    sku: 'CAM-THM-64',
    category: 'Sensors & IoT',
    locationId: 'b4011111-4444-4444-8444-444444444444',
    locationName: 'Fast-Moving Pick Zone 1',
    locationCode: 'PAC-RACK-1',
    quantity: 62,
    reservedQuantity: 4,
    unitPrice: 1250.00,
    status: 'In Stock'
  },
  {
    id: 'stk-016',
    productId: 'c1120000-0000-4000-8000-000000000012',
    productName: 'DIN-Rail Power Supply 24V 10A',
    sku: 'PWR-DIN-24',
    category: 'Power & Relays',
    locationId: 'b4011111-4444-4444-8444-444444444444',
    locationName: 'Fast-Moving Pick Zone 1',
    locationCode: 'PAC-RACK-1',
    quantity: 88,
    reservedQuantity: 10,
    unitPrice: 115.00,
    status: 'In Stock'
  },

  // European Gateway Hub
  {
    id: 'stk-017',
    productId: 'c1050000-0000-4000-8000-000000000005',
    productName: 'Programmable Logic Controller (PLC)',
    sku: 'CTL-PLC-16',
    category: 'Controllers',
    locationId: 'b5021111-5555-4555-8555-555555555555',
    locationName: 'Automated Shuttle Rack A',
    locationCode: 'EUR-RCK-A',
    quantity: 30,
    reservedQuantity: 0,
    unitPrice: 890.00,
    status: 'In Stock'
  },
  {
    id: 'stk-018',
    productId: 'c1070000-0000-4000-8000-000000000007',
    productName: 'Industrial Ethernet Switch 8-Port',
    sku: 'NET-SWT-08',
    category: 'Networking',
    locationId: 'b5021111-5555-4555-8555-555555555555',
    locationName: 'Automated Shuttle Rack A',
    locationCode: 'EUR-RCK-A',
    quantity: 75,
    reservedQuantity: 10,
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
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err) {
      logger.warn('Direct SQL findLocationStock failed:', err.message);
    }

    return memoryStock.filter(stk => stk.locationId === locationId);
  }
}
