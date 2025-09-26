import {
  createSupplier,
  deleteSupplier,
  getSupplierById,
  getSuppliers,
  updateSupplier
} from "../controllers/supplierController.js";

import express from "express";

const router = express.Router();

 
router.delete('/:id', deleteSupplier);
router.post("/", createSupplier);
router.get("/", getSuppliers);
router.get("/:id", getSupplierById);
router.put("/:id", updateSupplier);

export default router;