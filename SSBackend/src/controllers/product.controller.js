import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';

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
