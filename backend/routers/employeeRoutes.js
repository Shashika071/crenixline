// routes/employeeRoutes.js

import {
  applyMedicalLeave,
  calculateSalary,
  createEmployee,
  createFactoryClosure,
  deleteEmployee,
  exportAttendance,
  exportSalaryReport,
  getAttendance,
  getEmployeeById,
  getEmployeeStats,
  getEmployees,
  getFactoryClosures,
  getLeaveBalances,
  getProbationEmployees,
  markAttendance,
  markBulkAttendance,
  updateEmployee,
  updateMedicalLeaveStatus,
} from '../controllers/employeeController.js';

import express from 'express';

const router = express.Router();
router.get('/factory-closures', getFactoryClosures);
// Employee CRUD routes
router.post('/', createEmployee);
router.get('/', getEmployees);
router.get('/stats', getEmployeeStats);
router.get('/probation', getProbationEmployees);
router.get('/:id', getEmployeeById);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

// Attendance routes
router.post('/attendance/mark', markAttendance);
router.get('/attendance/list', getAttendance);
router.get('/attendance/export', exportAttendance);
router.post('/attendance/bulk', markBulkAttendance);
// Salary routes
router.get('/salary/calculate', calculateSalary);
router.get('/salary/export', exportSalaryReport);

// Leave management routes
router.get('/:id/leave-balances', getLeaveBalances);
router.post('/medical-leave/apply', applyMedicalLeave);
router.patch('/medical-leave/update', updateMedicalLeaveStatus);

// Factory closure routes
router.post('/factory-closures', createFactoryClosure);


export default router;