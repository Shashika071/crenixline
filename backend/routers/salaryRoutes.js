import {
  assignAllowanceToEmployee,
  createAllowance,
  deleteAllowance,
  getAllowances,
  getEmployeeAllowances,
  removeEmployeeAllowance,
  updateAllowance
} from '../controllers/allowanceController.js';
import {
  calculatePayslip,
  deletePayslip,
  finalizePayslip,
  getPayslipById,
  getPayslips,
  markAsPaid
} from '../controllers/employeeController.js';
import {
  deleteSalaryAdvance,
  getPendingAdvances,
  getSalaryAdvances,
  requestSalaryAdvance,
  updateAdvanceStatus
} from '../controllers/salaryAdvanceController.js';

import express from 'express';

const router = express.Router();

// Payslip routes
router.post('/payslips/calculate', calculatePayslip);
router.patch('/payslips/:id/finalize', finalizePayslip);
router.get('/payslips', getPayslips);
router.get('/payslips/:id', getPayslipById);
router.patch('/payslips/:id/paid', markAsPaid);
router.delete('/payslips/:id', deletePayslip);
// Allowance routes
router.post('/allowances', createAllowance);
router.get('/allowances', getAllowances);
router.put('/allowances/:id', updateAllowance);
router.delete('/allowances/:id', deleteAllowance);
router.post('/allowances/assign', assignAllowanceToEmployee);
router.get('/employees/:employeeId/allowances', getEmployeeAllowances);
router.delete('/employee-allowances/:id', removeEmployeeAllowance);

// Salary advance routes
router.post('/salary-advances', requestSalaryAdvance);
router.get('/salary-advances', getSalaryAdvances);
router.patch('/salary-advances/:id/status', updateAdvanceStatus);
router.get('/salary-advances/pending', getPendingAdvances);
router.delete('/:id', deleteSalaryAdvance);
export default router;