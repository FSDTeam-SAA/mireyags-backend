import express from "express";
import { verifyToken } from "../../core/middlewares/authMiddleware.js";
import { createReviewController, getProductReviewsController } from "./review.controller.js";


const router = express.Router();

router.post("/", verifyToken, createReviewController);
router.get("/:productId", getProductReviewsController);

export default router;