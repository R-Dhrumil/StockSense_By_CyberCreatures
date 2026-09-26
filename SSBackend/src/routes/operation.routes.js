import { Router } from 'express';
import {
  // Operation 1: Receipts (Incoming Goods)
  getReceipts,
  getReceiptById,
  createReceipt,
  validateReceipt,

  // Operation 2: Deliveries (Outgoing Customer Shipments)
  getDeliveries,
  getDeliveryById,
  createDelivery,
  pickDelivery,
  packDelivery,
  validateDelivery,
  cancelDelivery,

  // Audit Ledger
  getStockLedger,
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

// =============================================================================
// OPERATION 2: DELIVERIES (Outgoing Customer Shipments)
// =============================================================================

// GET /api/v1/operations/deliveries — List outgoing delivery orders
router.get('/deliveries', getDeliveries);

// POST /api/v1/operations/deliveries — Create outgoing delivery order (DRAFT/WAITING)
router.post('/deliveries', createDelivery);

// GET /api/v1/operations/deliveries/:id — Single delivery order details
router.get('/deliveries/:id', getDeliveryById);

// POST /api/v1/operations/deliveries/:id/pick — Step 1: Pick & reserve stock (WAITING -> READY)
router.post('/deliveries/:id/pick', pickDelivery);

// POST /api/v1/operations/deliveries/:id/pack — Step 2: Pack items into parcel (READY -> PACKED)
router.post('/deliveries/:id/pack', packDelivery);

// POST /api/v1/operations/deliveries/:id/validate — Step 3: Dispatch & update stock/ledger (PACKED/READY -> DONE)
router.post('/deliveries/:id/validate', validateDelivery);

// POST /api/v1/operations/deliveries/:id/cancel — Cancel & release reserved stock (-> CANCELED)
router.post('/deliveries/:id/cancel', cancelDelivery);

// =============================================================================
// AUDIT LEDGER
// =============================================================================

// GET /api/v1/operations/ledger — Stock ledger audit trail
router.get('/ledger', getStockLedger);

export default router;
