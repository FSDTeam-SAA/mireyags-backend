import express from "express";
import { createBrand, deleteBrand, getAllBrands, getBrandById, updateBrand } from "./brands.controller.js";
import { adminMiddleware, verifyToken } from "../../core/middlewares/authMiddleware.js";


const router = express.Router();

// Public
router.get("/get-all-brands", getAllBrands);
router.get("/:id", getBrandById);

// Admin only
router.post("/", verifyToken, adminMiddleware, createBrand);
router.put("/:id", verifyToken, adminMiddleware, updateBrand);
router.delete("/:id", verifyToken, adminMiddleware, deleteBrand);

export default router;
