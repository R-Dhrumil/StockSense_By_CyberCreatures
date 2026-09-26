import { Receipt } from '../models/receipt.model.js';
import { Delivery } from '../models/delivery.model.js';
import { Transfer } from '../models/transfer.model.js';
import { Adjustment } from '../models/adjustment.model.js';
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

// =============================================================================
// OPERATION 2: DELIVERIES (Outgoing Customer Shipments)
// =============================================================================

/**
 * GET /api/v1/operations/deliveries
 * List outgoing delivery orders with filters (status, customer, search, pagination)
 */
export const getDeliveries = catchAsync(async (req, res) => {
  const { status, customer, search, limit = 50, page = 1 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const deliveries = await Delivery.findAll({
    status,
    customer,
    search,
    limit: parseInt(limit, 10),
    offset
  });

  return ApiResponse.send(
    res,
    200,
    {
      count: deliveries.length,
      deliveries
    },
    'Deliveries retrieved successfully'
  );
});

/**
 * GET /api/v1/operations/deliveries/:id
 * Get single delivery with nested item lines
 */
export const getDeliveryById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const delivery = await Delivery.findById(id);
  if (!delivery) {
    throw new ApiError(404, 'Delivery operation not found');
  }

  return ApiResponse.send(
    res,
    200,
    { delivery },
    'Delivery details retrieved successfully'
  );
});

/**
 * POST /api/v1/operations/deliveries
 * Create a new outgoing delivery in DRAFT or WAITING state
 */
export const createDelivery = catchAsync(async (req, res) => {
  const {
    partner_name,
    partnerName,
    customer,
    source_location_id,
    sourceLocationId,
    locationId,
    reference_note,
    referenceNote,
    notes,
    items = [],
    lines = [],
    status = 'WAITING'
  } = req.body;

  const partner = partner_name || partnerName || customer;
  let sourceLocation = source_location_id || sourceLocationId || locationId;

  if (!partner) {
    throw new ApiError(400, 'Customer / Partner name is required');
  }

  // Provide default warehouse location fallback if not supplied
  if (!sourceLocation) {
    sourceLocation = 'b1021111-1111-4111-8111-111111111111';
  }

  const orderItems = (Array.isArray(items) && items.length > 0) ? items : lines;

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    throw new ApiError(400, 'At least one product line item is required');
  }

  const delivery = await Delivery.create({
    partner_name: partner,
    source_location_id: sourceLocation,
    reference_note: reference_note || referenceNote || notes || '',
    created_by: req.user?.id || null,
    items: orderItems,
    status
  });

  // Broadcast real-time creation
  try {
    broadcastEvent('delivery:created', {
      id: delivery.id,
      operationNumber: delivery.operationNumber,
      partnerName: delivery.partnerName,
      status: delivery.status,
      timestamp: new Date()
    });
  } catch (e) {}

  return ApiResponse.send(
    res,
    201,
    { delivery },
    `Delivery ${delivery.operationNumber} created successfully in ${delivery.status} status`
  );
});

/**
 * POST /api/v1/operations/deliveries/:id/pick
 * Step 1: Pick items and reserve inventory (WAITING -> READY)
 */
export const pickDelivery = catchAsync(async (req, res) => {
  const { id } = req.params;

  const picked = await Delivery.pick(id);

  try {
    broadcastEvent('delivery:picked', {
      delivery: picked,
      timestamp: new Date()
    });
  } catch (e) {}

  return ApiResponse.send(
    res,
    200,
    { delivery: picked },
    `Delivery ${picked.operationNumber || id} picked and stock reserved successfully`
  );
});

/**
 * POST /api/v1/operations/deliveries/:id/pack
 * Step 2: Pack items into parcel (READY -> PACKED)
 */
export const packDelivery = catchAsync(async (req, res) => {
  const { id } = req.params;

  const packed = await Delivery.pack(id);

  try {
    broadcastEvent('delivery:packed', {
      delivery: packed,
      timestamp: new Date()
    });
  } catch (e) {}

  return ApiResponse.send(
    res,
    200,
    { delivery: packed },
    `Delivery ${packed.operationNumber || id} packed successfully`
  );
});

/**
 * POST /api/v1/operations/deliveries/:id/validate
 * Step 3: Validate & Dispatch delivery, deduct stock from location, append negative movement to audit ledger
 */
export const validateDelivery = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { itemsDelivered = [] } = req.body;

  const validated = await Delivery.validate(
    id,
    itemsDelivered,
    req.user?.id || null
  );

  // Broadcast WebSocket events to update all clients in real-time
  try {
    broadcastEvent('stock:updated', {
      operationId: validated.id,
      operationNumber: validated.operationNumber,
      type: 'DELIVERY',
      sourceLocationId: validated.sourceLocationId,
      totalUnitsDispatched: validated.totalUnitsDispatched,
      timestamp: new Date()
    });

    broadcastEvent('stock:changed', {
      operationId: validated.id,
      operationNumber: validated.operationNumber,
      type: 'DELIVERY',
      timestamp: new Date()
    });

    broadcastEvent('delivery:validated', {
      delivery: validated,
      timestamp: new Date()
    });

    // Check for low stock items and trigger alert:low_stock
    if (validated.items && validated.items.length > 0) {
      for (const it of validated.items) {
        if (it.newAvailableQty !== undefined && it.newAvailableQty <= 10) {
          broadcastEvent('alert:low_stock', {
            productId: it.productId,
            productName: it.productName || 'Stock Product',
            currentStock: it.newAvailableQty,
            reorderLevel: 10,
            severity: it.newAvailableQty === 0 ? 'CRITICAL' : 'WARNING',
            message: it.newAvailableQty === 0 
              ? `CRITICAL ALERT: Product is completely OUT OF STOCK after delivery!` 
              : `LOW STOCK ALERT: Inventory dropped to ${it.newAvailableQty} units after delivery ${validated.operationNumber}.`,
            timestamp: new Date()
          });
        }
      }
    }
  } catch (e) {}

  return ApiResponse.send(
    res,
    200,
    { delivery: validated },
    `Delivery ${validated.operationNumber} validated & dispatched successfully. -${validated.totalUnitsDispatched || 0} units removed from inventory location.`
  );
});

/**
 * POST /api/v1/operations/deliveries/:id/cancel
 * Cancel delivery order and release reserved stock
 */
export const cancelDelivery = catchAsync(async (req, res) => {
  const { id } = req.params;

  const canceled = await Delivery.cancel(id);

  try {
    broadcastEvent('delivery:canceled', {
      delivery: canceled,
      timestamp: new Date()
    });
  } catch (e) {}

  return ApiResponse.send(
    res,
    200,
    { delivery: canceled },
    `Delivery ${canceled.operationNumber || id} canceled and reserved stock released.`
  );
});

// =============================================================================
// OPERATION 3: INTERNAL TRANSFERS (Inter-Rack / Inter-Hub Stock Movements)
// =============================================================================

/**
 * GET /api/v1/operations/transfers
 * List all internal transfers
 */
export const getTransfers = catchAsync(async (req, res) => {
  const { status, search, limit = 50, page = 1 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const transfers = await Transfer.findAll({
    status,
    search,
    limit: parseInt(limit, 10),
    offset
  });

  return ApiResponse.send(
    res,
    200,
    {
      count: transfers.length,
      transfers
    },
    'Internal transfers retrieved successfully'
  );
});

/**
 * GET /api/v1/operations/transfers/:id
 * Get single transfer with items
 */
export const getTransferById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const transfer = await Transfer.findById(id);
  if (!transfer) {
    throw new ApiError(404, 'Transfer operation not found');
  }

  return ApiResponse.send(
    res,
    200,
    { transfer },
    'Transfer details retrieved successfully'
  );
});

/**
 * POST /api/v1/operations/transfers
 * Create an internal transfer
 */
export const createTransfer = catchAsync(async (req, res) => {
  const {
    source_location_id,
    sourceLocationId,
    dest_location_id,
    destLocationId,
    product_id,
    productId,
    quantity,
    demanded_qty,
    demandedQty,
    reference_note,
    referenceNote,
    notes,
    warehouse_id,
    warehouseId,
    items
  } = req.body;

  const srcLoc = source_location_id || sourceLocationId;
  const dstLoc = dest_location_id || destLocationId;

  if (srcLoc && dstLoc && srcLoc === dstLoc) {
    throw new ApiError(400, 'Source and destination locations cannot be identical');
  }

  const transfer = await Transfer.create({
    sourceLocationId: srcLoc,
    destLocationId: dstLoc,
    productId: product_id || productId,
    demandedQty: demanded_qty || demandedQty || quantity || 1,
    notes: reference_note || referenceNote || notes,
    referenceNote: reference_note || referenceNote || notes,
    warehouseId: warehouse_id || warehouseId,
    userId: req.user?.id,
    items
  });

  try {
    broadcastEvent('transfer:created', {
      id: transfer.id,
      operationNumber: transfer.operationNumber || transfer.operation_number,
      status: transfer.status,
      timestamp: new Date()
    });
  } catch (e) {}

  return ApiResponse.send(
    res,
    201,
    { transfer },
    `Internal transfer ${transfer.operationNumber || transfer.operation_number || transfer.id} created successfully`
  );
});

/**
 * POST /api/v1/operations/transfers/:id/validate
 * Atomic SQL transaction: Decrement source location stock, increment destination location stock, log ledger
 */
export const validateTransfer = catchAsync(async (req, res) => {
  const { id } = req.params;

  const validated = await Transfer.validate(id, req.user?.id);

  try {
    broadcastEvent('stock:updated', {
      operationId: validated.id,
      operationNumber: validated.operationNumber || validated.operation_number,
      type: 'INTERNAL',
      sourceLocationId: validated.sourceLocationId || validated.source_location_id,
      destLocationId: validated.destLocationId || validated.dest_location_id,
      timestamp: new Date()
    });

    broadcastEvent('transfer:validated', {
      transfer: validated,
      timestamp: new Date()
    });
  } catch (e) {}

  return ApiResponse.send(
    res,
    200,
    { transfer: validated },
    `Transfer ${validated.operationNumber || validated.operation_number || id} validated successfully. Inter-location inventory balances updated.`
  );
});

/**
 * POST /api/v1/operations/transfers/:id/cancel
 * Cancel transfer
 */
export const cancelTransfer = catchAsync(async (req, res) => {
  const { id } = req.params;

  const canceled = await Transfer.cancel(id);

  try {
    broadcastEvent('transfer:canceled', {
      transfer: canceled,
      timestamp: new Date()
    });
  } catch (e) {}

  return ApiResponse.send(
    res,
    200,
    { transfer: canceled },
    `Transfer ${canceled.operationNumber || canceled.operation_number || id} canceled.`
  );
});

// =============================================================================
// OPERATION 4: STOCK ADJUSTMENTS (Physical Cycle Counts & Discrepancies)
// =============================================================================

/**
 * GET /api/v1/operations/adjustments
 * List physical inventory count adjustments
 */
export const getAdjustments = catchAsync(async (req, res) => {
  const { search, limit = 50, page = 1 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const adjustments = await Adjustment.findAll({
    search,
    limit: parseInt(limit, 10),
    offset
  });

  return ApiResponse.send(
    res,
    200,
    {
      count: adjustments.length,
      adjustments
    },
    'Stock adjustments retrieved successfully'
  );
});

/**
 * POST /api/v1/operations/adjustments
 * Submit physical inventory count adjustment
 */
export const createAdjustment = catchAsync(async (req, res) => {
  const {
    product_id,
    productId,
    location_id,
    locationId,
    warehouse_id,
    warehouseId,
    counted_qty,
    countedQty,
    physical_qty,
    physicalQty,
    quantity,
    mode,
    reason,
    notes,
    reference
  } = req.body;

  const targetProduct = product_id || productId;
  if (!targetProduct) {
    throw new ApiError(400, 'Product ID is required for stock adjustment');
  }

  const targetReason = reason || notes;
  if (!targetReason) {
    throw new ApiError(400, 'A mandatory reason must be provided for audit tracking');
  }

  const adjustment = await Adjustment.create({
    productId: targetProduct,
    locationId: location_id || locationId,
    warehouseId: warehouse_id || warehouseId,
    countedQty: counted_qty !== undefined ? counted_qty : countedQty,
    physicalQty: physical_qty !== undefined ? physical_qty : physicalQty,
    quantity,
    mode: mode || 'exact',
    reason: targetReason,
    notes: targetReason,
    reference,
    userId: req.user?.id
  });

  try {
    broadcastEvent('stock:updated', {
      operationId: adjustment.id,
      operationNumber: adjustment.operationNumber || adjustment.operation_number,
      type: 'ADJUSTMENT',
      productId: targetProduct,
      delta: adjustment.delta,
      timestamp: new Date()
    });

    broadcastEvent('stock:changed', {
      productId: targetProduct,
      delta: adjustment.delta,
      newQty: adjustment.newAvailableQty || adjustment.countedQty,
      timestamp: new Date()
    });

    broadcastEvent('adjustment:created', {
      adjustment,
      timestamp: new Date()
    });

    const newStock = adjustment.newAvailableQty ?? adjustment.countedQty;
    if (newStock !== undefined && newStock <= 10) {
      broadcastEvent('alert:low_stock', {
        productId: targetProduct,
        currentStock: newStock,
        reorderLevel: 10,
        severity: newStock === 0 ? 'CRITICAL' : 'WARNING',
        message: newStock === 0 
          ? `CRITICAL ALERT: Product is completely OUT OF STOCK after physical adjustment ${adjustment.operationNumber || adjustment.id}!` 
          : `LOW STOCK ALERT: Product stock adjusted down to ${newStock} units (${adjustment.reason}).`,
        timestamp: new Date()
      });
    }
  } catch (e) {}

  return ApiResponse.send(
    res,
    201,
    { adjustment },
    `Stock adjustment ${adjustment.operationNumber || adjustment.operation_number || adjustment.id} applied successfully. Delta: ${adjustment.delta > 0 ? `+${adjustment.delta}` : adjustment.delta} units logged to Stock Ledger.`
  );
});

// =============================================================================
// AUDIT LEDGER
// =============================================================================

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

