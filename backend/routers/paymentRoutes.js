import {
  createPayment,
  deletePayment,
  getFinancialSummary,
  getPayments,
  updatePayment
} from "../controllers/paymentController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createPayment);
router.get("/", getPayments);
router.get("/financial-summary", getFinancialSummary);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

export default router;