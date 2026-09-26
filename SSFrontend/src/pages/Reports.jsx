import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Warehouse,
  TrendingUp,
  IndianRupee,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  FileText
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
import { hasPermission } from '../utils/permissions';
import { useNavigate } from 'react-router-dom';
import { warehouseApi } from '../services/api';
import { downloadPdfReport, downloadExcelReport } from '../utils/exportUtils';

import { DEFAULT_WAREHOUSES } from '../utils/warehouseUtils';

export default function Reports({ onNotify, currentUser, activeWarehouse = 'All', onChangeWarehouse }) {
  const navigate = useNavigate();
  const canViewReports = hasPermission.canViewReports(currentUser?.role);
  const [activeReportTab, setActiveReportTab] = useState('valuation');
  const [selectedHub, setSelectedHub] = useState(activeWarehouse || 'All');
  const [dateFilter, setDateFilter] = useState('Quarter to Date');
  const [warehouses, setWarehouses] = useState(DEFAULT_WAREHOUSES);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (activeWarehouse) {
      setSelectedHub(activeWarehouse);
    }
  }, [activeWarehouse]);

  useEffect(() => {
    const fetchWarehouses = warehouseApi?.getWarehouses || warehouseApi?.getAll;
    if (typeof fetchWarehouses === 'function') {
      fetchWarehouses()
        .then(res => {
          const list = res?.data?.warehouses || res?.data;
          if (Array.isArray(list)) {
            setWarehouses(list);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Valuation Trend Dataset
  const DASHBOARD_TREND_DATA = [
    { month: 'Apr', purchase: 62000, sales: 84000, inventoryValue: 142 },
    { month: 'May', purchase: 74000, sales: 91000, inventoryValue: 148 },
    { month: 'Jun', purchase: 58000, sales: 88000, inventoryValue: 139 },
    { month: 'Jul', purchase: 91000, sales: 112000, inventoryValue: 155 },
    { month: 'Aug', purchase: 68000, sales: 97000, inventoryValue: 146 },
    { month: 'Sep', purchase: 82000, sales: 124000, inventoryValue: 162 },
  ];

  // Stock Aging Dataset
  const STOCK_AGING_DATA = [
    { range: '0–30 Days', tier: '0–30 Days', count: 142, value: 62400, percentage: 48, risk: 'Low (Fresh Stock)', color: 'var(--color-success-500)' },
    { range: '31–60 Days', tier: '31–60 Days', count: 88, value: 38200, percentage: 29, risk: 'Moderate (Active Rotation)', color: 'var(--color-primary-500)' },
    { range: '61–90 Days', tier: '61–90 Days', count: 45, value: 19800, percentage: 15, risk: 'Elevated (Review)', color: 'var(--color-warning-500)' },
    { range: '90+ Days', tier: '90+ Days', count: 22, value: 9800, percentage: 8, risk: 'Critical (Liquidation Needed)', color: 'var(--color-danger-500)' },
  ];

  // Top Moving Products
  const TOP_MOVING_PRODUCTS = [
    { rank: 1, name: 'Industrial Torque Sensor TS-90', sku: 'SEN-TRQ-90', volume: 142, revenue: 49558, velocity: 'High Velocity' },
    { rank: 2, name: 'Precision Stepper Motor 24V', sku: 'MOT-STP-24', volume: 85, revenue: 7607, velocity: 'High Velocity' },
    { rank: 3, name: 'Industrial Ethernet Switch', sku: 'NET-SWT-08', volume: 195, revenue: 53625, velocity: 'Top Mover' },
    { rank: 4, name: 'Brushless DC Servo Drive 48V', sku: 'DRV-BLDC-48', volume: 110, revenue: 47300, velocity: 'High Velocity' },
    { rank: 5, name: 'Carbon Steel Round Rods', sku: 'STL-ROD-01', volume: 260, revenue: 11700, velocity: 'Top Volume' },
  ];

  // Stagnant Inventory Clearance List
  const STAGNANT_CLEARANCE_ITEMS = [
    { sku: 'SEN-TRQ-90', name: 'Industrial Torque Sensor TS-90', category: 'Sensors', daysStagnant: 114, units: 45, unitCost: '₹349.00', totalValue: '₹15,705.00', recommendation: 'Promotional Clearance' },
    { sku: 'MOT-STP-24', name: 'Precision Stepper Motor 24V', category: 'Motors', daysStagnant: 102, units: 28, unitCost: '₹89.50', totalValue: '₹2,506.00', recommendation: 'Vendor Return' },
    { sku: 'BRG-608-ZZ', name: 'Ball Bearing 608-ZZ', category: 'Mechanical', daysStagnant: 128, units: 180, unitCost: '₹40.00', totalValue: '₹7,200.00', recommendation: 'Bundled Discount' },
    { sku: 'PLC-CPU-04', name: 'Compact PLC Controller', category: 'Electronics', daysStagnant: 95, units: 6, unitCost: '₹2,100.00', totalValue: '₹12,600.00', recommendation: 'Transfer to Main Hub' },
    { sku: 'PNE-CYL-50', name: 'Pneumatic Air Cylinder', category: 'Pneumatics', daysStagnant: 108, units: 14, unitCost: '₹350.00', totalValue: '₹4,900.00', recommendation: 'Promotional Clearance' },
    { sku: 'HYD-VAL-02', name: 'Hydraulic Proportional Valve', category: 'Hydraulics', daysStagnant: 119, units: 5, unitCost: '₹2,850.00', totalValue: '₹14,250.00', recommendation: 'Vendor Return' },
    { sku: 'CBL-SHD-100', name: 'Shielded Industrial Cable 100m', category: 'Cables', daysStagnant: 134, units: 8, unitCost: '₹800.00', totalValue: '₹6,400.00', recommendation: 'Maintenance Use' },
    { sku: 'OPT-ENC-10', name: 'Optical Encoder Module', category: 'Sensors', daysStagnant: 98, units: 12, unitCost: '₹953.25', totalValue: '₹11,439.00', recommendation: 'Bundled Discount' },
  ];

  const procurementVsSalesData = [
    { month: 'Apr', purchase: 62000, sales: 84000 },
    { month: 'May', purchase: 74000, sales: 91000 },
    { month: 'Jun', purchase: 58000, sales: 88000 },
    { month: 'Jul', purchase: 91000, sales: 112000 },
    { month: 'Aug', purchase: 68000, sales: 97000 },
    { month: 'Sep', purchase: 82000, sales: 124000 }
  ];

  if (!canViewReports) {
    return (
      <div className="card text-center" style={{ maxWidth: '500px', margin: '60px auto', padding: '40px 24px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-warning-50)', color: 'var(--color-warning-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={28} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Access Restricted</h2>
        <p style={{ fontSize: '14px', color: 'var(--color-neutral-600)', marginBottom: '24px', lineHeight: 1.5 }}>
          Executive reports and financial valuation analytics are accessible only to <strong>Inventory Managers</strong> and <strong>Administrators</strong>.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/dashboard')}
          style={{ margin: '0 auto' }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Handle PDF Export
  const handleExportPdf = async () => {
    setExporting(true);
    const dateStr = new Date().toISOString().slice(0, 10);

    try {
      if (activeReportTab === 'valuation') {
        await downloadPdfReport({
          title: 'StockSense — Stock Valuation & Inventory Turnover',
          subtitle: `Scope: ${selectedHub} | Period: ${dateFilter} | Currency: INR (₹)`,
          columns: [
            { header: 'Fiscal Month', accessor: 'month' },
            { header: 'Procurement (₹)', accessor: 'purchase' },
            { header: 'Sales Dispatched (₹)', accessor: 'sales' },
            { header: 'Valuation Balance (₹)', accessor: 'inventoryValue' },
            { header: 'Turnover Ratio', accessor: 'turnover' }
          ],
          data: DASHBOARD_TREND_DATA.map(d => ({
            month: `${d.month} 2026`,
            purchase: `₹${d.purchase.toLocaleString()}`,
            sales: `₹${d.sales.toLocaleString()}`,
            inventoryValue: `₹${(d.inventoryValue * 1000).toLocaleString()}`,
            turnover: '5.4x'
          })),
          summaryCards: [
            { title: 'Total Asset Valuation', value: '₹1,440,000' },
            { title: 'Inventory Turnover', value: '5.4x' },
            { title: 'Days Sales of Inv.', value: '67.5 Days' },
            { title: 'Carrying Cost', value: '₹216,000' }
          ],
          filename: `StockSense_Stock_Valuation_${dateStr}.pdf`,
          apiType: 'valuation'
        });
        onNotify?.('PDF Exported', 'Stock Valuation & Turnover report downloaded as PDF.', 'success');
      } else if (activeReportTab === 'aging') {
        await downloadPdfReport({
          title: 'StockSense — Inventory Aging & Depreciation Risk',
          subtitle: `Scope: ${selectedHub} | Period: ${dateFilter} | Tracked Items: 297`,
          columns: [
            { header: 'Aging Bracket', accessor: 'range' },
            { header: 'Line Items', accessor: 'count' },
            { header: 'Locked Value', accessor: 'value' },
            { header: 'Portfolio Share', accessor: 'percentage' },
            { header: 'Risk Assessment', accessor: 'risk' }
          ],
          data: STOCK_AGING_DATA.map(t => ({
            range: t.range,
            count: `${t.count} items`,
            value: `₹${t.value.toLocaleString()}`,
            percentage: `${t.percentage}%`,
            risk: t.risk
          })),
          summaryCards: [
            { title: 'Active Inventory Value', value: '₹130,200' },
            { title: 'Tracked Items', value: '297 Items' },
            { title: 'Stagnant Flag (>90d)', value: '₹75,000' }
          ],
          filename: `StockSense_Inventory_Aging_${dateStr}.pdf`,
          apiType: 'aging'
        });
        onNotify?.('PDF Exported', 'Inventory Aging & Depreciation report downloaded as PDF.', 'success');
      } else if (activeReportTab === 'trends') {
        await downloadPdfReport({
          title: 'StockSense — Procurement Spend vs Sales Revenue Trends',
          subtitle: `Scope: ${selectedHub} | Period: ${dateFilter} | Net Variance Analysis`,
          columns: [
            { header: 'Fiscal Month', accessor: 'month' },
            { header: 'Inbound Procurement', accessor: 'purchase' },
            { header: 'Outbound Sales', accessor: 'sales' },
            { header: 'Net Cash Spread', accessor: 'variance' },
            { header: 'Gross Margin %', accessor: 'margin' }
          ],
          data: procurementVsSalesData.map(d => ({
            month: `${d.month} 2026`,
            purchase: `₹${d.purchase.toLocaleString()}`,
            sales: `₹${d.sales.toLocaleString()}`,
            variance: `+₹${(d.sales - d.purchase).toLocaleString()}`,
            margin: `${(((d.sales - d.purchase) / d.sales) * 100).toFixed(1)}%`
          })),
          summaryCards: [
            { title: 'Total Inbound Spend', value: '₹435,000' },
            { title: 'Total Outbound Sales', value: '₹596,000' },
            { title: 'Gross Cash Spread', value: '+₹161,000' }
          ],
          filename: `StockSense_Trends_Report_${dateStr}.pdf`,
          apiType: 'trends'
        });
        onNotify?.('PDF Exported', 'Procurement vs Sales Trends report downloaded as PDF.', 'success');
      } else if (activeReportTab === 'velocity') {
        await downloadPdfReport({
          title: 'StockSense — Fast-Moving Velocity Ranking',
          subtitle: `Scope: ${selectedHub} | Trailing 30 Days Top Moving SKUs`,
          columns: [
            { header: 'Rank', accessor: 'rank' },
            { header: 'SKU Code', accessor: 'sku' },
            { header: 'Product Description', accessor: 'name' },
            { header: '30d Outbound Volume', accessor: 'volume' },
            { header: 'Gross Revenue Generated', accessor: 'revenue' },
            { header: 'Velocity Classification', accessor: 'velocity' }
          ],
          data: TOP_MOVING_PRODUCTS.map(p => ({
            rank: `#${p.rank}`,
            sku: p.sku,
            name: p.name,
            volume: `${p.volume} units`,
            revenue: `₹${p.revenue.toLocaleString()}`,
            velocity: p.velocity
          })),
          summaryCards: [
            { title: 'Rank #1 Product', value: 'SEN-TRQ-90' },
            { title: 'Top Mover Units', value: '260 units' },
            { title: 'Top Mover Revenue', value: '₹53,625' }
          ],
          filename: `StockSense_Velocity_Ranking_${dateStr}.pdf`,
          apiType: 'velocity'
        });
        onNotify?.('PDF Exported', 'Fast-Moving Product Velocity report downloaded as PDF.', 'success');
      }
    } catch (err) {
      onNotify?.('Export Error', err.message || 'Failed to export PDF report.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Handle Excel (.xlsx) Export
  const handleExportExcel = async () => {
    setExporting(true);
    const dateStr = new Date().toISOString().slice(0, 10);

    try {
      if (activeReportTab === 'valuation') {
        await downloadExcelReport({
          title: 'StockSense — Stock Valuation & Inventory Turnover',
          sheetName: 'Stock Valuation',
          columns: [
            { header: 'Fiscal Month', accessor: 'month' },
            { header: 'Procurement (INR)', accessor: 'purchase' },
            { header: 'Sales (INR)', accessor: 'sales' },
            { header: 'Net Valuation (INR)', accessor: 'inventoryValue' },
            { header: 'Turnover Ratio', accessor: 'turnover' }
          ],
          data: DASHBOARD_TREND_DATA.map(d => ({
            month: `${d.month} 2026`,
            purchase: d.purchase,
            sales: d.sales,
            inventoryValue: d.inventoryValue * 1000,
            turnover: '5.4x'
          })),
          filename: `StockSense_Stock_Valuation_${dateStr}.xlsx`,
          apiType: 'valuation'
        });
        onNotify?.('Excel Exported', 'Stock Valuation & Turnover report downloaded as Excel (.xlsx).', 'success');
      } else if (activeReportTab === 'aging') {
        await downloadExcelReport({
          title: 'StockSense — Inventory Aging & Depreciation Risk',
          sheetName: 'Stock Aging',
          columns: [
            { header: 'Aging Tier', accessor: 'range' },
            { header: 'Line Items Count', accessor: 'count' },
            { header: 'Locked Value (INR)', accessor: 'value' },
            { header: 'Portfolio Percentage', accessor: 'percentage' },
            { header: 'Risk Status', accessor: 'risk' }
          ],
          data: STOCK_AGING_DATA.map(t => ({
            range: t.range,
            count: t.count,
            value: t.value,
            percentage: `${t.percentage}%`,
            risk: t.risk
          })),
          filename: `StockSense_Inventory_Aging_${dateStr}.xlsx`,
          apiType: 'aging'
        });
        onNotify?.('Excel Exported', 'Inventory Aging & Depreciation report downloaded as Excel (.xlsx).', 'success');
      } else if (activeReportTab === 'trends') {
        await downloadExcelReport({
          title: 'StockSense — Procurement vs Sales Revenue Trends',
          sheetName: 'Procurement vs Sales',
          columns: [
            { header: 'Fiscal Month', accessor: 'month' },
            { header: 'Inbound Procurement (INR)', accessor: 'purchase' },
            { header: 'Outbound Sales (INR)', accessor: 'sales' },
            { header: 'Net Cash Spread (INR)', accessor: 'variance' },
            { header: 'Gross Margin Ratio', accessor: 'margin' }
          ],
          data: procurementVsSalesData.map(d => ({
            month: `${d.month} 2026`,
            purchase: d.purchase,
            sales: d.sales,
            variance: d.sales - d.purchase,
            margin: `${(((d.sales - d.purchase) / d.sales) * 100).toFixed(1)}%`
          })),
          filename: `StockSense_Trends_Report_${dateStr}.xlsx`,
          apiType: 'trends'
        });
        onNotify?.('Excel Exported', 'Procurement vs Sales Trends downloaded as Excel (.xlsx).', 'success');
      } else if (activeReportTab === 'velocity') {
        await downloadExcelReport({
          title: 'StockSense — Fast-Moving Velocity Ranking',
          sheetName: 'Product Velocity',
          columns: [
            { header: 'Rank', accessor: 'rank' },
            { header: 'SKU Code', accessor: 'sku' },
            { header: 'Product Description', accessor: 'name' },
            { header: 'Units Sold (30d)', accessor: 'volume' },
            { header: 'Gross Revenue (INR)', accessor: 'revenue' },
            { header: 'Velocity Classification', accessor: 'velocity' }
          ],
          data: TOP_MOVING_PRODUCTS.map(p => ({
            rank: p.rank,
            sku: p.sku,
            name: p.name,
            volume: p.volume,
            revenue: p.revenue,
            velocity: p.velocity
          })),
          filename: `StockSense_Velocity_Ranking_${dateStr}.xlsx`,
          apiType: 'velocity'
        });
        onNotify?.('Excel Exported', 'Fast-Moving Product Velocity downloaded as Excel (.xlsx).', 'success');
      }
    } catch (err) {
      onNotify?.('Export Error', err.message || 'Failed to export Excel report.', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Export Stagnant Clearance List
  const handleExportClearancePdf = async () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    await downloadPdfReport({
      title: 'StockSense — Stagnant Inventory Clearance Action List',
      subtitle: '12 SKUs with zero movement in >90 days (Valuation: ₹75,000)',
      columns: [
        { header: 'SKU', accessor: 'sku' },
        { header: 'Product Name', accessor: 'name' },
        { header: 'Category', accessor: 'category' },
        { header: 'Days Idle', accessor: 'daysStagnant' },
        { header: 'Units', accessor: 'units' },
        { header: 'Unit Cost', accessor: 'unitCost' },
        { header: 'Total Value', accessor: 'totalValue' },
        { header: 'Recommendation', accessor: 'recommendation' }
      ],
      data: STAGNANT_CLEARANCE_ITEMS,
      filename: `StockSense_Clearance_List_${dateStr}.pdf`,
      apiType: 'clearance'
    });
    onNotify?.('Clearance Dossier', '12 stagnant items exported to PDF successfully.', 'success');
  };

  const handleExportClearanceExcel = async () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    await downloadExcelReport({
      title: 'StockSense — Stagnant Inventory Clearance Action List',
      sheetName: 'Clearance SKUs',
      columns: [
        { header: 'SKU', accessor: 'sku' },
        { header: 'Product Name', accessor: 'name' },
        { header: 'Category', accessor: 'category' },
        { header: 'Days Idle', accessor: 'daysStagnant' },
        { header: 'Units', accessor: 'units' },
        { header: 'Unit Cost', accessor: 'unitCost' },
        { header: 'Total Value', accessor: 'totalValue' },
        { header: 'Action Recommendation', accessor: 'recommendation' }
      ],
      data: STAGNANT_CLEARANCE_ITEMS,
      filename: `StockSense_Clearance_List_${dateStr}.xlsx`,
      apiType: 'clearance'
    });
    onNotify?.('Clearance Dossier', '12 stagnant items exported to Excel (.xlsx) successfully.', 'success');
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

        <div className="page-header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleExportPdf}
            disabled={exporting}
            title="Download executive report in PDF format"
          >
            <FileText size={15} />
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportExcel}
            disabled={exporting}
            title="Download report data in Excel (.xlsx) format"
          >
            <FileSpreadsheet size={15} />
            <span>Export Excel</span>
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
                onChange={(e) => {
                  setSelectedHub(e.target.value);
                  onChangeWarehouse?.(e.target.value);
                }}
              >
                <option value="All">All Facilities (Consolidated)</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)' }}>
            Financial Year: 2026 • Reporting Currency: INR (₹)
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
              value="₹1,440,000"
              subtext="Calculated via FIFO method"
              icon={IndianRupee}
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
              value="₹216,000"
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
                <h3 className="chart-title">Valuation History by Fiscal Month (₹k)</h3>
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
                    formatter={(val) => [`₹${val}k`, 'Net Valuation']}
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
                        ₹{tier.value.toLocaleString()} ({tier.percentage}%)
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
                      {tier.count} line items tracked in this age bracket • {tier.risk}
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
                  Stagnant Inventory Flag: ₹75,000
                </h4>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)', maxWidth: '360px', margin: '8px auto 20px' }}>
                  12 SKUs haven't registered outbound sales movements in over 90 days. Recommended for vendor return or promotional clearance.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleExportClearancePdf}
                    title="Export 12 stagnant items as PDF"
                  >
                    <FileText size={14} />
                    <span>Download Clearance PDF</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleExportClearanceExcel}
                    title="Export 12 stagnant items as Excel"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Download Clearance Excel</span>
                  </button>
                </div>
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
                  formatter={(val) => [`₹${val.toLocaleString()}`, '']}
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
                <Legend />
                <Bar dataKey="purchase" name="Procurement Inflow (₹)" fill="#FAC4A2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sales" name="Sales Dispatched (₹)" fill="#E8894E" radius={[4, 4, 0, 0]} />
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
                <th>SKU</th>
                <th>Units Sold (30d)</th>
                <th>Gross Revenue</th>
                <th>Velocity Status</th>
              </tr>
            </thead>
            <tbody>
              {TOP_MOVING_PRODUCTS.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 800, color: 'var(--color-primary-600)' }}>#{item.rank}</td>
                  <td className="font-semibold">{item.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-neutral-500)' }}>{item.sku}</td>
                  <td style={{ fontWeight: 700 }}>{item.volume} units</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-primary-700)' }}>₹{item.revenue.toLocaleString()}</td>
                  <td>
                    <span className="badge badge-primary">{item.velocity}</span>
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
