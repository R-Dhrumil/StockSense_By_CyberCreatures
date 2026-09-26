import { StockLedger } from '../models/ledger.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';

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
 * Export stock ledger audit records in CSV format
 */
export const exportLedger = catchAsync(async (req, res) => {
  const records = await StockLedger.findAll({ limit: 1000 });

  const headers = ['Audit ID', 'Timestamp', 'Operation Type', 'Product Name', 'SKU', 'Quantity Delta', 'Balance After', 'Source Location', 'Destination Location', 'Reference Number', 'Audit Reason', 'Auditor'];
  
  const csvRows = [
    headers.join(','),
    ...records.map(r => [
      `"${r.id || ''}"`,
      `"${r.timestamp ? new Date(r.timestamp).toISOString() : ''}"`,
      `"${r.type || r.moveType || ''}"`,
      `"${(r.productName || '').replace(/"/g, '""')}"`,
      `"${r.sku || ''}"`,
      `"${r.quantityChange !== undefined ? r.quantityChange : ''}"`,
      `"${r.balanceAfter !== undefined ? r.balanceAfter : ''}"`,
      `"${(r.sourceLocation || '').replace(/"/g, '""')}"`,
      `"${(r.destLocation || '').replace(/"/g, '""')}"`,
      `"${r.reference || ''}"`,
      `"${(r.reason || '').replace(/"/g, '""')}"`,
      `"${r.user || ''}"`
    ].join(','))
  ];

  const csvContent = csvRows.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="StockSense_Audit_Ledger_${new Date().toISOString().slice(0,10)}.csv"`);
  return res.status(200).send(csvContent);
});
