import { Router } from 'express';
import {
  getWarehouses,
  createWarehouse,
  getWarehouseLocations,
  createWarehouseLocation,
  getLocationStock
} from '../controllers/warehouse.controller.js';

const router = Router();

// GET /api/v1/warehouses — List warehouses with capacity, location count, and total stock value.
router.get('/', getWarehouses);

// POST /api/v1/warehouses — Create warehouse.
router.post('/', createWarehouse);

// GET /api/v1/warehouses/:id/locations — List sub-locations / racks for a given warehouse.
router.get('/:id/locations', getWarehouseLocations);

// POST /api/v1/warehouses/:id/locations — Add sub-location (e.g., Rack A, Production Rack).
router.post('/:id/locations', createWarehouseLocation);

// GET /api/v1/warehouses/:id/locations/:locationId/stock — Query stock availability per location.
router.get('/:id/locations/:locationId/stock', getLocationStock);

export default router;
