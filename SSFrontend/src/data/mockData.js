// ============================================================================
// StockSense B2B SaaS — Enterprise Mock Data Store
// Realistic, consistent sample data across all 13 modules
// ============================================================================

export const INITIAL_PRODUCTS = [
  {
    id: 'PRD-1001',
    name: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    barcode: '8901234567890',
    category: 'Sensors & IoT',
    price: 349.00,
    costPrice: 210.00,
    availableQty: 142,
    reservedQty: 18,
    reorderLevel: 50,
    warehouse: 'West Coast Hub',
    status: 'In Stock',
    unit: 'pcs',
    supplier: 'Apex Dynamics Corp',
    description: 'High-precision industrial torque sensor with CAN bus and RS-485 interfaces.',
    image: 'Zap'
  },
  {
    id: 'PRD-1002',
    name: 'Precision Stepper Motor 24V',
    sku: 'MOT-STP-24',
    barcode: '8901234567891',
    category: 'Actuators',
    price: 89.50,
    costPrice: 52.00,
    availableQty: 28,
    reservedQty: 12,
    reorderLevel: 40,
    warehouse: 'Central Logistics Hub',
    status: 'Low Stock',
    unit: 'pcs',
    supplier: 'Apex Dynamics Corp',
    description: 'NEMA 23 bipolar stepper motor with 1.8 degree step angle and 1.26 Nm holding torque.',
    image: 'Cpu'
  },
  {
    id: 'PRD-1003',
    name: 'Optical Laser Distance Gauge',
    sku: 'SEN-OPT-04',
    barcode: '8901234567892',
    category: 'Sensors & IoT',
    price: 520.00,
    costPrice: 340.00,
    availableQty: 0,
    reservedQty: 5,
    reorderLevel: 25,
    warehouse: 'East Coast Dist',
    status: 'Out of Stock',
    unit: 'pcs',
    supplier: 'LuminoTech Precision',
    description: 'Class II optical laser rangefinder with ±1mm accuracy over 50m distance.',
    image: 'Camera'
  },
  {
    id: 'PRD-1004',
    name: 'Heavy Duty Pneumatic Cylinder',
    sku: 'PNE-CYL-80',
    barcode: '8901234567893',
    category: 'Pneumatics',
    price: 145.00,
    costPrice: 88.00,
    availableQty: 85,
    reservedQty: 10,
    reorderLevel: 30,
    warehouse: 'Southern Regional Depot',
    status: 'In Stock',
    unit: 'pcs',
    supplier: 'Vortex Flow Systems',
    description: 'ISO 15552 standard pneumatic cylinder with adjustable end-position cushioning.',
    image: 'Layers'
  },
  {
    id: 'PRD-1005',
    name: 'Programmable Logic Controller (PLC)',
    sku: 'CTL-PLC-16',
    barcode: '8901234567894',
    category: 'Controllers',
    price: 890.00,
    costPrice: 580.00,
    availableQty: 14,
    reservedQty: 8,
    reorderLevel: 20,
    warehouse: 'Central Logistics Hub',
    status: 'Low Stock',
    unit: 'pcs',
    supplier: 'ElectroCore Global',
    description: 'Modular PLC with 16 digital inputs, 16 relay outputs, Ethernet/IP and Modbus TCP.',
    image: 'Sliders'
  },
  {
    id: 'PRD-1006',
    name: 'Thermal Imaging Camera Module',
    sku: 'CAM-THM-64',
    barcode: '8901234567895',
    category: 'Sensors & IoT',
    price: 1250.00,
    costPrice: 810.00,
    availableQty: 62,
    reservedQty: 4,
    reorderLevel: 20,
    warehouse: 'West Coast Hub',
    status: 'In Stock',
    unit: 'pcs',
    supplier: 'LuminoTech Precision',
    description: 'Long-wave infrared thermal camera core 640x512 with 30Hz frame rate.',
    image: 'Camera'
  },
  {
    id: 'PRD-1007',
    name: 'Industrial Ethernet Switch 8-Port',
    sku: 'NET-SWT-08',
    barcode: '8901234567896',
    category: 'Networking',
    price: 275.00,
    costPrice: 165.00,
    availableQty: 195,
    reservedQty: 25,
    reorderLevel: 40,
    warehouse: 'East Coast Dist',
    status: 'In Stock',
    unit: 'pcs',
    supplier: 'ElectroCore Global',
    description: 'DIN-rail managed Gigabit Ethernet switch with redundant DC power inputs.',
    image: 'Plug'
  },
  {
    id: 'PRD-1008',
    name: 'High-Torque Planetary Gearbox 10:1',
    sku: 'GBX-PLN-10',
    barcode: '8901234567897',
    category: 'Actuators',
    price: 310.00,
    costPrice: 195.00,
    availableQty: 9,
    reservedQty: 3,
    reorderLevel: 15,
    warehouse: 'Southern Regional Depot',
    status: 'Low Stock',
    unit: 'pcs',
    supplier: 'Apex Dynamics Corp',
    description: 'Precision low-backlash planetary reducer for servo motors.',
    image: 'Wrench'
  },
  {
    id: 'PRD-1009',
    name: 'Reinforced Hydraulic Hose 50m',
    sku: 'HYD-HSE-50',
    barcode: '8901234567898',
    category: 'Pneumatics',
    price: 198.00,
    costPrice: 115.00,
    availableQty: 0,
    reservedQty: 0,
    reorderLevel: 20,
    warehouse: 'Central Logistics Hub',
    status: 'Out of Stock',
    unit: 'rolls',
    supplier: 'Vortex Flow Systems',
    description: 'Four-spiral steel wire reinforced rubber hose rated up to 450 bar working pressure.',
    image: 'Layers'
  },
  {
    id: 'PRD-1010',
    name: 'Brushless DC Servo Drive 48V',
    sku: 'DRV-BLDC-48',
    barcode: '8901234567899',
    category: 'Controllers',
    price: 430.00,
    costPrice: 280.00,
    availableQty: 110,
    reservedQty: 15,
    reorderLevel: 35,
    warehouse: 'West Coast Hub',
    status: 'In Stock',
    unit: 'pcs',
    supplier: 'ElectroCore Global',
    description: 'Digital servo drive with CANopen, EtherCAT, and integrated safety torque-off.',
    image: 'Sliders'
  }
];

export const INITIAL_CATEGORIES = [
  { id: 'CAT-1', name: 'Sensors & IoT', count: 48, stockValue: 84200, icon: 'Radar', status: 'Active', description: 'Thermal, optical, torque, proximity, and vibration telemetry devices' },
  { id: 'CAT-2', name: 'Actuators', count: 32, stockValue: 46800, icon: 'Cpu', status: 'Active', description: 'Electric motors, servo actuators, linear stages, and planetary drives' },
  { id: 'CAT-3', name: 'Controllers', count: 26, stockValue: 62400, icon: 'Sliders', status: 'Active', description: 'Programmable logic controllers, CNC heads, and embedded compute units' },
  { id: 'CAT-4', name: 'Pneumatics', count: 41, stockValue: 39100, icon: 'Wind', status: 'Active', description: 'Valves, air cylinders, pressure regulators, and high-pressure tubing' },
  { id: 'CAT-5', name: 'Networking', count: 19, stockValue: 28500, icon: 'Network', status: 'Active', description: 'Industrial switches, wireless gateways, fieldbus interfaces, and serial servers' },
  { id: 'CAT-6', name: 'Power & Relays', count: 35, stockValue: 31200, icon: 'Zap', status: 'Active', description: '24V/48V DIN-rail power supplies, solid-state relays, and battery backups' },
  { id: 'CAT-7', name: 'Fasteners & Seals', count: 72, stockValue: 18900, icon: 'Layers', status: 'Active', description: 'O-rings, high-tensile metric bolts, mounting brackets, and seals' },
  { id: 'CAT-8', name: 'Legacy Hardware', count: 6, stockValue: 4200, icon: 'Archive', status: 'Archived', description: 'Discontinued models kept for client maintenance and warranty spares' }
];

export const INITIAL_WAREHOUSES = [
  {
    id: 'WH-01',
    name: 'West Coast Hub',
    code: 'WCH-01',
    location: 'Oakland, California, USA',
    manager: 'Sarah Jenkins',
    email: 's.jenkins@stocksense.io',
    phone: '+1 (510) 844-9210',
    capacity: 12000,
    usedCapacity: 9840,
    totalProducts: 148,
    inventoryValue: 384500,
    status: 'Operational'
  },
  {
    id: 'WH-02',
    name: 'Central Logistics Hub',
    code: 'CLH-02',
    location: 'Dallas, Texas, USA',
    manager: 'Marcus Vance',
    email: 'm.vance@stocksense.io',
    phone: '+1 (214) 730-8199',
    capacity: 18000,
    usedCapacity: 15300,
    totalProducts: 215,
    inventoryValue: 542000,
    status: 'Operational'
  },
  {
    id: 'WH-03',
    name: 'East Coast Dist Center',
    code: 'ECD-03',
    location: 'Allentown, Pennsylvania, USA',
    manager: 'Elena Rostova',
    email: 'e.rostova@stocksense.io',
    phone: '+1 (610) 552-4411',
    capacity: 10000,
    usedCapacity: 4200,
    totalProducts: 94,
    inventoryValue: 218400,
    status: 'Operational'
  },
  {
    id: 'WH-04',
    name: 'Southern Regional Depot',
    code: 'SRD-04',
    location: 'Atlanta, Georgia, USA',
    manager: 'Devon Patel',
    email: 'd.patel@stocksense.io',
    phone: '+1 (404) 919-6320',
    capacity: 8500,
    usedCapacity: 7820,
    totalProducts: 112,
    inventoryValue: 295100,
    status: 'Near Capacity'
  }
];

export const INITIAL_SUPPLIERS = [
  {
    id: 'SUP-01',
    name: 'Apex Dynamics Corp',
    contactPerson: 'David Sterling',
    email: 'd.sterling@apexdynamics.com',
    phone: '+1 (312) 555-0144',
    location: 'Chicago, IL',
    rating: 4.8,
    activeOrders: 3,
    leadTimeDays: 7,
    suppliedCategories: ['Actuators', 'Sensors & IoT'],
    paymentTerms: 'Net 30'
  },
  {
    id: 'SUP-02',
    name: 'LuminoTech Precision',
    contactPerson: 'Karin Lindqvist',
    email: 'k.lindqvist@luminotech.se',
    phone: '+46 8 123 4567',
    location: 'Stockholm, Sweden',
    rating: 4.9,
    activeOrders: 1,
    leadTimeDays: 14,
    suppliedCategories: ['Sensors & IoT'],
    paymentTerms: 'Net 45'
  },
  {
    id: 'SUP-03',
    name: 'Vortex Flow Systems',
    contactPerson: 'Robert Chen',
    email: 'chen.r@vortexflow.com',
    phone: '+1 (713) 442-9901',
    location: 'Houston, TX',
    rating: 4.5,
    activeOrders: 2,
    leadTimeDays: 10,
    suppliedCategories: ['Pneumatics'],
    paymentTerms: 'Net 30'
  },
  {
    id: 'SUP-04',
    name: 'ElectroCore Global',
    contactPerson: 'Amara Okafor',
    email: 'a.okafor@electrocore.de',
    phone: '+49 89 9876 543',
    location: 'Munich, Germany',
    rating: 4.7,
    activeOrders: 4,
    leadTimeDays: 12,
    suppliedCategories: ['Controllers', 'Networking'],
    paymentTerms: 'Net 60'
  },
  {
    id: 'SUP-05',
    name: 'Titanium Mechanical Inc',
    contactPerson: 'Gregory Hayes',
    email: 'g.hayes@titaniummech.com',
    phone: '+1 (216) 334-1188',
    location: 'Cleveland, OH',
    rating: 4.3,
    activeOrders: 0,
    leadTimeDays: 15,
    suppliedCategories: ['Fasteners & Seals'],
    paymentTerms: 'Net 30'
  }
];

export const INITIAL_PURCHASE_ORDERS = [
  {
    id: 'PO-2026-001',
    supplier: 'Apex Dynamics Corp',
    orderDate: '2026-09-18',
    expectedDelivery: '2026-09-28',
    warehouse: 'West Coast Hub',
    itemsCount: 3,
    totalAmount: 14850.00,
    status: 'Ordered',
    paymentStatus: 'Pending',
    items: [
      { name: 'Precision Stepper Motor 24V', sku: 'MOT-STP-24', qty: 50, unitCost: 52.00, total: 2600.00 },
      { name: 'Industrial Torque Sensor TS-90', sku: 'SEN-TRQ-90', qty: 40, unitCost: 210.00, total: 8400.00 },
      { name: 'High-Torque Planetary Gearbox 10:1', sku: 'GBX-PLN-10', qty: 20, unitCost: 192.50, total: 3850.00 }
    ]
  },
  {
    id: 'PO-2026-002',
    supplier: 'LuminoTech Precision',
    orderDate: '2026-09-15',
    expectedDelivery: '2026-09-25',
    warehouse: 'East Coast Dist Center',
    itemsCount: 2,
    totalAmount: 22400.00,
    status: 'Partially Received',
    paymentStatus: 'Paid',
    items: [
      { name: 'Optical Laser Distance Gauge', sku: 'SEN-OPT-04', qty: 40, unitCost: 340.00, total: 13600.00 },
      { name: 'Thermal Imaging Camera Module', sku: 'CAM-THM-64', qty: 10, unitCost: 880.00, total: 8800.00 }
    ]
  },
  {
    id: 'PO-2026-003',
    supplier: 'ElectroCore Global',
    orderDate: '2026-09-20',
    expectedDelivery: '2026-10-04',
    warehouse: 'Central Logistics Hub',
    itemsCount: 2,
    totalAmount: 17400.00,
    status: 'Ordered',
    paymentStatus: 'Pending',
    items: [
      { name: 'Programmable Logic Controller (PLC)', sku: 'CTL-PLC-16', qty: 20, unitCost: 580.00, total: 11600.00 },
      { name: 'Brushless DC Servo Drive 48V', sku: 'DRV-BLDC-48', qty: 20, unitCost: 290.00, total: 5800.00 }
    ]
  },
  {
    id: 'PO-2026-004',
    supplier: 'Vortex Flow Systems',
    orderDate: '2026-09-10',
    expectedDelivery: '2026-09-19',
    warehouse: 'Southern Regional Depot',
    itemsCount: 1,
    totalAmount: 6900.00,
    status: 'Received',
    paymentStatus: 'Paid',
    items: [
      { name: 'Heavy Duty Pneumatic Cylinder', sku: 'PNE-CYL-80', qty: 75, unitCost: 92.00, total: 6900.00 }
    ]
  },
  {
    id: 'PO-2026-005',
    supplier: 'Apex Dynamics Corp',
    orderDate: '2026-09-24',
    expectedDelivery: '2026-10-06',
    warehouse: 'Central Logistics Hub',
    itemsCount: 1,
    totalAmount: 4200.00,
    status: 'Draft',
    paymentStatus: 'Unpaid',
    items: [
      { name: 'Industrial Torque Sensor TS-90', sku: 'SEN-TRQ-90', qty: 20, unitCost: 210.00, total: 4200.00 }
    ]
  },
  {
    id: 'PO-2026-006',
    supplier: 'Titanium Mechanical Inc',
    orderDate: '2026-09-02',
    expectedDelivery: '2026-09-14',
    warehouse: 'East Coast Dist Center',
    itemsCount: 3,
    totalAmount: 3100.00,
    status: 'Cancelled',
    paymentStatus: 'Refunded',
    items: [
      { name: 'M12 High-Tensile Bolts Box', sku: 'FAS-M12-BX', qty: 100, unitCost: 31.00, total: 3100.00 }
    ]
  }
];

export const INITIAL_SALES_ORDERS = [
  {
    id: 'SO-8841',
    customer: 'CyberRobotics Automation Ltd',
    contact: 'Markus Weber',
    date: '2026-09-24',
    expectedDispatch: '2026-09-27',
    total: 18450.00,
    itemCount: 4,
    fulfillmentStatus: 'Dispatched',
    paymentStatus: 'Paid',
    destination: 'Austin, TX',
    shippingCarrier: 'FedEx Freight (Priority)',
    trackingNumber: 'FX-8849102941'
  },
  {
    id: 'SO-8842',
    customer: 'Nordic Mechatronics AS',
    contact: 'Freja Nygard',
    date: '2026-09-25',
    expectedDispatch: '2026-09-28',
    total: 8920.00,
    itemCount: 2,
    fulfillmentStatus: 'Picked',
    paymentStatus: 'Paid',
    destination: 'Oslo, Norway',
    shippingCarrier: 'DHL Global Express',
    trackingNumber: 'DHL-99410244'
  },
  {
    id: 'SO-8843',
    customer: 'Atlas Manufacturing Group',
    contact: 'Jonathan Ward',
    date: '2026-09-25',
    expectedDispatch: '2026-09-29',
    total: 31200.00,
    itemCount: 6,
    fulfillmentStatus: 'Allocated',
    paymentStatus: 'Pending',
    destination: 'Detroit, MI',
    shippingCarrier: 'UPS Supply Chain',
    trackingNumber: 'Pending'
  },
  {
    id: 'SO-8844',
    customer: 'BioGenics Medical Devices',
    contact: 'Dr. Sandra Lee',
    date: '2026-09-26',
    expectedDispatch: '2026-09-30',
    total: 12400.00,
    itemCount: 3,
    fulfillmentStatus: 'Pending',
    paymentStatus: 'Paid',
    destination: 'Boston, MA',
    shippingCarrier: 'FedEx Express',
    trackingNumber: 'Pending'
  },
  {
    id: 'SO-8845',
    customer: 'Quantum Precision Tools',
    contact: 'Klaus Schmidt',
    date: '2026-09-20',
    expectedDispatch: '2026-09-22',
    total: 24700.00,
    itemCount: 5,
    fulfillmentStatus: 'Delivered',
    paymentStatus: 'Paid',
    destination: 'Munich, Germany',
    shippingCarrier: 'DB Schenker',
    trackingNumber: 'DBS-44102911'
  }
];

export const INITIAL_STOCK_MOVEMENTS = [
  {
    id: 'MOV-9101',
    date: '2026-09-26 09:42',
    type: 'Adjusted',
    product: 'Industrial Torque Sensor TS-90',
    sku: 'SEN-TRQ-90',
    qty: -2,
    source: 'West Coast Hub (Aisle 4)',
    destination: 'Damaged Goods / Scrap',
    reference: 'ADJ-2026-88',
    user: 'Sarah Jenkins',
    reason: 'Calibration failure during routine QA testing'
  },
  {
    id: 'MOV-9102',
    date: '2026-09-25 16:15',
    type: 'Received',
    product: 'Heavy Duty Pneumatic Cylinder',
    sku: 'PNE-CYL-80',
    qty: 75,
    source: 'Vortex Flow Systems',
    destination: 'Southern Regional Depot',
    reference: 'PO-2026-004',
    user: 'Devon Patel',
    reason: 'Purchase order receipt fulfillment'
  },
  {
    id: 'MOV-9103',
    date: '2026-09-25 14:30',
    type: 'Transferred',
    product: 'Optical Laser Distance Gauge',
    sku: 'SEN-OPT-04',
    qty: 15,
    source: 'Central Logistics Hub',
    destination: 'West Coast Hub',
    reference: 'TRF-2026-14',
    user: 'Marcus Vance',
    reason: 'Regional balance reallocation for SO-8841'
  },
  {
    id: 'MOV-9104',
    date: '2026-09-25 11:20',
    type: 'Issued',
    product: 'Precision Stepper Motor 24V',
    sku: 'MOT-STP-24',
    qty: -12,
    source: 'Central Logistics Hub',
    destination: 'CyberRobotics Order SO-8841',
    reference: 'SO-8841',
    user: 'Marcus Vance',
    reason: 'Sales order dispatch pick list'
  },
  {
    id: 'MOV-9105',
    date: '2026-09-24 15:45',
    type: 'Returned',
    product: 'Programmable Logic Controller (PLC)',
    sku: 'CTL-PLC-16',
    qty: 1,
    source: 'Nordic Mechatronics AS',
    destination: 'West Coast Hub (Quarantine)',
    reference: 'RMA-2026-09',
    user: 'Sarah Jenkins',
    reason: 'Customer ordered incorrect firmware variant'
  },
  {
    id: 'MOV-9106',
    date: '2026-09-24 08:30',
    type: 'Received',
    product: 'Industrial Ethernet Switch 8-Port',
    sku: 'NET-SWT-08',
    qty: 50,
    source: 'ElectroCore Global',
    destination: 'East Coast Dist Center',
    reference: 'PO-2026-002',
    user: 'Elena Rostova',
    reason: 'Scheduled inbound stock replenishment'
  }
];

export const INITIAL_USERS = [
  {
    id: 'USR-01',
    name: 'Alexandria Vance',
    email: 'a.vance@stocksense.io',
    role: 'Admin',
    department: 'Executive Operations',
    location: 'San Francisco HQ',
    status: 'Active',
    lastActive: 'Just now',
    avatar: 'AV'
  },
  {
    id: 'USR-02',
    name: 'Sarah Jenkins',
    email: 's.jenkins@stocksense.io',
    role: 'Inventory Manager',
    department: 'West Operations',
    location: 'Oakland, CA',
    status: 'Active',
    lastActive: '12m ago',
    avatar: 'SJ'
  },
  {
    id: 'USR-03',
    name: 'Marcus Vance',
    email: 'm.vance@stocksense.io',
    role: 'Warehouse Staff',
    department: 'Central Fulfillment',
    location: 'Dallas, TX',
    status: 'Active',
    lastActive: '1h ago',
    avatar: 'MV'
  },
  {
    id: 'USR-04',
    name: 'Elena Rostova',
    email: 'e.rostova@stocksense.io',
    role: 'Warehouse Staff',
    department: 'East Distribution',
    location: 'Allentown, PA',
    status: 'Active',
    lastActive: '3h ago',
    avatar: 'ER'
  },
  {
    id: 'USR-05',
    name: 'Julian Sterling',
    email: 'j.sterling@cybercreatures.com',
    role: 'Warehouse Staff',
    department: 'Inbound Receiving',
    location: 'Oakland, CA',
    status: 'Active',
    lastActive: 'Yesterday',
    avatar: 'JS'
  },
  {
    id: 'USR-06',
    name: 'Maya Patel',
    email: 'm.patel@stocksense.io',
    role: 'Inventory Manager',
    department: 'Supply Chain Planning',
    location: 'Atlanta, GA',
    status: 'Pending',
    lastActive: 'Invited (Pending)',
    avatar: 'MP'
  }
];

export const ROLE_PERMISSIONS_MATRIX = [
  { module: 'Manage Users & Warehouses (Settings)', admin: 'Full Control', manager: 'No Access', staff: 'No Access' },
  { module: 'Create & Edit Products Catalog', admin: 'Full Control', manager: 'Full Control', staff: 'View Only' },
  { module: 'Create & Validate Receipts (POs)', admin: 'Full Control', manager: 'Full Control', staff: 'View Only' },
  { module: 'Create & Validate Deliveries (SOs)', admin: 'Full Control', manager: 'Full Control', staff: 'Pick & Pack Only' },
  { module: 'Create & Validate Internal Transfers', admin: 'Full Control', manager: 'Full Control', staff: 'Create & Execute' },
  { module: 'Enter Stock Adjustment Counts', admin: 'Full Control', manager: 'Validate & Approve', staff: 'Count Entry Only' },
  { module: 'Live Dashboard Telemetry', admin: 'Full Access', manager: 'Full Access', staff: 'Read-Only' },
  { module: 'Stock Movement Audit Ledger', admin: 'Full Control + Purge', manager: 'Full Access', staff: 'View Own Moves' },
  { module: 'Financial & Valuation Reports', admin: 'Full Control', manager: 'View & Export', staff: 'No Access' }
];

export const DASHBOARD_TREND_DATA = [
  { month: 'Apr', inventoryValue: 1240, turnover: 4.2, orders: 110 },
  { month: 'May', inventoryValue: 1310, turnover: 4.5, orders: 134 },
  { month: 'Jun', inventoryValue: 1280, turnover: 4.8, orders: 152 },
  { month: 'Jul', inventoryValue: 1420, turnover: 5.1, orders: 168 },
  { month: 'Aug', inventoryValue: 1390, turnover: 4.9, orders: 160 },
  { month: 'Sep', inventoryValue: 1440, turnover: 5.4, orders: 184 }
];

export const CATEGORY_DISTRIBUTION_DATA = [
  { name: 'Sensors & IoT', value: 84200, color: '#F4A576' },
  { name: 'Actuators', value: 46800, color: '#E8894E' },
  { name: 'Controllers', value: 62400, color: '#D6702F' },
  { name: 'Pneumatics', value: 39100, color: '#10B981' },
  { name: 'Networking', value: 28500, color: '#3B82F6' },
  { name: 'Power & Relays', value: 31200, color: '#F59E0B' }
];

export const TOP_MOVING_PRODUCTS = [
  { name: 'Torque Sensor TS-90', volume: 420, revenue: 146580 },
  { name: 'Ethernet Switch 8P', volume: 380, revenue: 104500 },
  { name: 'Servo Drive 48V', volume: 290, revenue: 124700 },
  { name: 'Pneumatic Cylinder', volume: 245, revenue: 35525 },
  { name: 'Stepper Motor 24V', volume: 210, revenue: 18795 }
];

export const STOCK_AGING_DATA = [
  { range: '< 30 Days (Fast)', count: 184, value: 840000, percentage: 58 },
  { range: '30 - 60 Days (Normal)', count: 72, value: 380000, percentage: 26 },
  { range: '61 - 90 Days (Slow)', count: 24, value: 145000, percentage: 10 },
  { range: '> 90 Days (Stagnant)', count: 12, value: 75000, percentage: 6 }
];

export const DEFAULT_NOTIFICATIONS = [
  { id: 'notif-1', title: 'Critical Stock Alert', message: 'Optical Laser Distance Gauge reached 0 pcs in East Coast Dist.', type: 'danger', time: '10m ago', unread: true },
  { id: 'notif-2', title: 'New PO Ordered', message: 'PO-2026-003 placed with ElectroCore Global (₹17,400.00).', type: 'info', time: '45m ago', unread: true },
  { id: 'notif-3', title: 'Inbound Shipment Arrived', message: 'PO-2026-004 heavy pneumatic cylinders checked in at Southern Depot.', type: 'success', time: '2h ago', unread: false },
  { id: 'notif-4', title: 'Low Stock Warning', message: 'High-Torque Planetary Gearbox has only 9 units remaining.', type: 'warning', time: '4h ago', unread: false }
];
