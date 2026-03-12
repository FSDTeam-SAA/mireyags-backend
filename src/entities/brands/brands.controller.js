import { createPaginationInfo } from "../../lib/pagination.js";
import { generateResponse } from "../../lib/responseFormate.js";
import * as brandService from "./brands.service.js";


// Get all brands
export const getAllBrands = async (req, res) => {
  try {
    let { page = 1, limit = 10, q, isActive } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const search = q?.trim();
    const parsedIsActive =
      typeof isActive !== "undefined" ? isActive === "true" : undefined;

    const { brands, totalData } =
      await brandService.getAllBrandsService({
        page,
        limit,
        search,
        isActive: parsedIsActive
      });

    const pagination = createPaginationInfo(page, limit, totalData);

    generateResponse(res, 200, true, "Brands fetched successfully", {
      data: brands,
      pagination
    });

  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch brands", error.message);
  }
};


// Get brand by ID
export const getBrandById = async (req, res) => {
  try {
    const brand = await brandService.getBrandByIdService(req.params.id);

    if (!brand) {
      return generateResponse(res, 404, false, "Brand not found");
    }

    generateResponse(res, 200, true, "Brand fetched successfully", brand);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch brand", error.message);
  }
};


// Create brand
export const createBrand = async (req, res) => {
  try {
    const { name } = req.body;

    const brand = await brandService.createBrandService({ name });

    generateResponse(res, 201, true, "Brand created successfully", brand);
  } catch (error) {
    generateResponse(res, 400, false, error.message || "Failed to create brand");
  }
};


// Update brand
export const updateBrand = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    const updatedBrand = await brandService.updateBrandService(
      req.params.id,
      { name, isActive }
    );

    if (!updatedBrand) {
      return generateResponse(res, 404, false, "Brand not found");
    }

    generateResponse(res, 200, true, "Brand updated successfully", updatedBrand);
  } catch (error) {
    generateResponse(res, 400, false, error.message || "Failed to update brand");
  }
};


// Delete brand
export const deleteBrand = async (req, res) => {
  try {
    const deleted = await brandService.deleteBrandService(req.params.id);

    if (!deleted) {
      return generateResponse(res, 404, false, "Brand not found");
    }

    generateResponse(res, 200, true, "Brand deleted successfully");
  } catch (error) {
    generateResponse(res, 400, false, error.message || "Failed to delete brand");
  }
};
