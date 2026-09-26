import { Router } from 'express';
import {
  getReceipts,
  getReceiptById,
  createReceipt,
  validateReceipt,
  getStockLedger
} from '../controllers/operation.controller.js';

const router = Router();

// =============================================================================
// OPERATION 1: RECEIPTS (Incoming Goods)
// =============================================================================

// GET /api/v1/operations/receipts — List receipts with filters (status, date, supplier)
router.get('/receipts', getReceipts);

// POST /api/v1/operations/receipts — Create receipt with line items (Status: DRAFT or READY)
router.post('/receipts', createReceipt);

// GET /api/v1/operations/receipts/:id — Get receipt details and line items
router.get('/receipts/:id', getReceiptById);

// POST /api/v1/operations/receipts/:id/validate — Atomic transaction to validate & increment stock
router.post('/receipts/:id/validate', validateReceipt);

// GET /api/v1/operations/ledger — Stock ledger audit trail
router.get('/ledger', getStockLedger);

export default router;
