# StockSense — Comprehensive System Architecture & Workflow Specifications

## 1. Executive Summary

**StockSense** is an enterprise-grade, double-entry inventory management system built for high-throughput warehousing, multi-facility visibility, and strict role-based access control.

At its core, StockSense models every inventory change as an immutable **Stock Move** (`stock_moves`). Every item received, shelved, transferred between racks, allocated to orders, or reconciled during cycle counts flows through a centralized, audited state machine.

---

## 2. Entity-Relationship & System Topology

The following diagram details how **Warehouses**, **Sub-Locations / Racks**, **Categories**, **Products**, **Inventory Balances**, **Partners**, and **Stock Moves** are connected in the data layer:

```mermaid
erDiagram
    CATEGORY ||--o{ PRODUCT : "classifies & groups"
    SUPPLIER ||--o{ PURCHASE_ORDER : "supplies goods via"
    CUSTOMER ||--o{ SALES_ORDER : "places orders via"

    PRODUCT ||--o{ INVENTORY_STOCK : "maintains stock balances in"
    PRODUCT ||--o{ STOCK_MOVE : "item line tracked in"
    
    WAREHOUSE ||--|{ LOCATION_RACK : "contains physical"
    LOCATION_RACK ||--o{ INVENTORY_STOCK : "holds stored quantity in"
    
    PURCHASE_ORDER ||--|{ STOCK_MOVE : "generates inbound receipt"
    SALES_ORDER ||--|{ STOCK_MOVE : "generates outbound delivery"
    
    LOCATION_RACK ||--o{ STOCK_MOVE : "source location (from_location)"
    LOCATION_RACK ||--o{ STOCK_MOVE : "destination location (to_location)"

    USER ||--o{ STOCK_MOVE : "creates / validates"
```

---

## 3. End-to-End Operational Flow & Connection Architecture

The interaction across all system tiers—from master catalog data to physical storage racks, transactional orders, and real-time inventory balances:

```mermaid
graph TD
    subgraph Layer1["1. Catalog & Master Taxonomy Layer"]
        Cat["📁 Category (e.g. Sensors & IoT)"]
        Prod["📦 Master Product / SKU (e.g. TS-90 Torque Sensor)"]
        Supp["🚚 Supplier / Vendor Partner"]
        Cust["🏢 Customer / Client Partner"]
        
        Cat -->|"Classifies SKU"| Prod
        Supp -.->|"Supplies Catalog Item"| Prod
    end

    subgraph Layer2["2. Physical Storage & Facility Layer"]
        WH["🏭 Warehouse Facility (e.g. Main Central Hub)"]
        Dock["📍 Inbound Dock (WH/DOCK-IN)"]
        RackA["📍 Storage Rack A (High-Precision Storage)"]
        RackB["📍 Storage Rack B (Standard Storage)"]
        Packing["📍 Outbound Packing Bay (WH/PACK)"]
        QA["📍 Quarantine / QA Hold (WH/QA-HOLD)"]
        
        WH --> Dock
        WH --> RackA
        WH --> RackB
        WH --> Packing
        WH --> QA
    end

    subgraph Layer3["3. Immutable Transaction Engine (stock_moves)"]
        PO["🛒 Purchase Order (Inbound Receipt)"]
        SO["📈 Sales Order (Outbound Delivery)"]
        TRF["🔄 Inter-Rack / Inter-Hub Transfer"]
        ADJ["⚖️ Physical Cycle Count Adjustment"]
    end

    subgraph Layer4["4. Real-Time Telemetry & Balances"]
        StockBalance["📊 Real-Time Inventory Line<br/>• Available Quantity<br/>• Reserved Quantity<br/>• Total On-Hand<br/>• Reorder Min/Max Alerts<br/>• Real-Time Valuation (INR ₹)"]
    end

    %% Operational Connections
    Supp -->|"1. Ships Shipment"| PO
    PO -->|"2. Receipts create stock_move"| Dock
    Dock -->|"3. Putaway transfer"| RackA
    
    RackA -->|"4. Internal Transfers"| RackB
    RackB -->|"4. Internal Transfers"| RackA
    RackA -.->|"5. Quarantine Discrepancy"| QA
    
    RackA -->|"6. Pick Items"| Packing
    SO -->|"7. Dispatches goods"| Cust
    Packing -->|"8. Deliveries create stock_move"| SO

    %% Live inventory updates
    PO ==>|"Increments Available (+Qty)"| StockBalance
    SO ==>|"Reserves & Decrements (-Qty)"| StockBalance
    TRF ==>|"Moves Location (Net Zero)"| StockBalance
    ADJ ==>|"Reconciles Physical Counts (+/-)"| StockBalance
    
    Prod --- StockBalance
    RackA --- StockBalance

    classDef master fill:#e0e7ff,stroke:#4338ca,stroke-width:2px;
    classDef space fill:#ecfdf5,stroke:#047857,stroke-width:2px;
    classDef ops fill:#fef3c7,stroke:#b45309,stroke-width:2px;
    classDef balance fill:#f1f5f9,stroke:#0f172a,stroke-width:3px;

    class Cat,Prod,Supp,Cust master;
    class WH,RackA,RackB,Dock,Packing,QA space;
    class PO,SO,TRF,ADJ ops;
    class StockBalance balance;
```

---

## 4. Double-Entry Inventory Engine (`stock_moves`)

In StockSense, stock is never created or destroyed out of thin air—it is **moved** between physical or virtual locations:

```mermaid
graph TD
    subgraph External_Entities["External / Virtual Locations"]
        Supplier["Vendor / Supplier (Virtual Source)"]
        Customer["End Customer (Virtual Destination)"]
        VirtualLost["Inventory Loss / Gain (Virtual Scrap)"]
    end

    subgraph Internal_Locations["Internal Physical Warehouse Topology"]
        Dock["Inbound Receiving Dock (WH/DOCK)"]
        Racks["Storage Racks & Bays (WH/RCK-A, RCK-B)"]
        Quarantine["QA Quarantine (WH/QA-HOLD)"]
        Transit["Inter-Hub Transit (TRF-ZONE)"]
        Packing["Outbound Staging & Packing (WH/PACK)"]
    end

    %% Inbound Flow
    Supplier -->|"1. Receipt (+Qty) [PO]"| Dock
    Dock -->|"2. Internal Transfer (Putaway)"| Racks

    %% Internal Moves
    Racks -->|"3. Inspection / Defect"| Quarantine
    Racks -->|"4. Inter-Hub Transfer"| Transit
    Transit -->|"5. Putaway Destination"| Racks

    %% Outbound Flow
    Racks -->|"6. Pick & Allocate"| Packing
    Packing -->|"7. Delivery Order (-Qty) [SO]"| Customer

    %% Physical Adjustments
    Racks -.->|"8. Audit Discrepancy (+/- Qty)"| VirtualLost

    classDef primary fill:#eef2ff,stroke:#6366f1,stroke-width:2px;
    classDef success fill:#ecfdf5,stroke:#10b981,stroke-width:2px;
    classDef warning fill:#fffbeb,stroke:#f59e0b,stroke-width:2px;

    class Supplier,Customer,VirtualLost warning;
    class Dock,Packing,Transit primary;
    class Racks,Quarantine success;
```

### Operation Mapping in `stock_moves`:

| Operation | Movement Type | Source (`from_location`) | Destination (`to_location`) | Stock Ledger Effect |
|---|---|---|---|---|
| **Inbound Receipt (PO)** | `receipt` | `NULL` (External Vendor) | Warehouse Dock / Shelf | `+quantity` into stock |
| **Outbound Delivery (SO)** | `delivery` | Warehouse Shelf / Pack Bay | `NULL` (Customer) | `-quantity` from stock |
| **Internal Transfer** | `transfer` | Origin Rack (`WH-1/RCK-A`) | Target Rack (`WH-2/RCK-B`) | Net zero system change; location updated |
| **Stock Count Adjustment** | `adjustment` | `NULL` | Virtual Inventory Loss/Gain | Signed delta (`+` or `-`) with audit reason |

---

## 5. Stock Move Lifecycle State Machine

Every operational movement transitions through an auditable pipeline:

```mermaid
stateDiagram-v2
    [*] --> Draft : Create Operation (PO / SO / TRF / ADJ)
    
    state Draft {
        [*] --> LineItemsDefined : Add SKUs & Quantities
    }

    Draft --> Waiting : Confirm Order / Reserve Inventory
    Waiting --> Ready : Stock Available / Shipment Arrived at Dock
    
    state Ready {
        [*] --> PickPackTransfers : Staff Executes Physical Pick / Shelve
    }

    Ready --> Done : Manager / Admin Validates & Approves
    Ready --> Cancelled : Order Voided / Shipment Rejected
    Draft --> Cancelled : Draft Discarded

    state Done {
        [*] --> LedgerCommitted : stock_moves Row Set to DONE
        LedgerCommitted --> CachedStockUpdated : Product availableQty & Valuation Updated
    }

    Done --> [*]
    Cancelled --> [*]
```

---

## 6. Detailed System Breakdown

### A. Warehouses & Sub-Locations / Racks
1. **Multi-Warehouse Facilities**: Physical distribution centers with distinct addresses, capacity limits, and site operational leads (e.g., *Main Central Hub*, *Production Facility East*).
2. **Sub-Locations & Racks**:
   * **`INTERNAL`**: Standard storage locations for picking and pallet storage (`RCK-A`, `RCK-B`).
   * **`TRANSIT`**: Virtual staging areas for items moving between facilities.
   * **`SCRAP / QA`**: Quarantine locations for defective items or quality holds (`QA-HOLD`).
   * **`VENDOR / CUSTOMER`**: Virtual endpoints for supplier receipts and customer deliveries.
3. **Per-Location Stock Query**: Real-time inspection of on-hand quantities, reserved units, and unit valuation per rack.

---

### B. Categories & Product Taxonomy
1. **Hierarchical Grouping**: Organizes products into domain classifications (*Sensors & IoT*, *Actuators & Motors*, *Controllers*, *Pneumatics & Fluid*).
2. **Consolidated Valuation**: Automatically calculates cumulative stock valuation per category:
   $$\text{Category Stock Value} = \sum (\text{SKU Available Qty} \times \text{Unit Cost Price})$$
3. **Lifecycle**: Supports active and archived categories.

---

### C. Products & Master SKU Management
1. **Catalog Master Record**: Unique SKU code, barcode identifier (EAN-13/Code-128), Category, and Unit of Measure (UOM: `pcs`, `kg`, `m`, `box`, `roll`, `L`).
2. **Safety Thresholds**:
   * **Available Stock**: Unreserved inventory ready to fulfill orders.
   * **Reserved Stock**: Items allocated to active pending sales orders.
   * **Reorder Level ($Min$)**: Automatic threshold triggering replenishment alerts and PO drafts.
3. **Multi-Tier Valuation**: Standard Cost Price vs. Selling Price in base currency (**INR ₹**).

---

## 7. Role-Based Access Control (RBAC) Architecture

```mermaid
graph TD
    subgraph Roles["System User Roles"]
        Admin["Admin (System Owner)"]
        Manager["Inventory Manager (Operations)"]
        Staff["Warehouse Staff (Execution)"]
    end

    subgraph Access_Scopes["Access Scopes & Capabilities"]
        ScopeAdmin["• User & Role Management<br/>• Multi-Warehouse Provisioning<br/>• System Settings & Base Currency"]
        ScopeManager["• Product & Category CRUD<br/>• Create & Validate PO Receipts<br/>• Create & Validate SO Deliveries<br/>• Validate Stock Adjustments<br/>• Executive Reports & Analytics"]
        ScopeStaff["• Execute Inter-Hub Transfers<br/>• Pick / Pack Order Items<br/>• Enter Physical Shelf Counts<br/>• Read-Only Dashboard & Task Moves"]
    end

    Admin --> ScopeAdmin
    Admin --> ScopeManager
    Admin --> ScopeStaff

    Manager --> ScopeManager
    Manager --> ScopeStaff

    Staff --> ScopeStaff

    classDef adminNode fill:#fef2f2,stroke:#ef4444,stroke-width:2px;
    classDef managerNode fill:#eff6ff,stroke:#3b82f6,stroke-width:2px;
    classDef staffNode fill:#f0fdf4,stroke:#22c55e,stroke-width:2px;

    class Admin adminNode;
    class Manager managerNode;
    class Staff staffNode;
```

### Comprehensive Access Control Matrix

| Functional Area / Action | Admin | Inventory Manager | Warehouse Staff | Enforced Site Behavior |
|---|:---:|:---:|:---:|---|
| **System Settings & Base Currency** | ✅ | ❌ | ❌ | Restricted page; non-admins receive access-restricted fallback notice. |
| **Users & Role Matrix Management** | ✅ | ❌ | ❌ | Hidden from sidebar navigation for non-admins; direct access blocked. |
| **Warehouse & Rack Provisioning** | ✅ Full Provisioning | 👁️ Read-Only Telemetry | 👁️ Read-Only Telemetry | Non-admins can inspect rack stock, but "Add Facility" is gated. |
| **Product & Category CRUD** | ✅ Create / Edit / Delete | ✅ Create / Edit / Delete | 👁️ Read-Only Catalog | Action buttons hidden for Staff; read-only notice banner displayed. |
| **Inbound Receipts (POs)** | ✅ Create & Validate | ✅ Create & Validate | ❌ | Staff cannot create POs or validate inbound receipts. |
| **Sales Orders & Outbound Delivery** | ✅ Create & Validate | ✅ Create & Validate | 🟡 Pick / Pack Only | Staff executes picking and packing; cannot create new sales orders. |
| **Inter-Hub Transfers** | ✅ | ✅ | ✅ | All roles can initiate and execute internal transfers between racks/hubs. |
| **Stock Adjustments & Cycle Counts** | ✅ Full Validation | ✅ Full Validation | 🟡 Count Entry Only | Staff submits count; requires Manager/Admin approval before ledger update. |
| **Executive Reports & Valuation** | ✅ | ✅ | ❌ | Financial valuation and reports restricted to Managers & Admins. |
| **Live Telemetry Dashboard** | ✅ Full Control | ✅ Full Control | 👁️ Read-Only Tasks | Live operational telemetry with quick action button adapted per role. |

---

## 8. Summary of Component Connections

| Component Pair | Relationship | Description |
|---|:---:|---|
| **Category $\leftrightarrow$ Product** | *1 : N* | Categories classify multiple products for catalog browsing, tax defaults, and aggregated financial valuation. |
| **Product $\leftrightarrow$ Inventory Stock** | *1 : N* | Master product records connect to live physical stock balances across multiple warehouses and racks. |
| **Warehouse $\leftrightarrow$ Sub-Location / Rack** | *1 : N* | Facilities contain physical racks, bays, docks, and quarantine zones. |
| **Rack $\leftrightarrow$ Inventory Stock** | *N : N* | Pinpoints exactly which shelf/bay holds a specific product SKU. |
| **Purchase Order $\leftrightarrow$ Stock Move** | *1 : N* | Receiving supplier shipments creates inbound `receipt` moves (`+quantity`). |
| **Sales Order $\leftrightarrow$ Stock Move** | *1 : N* | Fulfilling customer orders reserves stock and creates outbound `delivery` moves (`-quantity`). |
| **Transfer $\leftrightarrow$ Stock Move** | *1 : 1* | Moving goods between racks/warehouses creates `transfer` moves with no net change in total company stock. |
| **Adjustment $\leftrightarrow$ Stock Move** | *1 : 1* | Reconciling physical cycle counts generates `adjustment` moves with mandatory audit reason logging. |
