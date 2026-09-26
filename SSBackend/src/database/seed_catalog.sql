-- =============================================================================
-- StockSense: Railway PostgreSQL Categories & Products Seed Script
-- Idempotent: Safe to execute multiple times
-- =============================================================================

-- 1. Insert Categories
INSERT INTO categories (name, code, description, icon, status)
VALUES 
  ('Sensors & IoT', 'SENSORS', 'Thermal, optical, torque, proximity, and vibration telemetry devices', 'Radar', 'Active'),
  ('Actuators', 'ACTUATORS', 'Electric motors, servo actuators, linear stages, and planetary drives', 'Cpu', 'Active'),
  ('Controllers', 'CONTROLLERS', 'Programmable logic controllers, CNC heads, and embedded compute units', 'Sliders', 'Active'),
  ('Pneumatics', 'PNEUMATICS', 'Valves, air cylinders, pressure regulators, and high-pressure tubing', 'Wind', 'Active'),
  ('Networking', 'NETWORK', 'Industrial switches, wireless gateways, fieldbus interfaces, and serial servers', 'Network', 'Active'),
  ('Power & Relays', 'POWER', '24V/48V DIN-rail power supplies, solid-state relays, and battery backups', 'Zap', 'Active'),
  ('Fasteners & Seals', 'FASTENERS', 'O-rings, high-tensile metric bolts, mounting brackets, and seals', 'Layers', 'Active'),
  ('Raw Materials', 'RAWMAT', 'Steel rods, aluminum billets, structural frames, and sheet metal', 'Boxes', 'Active')
ON CONFLICT (name) DO UPDATE 
SET 
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

-- 2. Insert Products Catalog
INSERT INTO products (
  name, sku, barcode, category_name, uom, price, cost_price, 
  available_qty, reserved_qty, reorder_level, warehouse, status, supplier, description, image
)
VALUES 
  (
    'Industrial Torque Sensor TS-90', 
    'SEN-TRQ-90', 
    '8901234567890', 
    'Sensors & IoT', 
    'pcs', 
    349.00, 
    210.00, 
    142, 
    18, 
    50, 
    'West Coast Hub', 
    'In Stock', 
    'Apex Dynamics Corp', 
    'High-precision industrial torque sensor with CAN bus and RS-485 interfaces.', 
    'Radar'
  ),
  (
    'Precision Stepper Motor 24V', 
    'MOT-STP-24', 
    '8901234567891', 
    'Actuators', 
    'pcs', 
    89.50, 
    52.00, 
    28, 
    12, 
    40, 
    'Central Logistics Hub', 
    'Low Stock', 
    'Apex Dynamics Corp', 
    'NEMA 23 bipolar stepper motor with 1.8 degree step angle and 1.26 Nm holding torque.', 
    'Cpu'
  ),
  (
    'Optical Laser Distance Gauge', 
    'SEN-OPT-04', 
    '8901234567892', 
    'Sensors & IoT', 
    'pcs', 
    520.00, 
    340.00, 
    0, 
    5, 
    25, 
    'East Coast Dist', 
    'Out of Stock', 
    'LuminoTech Precision', 
    'Class II optical laser rangefinder with ±1mm accuracy over 50m distance.', 
    'Radar'
  ),
  (
    'Heavy Duty Pneumatic Cylinder', 
    'PNE-CYL-80', 
    '8901234567893', 
    'Pneumatics', 
    'pcs', 
    145.00, 
    88.00, 
    85, 
    10, 
    30, 
    'Southern Regional Depot', 
    'In Stock', 
    'Vortex Flow Systems', 
    'ISO 15552 standard pneumatic cylinder with adjustable end-position cushioning.', 
    'Wind'
  ),
  (
    'Programmable Logic Controller (PLC)', 
    'CTL-PLC-16', 
    '8901234567894', 
    'Controllers', 
    'pcs', 
    890.00, 
    580.00, 
    14, 
    8, 
    20, 
    'Central Logistics Hub', 
    'Low Stock', 
    'ElectroCore Global', 
    'Modular PLC with 16 digital inputs, 16 relay outputs, Ethernet/IP and Modbus TCP.', 
    'Sliders'
  ),
  (
    'Thermal Imaging Camera Module', 
    'CAM-THM-64', 
    '8901234567895', 
    'Sensors & IoT', 
    'pcs', 
    1250.00, 
    810.00, 
    62, 
    4, 
    20, 
    'West Coast Hub', 
    'In Stock', 
    'LuminoTech Precision', 
    'Long-wave infrared thermal camera core 640x512 with 30Hz frame rate.', 
    'Radar'
  ),
  (
    'Industrial Ethernet Switch 8-Port', 
    'NET-SWT-08', 
    '8901234567896', 
    'Networking', 
    'pcs', 
    275.00, 
    165.00, 
    195, 
    25, 
    40, 
    'East Coast Dist', 
    'In Stock', 
    'ElectroCore Global', 
    'DIN-rail managed Gigabit Ethernet switch with redundant DC power inputs.', 
    'Network'
  ),
  (
    'High-Torque Planetary Gearbox 10:1', 
    'GBX-PLN-10', 
    '8901234567897', 
    'Actuators', 
    'pcs', 
    310.00, 
    195.00, 
    9, 
    3, 
    15, 
    'Southern Regional Depot', 
    'Low Stock', 
    'Apex Dynamics Corp', 
    'Precision low-backlash planetary reducer for servo motors.', 
    'Cpu'
  ),
  (
    'Reinforced Hydraulic Hose 50m', 
    'HYD-HSE-50', 
    '8901234567898', 
    'Pneumatics', 
    'rolls', 
    198.00, 
    115.00, 
    0, 
    0, 
    20, 
    'Central Logistics Hub', 
    'Out of Stock', 
    'Vortex Flow Systems', 
    'Four-spiral steel wire reinforced rubber hose rated up to 450 bar working pressure.', 
    'Wind'
  ),
  (
    'Brushless DC Servo Drive 48V', 
    'DRV-BLDC-48', 
    '8901234567899', 
    'Controllers', 
    'pcs', 
    430.00, 
    280.00, 
    110, 
    15, 
    35, 
    'West Coast Hub', 
    'In Stock', 
    'ElectroCore Global', 
    'Digital servo drive with CANopen, EtherCAT, and integrated safety torque-off.', 
    'Sliders'
  ),
  (
    'Steel Rods 25mm x 2m', 
    'STL-ROD-01', 
    '8901234567800', 
    'Raw Materials', 
    'pcs', 
    45.00, 
    28.00, 
    50, 
    0, 
    20, 
    'Main Store', 
    'In Stock', 
    'Titanium Mechanical Inc', 
    'Cold-rolled carbon steel round rods for production and fabrication.', 
    'Boxes'
  )
ON CONFLICT (sku) DO UPDATE 
SET 
  name = EXCLUDED.name,
  barcode = EXCLUDED.barcode,
  category_name = EXCLUDED.category_name,
  uom = EXCLUDED.uom,
  price = EXCLUDED.price,
  cost_price = EXCLUDED.cost_price,
  available_qty = EXCLUDED.available_qty,
  reserved_qty = EXCLUDED.reserved_qty,
  reorder_level = EXCLUDED.reorder_level,
  warehouse = EXCLUDED.warehouse,
  status = EXCLUDED.status,
  supplier = EXCLUDED.supplier,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- 3. Link Category Foreign Keys
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category_name = c.name AND p.category_id IS NULL;

-- 4. Verification Query
SELECT id, name, sku, category_name, uom, price, available_qty, reorder_level, status 
FROM products 
ORDER BY name ASC;
