import {
  getDashboardStats,
  getOrderReport
} from "../controllers/reportController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard", getDashboardStats);
router.get("/orders", getOrderReport);

export default router;