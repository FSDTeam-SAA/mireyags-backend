import express from "express";
import { verifyToken } from "../../core/middlewares/authMiddleware.js";
import {
  getCustomerAnalyticsController,
  getDashboardStatsController,
  getDashboardGrowthController
} from "./dashboard.controller.js";


const router = express.Router();

router.get("/stats",verifyToken, getDashboardStatsController);
router.get("/growth",verifyToken, getDashboardGrowthController);
router.get("/customers",verifyToken, getCustomerAnalyticsController);

export default router;