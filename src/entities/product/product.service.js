import Product from "./product.model.js";
import mongoose from "mongoose";


export const getAllProductsService = async ({
  page,
  limit,
  search,
  category,
  brand,
  minPrice,
  maxPrice,
  stock,
  isNew,
  sortBy
}) => {
  const skip = (page - 1) * limit;

  const matchStage = {};

  if (search) {
    matchStage.name = { $regex: search, $options: "i" };
  }

  if (category) {
    matchStage.category = new mongoose.Types.ObjectId(category);
  }

  if (brand) {
    matchStage.brand = new mongoose.Types.ObjectId(brand);
  }

  if (minPrice || maxPrice) {
    matchStage.price = {};
    if (minPrice) matchStage.price.$gte = Number(minPrice);
    if (maxPrice) matchStage.price.$lte = Number(maxPrice);
  }

  if (stock === "in") {
    matchStage.stock = { $gt: 0 };
  }

  if (stock === "out") {
    matchStage.stock = 0;
  }

  if (isNew === "true") {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    matchStage.createdAt = { $gte: oneMonthAgo };
  }

  const pipeline = [
    { $match: matchStage },

    // Lookup orders
    {
      $lookup: {
        from: "orders",
        localField: "_id",
        foreignField: "orderItems.productId",
        as: "orders"
      }
    },

    // Calculate totalSold
    {
      $addFields: {
        totalSold: {
          $sum: {
            $map: {
              input: "$orders",
              as: "order",
              in: {
                $sum: {
                  $map: {
                    input: "$$order.orderItems",
                    as: "item",
                    in: {
                      $cond: [
                        { $eq: ["$$item.productId", "$_id"] },
                        "$$item.quantity",
                        0
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ];

  // Sorting
  if (sortBy === "best_rating") {
    pipeline.push({ $sort: { averageRating: -1 } });
  } else if (sortBy === "popularity") {
    pipeline.push({
      $addFields: {
        popularityScore: {
          $add: [
            { $multiply: ["$totalSold", 0.7] },
            { $multiply: ["$averageRating", 0.3] }
          ]
        }
      }
    });

    pipeline.push({ $sort: { popularityScore: -1 } });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  const totalData = await Product.countDocuments(matchStage);

  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  pipeline.push(
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category"
      }
    },
    { $unwind: "$category" },
    {
      $lookup: {
        from: "brands",
        localField: "brand",
        foreignField: "_id",
        as: "brand"
      }
    },
    { $unwind: "$brand" }
  );

  const products = await Product.aggregate(pipeline);

  return { products, totalData };
};


export const getProductByIdService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const product = await Product.findById(id)
    .populate("category", "name")
    .populate("brand", "name");

  if (!product) return null;

  const relatedProducts = await Product.find({
    category: product.category._id,
    _id: { $ne: product._id } 
  })
    .populate("category", "name")
    .populate("brand", "name")
    .sort({ createdAt: -1 }) 
    .limit(6);

  return {
    product,
    relatedProducts
  };
};


export const getProductStatisticsService = async (user) => {
  if (user.role !== "ADMIN") {
    throw new Error("Only admin can access product statistics");
  }

  const stats = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        inStockProducts: {
          $sum: {
            $cond: [{ $gt: ["$stock", 0] }, 1, 0]
          }
        },
        outOfStockProducts: {
          $sum: {
            $cond: [{ $eq: ["$stock", 0] }, 1, 0]
          }
        }
      }
    }
  ]);

  return (
    stats[0] || {
      totalProducts: 0,
      inStockProducts: 0,
      outOfStockProducts: 0
    }
  );
};



export const createProductService = async (data) => {
  const product = new Product(data);
  return await product.save();
};


export const updateProductService = async (id, updatedFields) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  return await Product.findByIdAndUpdate(
    id,
    updatedFields,
    { new: true, runValidators: true }
  );
};


export const deleteProductService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const result = await Product.findByIdAndDelete(id);
  return result ? true : false;
};
