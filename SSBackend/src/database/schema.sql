-- =============================================================================
-- Database Schema for Direct PostgreSQL (Supabase, Railway, Neon, Local ready)
-- Idempotent initialization: Safe to execute multiple times
-- =============================================================================

-- Enable pgcrypto extension for gen_random_uuid() if not available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'INVENTORY_MANAGER', 'STAFF')),
  department VARCHAR(100) NOT NULL DEFAULT 'Warehouse',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. OTP Verification Table
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'Layers',
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  barcode VARCHAR(100),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name VARCHAR(100),
  category VARCHAR(100),
  uom VARCHAR(50) NOT NULL DEFAULT 'pcs',
  unit VARCHAR(50) NOT NULL DEFAULT 'pcs',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  available_qty INT NOT NULL DEFAULT 0,
  reserved_qty INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 10,
  warehouse VARCHAR(150),
  status VARCHAR(50) NOT NULL DEFAULT 'In Stock',
  supplier VARCHAR(150),
  description TEXT,
  image VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Backward compatibility columns if products table existed before
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_name VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS uom VARCHAR(50) DEFAULT 'pcs';
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50) DEFAULT 'pcs';
ALTER TABLE products ADD COLUMN IF NOT EXISTS available_qty INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_qty INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warehouse VARCHAR(150);
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'In Stock';
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier VARCHAR(150);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image VARCHAR(255);

-- 4. Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  address TEXT,
  manager_name VARCHAR(150),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(code);
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON warehouses(is_active);

-- 5. Sub-Locations & Racks Table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'INTERNAL' CHECK (type IN ('INTERNAL', 'VENDOR', 'CUSTOMER', 'SCRAP', 'TRANSIT')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(warehouse_id, code)
);

CREATE INDEX IF NOT EXISTS idx_locations_warehouse_id ON locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

-- 6. Stock Levels per Location Table
CREATE TABLE IF NOT EXISTS stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_stock_levels_product_id ON stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_location_id ON stock_levels(location_id);

-- 7. Operations Table (Receipts, Deliveries, Internal Transfers, Adjustments)
CREATE TABLE IF NOT EXISTS operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_number VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT')),
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED')),
  partner_name VARCHAR(255),
  source_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  dest_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  reference_note TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  validated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_operations_type ON operations(type);
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status);
CREATE INDEX IF NOT EXISTS idx_operations_number ON operations(operation_number);

-- 8. Operation Line Items Table
CREATE TABLE IF NOT EXISTS operation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  demanded_qty INT NOT NULL DEFAULT 1,
  done_qty INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_operation_items_op_id ON operation_items(operation_id);
CREATE INDEX IF NOT EXISTS idx_operation_items_product_id ON operation_items(product_id);

-- 9. Stock Ledger (Audit Trail for every physical stock move)
CREATE TABLE IF NOT EXISTS stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity_change INT NOT NULL,
  move_type VARCHAR(50) NOT NULL CHECK (move_type IN ('RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT')),
  reference_number VARCHAR(100) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_product_id ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_location_id ON stock_ledger(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_ref ON stock_ledger(reference_number);
