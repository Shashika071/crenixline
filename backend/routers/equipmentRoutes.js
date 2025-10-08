import {
  createEquipment,
  deleteEquipment,
  getAllEquipment,
  getEquipmentById,
  getLowStockEquipment,
  updateEquipment,
  updateEquipmentQuantity
} from "../controllers/equipmentController.js";

import express from "express";

const router = express.Router();

// Get all equipment
router.get("/", getAllEquipment);

// Get low stock equipment
router.get("/low-stock", getLowStockEquipment);

// Get equipment by ID
router.get("/:id", getEquipmentById);

// Create new equipment
router.post("/", createEquipment);

// Update equipment
router.put("/:id", updateEquipment);

// Delete equipment
router.delete("/:id", deleteEquipment);

// Update equipment quantity
router.patch("/:id/quantity", updateEquipmentQuantity);

export default router;
