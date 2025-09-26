import {
  createPayment,
  getFinancialSummary,
  getPayments
} from "../controllers/paymentController.js";

import express from "express";

const router = express.Router();

 
router.post("/", createPayment);
router.get("/", getPayments);
router.get("/financial-summary", getFinancialSummary);

export default router;