import Category from "./category.model.js";
import mongoose from "mongoose";


// Get all with pagination, optional search/filter
export const getAllCategoriesService = async ({ page, limit, search, isActive }) => {
  const skip = (page - 1) * limit;

  const filters = {};

  // Default to active categories unless explicitly overridden
  filters.isActive = typeof isActive !== "undefined" ? isActive : true;

  if (search) {
    filters.name = { $regex: search, $options: "i" };
  }

  const [categories, totalData] = await Promise.all([
    Category.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Category.countDocuments(filters)
  ]);

  return { categories, totalData };
};


// Get by id
export const getCategoryByIdService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return await Category.findOne({ _id: id, isActive: true });
};


// Create
export const createCategoryService = async (data) => {
  const category = new Category(data);
  return await category.save();
};


// Update
export const updateCategoryService = async (id, updatedFields) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  return await Category.findByIdAndUpdate(
    id,
    updatedFields,
    { new: true, runValidators: true }
  );
};


// Delete
export const deleteCategoryService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  // Soft delete: deactivate category but keep record for referenced products
  const result = await Category.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  return result ? true : false;
};
