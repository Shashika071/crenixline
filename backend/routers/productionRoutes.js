import {
  createProductionJob,
  getProductionJobs,
  updateProductionStatus
} from "../controllers/productionController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createProductionJob);
router.get("/", getProductionJobs);
router.patch("/:id/status", updateProductionStatus);

export default router;