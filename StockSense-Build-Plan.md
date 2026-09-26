# StockSense — Construction & Implementation Plan
### 5-hour hackathon build | React (frontend) + Node/Express (backend) + plain PostgreSQL

---

## 1. User Roles

The PDF names two target users directly; a hackathon build also needs one system-level role to make auth/setup demoable. Three roles total:

| Role | Who they are | What they can do |
|---|---|---|
| **Admin** | System owner / setup | Everything below, plus: manage warehouses & locations, create/deactivate user accounts, view all data across the system. Owns the **Settings** section. |
| **Inventory Manager** | Manages incoming & outgoing stock (per PDF) | Create & validate Receipts, Delivery Orders, and Stock Adjustments; manage Products (create/edit/categorize); view full Dashboard & Move History; cannot manage users or warehouses. |
| **Warehouse Staff** | Performs transfers, picking, shelving, counting (per PDF) | Create & execute Internal Transfers; perform picking/packing steps on Delivery Orders; enter physical counts for Adjustments (Inventory Manager still validates/approves them); view Dashboard (read-only) and their own task queue. Cannot create Receipts or manage Products. |

**Permission matrix (for the `role` check in code):**

| Action | Admin | Inventory Manager | Warehouse Staff |
|---|:---:|:---:|:---:|
| Manage users / warehouses (Settings) | ✅ | ❌ | ❌ |
| Create/edit Products | ✅ | ✅ | ❌ |
| Create & validate Receipts | ✅ | ✅ | ❌ |
| Create & validate Deliveries | ✅ | ✅ | 🟡 pick/pack only |
| Create & validate Transfers | ✅ | ✅ | ✅ |
| Enter Adjustment counts | ✅ | ✅ | 🟡 entry only, Manager validates |
| View Dashboard | ✅ | ✅ | ✅ (read-only) |
| View Move History / Ledger | ✅ | ✅ | ✅ (own moves) |

For a 4–5 hour build, implement this as a single `role` column checked in Express middleware (`requireRole('admin','manager')`) rather than a full permissions engine — enough to demo the access control convincingly without over-building it.

---

## 2. Construction Plan (what gets built, in what order, by whom)

### Guiding principle
Every stock operation — Receipts, Deliveries, Transfers, Adjustments — is powered by **one table and one engine**: `stock_moves`. Build the engine once in the backend, then build four thin screens on top of it.

### Phases

| Phase | Time | Goal | Owner |
|---|---|---|---|
| **0. Setup** | 0:00–0:20 | Postgres running, schema applied, Express skeleton + React skeleton both boot | Whole team |
| **1. Auth & Roles** | 0:20–1:00 | Signup/login, JWT, role middleware working end-to-end | Dev A (backend) |
| **2. Core Engine** | 0:20–1:20 (parallel) | `stock_moves` table + `validateMove()` service + REST endpoints | Dev B (backend) |
| **3. Product API + UI** | 1:00–1:50 | Product CRUD, backend route + frontend screen | Dev A |
| **4. Operations UI** | 1:20–3:15 | Receipt, Delivery, Transfer, Adjustment screens, role-gated | Dev B + C (frontend) |
| **5. Dashboard** | 2:30–3:50 | KPI endpoints + frontend cards/filters | Dev A |
| **6. Seed & Polish** | 3:50–4:20 | Seed demo data, low-stock alerts, move history table | Whole team |
| **7. Hardening** | 4:20–4:50 | Bug fixes, empty states, error handling, deploy | Whole team |
| **8. Demo rehearsal** | 4:50–5:00 | Walk through the script once, log in as each of the 3 roles | Whole team |

### Build order rationale
1. **Schema + Express skeleton first** — frontend and backend devs can code in parallel against an agreed contract immediately.
2. **Auth + roles early** — every other route depends on `req.user.role`, so this can't be an afterthought.
3. **Moves engine before individual screens** — Receipt/Delivery/Transfer/Adjustment are role-gated UI variations of one form + one backend function, not four separate builds.
4. **Dashboard last** — it's just read-queries over data the other phases already produce.

---

## 3. Data Model (plain PostgreSQL — no managed service)

```sql
-- 1. Users (with role)
create table users (
  id serial primary key,
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('admin','inventory_manager','warehouse_staff')),
  created_at timestamptz default now()
);

-- 2. Locations (warehouses / racks)
create table locations (
  id serial primary key,
  name text not null,
  created_at timestamptz default now()
);

-- 3. Products
create table products (
  id serial primary key,
  name text not null,
  sku text unique not null,
  category text,
  unit text default 'pcs',        -- unit of measure
  stock numeric default 0,        -- cached total stock, updated by moves
  reorder_level numeric default 10,
  created_at timestamptz default now()
);

-- 4. Stock Moves (THE core engine — powers all 4 operations)
create table stock_moves (
  id serial primary key,
  type text not null check (type in ('receipt','delivery','transfer','adjustment')),
  product_id integer references products(id) not null,
  from_location integer references locations(id),   -- null for receipts
  to_location integer references locations(id),     -- null for deliveries
  quantity numeric not null,                          -- signed for adjustments, positive otherwise
  partner text,                                       -- supplier/customer name, optional
  status text default 'draft' check (status in ('draft','waiting','ready','done','cancelled')),
  note text,
  created_by integer references users(id),
  validated_by integer references users(id),
  created_at timestamptz default now(),
  validated_at timestamptz
);
```

**How each operation maps to `stock_moves`:**

| Operation | `type` | `from_location` | `to_location` | Stock effect on validate |
|---|---|---|---|---|
| Receipt | `receipt` | null | set | `+quantity` |
| Delivery | `delivery` | set | null | `-quantity` |
| Transfer | `transfer` | set | set | `0` (location changes, total unchanged) |
| Adjustment | `adjustment` | null | null | `+quantity` or `-quantity` (signed) |

---

## 4. Implementation Plan

### Step 1 — Project & database setup (20 min)
```bash
# Local Postgres — fastest for a hackathon, no external account needed
createdb stocksense
psql stocksense -f schema.sql

# Backend
mkdir server && cd server
npm init -y
npm install express pg bcrypt jsonwebtoken cors dotenv

# Frontend
npm create vite@latest client -- --template react
cd client && npm install axios react-router-dom
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```
- `.env` in `server/`: `DATABASE_URL`, `JWT_SECRET`, `PORT`.
- If deploying: Render/Railway both offer a free Postgres instance + Node hosting in one place — fastest path to a live demo link without touching Supabase.

### Step 2 — Auth & role middleware (40 min)
- `POST /api/auth/signup` — hash password with bcrypt, insert user with chosen `role`.
- `POST /api/auth/login` — verify password, issue JWT containing `{ id, role }`.
- `middleware/auth.js` — `requireAuth` (verifies JWT) and `requireRole(...roles)` (checks `req.user.role`).
- Frontend: `AuthContext.jsx` stores JWT in memory + localStorage, attaches `Authorization: Bearer <token>` via an axios interceptor.

### Step 3 — Product API + UI (50 min)
- `routes/products.js` — GET (all roles), POST/PUT (admin + inventory_manager only via `requireRole`).
- `pages/Products.jsx` — table: Name, SKU, Category, Unit, Stock, Reorder Level; create/edit modal hidden for warehouse_staff.

### Step 4 — Stock Moves engine (60 min) — **the critical path**
- `services/stockEngine.js`:
```js
async function validateMove(moveId, validatorId) {
  const { rows } = await db.query('select * from stock_moves where id=$1', [moveId]);
  const move = rows[0];
  let delta = 0;
  if (move.type === 'receipt') delta = move.quantity;
  if (move.type === 'delivery') delta = -move.quantity;
  if (move.type === 'adjustment') delta = move.quantity; // signed
  if (move.type === 'transfer') delta = 0;

  if (delta !== 0) {
    await db.query('update products set stock = stock + $1 where id=$2', [delta, move.product_id]);
  }
  await db.query(
    `update stock_moves set status='done', validated_by=$1, validated_at=now() where id=$2`,
    [validatorId, moveId]
  );
}
```
- `routes/moves.js` — `POST /api/moves` (create, role-gated by type: receipts/deliveries need inventory_manager+, transfers open to warehouse_staff too), `POST /api/moves/:id/validate` (calls the engine).
- Frontend: one `MoveFormModal.jsx` reused for all 4 types, fields shown conditionally; a `MoveButton.jsx` "Validate" action, disabled/hidden based on `user.role`.

### Step 5 — Operation screens (60 min, parallel across devs)
- `pages/Receipts.jsx`, `Deliveries.jsx`, `Transfers.jsx`, `Adjustments.jsx` — each lists `stock_moves` filtered by `type`, opens the shared modal. Buttons conditionally rendered by role (e.g. warehouse_staff sees "Transfer" and "Pick/Pack" but not "New Receipt").

### Step 6 — Dashboard (40 min)
- `routes/dashboard.js` — aggregate SQL queries: total products, low stock (`stock <= reorder_level`), pending receipts/deliveries (`status != 'done'`), scheduled transfers.
- `pages/Dashboard.jsx` — KPI cards + recent moves table; content is the same for every role, but only admin/manager see quick-action buttons.

### Step 7 — Seed data & polish (30 min)
- `seed.sql` — one admin, one manager, one warehouse_staff user; the PDF's own example (Steel Rods, 100kg receipt → transfer to Production Rack → 20 delivered → 3 damaged).
- Loading/empty states, toast on validate, low-stock badge.

### Step 8 — Deploy & rehearse (10–15 min)
- Push both `server/` and `client/` (Render/Railway for backend+DB, Vercel/Netlify for frontend, or both on Render).
- Rehearse logging in as all three roles to show the access differences live — this is a strong demo beat judges notice.

---

## 5. File Structure

```
stocksense/
├── schema.sql                     # full DB schema (section 3 above)
├── seed.sql                       # demo users + PDF example data
│
├── server/                        # Node/Express + plain PostgreSQL
│   ├── .env                       # DATABASE_URL, JWT_SECRET (gitignored)
│   ├── package.json
│   ├── index.js                   # app entry, mounts routes
│   ├── db.js                      # pg Pool instance
│   │
│   ├── middleware/
│   │   └── auth.js                # requireAuth, requireRole(...roles)
│   │
│   ├── services/
│   │   └── stockEngine.js         # validateMove() — the core logic
│   │
│   └── routes/
│       ├── auth.js                # signup, login
│       ├── users.js                # admin: manage users
│       ├── products.js
│       ├── locations.js            # admin: manage warehouses
│       ├── moves.js                # create + validate (all 4 operation types)
│       └── dashboard.js            # KPI aggregate queries
│
└── client/                        # React (Vite)
    ├── .env                        # VITE_API_URL
    ├── package.json
    ├── tailwind.config.js
    │
    └── src/
        ├── main.jsx
        ├── App.jsx                 # routes + layout shell
        │
        ├── lib/
        │   └── api.js               # axios instance, attaches JWT
        │
        ├── context/
        │   └── AuthContext.jsx      # user, role, login/logout
        │
        ├── components/
        │   ├── Sidebar.jsx          # nav items shown/hidden by role
        │   ├── Topbar.jsx
        │   ├── KpiCard.jsx
        │   ├── DataTable.jsx
        │   ├── MoveFormModal.jsx    # reusable form for all 4 move types
        │   ├── MoveButton.jsx       # role-aware "Validate" button
        │   ├── ProductFormModal.jsx
        │   ├── StatusBadge.jsx      # Draft/Waiting/Ready/Done/Cancelled pill
        │   ├── ProtectedRoute.jsx   # requireAuth
        │   └── RoleGate.jsx         # <RoleGate allow={['admin','inventory_manager']}>
        │
        ├── pages/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Products.jsx
        │   ├── Receipts.jsx
        │   ├── Deliveries.jsx
        │   ├── Transfers.jsx
        │   ├── Adjustments.jsx
        │   ├── MoveHistory.jsx      # full ledger, filterable
        │   ├── Settings.jsx         # admin only: warehouses, users
        │   └── Profile.jsx
        │
        └── styles/
            └── index.css
```

**Why this structure:**
- `server/services/stockEngine.js` isolates the one piece of business logic that *must* be correct — easy to unit-test or debug under time pressure, independent of routing/auth.
- `middleware/auth.js` centralizes role checks so every route declares its access rule in one line (`router.post('/', requireRole('admin','inventory_manager'), ...)`), instead of scattering `if` checks through business logic.
- `components/RoleGate.jsx` on the frontend mirrors the backend's role rules for UI visibility — the same permission matrix expressed twice, once for security (backend, source of truth) and once for UX (frontend, hides buttons the user can't use anyway).
- `pages/Receipts.jsx`, `Deliveries.jsx`, `Transfers.jsx`, `Adjustments.jsx` are near-duplicates by design — copy-paste-adapt is faster than premature abstraction at hackathon speed.

---

## 6. Task Board

- [ ] `schema.sql` written + applied to local Postgres
- [ ] Express skeleton + `db.js` connection pool
- [ ] Auth routes (signup/login) + JWT + `requireAuth`/`requireRole` middleware
- [ ] Product routes + Product CRUD screen
- [ ] `stockEngine.js` — validateMove logic
- [ ] Moves routes (create + validate) with role gating
- [ ] MoveFormModal (reusable, frontend)
- [ ] Receipts / Deliveries / Transfers / Adjustments screens
- [ ] Dashboard KPI routes + screen
- [ ] Move History / ledger page
- [ ] Low-stock alert badge
- [ ] Seed script (3 role users + PDF example data)
- [ ] Deploy backend + DB, deploy frontend
- [ ] Rehearse demo logged in as each role

---

## 7. Cut list (drop these first if behind schedule)

1. Filters on Dashboard/Move History
2. `Settings.jsx` warehouse management UI (seed locations directly in SQL instead)
3. Adjustments screen (keep Receipt/Delivery/Transfer as the demo spine)
4. Separate "pick" vs "pack" sub-steps on Delivery — collapse into one Validate action
5. Profile page (stub it)
6. Admin user-management UI (create the 3 demo users via seed script instead of building a screen)
