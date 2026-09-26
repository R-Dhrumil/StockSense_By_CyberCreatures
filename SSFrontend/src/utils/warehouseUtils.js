export const DEFAULT_WAREHOUSES = [
  { id: 'wh-main', name: 'Main Central Hub', code: 'WH-MAIN', address: '100 Logistics Blvd, Oakland, CA 94607' },
  { id: 'wh-prod', name: 'Production Facility East', code: 'WH-PROD', address: '450 Industrial Parkway, Allentown, PA 18109' },
  { id: 'wh-south', name: 'Southern Logistics Depot', code: 'WH-SOUTH', address: '780 Freight Way, Dallas, TX 75261' },
  { id: 'wh-west', name: 'West Coast Distribution', code: 'WH-WEST', address: '1200 Pacific Gateway, Seattle, WA 98101' },
  { id: 'wh-eur', name: 'European Gateway Hub', code: 'WH-EUR', address: 'Rotterdam Port Sector 4, Maasvlakte, Netherlands' },
];

/**
 * Checks whether an item's warehouse property matches the active warehouse filter.
 * Supports exact matching, case-insensitive substring matching, and warehouse codes.
 */
export function matchesWarehouse(itemWarehouse, targetWarehouse, facilityList = []) {
  if (!targetWarehouse || targetWarehouse === 'All') return true;
  if (!itemWarehouse) return false;

  const normTarget = String(targetWarehouse).toLowerCase().trim();
  const normItem = String(itemWarehouse).toLowerCase().trim();

  // Exact or reciprocal substring check
  if (normItem === normTarget) return true;
  if (normItem.includes(normTarget) || normTarget.includes(normItem)) return true;

  // Code or facility alias match
  const allFacilities = facilityList.length > 0 ? facilityList : DEFAULT_WAREHOUSES;
  const targetFac = allFacilities.find(f => 
    (f.name && f.name.toLowerCase() === normTarget) ||
    (f.code && f.code.toLowerCase() === normTarget) ||
    f.id === targetWarehouse
  );

  if (targetFac) {
    const targetName = (targetFac.name || '').toLowerCase();
    const targetCode = (targetFac.code || '').toLowerCase();
    if (targetName && (normItem.includes(targetName) || targetName.includes(normItem))) return true;
    if (targetCode && normItem.includes(targetCode)) return true;
  }

  // Also check if item warehouse matches any known facility code/name
  const itemFac = allFacilities.find(f => 
    (f.name && f.name.toLowerCase() === normItem) ||
    (f.code && f.code.toLowerCase() === normItem)
  );

  if (itemFac) {
    const itemName = (itemFac.name || '').toLowerCase();
    const itemCode = (itemFac.code || '').toLowerCase();
    if (itemName && (normTarget.includes(itemName) || itemName.includes(normTarget))) return true;
    if (itemCode && normTarget.includes(itemCode)) return true;
  }

  return false;
}

/**
 * Filter an array of products by active warehouse
 */
export function filterProductsByWarehouse(products = [], targetWarehouse = 'All', facilityList = []) {
  if (!products || !Array.isArray(products)) return [];
  if (!targetWarehouse || targetWarehouse === 'All') return products;
  return products.filter(p => p && matchesWarehouse(p.warehouse, targetWarehouse, facilityList));
}
