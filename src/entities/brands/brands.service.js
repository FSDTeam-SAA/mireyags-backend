import mongoose from "mongoose";
import slugify from "slugify";
import Brand from "./brands.model.js";


// Get all brands
export const getAllBrandsService = async ({ page, limit }) => {
  const skip = (page - 1) * limit;

  const [brands, totalData] = await Promise.all([
    Brand.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Brand.countDocuments()
  ]);

  return { brands, totalData };
};


// Get brand by ID
export const getBrandByIdService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return await Brand.findById(id);
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

  // Optional production safety
  const productExists = await Product.exists({ brand: id });
  if (productExists) {
    throw new Error("Cannot delete brand. Products are using this brand.");
  }

  const result = await Brand.findByIdAndDelete(id);
  return result ? true : false;
};
