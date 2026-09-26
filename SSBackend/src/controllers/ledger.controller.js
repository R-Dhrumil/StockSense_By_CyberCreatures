import { StockLedger } from '../models/ledger.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';
import { exportToPdf } from '../utils/exportPdf.js';
import { exportToExcel } from '../utils/exportExcel.js';

/**
 * GET /api/v1/ledger
 * Fetch paginated immutable audit trail of inventory movements
 */
export const getLedgerRecords = catchAsync(async (req, res) => {
  const { productId, warehouseId, operationType, search, dateFrom, dateTo, limit = 100, page = 1 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const records = await StockLedger.findAll({
    productId,
    warehouseId,
    operationType,
    search,
    dateFrom,
    dateTo,
    limit: parseInt(limit, 10),
    offset
  });

  return ApiResponse.send(
    res,
    200,
    {
      count: records.length,
      ledger: records
    },
    'Stock ledger audit trail retrieved successfully'
  );
});

/**
 * GET /api/v1/ledger/export
 * Export stock ledger audit records in PDF or Excel format (default: PDF)
 */
export const exportLedger = catchAsync(async (req, res) => {
  const format = (req.query.format || 'pdf').toLowerCase();
  const records = await StockLedger.findAll({ limit: 1000 });

  const formattedData = records.map(r => ({
    id: (r.id || '').substring(0, 10),
    date: r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '',
    type: r.type || r.moveType || '',
    product: r.productName || '',
    sku: r.sku || '',
    qty: r.quantityChange !== undefined ? r.quantityChange : '',
    balance: r.balanceAfter !== undefined ? r.balanceAfter : '',
    reference: r.reference || '',
    user: r.user || ''
  }));

  const headers = [
    { label: 'Audit ID', property: 'id', width: 60 },
    { label: 'Date', property: 'date', width: 60 },
    { label: 'Type', property: 'type', width: 65 },
    { label: 'Product Name', property: 'product', width: 130 },
    { label: 'SKU', property: 'sku', width: 75 },
    { label: 'Delta', property: 'qty', width: 45 },
    { label: 'Balance', property: 'balance', width: 50 },
    { label: 'Reference', property: 'reference', width: 75 },
    { label: 'Auditor', property: 'user', width: 60 }
  ];

  if (format === 'excel' || format === 'xlsx') {
    const columns = headers.map(h => ({ header: h.label, key: h.property, width: 16 }));
    return await exportToExcel(res, {
      data: formattedData,
      columns,
      filename: `StockSense_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: 'Stock Movements'
    });
  }

  if (format === 'csv') {
    const csvHeaders = ['Audit ID', 'Timestamp', 'Operation Type', 'Product Name', 'SKU', 'Quantity Delta', 'Balance After', 'Reference Number', 'Auditor'];
    const csvRows = [
      csvHeaders.join(','),
      ...records.map(r => [
        `"${r.id || ''}"`,
        `"${r.timestamp ? new Date(r.timestamp).toISOString() : ''}"`,
        `"${r.type || r.moveType || ''}"`,
        `"${(r.productName || '').replace(/"/g, '""')}"`,
        `"${r.sku || ''}"`,
        `"${r.quantityChange !== undefined ? r.quantityChange : ''}"`,
        `"${r.balanceAfter !== undefined ? r.balanceAfter : ''}"`,
        `"${r.reference || ''}"`,
        `"${r.user || ''}"`
      ].join(','))
    ];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="StockSense_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send(csvRows.join('\n'));
  }

  // Default: Stream real PDF document
  return await exportToPdf(res, {
    title: 'StockSense Central Stock Ledger Audit Trail',
    data: formattedData,
    headers,
    filename: `StockSense_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.pdf`
  });
});

