import {
  getDashboardStats,
  getOrderReport
} from "../controllers/reportController.js";

import express from "express";

const router = express.Router();

 

router.get("/dashboard", getDashboardStats);
router.get("/orders", getOrderReport);

export default router;