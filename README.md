# StockSense — Enterprise B2B Cloud Inventory & Warehouse Management System (WMS)
> **Built by Team CyberCreatures**  
> *A high-throughput, atomic, multi-facility inventory control and operational telemetry platform.*

---

## 📌 Executive Summary

**StockSense** is an enterprise-grade Warehouse Management and Inventory Orchestration platform designed for industrial supply chains, logistics depots, and multi-tier distribution networks. 

Built to eliminate stock discrepancies, supply chain bottlenecks, and operational silos, StockSense provides real-time stock tracking across distributed hubs, end-to-end order execution pipelines (Inbound Receipts, Outbound Deliveries, Inter-Facility Transfers, and Physical Cycle Count Adjustments), role-based governance, and instant PDF/Excel executive audit reporting.

---

## 🌟 Key Capabilities & Modules

### 1. 🏢 Multi-Warehouse & Sub-Location Management
- **Hierarchical Topography**: Manage facilities (*Main Central Hub*, *Production Facility East*, *Southern Logistics Depot*, *West Coast Distribution*, *European Gateway Hub*) down to granular sub-locations, zones, transit docks, and climate-controlled racks.
- **Global Facility Switcher**: Topbar warehouse selector instantaneously synchronizes telemetry, stock valuations, KPI metrics, task queues, and product availability across the entire application.
- **Volumetric & Capacity Telemetry**: Real-time capacity utilization meters and rack occupancy trackers.

### 2. 📦 Product Master Catalog & Smart CSV Ingestion
- **Industrial SKU & Barcode Engine**: Master catalog tracking SKUs, EAN/UPC barcodes, categories, selling prices, unit costs, dynamic reorder thresholds, and unit-of-measure (UOM).
- **Intelligent CSV Bulk Import**:
  - Built-in template generator (`StockSense_Product_Import_Template.csv`).
  - Fuzzy header matching (`name`/`item`/`title`, `qty`/`stock`, `price`/`mrp`, etc.).
  - Automatic SKU generation, number/currency sanitization, and stock health computation.
  - Live data preview table with validation badges prior to database commit.
  - Resilient offline fallback.

### 3. 🔄 The Core Operations Engine (One Unified State Engine)
Every physical move is powered by atomic PostgreSQL transaction logic and an immutable audit trail (`stock_ledger`):
- **Inbound Receipts (Purchase Orders)**: Vendor procurement check-in, stage-by-stage receiving, and automated inventory ledger accretion.
- **Outbound Deliveries (Sales Orders)**: Strict 3-stage fulfillment workflow:
  1. **Pick**: Soft-reserves inventory, preventing stock double-allocation.
  2. **Pack**: Groups picked goods into parcels with carrier tracking.
  3. **Validate & Dispatch**: Atomically deducts stock from locations and writes a permanent ledger entry.
- **Internal Relocations (Transfers)**: Inter-rack and cross-hub balancing with source and destination validation.
- **Cycle Count Adjustments**: Guided count entry with theoretical vs. counted discrepancy delta calculation and manager validation.

### 4. 📊 Executive Dashboard & Real-Time Telemetry
- **5 Core Operational KPIs**: Instant computation of *Products in Stock*, *Low/Out of Stock Items*, *Pending Receipts*, *Pending Deliveries*, and *Scheduled Internal Transfers*.
- **Dynamic Valuation Trends**: 6-month historical asset valuation charts that dynamically scale to selected facilities.
- **Category Donut Visualization**: Live distribution of stock allocation across technical categories with high-contrast accessibility tooltips.
- **Real-Time WebSockets**: Instant broadcast of critical low-stock thresholds (`alert:low_stock`), inbound check-ins, and dispatch milestones.

### 5. 📑 Audit Ledger & Zero-Dependency Reporting
- **Permanent Stock Ledger**: Append-only transaction history logging every quantity delta, user accountability, timestamp, and audit reason.
- **Client-Side Vector PDF Engine**: Custom-engineered vector PDF report generator that downloads clean, multi-column executive audit trails without external server dependencies.
- **SpreadsheetML Excel (.xlsx) Exporter**: Formatted multi-tab XML spreadsheet downloads for deep financial reconciliation.
- **Executive Analytics**: Valuation turnover velocity, 4-tier stock aging analysis (0-30d, 31-60d, 61-90d, 90d+), and stagnant clearance recommendations.

---

## 👥 User Roles & Access Governance (RBAC)

| Capability / Action | System Admin | Inventory Manager | Warehouse Staff |
|---|:---:|:---:|:---:|
| **Manage Facilities & Locations** | ✅ Full Access | ❌ Read-Only | ❌ Read-Only |
| **Manage Users & Role Assignment** | ✅ Full Access | ❌ Restricted | ❌ Restricted |
| **Product Catalog Creation & Bulk Import** | ✅ Full Access | ✅ Full Access | 👁️ Read-Only Mode |
| **Create & Validate Inbound Receipts (PO)** | ✅ Full Access | ✅ Full Access | ❌ Restricted |
| **Pick & Pack Outbound Deliveries** | ✅ Full Access | ✅ Full Access | ✅ Operator Step |
| **Validate Delivery Dispatch** | ✅ Full Access | ✅ Full Access | ❌ Restricted |
| **Initiate & Execute Internal Transfers** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Physical Count Entry (Adjustments)** | ✅ Full Access | ✅ Full Access | 🟡 Entry Only |
| **Approve & Validate Adjustments** | ✅ Full Access | ✅ Full Access | ❌ Restricted |
| **Financial Valuation & Aging Reports** | ✅ Full Access | ✅ Full Access | ❌ Restricted |

---

## 🛠️ Technology Stack

### Frontend Architecture
- **Core**: React 18 (SPA), React Router v7
- **Build Tooling**: Vite 8 (Ultra-fast HMR, Rollup production bundle)
- **Styling**: Tailored CSS Design System with CSS Custom Properties, modern typography, glassmorphism, and responsive CSS Grid / Flexbox
- **Icons**: Lucide React
- **Data Visualizations**: Recharts (Responsive Area Charts, Pie/Donut Charts)
- **Networking & Real-Time**: Fetch API Client with interceptors + Socket.io Client
- **Document Generation**: Custom pure-JS Vector PDF and SpreadsheetML Excel engine

### Backend Architecture
- **Runtime**: Node.js (ES Modules)
- **Web Framework**: Express.js
- **Database**: PostgreSQL (pg client pool, raw parameterized SQL for maximum speed and safety)
- **Authentication**: JWT (JSON Web Tokens) + Argon2/Bcrypt password hashing
- **Real-Time**: Socket.io Server for low-stock and shipment telemetry
- **Documentation**: Swagger UI & OpenAPI Specification mounted at `/docs`

---

## 📁 Repository Structure

```text
StockSense_By_CyberCreatures/
├── Docs/                           # Architecture specs, build plans, and original design docs
│   ├── StockSense-Build-Plan.md
│   ├── StockSense_Module_Wise_Build_Plan.md
│   └── StockSense.pdf
│
├── SSBackend/                      # REST API & WebSocket Server (Node.js/Express)
│   ├── src/
│   │   ├── config/                 # DB connection pool, environment configuration
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── controllers/            # Request handlers (auth, product, operations, dashboard, etc.)
│   │   ├── database/               # Relational SQL schema, indexes, and industrial seed dataset
│   │   │   ├── schema.sql
│   │   │   └── seed_inventory.sql
│   │   ├── middleware/             # JWT auth validation, role authorization, error handling
│   │   ├── models/                 # Database entity queries (Product, Warehouse, Operation, Ledger)
│   │   ├── routes/                 # Express v1 route mounting
│   │   ├── services/               # Socket.io emitter, automated low-stock alerting
│   │   ├── utils/                  # ApiError, ApiResponse, logger, email templates
│   │   ├── app.js                  # Express middleware configuration
│   │   └── server.js               # HTTP server & Socket.io entry point
│   ├── package.json
│   └── .env.example
│
└── SSFrontend/                     # User Interface Client (React + Vite)
    ├── src/
    │   ├── assets/                 # SVGs, brand assets, icons
    │   ├── components/             # Reusable UI component library
    │   │   ├── common/             # DataTable, Modal, Drawer, KpiCard, StatusBadge, Toast
    │   │   └── layout/             # Topbar, Sidebar, NotificationPanel
    │   ├── pages/                  # Top-level route views
    │   │   ├── Dashboard.jsx       # Real-time metrics, trend area charts, operations feed
    │   │   ├── Products.jsx        # Catalog table, CSV bulk import, product drawer
    │   │   ├── Inventory.jsx       # Multi-facility stock balance, cycle count adjustments
    │   │   ├── Warehouses.jsx      # Hub management, rack sub-location inspection
    │   │   ├── PurchaseOrders.jsx  # Inbound supplier receipts & PO intake
    │   │   ├── SalesOrders.jsx     # Outbound customer deliveries & pick/pack workflow
    │   │   ├── StockMovements.jsx  # Audit ledger move history & vector PDF/Excel export
    │   │   ├── Reports.jsx         # Executive valuation, aging breakdown, top movers
    │   │   ├── Suppliers.jsx       # Approved vendor catalog
    │   │   ├── UsersManagement.jsx # RBAC user directory & role delegation
    │   │   ├── Settings.jsx        # Company profile & warehouse preferences
    │   │   └── Login.jsx           # Secure authentication with demo role quick-switch
    │   ├── services/               # API client, endpoints, and WebSocket subscriptions
    │   ├── utils/                  # Permission matrix, warehouse matching, report export generators
    │   ├── App.jsx                 # Global state orchestration & route tree
    │   ├── App.css                 # Comprehensive design system tokens & theme classes
    │   └── main.jsx                # DOM mount
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Quickstart & Local Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **PostgreSQL**: v14.0 or higher (or a cloud PostgreSQL instance like Neon, Supabase, Railway)
- **Package Manager**: `npm`

---

### 2. Backend Setup (`SSBackend`)

1. **Navigate to the backend directory**:
   ```bash
   cd SSBackend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in `SSBackend/` (or copy from `.env.example`):
   ```env
   NODE_ENV=development
   PORT=5002
   HOST=0.0.0.0
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stocksense
   DB_SSL=false
   JWT_SECRET=super_secret_jwt_key_stocksense_2026
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=*
   ```

4. **Initialize Schema & Seed Database**:
   You can run the SQL files directly against your PostgreSQL database:
   ```bash
   psql -d stocksense -f src/database/schema.sql
   psql -d stocksense -f src/database/seed_inventory.sql
   ```
   *(Note: The server also performs automatic incremental schema synchronization on startup).*

5. **Start Backend Server**:
   ```bash
   # Development with auto-reload:
   npm run dev

   # Or standard start:
   npm start
   ```
   - API endpoints: `http://localhost:5002/api/v1`
   - Health check: `http://localhost:5002/health`
   - Interactive Swagger API docs: `http://localhost:5002/docs`

---

### 3. Frontend Setup (`SSFrontend`)

1. **Navigate to the frontend directory**:
   ```bash
   cd SSFrontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   - Open your browser at `http://localhost:5173` (or the network IP shown in the terminal for local device testing).

4. **Production Build Validation**:
   ```bash
   npm run build
   ```

---

## 🔑 Demo Credentials

To experience the granular Role-Based Access Control, use the demo quick-login presets on the login screen or sign in with:

| Role | Email | Password | Primary Experience |
|---|---|---|---|
| **System Admin** | `admin@stocksense.io` | `admin123` | Full access: facilities, users, catalog, ledger, settings |
| **Inventory Manager** | `s.jenkins@stocksense.io` | `manager123` | High-level governance: PO validation, delivery dispatch, audits |
| **Warehouse Staff** | `m.vance@stocksense.io` | `staff123` | Operational floor: physical cycle counts, pick/pack tasks |

*(You can also dynamically switch the simulated active role at any time via the Topbar User Profile dropdown).*

---

## 📡 API Endpoint Overview

### Authentication (`/api/v1/auth`)
- `POST /login` — Authenticate and obtain JWT
- `POST /register` — Register new user account
- `POST /send-otp` / `POST /verify-otp` — Passwordless email authentication
- `GET  /me` — Retrieve active authenticated session

### Master Catalog (`/api/v1/products`)
- `GET    /` — List catalog products with search, category, warehouse, and low-stock filters
- `POST   /` — Create new SKU product
- `GET    /:id` — Retrieve product details
- `PUT    /:id` — Update product specifications
- `DELETE /:id` — Delete product
- `POST   /bulk-import` — Batch insert/upsert array of parsed CSV products

### Warehouses & Locations (`/api/v1/warehouses`)
- `GET  /` — List all facilities with capacity and valuation telemetry
- `POST /` — Provision a new warehouse facility
- `GET  /:id/locations` — Fetch rack locations and storage zones for a hub
- `POST /:id/locations` — Create sub-location rack

### Core Operations (`/api/v1/operations`)
- `GET  /receipts` — List inbound supplier purchase orders
- `POST /receipts` — Create new inbound receipt
- `POST /receipts/:id/validate` — Validate inbound shipment into inventory
- `GET  /deliveries` — List outbound sales orders
- `POST /deliveries/:id/pick` — Step 1: Pick goods & soft-reserve stock
- `POST /deliveries/:id/pack` — Step 2: Pack items into shipping parcel
- `POST /deliveries/:id/validate` — Step 3: Validate dispatch & write ledger
- `GET  /transfers` — List internal relocations
- `POST /transfers` — Execute inter-location transfer
- `GET  /adjustments` — List cycle count adjustments
- `POST /adjustments` — Submit physical inventory discrepancy adjustment

### Stock Ledger & Analytics (`/api/v1/ledger`, `/api/v1/dashboard`)
- `GET /ledger` — Fetch immutable transaction audit trail
- `GET /ledger/export?format=pdf|excel` — Server-side stream export
- `GET /dashboard/metrics?warehouse=...` — 5 Core KPIs filtered by warehouse
- `GET /dashboard/operations-summary` — Multi-filtered operational tasks

---

## 🛡️ Security & Integrity Highlights
- **Atomic Operations**: All multi-step stock movements (Pick/Pack/Dispatch, Adjustment reconciliation) are wrapped inside strict SQL transactions to prevent phantom inventory.
- **SQL Injection Prevention**: 100% of queries use parameterized prepared statements.
- **Zero-Dependency PDF/Excel Export**: Client-side document generators prevent third-party vendor lock-in or vulnerability exposure.
- **Input Sanitization**: Client and server-side validation on SKUs, prices, quantities, and numeric thresholds.

---

## 🏆 Hackathon Credits & Authors
Developed with passion by **Team CyberCreatures**:
- **Architecture & Full-Stack Development**
- **UI/UX Design System & Data Visualizations**
- **PostgreSQL Database Engine & Telemetry**

*StockSense — Precision Control Over Every Unit, Every Rack, Every Facility.*
