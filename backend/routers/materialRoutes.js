import {
  createMaterial,
  getLowStockMaterials,
  getMaterials,
  updateMaterialStock
} from "../controllers/materialController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createMaterial);
router.get("/", getMaterials);
router.get("/low-stock", getLowStockMaterials);
router.patch("/:id/stock", updateMaterialStock);

export default router;