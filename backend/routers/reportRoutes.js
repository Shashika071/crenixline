import authMiddleware from "../middleware/authMiddleware.js";
import express from "express";
import {
  getDashboardStats,
} from "../controllers/reportController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard", getDashboardStats);
 

export default router;