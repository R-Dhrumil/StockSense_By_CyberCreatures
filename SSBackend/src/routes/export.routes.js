import { Router } from 'express';
import { exportPdfCustom, exportExcelCustom, exportReportByType } from '../controllers/export.controller.js';

const router = Router();

// Custom dynamic exports
router.post('/pdf', exportPdfCustom);
router.post('/excel', exportExcelCustom);

// Pre-defined reports by type (valuation, aging, clearance, trends, velocity)
router.get('/reports/:type', exportReportByType);

export default router;
