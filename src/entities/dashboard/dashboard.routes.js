import express from "express";
import { verifyToken } from "../../core/middlewares/authMiddleware.js";
import { getCustomerAnalyticsController } from "./dashboard.controller.js";


const router = express.Router();

router.get("/customers", verifyToken, getCustomerAnalyticsController);

export default router;