import { Operation } from '../models/operation.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * Get all Delivery Orders with optional status/search filters
 */
export const getDeliveries = catchAsync(async (req, res) => {
  const { status, search, limit, offset } = req.query;

  const deliveries = await Operation.findAll({
    type: 'DELIVERY',
    status,
    search,
    limit: limit ? parseInt(limit, 10) : 100,
    offset: offset ? parseInt(offset, 10) : 0,
  });

  return ApiResponse.send(
    res,
    200,
    { deliveries, total: deliveries.length },
    'Delivery orders retrieved successfully'
  );
});

/**
 * Get single delivery order by ID with line items
 */
export const getDeliveryById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const delivery = await Operation.findById(id);

  if (!delivery) {
    throw new ApiError(404, 'Delivery order not found');
  }

  return ApiResponse.send(
    res,
    200,
    { delivery },
    'Delivery order details retrieved'
  );
});

/**
 * Create a new Delivery Order (DRAFT / WAITING)
 */
export const createDelivery = catchAsync(async (req, res) => {
  const {
    customerName,
    partnerName,
    shippingAddress,
    warehouseId,
    notes,
    items,
    lines,
  } = req.body;

  const targetPartner = customerName || partnerName;
  if (!targetPartner) {
    throw new ApiError(400, 'Customer name is required');
  }

  const orderLines = items || lines || [];
  if (!Array.isArray(orderLines) || orderLines.length === 0) {
    throw new ApiError(400, 'At least one product item line is required');
  }

  const delivery = await Operation.createDelivery({
    partnerName: targetPartner,
    shippingAddress,
    warehouseId,
    notes,
    createdBy: req.user?.id,
    lines: orderLines.map((l) => ({
      productId: l.productId || l.product_id || l.id,
      demandedQty: Number(l.demandedQty || l.demanded_qty || l.quantity || 1),
      unitPrice: Number(l.unitPrice || l.unit_price || l.price || 0),
    })),
  });

  return ApiResponse.send(
    res,
    201,
    { delivery },
    'Delivery order created successfully'
  );
});

/**
 * Step 1: Pick / Reserve stock for Delivery Order
 * Checks available stock >= demanded stock, reserves quantity, sets status to READY
 */
export const pickDelivery = catchAsync(async (req, res) => {
  const { id } = req.params;
  const delivery = await Operation.pickDelivery(id, req.user?.id);

  return ApiResponse.send(
    res,
    200,
    { delivery },
    'Items picked and stock successfully reserved'
  );
});

/**
 * Step 2: Pack items into shipping parcels
 * Sets status to PACKED
 */
export const packDelivery = catchAsync(async (req, res) => {
  const { id } = req.params;
  const delivery = await Operation.packDelivery(id, req.user?.id);

  return ApiResponse.send(
    res,
    200,
    { delivery },
    'Items packed and ready for dispatch'
  );
});

/**
 * Step 3: Validate & Dispatch Delivery Order
 * Atomic SQL transaction: Decrements available_qty, releases reserved_qty,
 * records negative movement in stock_ledger, updates status to DONE.
 */
export const validateDelivery = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { trackingNumber, carrier, doneQuantities } = req.body;

  const delivery = await Operation.validateDelivery(id, {
    trackingNumber,
    carrier,
    doneQuantities,
    userId: req.user?.id,
  });

  return ApiResponse.send(
    res,
    200,
    { delivery },
    'Delivery order validated & dispatched. Stock ledger updated successfully'
  );
});

/**
 * Cancel a Delivery Order and release any reserved quantities
 */
export const cancelDelivery = catchAsync(async (req, res) => {
  const { id } = req.params;
  const delivery = await Operation.cancelDelivery(id, req.user?.id);

  return ApiResponse.send(
    res,
    200,
    { delivery },
    'Delivery order cancelled and reserved stock released'
  );
});
