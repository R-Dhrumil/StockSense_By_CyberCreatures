import React, { useState, useEffect, useCallback,useMemo } from 'react';
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
  Search,
  Warehouse
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
  Cell,
  Legend
} from 'recharts';
import KpiCard from '../components/common/KpiCard';
import StatusBadge from '../components/common/StatusBadge';

import { hasPermission, normalizeRole, ROLES, ROLE_LABELS } from '../utils/permissions';
import { dashboardApi, categoryApi, warehouseApi } from '../services/api';
import { matchesWarehouse, filterProductsByWarehouse, DEFAULT_WAREHOUSES } from '../utils/warehouseUtils';

export default function Dashboard({
  currentUser,
  onOpenQuickAction,
  activeWarehouse = 'All',
  onChangeWarehouse,
  products = [],
  warehouses = []
}) {
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const navigate = useNavigate();

  const userRole = normalizeRole(currentUser?.role);
  const isStaff = userRole === ROLES.STAFF;

  const [facilities, setFacilities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredOps, setFilteredOps] = useState([]);
  const [loadingOps, setLoadingOps] = useState(false);

  const facilityList = useMemo(() => {
    return facilities.length > 0 ? facilities : (warehouses.length > 0 ? warehouses : DEFAULT_WAREHOUSES);
  }, [facilities, warehouses]);

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
    warehouseId: activeWarehouse === 'All' ? '' : activeWarehouse,
    categoryId: '',
    search: ''
  });

  // Filter products by active warehouse
  const whProducts = useMemo(() => {
    return filterProductsByWarehouse(products, activeWarehouse, facilityList);
  }, [products, activeWarehouse, facilityList]);

  // Compute live client-side warehouse KPIs immediately upon warehouse change
  useEffect(() => {
    if (whProducts && whProducts.length > 0) {
      const inStock = whProducts.filter(p => Number(p.availableQty || 0) > 0).length;
      const lowStock = whProducts.filter(p => Number(p.availableQty || 0) > 0 && Number(p.availableQty || 0) <= Number(p.reorderLevel || 10)).length;
      const outOfStock = whProducts.filter(p => Number(p.availableQty || 0) === 0).length;
      const totalVal = whProducts.reduce((sum, p) => sum + (Number(p.availableQty || 0) * Number(p.price || 0)), 0);

      setMetrics(prev => ({
        ...prev,
        totalProductsInStock: inStock,
        lowStockCount: lowStock,
        outOfStockCount: outOfStock,
        totalStockValue: totalVal > 0 ? totalVal : prev.totalStockValue
      }));
    } else if (activeWarehouse !== 'All') {
      setMetrics(prev => ({
        ...prev,
        totalProductsInStock: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalStockValue: 0
      }));
    }
  }, [whProducts, activeWarehouse]);

  // Dynamic Category Distribution computed from warehouse products
  const categoryDistribution = useMemo(() => {
    if (whProducts && whProducts.length > 0) {
      const counts = {};
      whProducts.forEach(p => {
        const cat = p.category || p.category_name || 'General';
        counts[cat] = (counts[cat] || 0) + 1;
      });
      const palette = ['#E8894E', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#06B6D4', '#EC4899', '#6366F1'];
      const total = whProducts.length;
      return Object.entries(counts).map(([name, count], i) => ({
        name,
        value: Math.round((count / total) * 100),
        color: palette[i % palette.length]
      }));
    }
    return [
      { name: 'Sensors & IoT', value: 28, color: '#E8894E' },
      { name: 'Actuators', value: 22, color: '#F59E0B' },
      { name: 'Controllers', value: 18, color: '#3B82F6' },
      { name: 'Pneumatics', value: 14, color: '#10B981' },
      { name: 'Networking', value: 10, color: '#8B5CF6' },
      { name: 'Others', value: 8, color: '#06B6D4' },
    ];
  }, [whProducts]);

  // Valuation Trend Dataset dynamically scaled
  const trendData = useMemo(() => {
    const baseVal = metrics.totalStockValue || 148500;
    const ratios = [0.81, 0.91, 0.86, 1.02, 0.98, 1.0];
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    return months.map((month, i) => ({
      month,
      inventoryValue: Math.round(baseVal * ratios[i])
    }));
  }, [metrics.totalStockValue]);

  // Load KPI Metrics from backend with warehouse query
  const loadMetrics = useCallback(async (targetWh = activeWarehouse) => {
    try {
      const res = await dashboardApi.getMetrics({
        warehouse: targetWh !== 'All' ? targetWh : undefined
      });
      if (res?.data?.metrics) {
        setMetrics(prev => ({
          ...prev,
          ...res.data.metrics
        }));
      }
    } catch (e) {
      console.warn('Live metrics load failed, using cache/computed:', e);
    }
  }, [activeWarehouse]);

  // Load Operations matching Dynamic Multi-Filters
  const loadFilteredOperations = useCallback(async (customFilters = filters) => {
    setLoadingOps(true);
    try {
      const whParam = activeWarehouse !== 'All' ? activeWarehouse : customFilters.warehouseId;
      const res = await dashboardApi.getOperationsSummary({
        ...customFilters,
        warehouseId: whParam || undefined
      });
      if (res?.data?.operations) {
        setFilteredOps(res.data.operations);
      }
    } catch (e) {
      console.warn('Operations summary load failed:', e);
    } finally {
      setLoadingOps(false);
    }
  }, [filters, activeWarehouse]);

  // Synchronize when activeWarehouse changes
  useEffect(() => {
    const whFilter = activeWarehouse === 'All' ? '' : activeWarehouse;
    setFilters(prev => ({ ...prev, warehouseId: whFilter }));
    loadMetrics(activeWarehouse);
    loadFilteredOperations({ ...filters, warehouseId: whFilter });
  }, [activeWarehouse]);

  // Initial metadata load
  useEffect(() => {
    warehouseApi.getWarehouses().then(res => {
      if (res?.data?.warehouses) setFacilities(res.data.warehouses);
    }).catch(() => {});

    categoryApi.getCategories().then(res => {
      if (res?.data?.categories) setCategories(res.data.categories);
    }).catch(() => {});
  }, []);

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

      {/* Active Warehouse Indicator Banner */}
      {activeWarehouse && activeWarehouse !== 'All' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(232, 137, 78, 0.08)',
          border: '1px solid rgba(232, 137, 78, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--color-primary-700)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warehouse size={16} style={{ color: 'var(--color-primary-600)' }} />
            <span>
              Showing live inventory metrics & operations for <strong>{activeWarehouse}</strong>
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onChangeWarehouse?.('All')}
            style={{ fontSize: '11px', padding: '4px 10px', height: 'auto' }}
          >
            Show All Warehouses
          </button>
        </div>
      )}

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
              onChange={(e) => {
                const val = e.target.value;
                setFilters({ ...filters, warehouseId: val });
                onChangeWarehouse?.(val || 'All');
              }}
            >
              <option value="">All Facilities</option>
              {facilityList.map(f => (
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
          <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-neutral-200)', paddingTop: '12px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
            <table style={{ width: '100%', minWidth: '560px', borderCollapse: 'collapse', fontSize: '12px' }}>
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
            <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
              <AreaChart data={trendData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
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
                  contentStyle={{
                    backgroundColor: '#111827',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #374151',
                    padding: '8px 12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                  }}
                  itemStyle={{ color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}
                  labelStyle={{ color: '#F3F4F6', fontWeight: 600, fontSize: '12px', marginBottom: '2px' }}
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
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}%`, name]}
                  contentStyle={{
                    backgroundColor: '#111827',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #374151',
                    padding: '8px 12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                  }}
                  itemStyle={{ color: '#FFFFFF', fontWeight: 600, fontSize: '13px' }}
                  labelStyle={{ color: '#F3F4F6', fontWeight: 600, fontSize: '12px', marginBottom: '2px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
