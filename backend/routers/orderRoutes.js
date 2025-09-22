import {
  createOrder,
  getOrderById,
  getOrderStats,
  getOrders,
  updateOrder,
  updateOrderProgress
} from "../controllers/orderController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/stats", getOrderStats);
router.get("/:id", getOrderById);
router.put("/:id", updateOrder);
router.patch("/:id/progress", updateOrderProgress);

export default router;