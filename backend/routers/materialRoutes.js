import {
  createMaterial,
  deleteMaterial,
  getLowStockMaterials,
  getMaterialById,
  getMaterials,
  updateMaterial,
  updateMaterialStock
} from "../controllers/materialController.js";

import express from "express";

const router = express.Router();



// CRUD operations
router.post("/", createMaterial);
router.get("/", getMaterials);
router.get("/:id", getMaterialById);
router.put("/:id", updateMaterial);
router.delete("/:id", deleteMaterial);

// Stock operations
router.patch("/:id/stock", updateMaterialStock);

// Special queries
router.get("/low-stock", getLowStockMaterials);

export default router;