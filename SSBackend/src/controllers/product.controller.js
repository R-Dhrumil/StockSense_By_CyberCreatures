import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';
import { checkProductStockAndAlert } from '../services/alert.service.js';

/**
 * Get catalog products with search & filters
 */
export const getProducts = catchAsync(async (req, res) => {
  const { search, category, status, warehouse, lowStockOnly, limit, offset } = req.query;

  const products = await Product.findAll({
    search,
    category,
    status,
    warehouse,
    lowStockOnly: lowStockOnly === 'true',
    limit: limit ? parseInt(limit, 10) : 200,
    offset: offset ? parseInt(offset, 10) : 0,
  });

  return ApiResponse.send(res, 200, { products, total: products.length }, 'Products retrieved successfully');
});

/**
 * Get product by ID
 */
export const getProductById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  return ApiResponse.send(res, 200, { product }, 'Product details retrieved');
});

/**
 * Create a new product
 */
export const createProduct = catchAsync(async (req, res) => {
  const {
    name,
    sku,
    barcode,
    categoryId,
    category_id,
    category,
    category_name,
    uom,
    unit,
    price,
    costPrice,
    cost_price,
    availableQty,
    available_qty,
    reservedQty,
    reserved_qty,
    reorderLevel,
    reorder_level,
    warehouse,
    supplier,
    description,
    image
  } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Product name is required');
  }

  const cleanSku = sku ? sku.trim().toUpperCase() : `SKU-${Math.floor(1000 + Math.random() * 9000)}`;

  // Check unique SKU
  const existingSku = await Product.findBySku(cleanSku);
  if (existingSku) {
    throw new ApiError(409, `Product with SKU '${cleanSku}' already exists`);
  }

  // Resolve category name if ID provided or vice-versa
  let catId = category_id || categoryId || null;
  let catName = category_name || category || 'General';

  if (!catId && catName && catName !== 'General') {
    const foundCat = await Category.findByName(catName);
    if (foundCat) catId = foundCat.id;
  }

  const product = await Product.create({
    name: name.trim(),
    sku: cleanSku,
    barcode: barcode || null,
    category_id: catId,
    category_name: catName,
    uom: uom || unit || 'pcs',
    price: price !== undefined ? price : 0,
    cost_price: cost_price !== undefined ? cost_price : (costPrice !== undefined ? costPrice : 0),
    available_qty: available_qty !== undefined ? available_qty : (availableQty !== undefined ? availableQty : 0),
    reserved_qty: reserved_qty !== undefined ? reserved_qty : (reservedQty !== undefined ? reservedQty : 0),
    reorder_level: reorder_level !== undefined ? reorder_level : (reorderLevel !== undefined ? reorderLevel : 10),
    warehouse: warehouse || 'Main Store',
    supplier: supplier || '',
    description: description || '',
    image: image || 'Package'
  });

  if (product?.id && (product.availableQty <= (product.reorderLevel || 10))) {
    checkProductStockAndAlert(product.id, product.warehouse);
  }

  return ApiResponse.send(res, 201, { product }, 'Product created successfully');
});

/**
 * Update an existing product
 */
export const updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const existing = await Product.findById(id);

  if (!existing) {
    throw new ApiError(404, 'Product not found');
  }

  // If changing SKU, check uniqueness
  if (req.body.sku && req.body.sku.trim().toUpperCase() !== existing.sku) {
    const duplicate = await Product.findBySku(req.body.sku.trim().toUpperCase());
    if (duplicate && duplicate.id !== id) {
      throw new ApiError(409, `SKU '${req.body.sku}' is already assigned to another product`);
    }
  }

  const updated = await Product.update(id, req.body);
  
  if (updated?.id && (updated.availableQty <= (updated.reorderLevel || 10))) {
    checkProductStockAndAlert(updated.id, updated.warehouse);
  }

  return ApiResponse.send(res, 200, { product: updated }, 'Product updated successfully');
});

/**
 * Delete a product
 */
export const deleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const deleted = await Product.delete(id);

  if (!deleted) {
    throw new ApiError(404, 'Product not found');
  }

  return ApiResponse.send(res, 200, { id }, `Product '${deleted.name}' deleted successfully`);
});

/**
 * Bulk import products from CSV/JSON payload
 */
export const bulkImportProducts = catchAsync(async (req, res) => {
  const { products = [] } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    throw new ApiError(400, 'Products array is required and must not be empty');
  }

  const results = {
    created: 0,
    updated: 0,
    errors: [],
    products: []
  };

  for (const item of products) {
    try {
      const name = item.name || item.product_name || item.productName || item['Product Name'] || item['Name'];
      if (!name || !String(name).trim()) continue;

      let sku = item.sku || item.SKU || item.item_code || item['SKU'] || item['Item Code'];
      if (!sku || !String(sku).trim()) {
        sku = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      sku = String(sku).trim().toUpperCase();

      const price = parseFloat(item.price || item.sellingPrice || item['Selling Price'] || item['Price'] || 0) || 0;
      const cost_price = parseFloat(item.cost_price || item.costPrice || item['Cost Price'] || item['Cost'] || 0) || 0;
      const available_qty = parseInt(item.available_qty || item.availableQty || item.quantity || item.qty || item['Available Stock'] || item['Quantity'] || item['Stock'] || 0, 10) || 0;
      const reorder_level = parseInt(item.reorder_level || item.reorderLevel || item['Reorder Level'] || item['Min Stock'] || 10, 10) || 10;
      const uom = item.uom || item.unit || item['Unit'] || item['UOM'] || 'pcs';
      const category_name = item.category_name || item.category || item['Category'] || item['Category Name'] || 'General';
      const warehouse = item.warehouse || item['Warehouse'] || 'Main Store';
      const barcode = item.barcode || item['Barcode'] || null;
      const description = item.description || item['Description'] || '';

      const existing = await Product.findBySku(sku);
      if (existing) {
        const updated = await Product.update(existing.id, {
          name: String(name).trim(),
          category_name,
          price,
          cost_price,
          available_qty,
          reorder_level,
          uom,
          warehouse,
          barcode,
          description
        });
        results.updated++;
        results.products.push(updated);
      } else {
        const created = await Product.create({
          name: String(name).trim(),
          sku,
          barcode,
          category_name,
          price,
          cost_price,
          available_qty,
          reorder_level,
          uom,
          warehouse,
          description,
          image: 'Package'
        });
        results.created++;
        results.products.push(created);
      }
    } catch (err) {
      results.errors.push({ sku: item.sku || item.name, error: err.message });
    }
  }

  return ApiResponse.send(
    res,
    200,
    results,
    `Processed ${results.created + results.updated} products (${results.created} created, ${results.updated} updated)`
  );
});
