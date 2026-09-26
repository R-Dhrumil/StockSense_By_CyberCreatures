import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';
import { exportToExcel } from '../utils/exportExcel.js';
import { exportToPdf } from '../utils/exportPdf.js';

import { ROLES } from '../config/roles.js';

const MOCK_DATA = [
  { id: 1, title: 'Stock Receipt #REC-101 (Steel Rods)', category: 'Receipts', department: 'Warehouse', amount: 5000 },
  { id: 2, title: 'Delivery Order #DEL-102 (Finished Goods)', category: 'Deliveries', department: 'Logistics', amount: 12000 },
  { id: 3, title: 'Internal Transfer #TRF-201 (Main to Production)', category: 'Transfers', department: 'Operations', amount: 0 },
  { id: 4, title: 'Stock Adjustment #ADJ-001 (Physical Count)', category: 'Adjustments', department: 'Warehouse', amount: 100 },
];

export const getScopedData = catchAsync(async (req, res) => {
  const userRole = req.user.role;
  let result = [];

  if (userRole === ROLES.ADMIN || userRole === ROLES.INVENTORY_MANAGER) {
    result = MOCK_DATA;
  } else if (userRole === ROLES.STAFF) {
    result = MOCK_DATA.filter((item) => ['Transfers', 'Adjustments', 'Receipts', 'Deliveries'].includes(item.category));
  } else {
    result = [];
  }

  return ApiResponse.send(
    res,
    200,
    {
      userRole,
      filterApplied: req.dbFilter || {},
      count: result.length,
      data: result,
    },
    `Data scoped for role '${userRole}' fetched successfully`
  );
});

export const exportSampleExcel = catchAsync(async (req, res) => {
  await exportToExcel(res, {
    data: MOCK_DATA,
    filename: 'Hackathon_Sample_Report.xlsx',
    sheetName: 'Sample Orders',
  });
});

export const exportSamplePdf = catchAsync(async (req, res) => {
  await exportToPdf(res, {
    title: 'Hackathon Sample Report',
    data: MOCK_DATA,
    filename: 'Hackathon_Sample_Report.pdf',
  });
});
