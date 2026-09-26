import { Router } from 'express';
import { getLedgerRecords, exportLedger } from '../controllers/ledger.controller.js';

const router = Router();

// GET /api/v1/ledger — Paginated audit trail
router.get('/', getLedgerRecords);

// GET /api/v1/ledger/export — CSV export
router.get('/export', exportLedger);

export default router;
