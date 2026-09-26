import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  IndianRupee,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowRight,
  Plus,
  RefreshCw,
  Truck,
  Send,
  Boxes,
  ExternalLink,
  Zap,
  ArrowLeftRight,
  SlidersHorizontal,
  Layers,
  Filter,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import KpiCard from '../components/common/KpiCard';
import StatusBadge from '../components/common/StatusBadge';
import {
  DASHBOARD_TREND_DATA,
  CATEGORY_DISTRIBUTION_DATA,
  INITIAL_PRODUCTS,
  INITIAL_WAREHOUSES,
  INITIAL_CATEGORIES
} from '../data/mockData';
import { hasPermission, normalizeRole, ROLES, ROLE_LABELS } from '../utils/permissions';
import { dashboardApi, categoryApi, warehouseApi } from '../services/api';

export default function Dashboard({ currentUser, onOpenQuickAction }) {
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const navigate = useNavigate();

  const userRole = normalizeRole(currentUser?.role);
  const isStaff = userRole === ROLES.STAFF;

  // Live Metrics State (Module 9: 5 Core Operational KPIs)
  const [metrics, setMetrics] = useState({
    totalProductsInStock: 24,
    lowStockCount: 3,
    outOfStockCount: 1,
    pendingReceipts: 4,
    pendingDeliveries: 5,
    internalTransfersScheduled: 2,
    totalStockValue: 148500.00
  });

  // Dynamic Multi-Filters State (Module 9)
  const [filters, setFilters] = useState({
    docType: '',
    status: '',
    warehouseId: '',
    categoryId: '',
    search: ''
  });

  const [facilities, setFacilities] = useState(INITIAL_WAREHOUSES);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [filteredOps, setFilteredOps] = useState([]);
  const [loadingOps, setLoadingOps] = useState(false);

  // Load KPI Metrics
  const loadMetrics = useCallback(async () => {
    try {
      const res = await dashboardApi.getMetrics();
      if (res?.data?.metrics) {
        setMetrics(res.data.metrics);
      }
    } catch (e) {
      console.warn('Live metrics load failed, using cache:', e);
    }
  }, []);

  // Load Operations matching Dynamic Multi-Filters
  const loadFilteredOperations = useCallback(async () => {
    setLoadingOps(true);
    try {
      const res = await dashboardApi.getOperationsSummary(filters);
      if (res?.data?.operations) {
        setFilteredOps(res.data.operations);
      }
    } catch (e) {
      console.warn('Operations summary load failed:', e);
    } finally {
      setLoadingOps(false);
    }
  }, [filters]);

  // Initial metadata load
  useEffect(() => {
    loadMetrics();
    loadFilteredOperations();

    // Fetch facilities and categories for filter dropdowns
    warehouseApi.getWarehouses().then(res => {
      if (res?.data?.warehouses) setFacilities(res.data.warehouses);
    }).catch(() => {});

    categoryApi.getCategories().then(res => {
      if (res?.data?.categories) setCategories(res.data.categories);
    }).catch(() => {});
  }, [loadMetrics, loadFilteredOperations]);

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Read-Only Banner for Staff */}
      {isStaff && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 16px',
          background: 'var(--color-neutral-100)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--color-neutral-700)',
          borderLeft: '4px solid var(--color-neutral-400)'
        }}>
          <Zap size={16} style={{ color: 'var(--color-primary-600)', flexShrink: 0 }} />
          <span><strong>Warehouse Operations View:</strong> Live inventory telemetry and task queues. You can execute internal transfers, record count entries, and perform order pick/pack.</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Enterprise Console</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Dashboard & KPIs</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              Welcome back, {currentUser?.name?.split(' ')[0] || 'User'}
            </h1>
            <span className={`badge ${userRole === 'ADMIN' ? 'badge-primary' : (userRole === 'INVENTORY_MANAGER' ? 'badge-info' : 'badge-neutral')}`} style={{ fontSize: '11px' }}>
              {ROLE_LABELS[userRole]}
            </span>
          </div>
          <p className="page-subtitle">
            Live inventory telemetry, replenishment pipeline, and fulfillment overview (Module 9: 5 Core KPIs).
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              loadMetrics();
              loadFilteredOperations();
            }}
            title="Refresh KPIs"
          >
            <RefreshCw size={15} />
            <span>Sync Telemetry</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onOpenQuickAction('adjustment')}
          >
            <RefreshCw size={16} />
            <span>{isStaff ? 'Physical Count Entry' : 'Stock Adjustment'}</span>
          </button>
        </div>
      </div>

      {/* Module 9: 5 Core Operational KPI Cards Grid */}
      <div className="kpi-grid">
        {/* KPI 1: Total Products in Stock */}
        <KpiCard
          title="Products in Stock"
          value={`${metrics.totalProductsInStock} SKUs`}
          subtext="Active catalog items"
          icon={Package}
          trend="In Stock"
          trendDirection="up"
          variant="primary"
          onClick={() => navigate('/products')}
        />

        {/* KPI 2: Low / Out of Stock Items */}
        <KpiCard
          title="Low / Out of Stock"
          value={`${metrics.lowStockCount + metrics.outOfStockCount} Items`}
          subtext={`${metrics.outOfStockCount} Critical Out-of-Stock`}
          icon={AlertTriangle}
          trend={metrics.lowStockCount > 0 ? "Action Required" : "Optimal"}
          trendDirection={metrics.lowStockCount > 0 ? "down" : "up"}
          variant={metrics.lowStockCount > 0 ? "warning" : "success"}
          onClick={() => navigate('/inventory')}
        />

        {/* KPI 3: Pending Receipts */}
        <KpiCard
          title="Pending Receipts"
          value={`${metrics.pendingReceipts} Orders`}
          subtext="Inbound goods awaiting receipt"
          icon={ShoppingCart}
          trend="Inbound Pipeline"
          trendDirection="up"
          variant="info"
          onClick={() => navigate('/purchase-orders')}
        />

        {/* KPI 4: Pending Deliveries */}
        <KpiCard
          title="Pending Deliveries"
          value={`${metrics.pendingDeliveries} Shipments`}
          subtext="Outbound customer orders"
          icon={Truck}
          trend="Pick / Pack Queue"
          trendDirection="up"
          variant="warning"
          onClick={() => navigate('/sales-orders')}
        />

        {/* KPI 5: Internal Transfers Scheduled */}
        <KpiCard
          title="Transfers Scheduled"
          value={`${metrics.internalTransfersScheduled} Relocations`}
          subtext="Inter-rack / hub balance"
          icon={ArrowLeftRight}
          trend="In Transit"
          trendDirection="up"
          variant="primary"
          onClick={() => navigate('/inventory')}
        />
      </div>

      {/* Module 9: Dynamic Multi-Filter Toolbar */}
      <div className="card mb-6" style={{ padding: '16px', background: 'var(--color-neutral-0)', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={17} style={{ color: 'var(--color-primary-600)' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
              Dynamic Multi-Filter Operations Feed
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-neutral-500)' }}>
            Showing live database operations matched across 4 filter dimensions
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Filter 1: Document Type */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Document Type</label>
            <select
              className="form-select"
              style={{ fontSize: '12px', height: '36px' }}
              value={filters.docType}
              onChange={(e) => setFilters({ ...filters, docType: e.target.value })}
            >
              <option value="">All Document Types</option>
              <option value="RECEIPT">Incoming Receipts (PO)</option>
              <option value="DELIVERY">Outgoing Deliveries (SO)</option>
              <option value="INTERNAL">Internal Transfers (TRF)</option>
              <option value="ADJUSTMENT">Stock Adjustments (ADJ)</option>
            </select>
          </div>

          {/* Filter 2: Operation Status */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Pipeline Status</label>
            <select
              className="form-select"
              style={{ fontSize: '12px', height: '36px' }}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft / Waiting</option>
              <option value="READY">Ready / Picked / Allocated</option>
              <option value="PACKED">Packed Parcel</option>
              <option value="DONE">Done / Dispatched / Received</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </div>

          {/* Filter 3: Warehouse / Facility */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Warehouse Facility</label>
            <select
              className="form-select"
              style={{ fontSize: '12px', height: '36px' }}
              value={filters.warehouseId}
              onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value })}
            >
              <option value="">All Facilities</option>
              {facilities.map(f => (
                <option key={f.id} value={f.name}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Filter 4: Keyword Search */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Search Reference / Partner</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--color-neutral-400)' }} />
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '12px', height: '36px', paddingLeft: '30px' }}
                placeholder="Search PO, SO, TRF, Client..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Live Filtered Operations Feed Table */}
        {filteredOps.length > 0 && (
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-neutral-200)', paddingTop: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--color-neutral-500)', borderBottom: '1px solid var(--color-neutral-200)' }}>
                  <th style={{ padding: '6px 8px' }}>Operation #</th>
                  <th style={{ padding: '6px 8px' }}>Type</th>
                  <th style={{ padding: '6px 8px' }}>Partner / Client</th>
                  <th style={{ padding: '6px 8px' }}>Facility</th>
                  <th style={{ padding: '6px 8px' }}>Demanded</th>
                  <th style={{ padding: '6px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOps.slice(0, 5).map((op, idx) => (
                  <tr key={op.id || idx} style={{ borderBottom: '1px solid var(--color-neutral-100)' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 700, fontFamily: 'monospace' }}>{op.operationNumber || op.operation_number}</td>
                    <td style={{ padding: '6px 8px' }}><span className="badge badge-neutral">{op.type}</span></td>
                    <td style={{ padding: '6px 8px' }}>{op.partnerName || 'Internal Warehouse'}</td>
                    <td style={{ padding: '6px 8px' }}>{op.warehouseName}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{op.totalDemanded} units</td>
                    <td style={{ padding: '6px 8px' }}><StatusBadge status={op.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Charts Grid */}
      <div className="charts-grid">
        {/* Trend Area Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h2 className="chart-title">Inventory Valuation Trend (₹)</h2>
              <p className="card-subtitle">6-Month historical asset trend across hubs</p>
            </div>
            <span className="badge badge-success">Live Valuation</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DASHBOARD_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4A576" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F4A576" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Valuation']}
                  contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
                <Area
                  type="monotone"
                  dataKey="inventoryValue"
                  stroke="#E8894E"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#valGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Distribution by Category Donut Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h2 className="chart-title">Stock Valuation by Category</h2>
              <p className="card-subtitle">Capital allocation breakdown</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => navigate('/categories')}
            >
              View Categories
            </button>
          </div>
          <div className="chart-body" style={{ display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_DISTRIBUTION_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {CATEGORY_DISTRIBUTION_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Share']}
                  contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
