import { createPaginationInfo } from "../../lib/pagination.js";
import Product from "../product/product.model.js";
import Review from "./review.model.js";


export const createReviewService = async (userId, payload) => {
  const { productId, rating, comment } = payload;

  if (!productId || !rating) {
    throw new Error("Product and rating required");
  }

  const existing = await Review.findOne({ userId, productId });
  if (existing) {
    throw new Error("You already reviewed this product");
  }

  const review = await Review.create({
    userId,
    productId,
    rating,
    comment
  });

  const stats = await Review.aggregate([
    { $match: { productId: review.productId } },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (stats.length) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: stats[0].avgRating,
      reviewCount: stats[0].reviewCount
    });
  }

  return review;
};


export const getProductReviewsService = async (productId, query) => {
  const page = Number(query?.page) || 1;
  const limit = Number(query?.limit) || 10;
  const skip = (page - 1) * limit;

  const totalData = await Review.countDocuments({ productId });

  const reviews = await Review.find({ productId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    data: reviews,
    pagination: createPaginationInfo(page, limit, totalData)
  };
};