import { Router } from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplier.controller.js';

const router = Router();

// GET /api/v1/suppliers — List all suppliers with search and pagination
router.get('/', getSuppliers);

// POST /api/v1/suppliers — Create a new supplier
router.post('/', createSupplier);

// GET /api/v1/suppliers/:id — Get supplier details by ID
router.get('/:id', getSupplierById);

// PUT /api/v1/suppliers/:id — Update supplier details
router.put('/:id', updateSupplier);

// DELETE /api/v1/suppliers/:id — Delete / deactivate supplier
router.delete('/:id', deleteSupplier);

export default router;
