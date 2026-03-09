import { generateResponse } from "../../lib/responseFormate.js";
import {
  getCustomerAnalyticsService,
  getDashboardStatsService,
  getDashboardGrowthService
} from "./dashboard.service.js";


export const getCustomerAnalyticsController = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const data = await getCustomerAnalyticsService(req.user, { page, limit, search });
    return generateResponse(res, 200, true, "Customer analytics fetched", data);
  } catch (err) {
    next(err);
  }
};


// GET /api/v1/dashboard/stats
export const getDashboardStatsController = async (req, res, next) => {
  try {
    const data = await getDashboardStatsService(req.user);
    return generateResponse(res, 200, true, "Dashboard stats fetched", data);
  } catch (err) {
    if (err.message === "Only admin can access dashboard stats") {
      return generateResponse(res, 403, false, err.message, null);
    }
    next(err);
  }
};


// GET /api/v1/dashboard/growth?year=2025
export const getDashboardGrowthController = async (req, res, next) => {
  try {
    const data = await getDashboardGrowthService(req.user, req.query);
    return generateResponse(res, 200, true, "Dashboard growth fetched", data);
  } catch (err) {
    if (err.message === "Only admin can access growth data") {
      return generateResponse(res, 403, false, err.message, null);
    }
    next(err);
  }
};