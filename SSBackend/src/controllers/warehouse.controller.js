import { Warehouse } from '../models/warehouse.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * GET /api/v1/warehouses
 * List all warehouses with capacity, location count, and total stock value.
 */
export const getWarehouses = catchAsync(async (req, res) => {
  const warehouses = await Warehouse.findAll();
  return ApiResponse.send(
    res,
    200,
    {
      count: warehouses.length,
      warehouses
    },
    'Warehouses retrieved successfully with capacity and valuation telemetry'
  );
});

/**
 * POST /api/v1/warehouses
 * Create a new warehouse facility
 */
export const createWarehouse = catchAsync(async (req, res) => {
  const { name, code, address, manager_name, managerName, is_active, isActive } = req.body;

  if (!name || !code) {
    throw new ApiError(400, 'Warehouse name and unique code are required.');
  }

  const warehouse = await Warehouse.create({
    name,
    code,
    address,
    manager_name: manager_name || managerName,
    is_active: is_active ?? isActive ?? true
  });

  return ApiResponse.send(
    res,
    201,
    { warehouse },
    'Warehouse created successfully with primary location dock initialized'
  );
});

/**
 * GET /api/v1/warehouses/:id/locations
 * List sub-locations / racks for a given warehouse
 */
export const getWarehouseLocations = catchAsync(async (req, res) => {
  const { id } = req.params;

  const locations = await Warehouse.findLocations(id);

  return ApiResponse.send(
    res,
    200,
    {
      warehouseId: id,
      count: locations.length,
      locations
    },
    'Warehouse sub-locations and rack allocations retrieved successfully'
  );
});

/**
 * POST /api/v1/warehouses/:id/locations
 * Add a sub-location (e.g., Rack A, Production Floor, Inbound Dock)
 */
export const createWarehouseLocation = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, code, type } = req.body;

  if (!name || !code) {
    throw new ApiError(400, 'Sub-location name and code are required.');
  }

  const validTypes = ['INTERNAL', 'VENDOR', 'CUSTOMER', 'SCRAP', 'TRANSIT'];
  const normalizedType = (type || 'INTERNAL').toUpperCase();
  if (!validTypes.includes(normalizedType)) {
    throw new ApiError(400, `Invalid location type: ${type}. Allowed types: ${validTypes.join(', ')}`);
  }

  const location = await Warehouse.createLocation({
    warehouseId: id,
    name,
    code,
    type: normalizedType
  });

  return ApiResponse.send(
    res,
    201,
    { location },
    `Sub-location '${location.name}' (${location.code}) established successfully`
  );
});

/**
 * GET /api/v1/warehouses/:id/locations/:locationId/stock
 * Query stock availability per location
 */
export const getLocationStock = catchAsync(async (req, res) => {
  const { id, locationId } = req.params;

  const stock = await Warehouse.findLocationStock(id, locationId);

  return ApiResponse.send(
    res,
    200,
    {
      warehouseId: id,
      locationId,
      itemCount: stock.length,
      stock
    },
    'Granular rack stock availability retrieved'
  );
});
