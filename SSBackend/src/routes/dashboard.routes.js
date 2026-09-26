import { Router } from 'express';
import { getDashboardMetrics, getOperationsSummary } from '../controllers/dashboard.controller.js';

const router = Router();

// GET /api/v1/dashboard/metrics — 5 core KPIs
router.get('/metrics', getDashboardMetrics);

// GET /api/v1/dashboard/operations-summary — dynamic multi-filtered operations list
router.get('/operations-summary', getOperationsSummary);

export default router;
