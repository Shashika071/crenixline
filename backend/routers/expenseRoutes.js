import {
  createExpense,
  getExpenseSummary,
  getExpenses
} from "../controllers/expenseController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createExpense);
router.get("/", getExpenses);
router.get("/summary", getExpenseSummary);

export default router;