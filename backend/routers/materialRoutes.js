import {
  createMaterial,
  deleteMaterial,
  getLowStockMaterials,
  getMaterialById,
  getMaterials,
  updateMaterial,
  updateMaterialStock
} from "../controllers/materialController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.use(authMiddleware);

// CRUD operations
router.get("/low-stock", getLowStockMaterials);
router.post("/", createMaterial);
router.get("/", getMaterials);
router.get("/:id", getMaterialById);
router.put("/:id", updateMaterial);
router.delete("/:id", deleteMaterial);

// Stock operations
router.patch("/:id/stock", updateMaterialStock);

// Special queries


export default router;