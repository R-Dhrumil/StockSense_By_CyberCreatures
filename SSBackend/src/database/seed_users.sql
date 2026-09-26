-- =============================================================================
-- StockSense: Railway PostgreSQL Users Seed Script
-- Idempotent: Safe to execute in Railway Query Editor, Supabase, Neon, or psql
-- =============================================================================

-- 1. Ensure required extensions & table exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- 2. Insert / Update Demo Accounts with Valid Bcrypt (Cost Factor 10)
-- Passwords:
--   admin@stocksense.io          -> Admin@1234
--   sarah.jenkins@stocksense.io  -> Manager@1234
--   marcus.vance@stocksense.io   -> Staff@1234

INSERT INTO users (name, email, password, role, department, is_active)
VALUES 
  (
    'Alexandria Vance', 
    'admin@stocksense.io', 
    '$2a$10$GEkgLzs2J2IeBvFTTVBknevGehnP1nCS223PeqSQeHvEG07QPtL.y', 
    'ADMIN', 
    'Executive Operations', 
    TRUE
  ),
  (
    'Sarah Jenkins', 
    'sarah.jenkins@stocksense.io', 
    '$2a$10$v46mBxtPnWGLoa.r9Q2Qluvww0wc821ryxN8FtNHfbp8AsoKjmUvW', 
    'INVENTORY_MANAGER', 
    'Inventory Control', 
    TRUE
  ),
  (
    'Marcus Vance', 
    'marcus.vance@stocksense.io', 
    '$2a$10$8xqx4nvKGj5dtJBRKJSNGOtUnXIXE/FB158GIr2fZSzv1ZkJ5mO.G', 
    'STAFF', 
    'Warehouse Floor', 
    TRUE
  )
ON CONFLICT (email) DO UPDATE 
SET 
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

-- 3. Verification Query
SELECT id, name, email, role, department, is_active, created_at 
FROM users 
WHERE email IN ('admin@stocksense.io', 'sarah.jenkins@stocksense.io', 'marcus.vance@stocksense.io');
