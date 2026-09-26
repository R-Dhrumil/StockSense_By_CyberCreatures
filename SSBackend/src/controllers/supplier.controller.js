import { Supplier } from '../models/supplier.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { broadcastEvent } from '../services/socket.service.js';

/**
 * GET /api/v1/suppliers
 * List all suppliers with search and pagination
 */
export const getSuppliers = catchAsync(async (req, res) => {
  const { search = '', limit = 100, page = 1 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const suppliers = await Supplier.findAll({
    search,
    limit: parseInt(limit, 10),
    offset
  });

  return ApiResponse.send(
    res,
    200,
    {
      count: suppliers.length,
      suppliers
    },
    'Suppliers retrieved successfully'
  );
});

/**
 * GET /api/v1/suppliers/:id
 * Get single supplier by ID
 */
export const getSupplierById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  return ApiResponse.send(
    res,
    200,
    { supplier },
    'Supplier retrieved successfully'
  );
});

/**
 * POST /api/v1/suppliers
 * Create a new supplier
 */
export const createSupplier = catchAsync(async (req, res) => {
  const {
    name,
    contactPerson,
    contact_person,
    email,
    phone,
    location,
    rating,
    leadTimeDays,
    lead_time_days,
    paymentTerms,
    payment_terms,
    suppliedCategories,
    supplied_categories,
    activeOrders,
    active_orders
  } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Supplier name is required');
  }

  if (!email || !email.trim()) {
    throw new ApiError(400, 'Supplier email is required');
  }

  const existing = await Supplier.findByName(name.trim());
  if (existing) {
    throw new ApiError(409, `A supplier with name "${name.trim()}" already exists`);
  }

  const supplier = await Supplier.create({
    name: name.trim(),
    contactPerson: contactPerson || contact_person || '',
    email: email.trim(),
    phone: phone ? phone.trim() : '',
    location: location ? location.trim() : '',
    rating: rating !== undefined ? parseFloat(rating) : 4.5,
    leadTimeDays: leadTimeDays || lead_time_days || 7,
    paymentTerms: paymentTerms || payment_terms || 'Net 30',
    suppliedCategories: suppliedCategories || supplied_categories || '',
    activeOrders: activeOrders || active_orders || 0,
  });

  try {
    broadcastEvent('supplier:created', { supplier, timestamp: new Date() });
  } catch (e) {}

  return ApiResponse.send(
    res,
    201,
    { supplier },
    `Supplier "${supplier.name}" added successfully`
  );
});

/**
 * PUT /api/v1/suppliers/:id
 * Update an existing supplier
 */
export const updateSupplier = catchAsync(async (req, res) => {
  const { id } = req.params;

  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  const updated = await Supplier.update(id, req.body);

  try {
    broadcastEvent('supplier:updated', { supplier: updated, timestamp: new Date() });
  } catch (e) {}

  return ApiResponse.send(
    res,
    200,
    { supplier: updated },
    `Supplier "${updated.name}" updated successfully`
  );
});

/**
 * DELETE /api/v1/suppliers/:id
 * Delete / deactivate a supplier
 */
export const deleteSupplier = catchAsync(async (req, res) => {
  const { id } = req.params;

  const supplier = await Supplier.findById(id);
  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  await Supplier.delete(id);

  try {
    broadcastEvent('supplier:deleted', { id, timestamp: new Date() });
  } catch (e) {}

  return ApiResponse.send(
    res,
    200,
    { id },
    `Supplier "${supplier.name}" deleted successfully`
  );
});
