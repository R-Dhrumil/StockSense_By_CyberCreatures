import { exportToPdf } from '../utils/exportPdf.js';
import { exportToExcel } from '../utils/exportExcel.js';
import { catchAsync } from '../utils/catchAsync.js';

// Pre-configured report datasets
const VALUATION_DATA = [
  { month: 'Apr 2026', purchase: 62000, sales: 84000, inventoryValue: 142000, turnover: '5.2x' },
  { month: 'May 2026', purchase: 74000, sales: 91000, inventoryValue: 148000, turnover: '5.3x' },
  { month: 'Jun 2026', purchase: 58000, sales: 88000, inventoryValue: 139000, turnover: '5.5x' },
  { month: 'Jul 2026', purchase: 91000, sales: 112000, inventoryValue: 155000, turnover: '5.4x' },
  { month: 'Aug 2026', purchase: 68000, sales: 97000, inventoryValue: 146000, turnover: '5.6x' },
  { month: 'Sep 2026', purchase: 82000, sales: 124000, inventoryValue: 162000, turnover: '5.7x' }
];

const AGING_DATA = [
  { tier: '0–30 Days', count: 142, value: '₹62,400', percentage: '47.9%', risk: 'Low (Fresh Stock)' },
  { tier: '31–60 Days', count: 88, value: '₹38,200', percentage: '29.3%', risk: 'Moderate (Active)' },
  { tier: '61–90 Days', count: 45, value: '₹19,800', percentage: '15.2%', risk: 'Elevated (Review)' },
  { tier: '90+ Days', count: 22, value: '₹9,800', percentage: '7.6%', risk: 'Critical (Stagnant)' }
];

const STAGNANT_CLEARANCE_DATA = [
  { sku: 'SEN-TRQ-90', name: 'Industrial Torque Sensor TS-90', category: 'Sensors', daysStagnant: 114, units: 45, unitCost: '₹349.00', totalValue: '₹15,705.00', recommendation: 'Promotional Clearance' },
  { sku: 'MOT-STP-24', name: 'Precision Stepper Motor 24V', category: 'Motors', daysStagnant: 102, units: 28, unitCost: '₹89.50', totalValue: '₹2,506.00', recommendation: 'Vendor Return' },
  { sku: 'BRG-608-ZZ', name: 'Ball Bearing 608-ZZ', category: 'Mechanical', daysStagnant: 128, units: 180, unitCost: '₹40.00', totalValue: '₹7,200.00', recommendation: 'Bundled Discount' },
  { sku: 'PLC-CPU-04', name: 'Compact PLC Controller', category: 'Electronics', daysStagnant: 95, units: 6, unitCost: '₹2,100.00', totalValue: '₹12,600.00', recommendation: 'Transfer to Main Hub' },
  { sku: 'PNE-CYL-50', name: 'Pneumatic Air Cylinder', category: 'Pneumatics', daysStagnant: 108, units: 14, unitCost: '₹350.00', totalValue: '₹4,900.00', recommendation: 'Promotional Clearance' },
  { sku: 'HYD-VAL-02', name: 'Hydraulic Proportional Valve', category: 'Hydraulics', daysStagnant: 119, units: 5, unitCost: '₹2,850.00', totalValue: '₹14,250.00', recommendation: 'Vendor Return' },
  { sku: 'CBL-SHD-100', name: 'Shielded Industrial Cable 100m', category: 'Cables', daysStagnant: 134, units: 8, unitCost: '₹800.00', totalValue: '₹6,400.00', recommendation: 'Maintenance Use' },
  { sku: 'OPT-ENC-10', name: 'Optical Encoder Module', category: 'Sensors', daysStagnant: 98, units: 12, unitCost: '₹953.25', totalValue: '₹11,439.00', recommendation: 'Bundled Discount' }
];

const TRENDS_DATA = [
  { month: 'Apr 2026', purchase: '₹62,000', sales: '₹84,000', variance: '+₹22,000', margin: '26.2%' },
  { month: 'May 2026', purchase: '₹74,000', sales: '₹91,000', variance: '+₹17,000', margin: '18.7%' },
  { month: 'Jun 2026', purchase: '₹58,000', sales: '₹88,000', variance: '+₹30,000', margin: '34.1%' },
  { month: 'Jul 2026', purchase: '₹91,000', sales: '₹112,000', variance: '+₹21,000', margin: '18.8%' },
  { month: 'Aug 2026', purchase: '₹68,000', sales: '₹97,000', variance: '+₹29,000', margin: '29.9%' },
  { month: 'Sep 2026', purchase: '₹82,000', sales: '₹124,000', variance: '+₹42,000', margin: '33.9%' }
];

const VELOCITY_DATA = [
  { rank: '#1', sku: 'SEN-TRQ-90', name: 'Industrial Torque Sensor TS-90', category: 'Sensors', volume: 142, revenue: '₹49,558', status: 'High Velocity' },
  { rank: '#2', sku: 'MOT-STP-24', name: 'Precision Stepper Motor 24V', category: 'Motors', volume: 85, revenue: '₹7,607', status: 'High Velocity' },
  { rank: '#3', sku: 'NET-SWT-08', name: 'Industrial Ethernet Switch', category: 'Networking', volume: 195, revenue: '₹53,625', status: 'Top Mover' },
  { rank: '#4', sku: 'DRV-BLDC-48', name: 'Brushless DC Servo Drive 48V', category: 'Drives', volume: 110, revenue: '₹47,300', status: 'High Velocity' },
  { rank: '#5', sku: 'STL-ROD-01', name: 'Carbon Steel Round Rods', category: 'Raw Materials', volume: 260, revenue: '₹11,700', status: 'Top Volume' }
];

/**
 * POST /api/v1/export/pdf
 * Export custom data to PDF
 */
export const exportPdfCustom = catchAsync(async (req, res) => {
  const { title = 'StockSense Analytics Report', headers, data = [], filename = 'StockSense_Report.pdf' } = req.body;
  await exportToPdf(res, {
    title,
    headers,
    data,
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  });
});

/**
 * POST /api/v1/export/excel
 * Export custom data to Excel (.xlsx)
 */
export const exportExcelCustom = catchAsync(async (req, res) => {
  const { filename = 'StockSense_Report.xlsx', sheetName = 'Report Data', columns, data = [] } = req.body;
  await exportToExcel(res, {
    filename: filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
    sheetName,
    columns,
    data
  });
});

/**
 * GET /api/v1/export/reports/:type
 * Pre-formatted report downloads in PDF or Excel
 */
export const exportReportByType = catchAsync(async (req, res) => {
  const { type } = req.params;
  const format = (req.query.format || 'pdf').toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);

  let title = 'StockSense Operational Intelligence';
  let data = [];
  let headers = [];
  let columns = [];
  let sheetName = 'Analytics';
  let baseFilename = `StockSense_${type}_Report_${dateStr}`;

  switch (type) {
    case 'valuation':
      title = 'StockSense — Stock Valuation & Inventory Turnover';
      sheetName = 'Valuation & Turnover';
      headers = [
        { label: 'Fiscal Month', property: 'month', width: 80 },
        { label: 'Procurement (₹)', property: 'purchase', width: 90 },
        { label: 'Sales (₹)', property: 'sales', width: 90 },
        { label: 'Net Valuation (₹)', property: 'inventoryValue', width: 100 },
        { label: 'Turnover Ratio', property: 'turnover', width: 80 }
      ];
      columns = headers.map(h => ({ header: h.label, key: h.property, width: 18 }));
      data = VALUATION_DATA;
      break;

    case 'aging':
      title = 'StockSense — Inventory Aging & Depreciation Risk';
      sheetName = 'Stock Aging';
      headers = [
        { label: 'Aging Tier', property: 'tier', width: 80 },
        { label: 'Line Items', property: 'count', width: 70 },
        { label: 'Locked Value', property: 'value', width: 90 },
        { label: 'Portfolio Share', property: 'percentage', width: 80 },
        { label: 'Risk Category', property: 'risk', width: 120 }
      ];
      columns = headers.map(h => ({ header: h.label, key: h.property, width: 18 }));
      data = AGING_DATA;
      break;

    case 'clearance':
      title = 'StockSense — Stagnant Inventory Clearance Dossier';
      sheetName = 'Clearance SKUs';
      headers = [
        { label: 'SKU', property: 'sku', width: 75 },
        { label: 'Product Name', property: 'name', width: 130 },
        { label: 'Category', property: 'category', width: 75 },
        { label: 'Days Idle', property: 'daysStagnant', width: 60 },
        { label: 'Units', property: 'units', width: 45 },
        { label: 'Unit Cost', property: 'unitCost', width: 65 },
        { label: 'Total Value', property: 'totalValue', width: 75 },
        { label: 'Action Recommendation', property: 'recommendation', width: 120 }
      ];
      columns = headers.map(h => ({ header: h.label, key: h.property, width: 18 }));
      data = STAGNANT_CLEARANCE_DATA;
      break;

    case 'trends':
      title = 'StockSense — Procurement vs Sales Revenue Trends';
      sheetName = 'Trends Comparison';
      headers = [
        { label: 'Month', property: 'month', width: 80 },
        { label: 'Procurement Spend', property: 'purchase', width: 100 },
        { label: 'Sales Fulfilled', property: 'sales', width: 100 },
        { label: 'Net Variance', property: 'variance', width: 90 },
        { label: 'Margin Ratio', property: 'margin', width: 80 }
      ];
      columns = headers.map(h => ({ header: h.label, key: h.property, width: 18 }));
      data = TRENDS_DATA;
      break;

    case 'velocity':
      title = 'StockSense — Fast-Moving Product Velocity Ranking';
      sheetName = 'Velocity Ranking';
      headers = [
        { label: 'Rank', property: 'rank', width: 45 },
        { label: 'SKU', property: 'sku', width: 80 },
        { label: 'Product Description', property: 'name', width: 140 },
        { label: 'Category', property: 'category', width: 80 },
        { label: 'Units Sold (30d)', property: 'volume', width: 85 },
        { label: 'Gross Revenue', property: 'revenue', width: 85 },
        { label: 'Velocity Status', property: 'status', width: 80 }
      ];
      columns = headers.map(h => ({ header: h.label, key: h.property, width: 18 }));
      data = VELOCITY_DATA;
      break;

    default:
      title = 'StockSense — Executive Valuation & Analytics Report';
      sheetName = 'Executive Report';
      headers = [
        { label: 'Fiscal Month', property: 'month', width: 80 },
        { label: 'Procurement (₹)', property: 'purchase', width: 90 },
        { label: 'Sales (₹)', property: 'sales', width: 90 },
        { label: 'Net Valuation (₹)', property: 'inventoryValue', width: 100 }
      ];
      columns = headers.map(h => ({ header: h.label, key: h.property, width: 18 }));
      data = VALUATION_DATA;
      break;
  }

  if (format === 'excel' || format === 'xlsx') {
    return await exportToExcel(res, {
      data,
      columns,
      filename: `${baseFilename}.xlsx`,
      sheetName
    });
  }

  // Stream PDF
  return await exportToPdf(res, {
    title,
    data,
    headers,
    filename: `${baseFilename}.pdf`
  });
});
