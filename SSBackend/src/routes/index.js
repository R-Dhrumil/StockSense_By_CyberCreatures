import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import sampleRoutes from './sample.routes.js';
import uploadRoutes from './upload.routes.js';
import warehouseRoutes from './warehouse.routes.js';
import operationRoutes from './operation.routes.js';
import ledgerRoutes from './ledger.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import exportRoutes from './export.routes.js';
import supplierRoutes from './supplier.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/sample', sampleRoutes);
router.use('/upload', uploadRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/operations', operationRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/export', exportRoutes);
router.use('/suppliers', supplierRoutes);

export default router;


