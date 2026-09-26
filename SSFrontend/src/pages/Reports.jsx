import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Warehouse,
  Layers,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import KpiCard from '../components/common/KpiCard';
import {
  DASHBOARD_TREND_DATA,
  STOCK_AGING_DATA,
  TOP_MOVING_PRODUCTS,
  INITIAL_WAREHOUSES,
  INITIAL_CATEGORIES
} from '../data/mockData';

export default function Reports({ onNotify }) {
  const [activeReportTab, setActiveReportTab] = useState('valuation');
  const [selectedHub, setSelectedHub] = useState('All');
  const [dateFilter, setDateFilter] = useState('Quarter to Date');

  const procurementVsSalesData = [
    { month: 'Apr', purchase: 62000, sales: 84000 },
    { month: 'May', purchase: 74000, sales: 91000 },
    { month: 'Jun', purchase: 58000, sales: 88000 },
    { month: 'Jul', purchase: 91000, sales: 112000 },
    { month: 'Aug', purchase: 68000, sales: 97000 },
    { month: 'Sep', purchase: 82000, sales: 124000 }
  ];

  const handleExportReport = () => {
    onNotify('Report Generated', `Exported ${activeReportTab.toUpperCase()} analysis to CSV.`, 'success');
  };

  return (
    <div className="reports-page animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-breadcrumbs">
            <span>Intelligence</span>
            <span className="breadcrumb-sep">/</span>
            <span style={{ color: 'var(--color-neutral-800)', fontWeight: 600 }}>Reports & Analytics</span>
          </div>
          <h1 className="page-title">Operational Intelligence & Valuation</h1>
          <p className="page-subtitle">
            Deep-dive financial asset valuation, stock turnover ratios, inventory aging, and replenishment needs.
          </p>
        </div>

        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportReport}
          >
            <Download size={15} />
            <span>Export Report Data</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="card mb-6" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} style={{ color: 'var(--color-primary-600)' }} />
              <select
                className="form-select"
                style={{ height: '36px', fontSize: '12px' }}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Quarter to Date">Q3 2026 (Quarter to Date)</option>
                <option value="Year to Date">Year to Date (2026)</option>
                <option value="Prior Fiscal Year">Prior Fiscal Year</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Warehouse size={15} style={{ color: 'var(--color-primary-600)' }} />
              <select
                className="form-select"
                style={{ height: '36px', fontSize: '12px' }}
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
              >
                <option value="All">All Facilities (Consolidated)</option>
                {INITIAL_WAREHOUSES.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)' }}>
            Financial Year: 2026 • Reporting Currency: USD ($)
          </div>
        </div>
      </div>

      {/* Report Category Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeReportTab === 'valuation' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('valuation')}
        >
          Stock Valuation & Turnover
        </button>
        <button
          type="button"
          className={`tab ${activeReportTab === 'aging' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('aging')}
        >
          Stock Aging & Depreciation
        </button>
        <button
          type="button"
          className={`tab ${activeReportTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('trends')}
        >
          Procurement vs Sales Trends
        </button>
        <button
          type="button"
          className={`tab ${activeReportTab === 'velocity' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('velocity')}
        >
          Velocity (Fast vs Slow Moving)
        </button>
      </div>

      {/* TAB 1: Valuation & Turnover */}
      {activeReportTab === 'valuation' && (
        <div>
          <div className="kpi-grid">
            <KpiCard
              title="Total Asset Valuation"
              value="$1,440,000"
              subtext="Calculated via FIFO method"
              icon={DollarSign}
              trend="+5.4% YoY"
              trendDirection="up"
              variant="primary"
            />
            <KpiCard
              title="Inventory Turnover Ratio"
              value="5.4x"
              subtext="Annualized stock turns"
              icon={TrendingUp}
              trend="+0.5x vs benchmark"
              trendDirection="up"
              variant="success"
            />
            <KpiCard
              title="Days Sales of Inventory (DSI)"
              value="67.5 Days"
              subtext="Average time to sell out"
              icon={Clock}
              trend="-4.2 days (improved)"
              trendDirection="up"
              variant="info"
            />
            <KpiCard
              title="Holding / Carrying Cost"
              value="$216,000"
              subtext="Est. 15% annual storage overhead"
              icon={AlertTriangle}
              trend="Controlled"
              trendDirection="up"
              variant="warning"
            />
          </div>

          <div className="chart-card mb-6">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Valuation History by Fiscal Month ($k)</h3>
                <p className="card-subtitle">Month-end audited warehouse balances</p>
              </div>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={DASHBOARD_TREND_DATA}>
                  <defs>
                    <linearGradient id="repVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F4A576" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#F4A576" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip
                    formatter={(val) => [`$${val}k`, 'Net Valuation']}
                    contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                  />
                  <Area type="monotone" dataKey="inventoryValue" stroke="#E8894E" strokeWidth={3} fill="url(#repVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Stock Aging */}
      {activeReportTab === 'aging' && (
        <div>
          <div className="grid-2 mb-6">
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '16px' }}>Stock Aging Risk Distribution</h3>
              <p className="card-subtitle" style={{ marginBottom: '20px' }}>
                Classification of active warehouse inventory by duration since check-in date
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {STOCK_AGING_DATA.map((tier, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-neutral-800)' }}>{tier.range}</span>
                      <span style={{ fontWeight: 700, color: tier.percentage < 10 ? 'var(--color-danger-600)' : 'var(--color-neutral-700)' }}>
                        ${tier.value.toLocaleString()} ({tier.percentage}%)
                      </span>
                    </div>
                    <div className="capacity-bar" style={{ height: '8px' }}>
                      <div
                        className="capacity-bar-fill"
                        style={{
                          width: `${tier.percentage}%`,
                          background: idx === 0 ? 'var(--color-success-500)' : (idx === 1 ? 'var(--color-primary-500)' : (idx === 2 ? 'var(--color-warning-500)' : 'var(--color-danger-500)'))
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-neutral-400)', marginTop: '4px' }}>
                      {tier.count} line items tracked in this age bracket
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-warning-50)', color: 'var(--color-warning-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Clock size={32} />
                </div>
                <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                  Stagnant Inventory Flag: $75,000
                </h4>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)', maxWidth: '360px', margin: '8px auto 20px' }}>
                  12 SKUs haven't registered outbound sales movements in over 90 days. Recommended for vendor return or promotional clearance.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNotify('Clearance List', 'Exported 12 stagnant items to CSV.', 'info')}
                >
                  Generate Clearance List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Trends */}
      {activeReportTab === 'trends' && (
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Inbound Procurement Spend vs Outbound Sales Revenue</h3>
              <p className="card-subtitle">Monthly comparison of replenishment costs vs fulfilled sales</p>
            </div>
          </div>
          <div className="chart-body" style={{ height: '360px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={procurementVsSalesData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  formatter={(val) => [`$${val.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
                <Legend />
                <Bar dataKey="purchase" name="Procurement Inflow ($)" fill="#FAC4A2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sales" name="Sales Dispatched ($)" fill="#E8894E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4: Velocity */}
      {activeReportTab === 'velocity' && (
        <div className="table-container">
          <div className="table-toolbar">
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600 }}>Fast-Moving Velocity Ranking</h3>
            <span className="badge badge-success">Top Performers</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product Description</th>
                <th>Units Sold (30d)</th>
                <th>Gross Revenue</th>
                <th>Velocity Status</th>
              </tr>
            </thead>
            <tbody>
              {TOP_MOVING_PRODUCTS.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 800, color: 'var(--color-primary-600)' }}>#{idx + 1}</td>
                  <td className="font-semibold">{item.name}</td>
                  <td style={{ fontWeight: 700 }}>{item.volume} units</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-primary-700)' }}>${item.revenue.toLocaleString()}</td>
                  <td>
                    <span className="badge badge-primary">High Velocity</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
