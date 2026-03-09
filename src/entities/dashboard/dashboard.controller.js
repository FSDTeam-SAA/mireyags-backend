import { generateResponse } from "../../lib/responseFormate.js";
import { getCustomerAnalyticsService } from "./dashboard.service.js";


export const getCustomerAnalyticsController = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;

    const data = await getCustomerAnalyticsService(req.user, {
      page,
      limit,
      search
    });

    return generateResponse(res, 200, true, "Customer analytics fetched", data);
  } catch (err) {
    next(err);
  }
};