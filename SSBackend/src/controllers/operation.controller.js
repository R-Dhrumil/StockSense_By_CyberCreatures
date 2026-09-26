import { Receipt } from '../models/receipt.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { broadcastEvent } from '../services/socket.service.js';

/**
 * GET /api/v1/operations/receipts
 * List all receipts with status, supplier, and search filtering
 */
export const getReceipts = catchAsync(async (req, res) => {
  const { status, supplier, search, limit = 50, page = 1 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const receipts = await Receipt.findAll({
    status,
    supplier,
    search,
    limit: parseInt(limit, 10),
    offset
  });

  return ApiResponse.send(
    res,
    200,
    {
      count: receipts.length,
      receipts
    },
    'Receipts retrieved successfully'
  );
});

/**
 * GET /api/v1/operations/receipts/:id
 * Get single receipt with nested item lines
 */
export const getReceiptById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const receipt = await Receipt.findById(id);
  if (!receipt) {
    throw new ApiError(404, 'Receipt operation not found');
  }

  return ApiResponse.send(
    res,
    200,
    { receipt },
    'Receipt details retrieved successfully'
  );
});

/**
 * POST /api/v1/operations/receipts
 * Create a new incoming receipt in DRAFT or READY state
 */
export const createReceipt = catchAsync(async (req, res) => {
  const {
    partner_name,
    partnerName,
    supplier,
    dest_location_id,
    destLocationId,
    locationId,
    reference_note,
    referenceNote,
    notes,
    items = [],
    status = 'READY'
  } = req.body;

  const partner = partner_name || partnerName || supplier;
  const targetLocation = dest_location_id || destLocationId || locationId;

  if (!partner) {
    throw new ApiError(400, 'Supplier / Partner name is required');
  }

  if (!targetLocation) {
    throw new ApiError(400, 'Destination location / rack ID is required');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'At least one product line item is required');
  }

  const receipt = await Receipt.create({
    partner_name: partner,
    dest_location_id: targetLocation,
    reference_note: reference_note || referenceNote || notes || '',
    created_by: req.user?.id || null,
    items,
    status
  });

  // Broadcast real-time creation
  try {
    broadcastEvent('receipt:created', {
      id: receipt.id,
      operationNumber: receipt.operationNumber,
      partnerName: receipt.partnerName,
      status: receipt.status,
      timestamp: new Date()
    });
  } catch (e) {}

  return ApiResponse.send(
    res,
    201,
    { receipt },
    `Receipt ${receipt.operationNumber} created successfully in ${receipt.status} status`
  );
});

/**
 * POST /api/v1/operations/receipts/:id/validate
 * Atomic SQL transaction: Validate receipt, increment stock at target rack, append to audit ledger
 */
export const validateReceipt = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { itemsReceived = [] } = req.body;

  const validated = await Receipt.validate(
    id,
    itemsReceived,
    req.user?.id || null
  );

  // Broadcast WebSocket events to update all clients in real-time
  try {
    broadcastEvent('stock:updated', {
      operationId: validated.id,
      operationNumber: validated.operationNumber,
      type: 'RECEIPT',
      destLocationId: validated.destLocationId,
      totalUnitsIncremented: validated.totalUnitsIncremented,
      timestamp: new Date()
    });

    broadcastEvent('receipt:validated', {
      receipt: validated,
      timestamp: new Date()
    });
  } catch (e) {}

  return ApiResponse.send(
    res,
    200,
    { receipt: validated },
    `Receipt ${validated.operationNumber} validated successfully. +${validated.totalUnitsIncremented || 0} units added to inventory location.`
  );
});

/**
 * GET /api/v1/operations/ledger
 * Inspect immutable stock ledger entries
 */
export const getStockLedger = catchAsync(async (req, res) => {
  const { productId, locationId, limit = 50 } = req.query;

  const ledger = await Receipt.findLedger({
    productId,
    locationId,
    limit: parseInt(limit, 10)
  });

  return ApiResponse.send(
    res,
    200,
    {
      count: ledger.length,
      ledger
    },
    'Stock ledger retrieved successfully'
  );
});
