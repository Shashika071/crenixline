import {
  calculateSalary,
  createEmployee,
  deleteEmployee,
  exportAttendance,
  exportSalaryReport,
  getAttendance,
  getEmployeeById,
  getEmployeeStats,
  getEmployees,
  markAttendance,
  updateEmployee
} from '../controllers/employeeController.js';

import express from 'express';

const router = express.Router();

router.post('/', createEmployee);
router.get('/', getEmployees);
router.get('/stats', getEmployeeStats);
router.get('/:id', getEmployeeById);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

// Attendance routes
router.post('/attendance/mark', markAttendance);
router.get('/attendance/list', getAttendance);
router.get('/attendance/export', exportAttendance);

// Salary routes
router.get('/salary/calculate', calculateSalary);
router.get('/salary/export', exportSalaryReport);

export default router;