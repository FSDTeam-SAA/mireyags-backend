import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  getProductStatisticsController,
  updateProduct
} from "./product.controller.js";

import { verifyToken, adminMiddleware } from "../../core/middlewares/authMiddleware.js";
import { multerUpload } from "../../core/middlewares/multer.js";

const router = express.Router();

router.get("/get-all-products", getAllProducts);
router.get("/statistics", verifyToken, getProductStatisticsController);
router.get("/:id", getProductById);

router.post(
  "/",
  verifyToken,
  adminMiddleware,
  multerUpload([
    { name: "image", maxCount: 1 },
    { name: "subImages", maxCount: 5 }
  ]),
  createProduct
);

router.put(
  "/:id",
  verifyToken,
  adminMiddleware,
  multerUpload([
    { name: "image", maxCount: 1 },
    { name: "subImages", maxCount: 5 }
  ]),
  updateProduct
);

router.delete("/:id", verifyToken, adminMiddleware, deleteProduct);

export default router;
