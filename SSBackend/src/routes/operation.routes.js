import { Router } from 'express';
import {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  pickDelivery,
  packDelivery,
  validateDelivery,
  cancelDelivery,
} from '../controllers/operation.controller.js';

const router = Router();

// Delivery Orders Endpoints
// GET /api/v1/operations/deliveries — list outgoing delivery orders
router.get('/deliveries', getDeliveries);

// POST /api/v1/operations/deliveries — create outgoing delivery order (DRAFT/WAITING)
router.post('/deliveries', createDelivery);

// GET /api/v1/operations/deliveries/:id — single delivery order details
router.get('/deliveries/:id', getDeliveryById);

// POST /api/v1/operations/deliveries/:id/pick — Step 1: Pick & reserve stock (WAITING -> READY)
router.post('/deliveries/:id/pick', pickDelivery);

// POST /api/v1/operations/deliveries/:id/pack — Step 2: Pack items into parcel (READY -> PACKED)
router.post('/deliveries/:id/pack', packDelivery);

// POST /api/v1/operations/deliveries/:id/validate — Step 3: Dispatch & update stock/ledger (PACKED/READY -> DONE)
router.post('/deliveries/:id/validate', validateDelivery);

// POST /api/v1/operations/deliveries/:id/cancel — Cancel & release reserved stock (-> CANCELLED)
router.post('/deliveries/:id/cancel', cancelDelivery);

export default router;
