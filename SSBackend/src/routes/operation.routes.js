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

  // Operation 3: Internal Transfers (Inter-Rack / Inter-Hub)
  getTransfers,
  getTransferById,
  createTransfer,
  validateTransfer,
  cancelTransfer,

  // Operation 4: Stock Adjustments (Physical Cycle Counts)
  getAdjustments,
  createAdjustment,

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
// OPERATION 3: INTERNAL TRANSFERS (Inter-Rack / Inter-Hub)
// =============================================================================

// GET /api/v1/operations/transfers — List internal transfers
router.get('/transfers', getTransfers);

// POST /api/v1/operations/transfers — Create internal transfer
router.post('/transfers', createTransfer);

// GET /api/v1/operations/transfers/:id — Single transfer details
router.get('/transfers/:id', getTransferById);

// POST /api/v1/operations/transfers/:id/validate — Validate internal transfer & update location stock
router.post('/transfers/:id/validate', validateTransfer);

// POST /api/v1/operations/transfers/:id/cancel — Cancel internal transfer
router.post('/transfers/:id/cancel', cancelTransfer);

// =============================================================================
// OPERATION 4: STOCK ADJUSTMENTS (Physical Counts)
// =============================================================================

// GET /api/v1/operations/adjustments — List stock adjustments history
router.get('/adjustments', getAdjustments);

// POST /api/v1/operations/adjustments — Submit physical inventory count adjustment
router.post('/adjustments', createAdjustment);

// =============================================================================
// AUDIT LEDGER
// =============================================================================

// GET /api/v1/operations/ledger — Stock ledger audit trail
router.get('/ledger', getStockLedger);

export default router;

