import { Receipt } from './receipt.model.js';
import { Delivery } from './delivery.model.js';
import { Transfer } from './transfer.model.js';

// Backward compatibility alias: Operation maps to Receipt
export const Operation = Receipt;
export { Receipt, Delivery, Transfer };
export default Receipt;
