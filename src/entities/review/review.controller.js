import { generateResponse } from "../../lib/responseFormate.js";
import { createReviewService, getProductReviewsService } from "./review.service.js";


export const createReviewController = async (req, res, next) => {
  try {
    const data = await createReviewService(req.user.id, req.body);

    return generateResponse(res, 200, true, "Review submitted", data);
  } catch (err) {
    next(err);
  }
};


export const getProductReviewsController = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const data = await getProductReviewsService(req.params.productId, {
      page,
      limit
    });

    return generateResponse(res, 200, true, "Reviews fetched", data);
  } catch (err) {
    next(err);
  }
};


