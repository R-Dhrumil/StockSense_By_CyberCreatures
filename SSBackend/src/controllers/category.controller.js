import { Category } from '../models/category.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * Get all product categories with product counts and valuation
 */
export const getCategories = catchAsync(async (req, res) => {
  const categories = await Category.findAll();
  return ApiResponse.send(res, 200, { categories }, 'Categories retrieved successfully');
});

/**
 * Create a new category
 */
export const createCategory = catchAsync(async (req, res) => {
  const { name, code, description, icon, status } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Category name is required');
  }

  const existing = await Category.findByName(name.trim());
  if (existing) {
    throw new ApiError(409, `Category '${name.trim()}' already exists`);
  }

  const category = await Category.create({
    name: name.trim(),
    code,
    description,
    icon: icon || 'Layers',
    status: status || 'Active'
  });

  return ApiResponse.send(res, 201, { category }, 'Category created successfully');
});

/**
 * Update an existing category
 */
export const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, code, description, icon, status } = req.body;

  const existing = await Category.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Category not found');
  }

  const updated = await Category.update(id, { name, code, description, icon, status });
  return ApiResponse.send(res, 200, { category: updated }, 'Category updated successfully');
});

/**
 * Delete a category
 */
export const deleteCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  const deleted = await Category.delete(id);
  if (!deleted) {
    throw new ApiError(404, 'Category not found');
  }
  return ApiResponse.send(res, 200, null, 'Category deleted successfully');
});
