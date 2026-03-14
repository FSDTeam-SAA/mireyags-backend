import mongoose from "mongoose";
import slugify from "slugify";
import Brand from "./brands.model.js";
import Product from "../product/product.model.js";


// Get all brands with optional search/filter
export const getAllBrandsService = async ({ page, limit, search, isActive }) => {
  const skip = (page - 1) * limit;

  const filters = {};

  // Default to active brands unless explicitly overridden
  filters.isActive = typeof isActive !== "undefined" ? isActive : true;

  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } }
    ];
  }

  const [brands, totalData] = await Promise.all([
    Brand.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Brand.countDocuments(filters)
  ]);

  return { brands, totalData };
};


// Get brand by ID
export const getBrandByIdService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return await Brand.findOne({ _id: id, isActive: true });
};


// Create brand
export const createBrandService = async ({ name }) => {
  if (!name) throw new Error("Brand name is required");

  // Check duplicate (case insensitive)
  const existing = await Brand.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") }
  });

  if (existing) {
    throw new Error("Brand already exists");
  }

  const slug = slugify(name, { lower: true, strict: true });

  const brand = new Brand({ name, slug });
  return await brand.save();
};


// Update brand
export const updateBrandService = async (id, updatedFields) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  if (updatedFields.name) {
    updatedFields.slug = slugify(updatedFields.name, {
      lower: true,
      strict: true
    });
  }

  return await Brand.findByIdAndUpdate(
    id,
    updatedFields,
    { new: true, runValidators: true }
  );
};


// Delete brand
export const deleteBrandService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  // Soft delete: deactivate brand but keep record for referenced products
  const result = await Brand.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  return result ? true : false;
};
