// routes/orderRoutes.js

import {
  assignJob,
  completeStage,
  createOrder,
  deleteOrder,
  getOrderById,
  getOrderStats,
  getOrders,
  updateJobAssignment,
  updateOrder,
  updateOrderProgress,
  updateOrderQuantity
} from "../controllers/orderController.js";

import express from "express";

const router = express.Router();

 

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/stats", getOrderStats);
router.get("/:id", getOrderById);
router.put("/:id", updateOrder);
router.patch("/:id/progress", updateOrderProgress);
router.patch("/:id/quantity", updateOrderQuantity);

// New production job routes
router.patch("/:id/assign-job", assignJob);
router.patch("/:id/complete-stage", completeStage);
router.delete('/:id', deleteOrder);
router.patch("/:id/update-job", updateJobAssignment);
export default router;