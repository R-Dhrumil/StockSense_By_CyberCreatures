import React, { useState } from 'react';
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
  Zap
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
  BarChart,
  Bar,
  Legend
} from 'recharts';
import KpiCard from '../components/common/KpiCard';
import StatusBadge from '../components/common/StatusBadge';
import {
  DASHBOARD_TREND_DATA,
  CATEGORY_DISTRIBUTION_DATA,
  TOP_MOVING_PRODUCTS,
  INITIAL_PRODUCTS,
  INITIAL_STOCK_MOVEMENTS
} from '../data/mockData';

export default function Dashboard({ currentUser, onOpenQuickAction }) {
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const navigate = useNavigate();

  // Low stock products from initial products
  const criticalItems = INITIAL_PRODUCTS.filter(
    (p) => p.status === 'Low Stock' || p.status === 'Out of Stock'
  );

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Enterprise Console</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Dashboard</span>
          </div>
          <h1 className="page-title">
            Welcome back, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="page-subtitle">
            Here is your live inventory telemetry, replenishment pipeline, and fulfillment overview.
          </p>
        </div>

        {/* Date Filter & Actions */}
        <div className="page-header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-neutral-0)', padding: '4px 12px', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-lg)' }}>
            <Calendar size={15} style={{ color: 'var(--color-primary-600)' }} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="form-select"
              style={{ border: 'none', background: 'transparent', height: '32px', fontSize: 'var(--font-size-xs)', fontWeight: 500, paddingRight: '24px' }}
              aria-label="Filter date range"
            >
              <option value="Today">Today (Realtime)</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Quarter">Q3 2026 (Quarter)</option>
              <option value="Year-to-Date">Year-to-Date (2026)</option>
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onOpenQuickAction('adjustment')}
          >
            <RefreshCw size={16} />
            <span>Stock Adjustment</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="kpi-grid">
        <KpiCard
          title="Total Catalog Products"
          value="324"
          subtext="Across 8 categories"
          icon={Package}
          trend="+12% MoM"
          trendDirection="up"
          variant="primary"
        />
        <KpiCard
          title="Total Inventory Value"
          value="₹1,440,000"
          subtext="FIFO Cost Method"
          icon={IndianRupee}
          trend="+5.4% YoY"
          trendDirection="up"
          variant="success"
        />
        <KpiCard
          title="Low Stock Items"
          value="8 SKUs"
          subtext="Below threshold point"
          icon={AlertTriangle}
          trend="Action required"
          trendDirection="down"
          variant="warning"
        />
        <KpiCard
          title="Out of Stock Items"
          value="2 SKUs"
          subtext="Zero active stock"
          icon={XCircle}
          trend="Critical"
          trendDirection="down"
          variant="danger"
        />
        <KpiCard
          title="Pending Purchase Orders"
          value="5 Orders"
          subtext="₹54,650 Inbound value"
          icon={ShoppingCart}
          trend="3 In Transit"
          trendDirection="up"
          variant="info"
        />
        <KpiCard
          title="Monthly Dispatched Sales"
          value="₹95,670"
          subtext="98.2% On-time pick rate"
          icon={TrendingUp}
          trend="+18.4%"
          trendDirection="up"
          variant="success"
        />
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-neutral-700)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={15} style={{ color: 'var(--color-warning-500)' }} /> Operational Quick Shortcuts
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)' }}>
            Frequently used tasks
          </span>
        </div>
        <div className="quick-actions">
          <div className="quick-action" onClick={() => onOpenQuickAction('product')}>
            <div className="quick-action-icon">
              <Plus size={18} style={{ color: 'var(--color-primary-600)' }} />
            </div>
            <span>New Product</span>
          </div>

          <div className="quick-action" onClick={() => onOpenQuickAction('adjustment')}>
            <div className="quick-action-icon">
              <RefreshCw size={18} style={{ color: 'var(--color-warning-600)' }} />
            </div>
            <span>Adjust Stock</span>
          </div>

          <div className="quick-action" onClick={() => onOpenQuickAction('po')}>
            <div className="quick-action-icon">
              <ShoppingCart size={18} style={{ color: 'var(--color-info-600)' }} />
            </div>
            <span>Create PO</span>
          </div>

          <div className="quick-action" onClick={() => navigate('/inventory')}>
            <div className="quick-action-icon">
              <Truck size={18} style={{ color: 'var(--color-success-600)' }} />
            </div>
            <span>Stock Transfer</span>
          </div>

          <div className="quick-action" onClick={() => onOpenQuickAction('so')}>
            <div className="quick-action-icon">
              <Send size={18} style={{ color: '#8C4116' }} />
            </div>
            <span>New Sales Order</span>
          </div>

          <div className="quick-action" onClick={() => navigate('/reports')}>
            <div className="quick-action-icon">
              <Boxes size={18} style={{ color: '#4B5563' }} />
            </div>
            <span>Stock Valuation</span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="charts-grid">
        {/* Trend Area Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h2 className="chart-title">Inventory Valuation & Velocity ($k)</h2>
              <p className="card-subtitle">6-Month historical asset trend across hubs</p>
            </div>
            <span className="badge badge-success">Live Trend</span>
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
                  formatter={(val) => [`₹${val}k`, 'Valuation']}
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
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Value']}
                  contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ color: '#374151', fontSize: '11px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row: Top-Moving Products Bar Chart + Critical Low Stock Alerts Table */}
      <div className="grid-2 mb-6">
        {/* Top-Moving Products Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h2 className="chart-title">Top 5 Moving Products (30 Days)</h2>
              <p className="card-subtitle">Fastest turn items measured by shipped units</p>
            </div>
            <span className="badge badge-primary">High Velocity</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={TOP_MOVING_PRODUCTS}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#4B5563', fontSize: 11 }} width={120} />
                <Tooltip
                  formatter={(val, name) => [val, name === 'volume' ? 'Units Dispatched' : name]}
                  contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
                <Bar dataKey="volume" fill="#F4A576" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts & Immediate Reorder Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--color-warning-600)' }} />
                <h2 className="card-title">Critical Stock Replenishment Alerts</h2>
              </div>
              <p className="card-subtitle">Items at or below designated safety thresholds</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/products')}
            >
              All Inventory
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Warehouse</th>
                  <th>Stock / Min</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {criticalItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="table-product-cell">
                        <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: 'var(--color-neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary-600)', flexShrink: 0 }}>
                          <Package size={15} />
                        </div>
                        <div>
                          <div className="table-product-name">{item.name}</div>
                          <div className="table-product-sku">{item.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-600)' }}>
                      {item.warehouse}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: item.availableQty === 0 ? 'var(--color-danger-600)' : 'var(--color-warning-600)' }}>
                        {item.availableQty}
                      </span>
                      <span style={{ color: 'var(--color-neutral-400)', fontSize: 'var(--font-size-xs)' }}>
                        {' '}/ {item.reorderLevel} {item.unit}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => onOpenQuickAction('po')}
                        title="Draft PO for this product"
                      >
                        Reorder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Stock Movements Ledger Preview */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent Stock Audit Transactions</h2>
            <p className="card-subtitle">Verified system movements across all active warehouse locations</p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/movements')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Complete Audit Log</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Product & SKU</th>
                <th>Quantity</th>
                <th>Source → Destination</th>
                <th>Ref ID</th>
                <th>Operator</th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_STOCK_MOVEMENTS.slice(0, 5).map((mov) => (
                <tr key={mov.id}>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', whiteSpace: 'nowrap' }}>
                    {mov.date}
                  </td>
                  <td>
                    <StatusBadge status={mov.type} type="movement" size="sm" />
                  </td>
                  <td>
                    <div className="font-medium" style={{ color: 'var(--color-neutral-800)' }}>
                      {mov.product}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)' }}>
                      {mov.sku}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        color: mov.qty > 0 ? 'var(--color-success-600)' : 'var(--color-danger-600)'
                      }}
                    >
                      {mov.qty > 0 ? `+${mov.qty}` : mov.qty}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-600)' }}>
                    <span>{mov.source}</span>
                    <span style={{ margin: '0 4px', color: 'var(--color-neutral-400)' }}>→</span>
                    <span>{mov.destination}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'monospace', background: 'var(--color-neutral-100)', padding: '2px 6px', borderRadius: '4px' }}>
                      {mov.reference}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-600)' }}>
                    {mov.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
