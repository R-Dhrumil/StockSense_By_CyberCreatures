import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { sendEmail } from '../utils/email.js';
import { lowStockAlertEmailTemplate } from '../utils/emailTemplates.js';
import { broadcastEvent } from './socket.service.js';
import { logger } from '../utils/logger.js';
import { query } from '../config/db.js';

// In-memory cache to prevent duplicate email storms within 5 minutes for the same product+warehouse
const alertDebounceMap = new Map();

/**
 * Dispatch Low Stock Email & Socket Telemetry to all Admins and Inventory Managers
 * @param {Object} params
 * @param {string} params.productId
 * @param {string} params.productName
 * @param {string} [params.sku]
 * @param {number} params.availableStock
 * @param {number} [params.reorderLevel=10]
 * @param {string} [params.warehouseName]
 * @param {string} [params.locationName]
 * @param {string} [params.uom='pcs']
 * @param {string} [params.reason]
 */
export const triggerLowStockNotification = async ({
  productId,
  productName,
  sku,
  availableStock,
  reorderLevel = 10,
  warehouseName = 'Main Central Hub',
  locationName = '',
  uom = 'pcs',
  reason = 'Inventory reduction'
}) => {
  try {
    const stockVal = Number(availableStock);
    const reorderVal = Number(reorderLevel);

    // 1. Emit real-time WebSocket alert to UI
    broadcastEvent('alert:low_stock', {
      productId,
      productName: productName || 'Stock Item',
      sku,
      currentStock: stockVal,
      reorderLevel: reorderVal,
      warehouseName,
      locationName,
      severity: stockVal <= 0 ? 'CRITICAL' : 'WARNING',
      message: stockVal <= 0
        ? `CRITICAL ALERT: ${productName} is completely OUT OF STOCK in ${warehouseName}!`
        : `LOW STOCK ALERT: ${productName} dropped to ${stockVal} ${uom} (Reorder Limit: ${reorderVal}) in ${warehouseName}.`,
      timestamp: new Date()
    });

    // 2. Prevent duplicate email spam within 2 minutes for identical product & warehouse
    const debounceKey = `${productId || productName}_${warehouseName}_${stockVal <= 0 ? 'OUT' : 'LOW'}`;
    const lastSent = alertDebounceMap.get(debounceKey);
    const now = Date.now();
    if (lastSent && (now - lastSent) < 2 * 60 * 1000) {
      logger.info(`⏳ [AlertService] Low stock email already dispatched recently for ${productName} in ${warehouseName}. Skipping duplicate email.`);
      return;
    }
    alertDebounceMap.set(debounceKey, now);

    // 3. Find all Admin and Inventory Manager recipients
    let recipients = [];
    try {
      recipients = await User.findAdminsAndManagers();
    } catch (err) {
      logger.warn('Failed to query users from DB for alert email:', err.message);
    }

    // Default recipients fallback if DB has no specific managers yet
    const targetList = (recipients && recipients.length > 0)
      ? recipients
      : [
          { name: 'System Admin', email: 'admin@stocksense.internal', role: 'ADMIN' },
          { name: 'Inventory Manager', email: 'manager@stocksense.internal', role: 'INVENTORY_MANAGER' }
        ];

    logger.info(`📧 [AlertService] Triggering Low Stock Alert Email to ${targetList.length} recipients for "${productName}" (Stock: ${stockVal} <= Reorder: ${reorderVal})`);

    const isCritical = stockVal <= 0;
    const emailSubject = isCritical
      ? `🚨 [CRITICAL OUT OF STOCK] ${productName} (${sku || 'SKU'}) in ${warehouseName}`
      : `⚠️ [LOW STOCK ALERT] ${productName} reached reorder limit in ${warehouseName}`;

    // 4. Send emails asynchronously in parallel to each admin/manager
    const emailPromises = targetList.map(async (user) => {
      try {
        const html = lowStockAlertEmailTemplate({
          recipientName: user.name,
          productName,
          sku,
          availableStock: stockVal,
          reorderLevel: reorderVal,
          warehouseName,
          locationName,
          uom
        });

        await sendEmail({
          to: user.email,
          subject: emailSubject,
          html
        });
      } catch (sendErr) {
        logger.error(`❌ [AlertService] Failed to send low stock email to ${user.email}:`, sendErr.message);
      }
    });

    await Promise.allSettled(emailPromises);
  } catch (err) {
    logger.error('❌ [AlertService] Unexpected error in triggerLowStockNotification:', err.message);
  }
};

/**
 * Check product in DB after any stock alteration and trigger alert if below threshold
 * @param {string} productId
 * @param {string} [fallbackWarehouse]
 * @param {string} [locationName]
 */
export const checkProductStockAndAlert = async (productId, fallbackWarehouse, locationName) => {
  try {
    if (!productId) return;

    // Query current product & warehouse info
    const text = `
      SELECT 
        p.id, 
        p.name, 
        p.sku, 
        p.available_qty AS "availableQty", 
        p.reorder_level AS "reorderLevel", 
        p.uom, 
        p.warehouse
      FROM products p
      WHERE p.id = $1
    `;
    const res = await query(text, [productId]);
    if (!res.rows || res.rows.length === 0) return;

    const prod = res.rows[0];
    const availableQty = Number(prod.availableQty || 0);
    const reorderLevel = Number(prod.reorderLevel || 10);

    if (availableQty <= reorderLevel) {
      await triggerLowStockNotification({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        availableStock: availableQty,
        reorderLevel,
        warehouseName: fallbackWarehouse || prod.warehouse || 'Main Central Hub',
        locationName: locationName || '',
        uom: prod.uom || 'pcs'
      });
    }
  } catch (err) {
    logger.error('❌ [AlertService] Error during checkProductStockAndAlert:', err.message);
  }
};
