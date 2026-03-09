import express from "express";
import { verifyToken, optionalToken } from "../../core/middlewares/authMiddleware.js";
import { createOrderCheckoutController, getOrdersController, getOrderController, getOrderStatusStatsController, updateOrderStatusController } from "./order.controller.js";


const router = express.Router();


router.post("/", optionalToken, createOrderCheckoutController);
router.get("/statistics", verifyToken, getOrderStatusStatsController);

router.get("/", verifyToken, getOrdersController);
router.get("/:id", verifyToken, getOrderController);
router.put("/:id", verifyToken, updateOrderStatusController);


export default router;