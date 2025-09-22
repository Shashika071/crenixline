import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployeeStats,
  getEmployees,
  updateEmployee
} from "../controllers/employeeController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createEmployee);
router.get("/", getEmployees);
router.get("/stats", getEmployeeStats);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

export default router;