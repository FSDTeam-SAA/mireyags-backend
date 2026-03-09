import * as productService from "./product.service.js";
import { generateResponse } from "../../lib/responseFormate.js";
import { cloudinaryUpload } from "../../lib/cloudinaryUpload.js";
import { createPaginationInfo } from "../../lib/pagination.js";


// GET ALL
export const getAllProducts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      stock,
      isNew
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const { products, totalData } =
      await productService.getAllProductsService({
        page,
        limit,
        search,
        category,
        brand,
        minPrice,
        maxPrice,
        stock,
        isNew
      });

    const pagination = createPaginationInfo(page, limit, totalData);

    generateResponse(res, 200, true, "Products fetched successfully", {
      data: products,
      pagination
    });
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch products", error.message);
  }
};


// GET BY ID
export const getProductById = async (req, res) => {
  try {
    const data = await productService.getProductByIdService(req.params.id);

    if (!data) {
      return generateResponse(res, 404, false, "Product not found");
    }

    generateResponse(res, 200, true, "Product fetched successfully", data);

  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch product", error.message);
  }
};


export const getProductStatisticsController = async (req, res, next) => {
  try {
    const data = await productService.getProductStatisticsService(req.user);

    return generateResponse(
      res,
      200,
      true,
      "Product statistics fetched successfully",
      data
    );
  } catch (err) {
    next(err);
  }
};


// CREATE
export const createProduct = async (req, res) => {
  try {
    let {
      name,
      weight,
      size,
      price,
      offerPrice,
      stock,
      category,
      brand,
      description,
      image,
      subImages
    } = req.body;

    const mainImageFile = req.files?.image?.[0];
    const subImageFiles = req.files?.subImages || [];

    if (!name || !price || !category) {
      return generateResponse(res, 400, false, "Name, price and category are required");
    }

    // numbers
    price = Number(price);
    offerPrice = offerPrice ? Number(offerPrice) : 0;
    stock = Number(stock);

    // size parse
    let parsedSize = [];
    if (size) {
      try {
        parsedSize = typeof size === "string" ? JSON.parse(size) : size;
      } catch {
        return generateResponse(res, 400, false, "Invalid size format");
      }
    }

    // =========================
    // MAIN IMAGE
    // =========================
    let imageUrl = image;

    if (mainImageFile) {
      const upload = await cloudinaryUpload(
        mainImageFile.path,
        `product_${Date.now()}`,
        "products"
      );
      imageUrl = upload.secure_url;
    }

    if (!imageUrl) {
      return generateResponse(res, 400, false, "Main image is required");
    }

    // =========================
    // SUB IMAGES
    // =========================
    let subImageUrls = [];

    // if files uploaded
    if (subImageFiles.length) {
      for (const file of subImageFiles) {
        const upload = await cloudinaryUpload(
          file.path,
          `product_sub_${Date.now()}`,
          "products"
        );
        subImageUrls.push(upload.secure_url);
      }
    }

    // if JSON urls provided
    if (!subImageUrls.length && subImages) {
      try {
        subImageUrls =
          typeof subImages === "string" ? JSON.parse(subImages) : subImages;
      } catch {
        return generateResponse(res, 400, false, "Invalid subImages format");
      }
    }

    const product = await productService.createProductService({
      name,
      weight,
      size: parsedSize,
      price,
      offerPrice,
      stock,
      category,
      brand,
      description,
      image: imageUrl,
      subImages: subImageUrls
    });

    return generateResponse(res, 201, true, "Product created successfully", product);

  } catch (error) {
    return generateResponse(res, 400, false, "Failed to create product", error.message);
  }
};


// UPDATE
export const updateProduct = async (req, res) => {
  try {
    const body = req.body;
    const mainImageFile = req.files?.image?.[0];
    const subImageFiles = req.files?.subImages || [];

    let updatedFields = { ...body };

    // ======================
    // NUMBERS
    // ======================
    if (body.price) updatedFields.price = Number(body.price);
    if (body.offerPrice) updatedFields.offerPrice = Number(body.offerPrice);
    if (body.weight) updatedFields.weight = Number(body.weight);

    // ======================
    // SIZE PARSE
    // ======================
    if (body.size) {
      try {
        updatedFields.size =
          typeof body.size === "string" ? JSON.parse(body.size) : body.size;
      } catch {
        return generateResponse(res, 400, false, "Invalid size format");
      }
    }

    // ======================
    // MAIN IMAGE (file OR url)
    // ======================
    if (mainImageFile) {
      const upload = await cloudinaryUpload(
        mainImageFile.path,
        `product_${Date.now()}`,
        "products"
      );
      updatedFields.image = upload.secure_url;
    }
    // if no file → body.image already stays (URL)

    // ======================
    // SUB IMAGES (file OR url)
    // ======================
    let subImageUrls = [];

    // upload files if exist
    if (subImageFiles.length) {
      for (const file of subImageFiles) {
        const upload = await cloudinaryUpload(
          file.path,
          `product_sub_${Date.now()}`,
          "products"
        );
        subImageUrls.push(upload.secure_url);
      }
      updatedFields.subImages = subImageUrls;
    }
    // if json urls provided
    else if (body.subImages) {
      try {
        updatedFields.subImages =
          typeof body.subImages === "string"
            ? JSON.parse(body.subImages)
            : body.subImages;
      } catch {
        return generateResponse(res, 400, false, "Invalid subImages format");
      }
    }

    const updatedProduct = await productService.updateProductService(
      req.params.id,
      updatedFields
    );

    if (!updatedProduct) {
      return generateResponse(res, 404, false, "Product not found");
    }

    return generateResponse(
      res,
      200,
      true,
      "Product updated successfully",
      updatedProduct
    );

  } catch (error) {
    return generateResponse(
      res,
      400,
      false,
      "Failed to update product",
      error.message
    );
  }
};


// DELETE
export const deleteProduct = async (req, res) => {
  try {
    const deleted =
      await productService.deleteProductService(req.params.id);

    if (!deleted) {
      return generateResponse(res, 404, false, "Product not found");
    }

    generateResponse(res, 200, true, "Product deleted successfully");

  } catch (error) {
    generateResponse(res, 400, false, "Failed to delete product", error.message);
  }
};
