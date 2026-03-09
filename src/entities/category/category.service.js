import Category from "./category.model.js";
import mongoose from "mongoose";



// Get all with pagination
export const getAllCategoriesService = async ({ page, limit }) => {
  const skip = (page - 1) * limit;

  const [categories, totalData] = await Promise.all([
    Category.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Category.countDocuments()
  ]);

  return { categories, totalData };
};


// Get by id
export const getCategoryByIdService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return await Category.findById(id);
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

  // safety
  const productExists = await Product.exists({ category: id });
  if (productExists) {
    throw new Error("Cannot delete category. Products are using this category.");
  }

  const result = await Category.findByIdAndDelete(id);
  return result ? true : false;
};
