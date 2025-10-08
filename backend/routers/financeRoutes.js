import {
  createExpense,
  deleteExpense,
  getExpenseSummary,
  getExpenses,
  getFinancialSummary,
  getMachineRentalExpenses,
  getSalaryExpenses,
  getStatutoryContributions,
  markPayslipPaid,
  markPayslipsBulkPaid,
  markRentalAsPaid,
  markRentalsBulkPaid,
  updateExpense
} from "../controllers/financeController.js";

import express from "express";

const router = express.Router();

// Apply auth middleware to all routes
 

// Financial summary endpoints
router.get("/summary", getFinancialSummary);

// Expense endpoints
router.post("/expenses", createExpense);
router.get("/expenses", getExpenses);
router.get("/expenses/summary", getExpenseSummary);
router.put("/expenses/:id", updateExpense);
router.delete("/expenses/:id", deleteExpense);

// Machine rental expenses
router.get("/rentals", getMachineRentalExpenses);

// Mark rental as paid (reduces from Total Income)
router.patch("/rentals/:machineId/:month/paid", markRentalAsPaid);

// Mark multiple rentals as paid in bulk
router.post("/rentals/bulk-paid", markRentalsBulkPaid);

// Statutory contributions (EPF & ETF)
router.get("/statutory", getStatutoryContributions);

// Salary expenses
router.get("/salaries", getSalaryExpenses);

// Mark payslip as paid (reduces from Total Income)
router.patch("/salaries/:id/paid", markPayslipPaid);

// Mark multiple payslips as paid in bulk
router.post("/salaries/bulk-paid", markPayslipsBulkPaid);

export default router;