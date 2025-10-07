import {
  applyMedicalLeave,
  getLeaveBalances,
  updateMedicalLeaveStatus
} from '../controllers/leaveController.js';
import {
  calculateSalary,
  exportSalaryReport
} from '../controllers/salaryController.js';
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployeeStats,
  getEmployees,
  getProbationEmployees,
  updateEmployee
} from '../controllers/employeeController.js';
import {
  createFactoryClosure,
  getFactoryClosures
} from '../controllers/factoryClosureController.js';
import {
  exportAttendance,
  getAttendance,
  markAttendance,
  markAttendanceByQR,
  markBulkAttendance
} from '../controllers/attendanceController.js';

import express from 'express';
import upload from '../middleware/upload.js';

const router = express.Router();
router.get('/factory-closures', getFactoryClosures);
// Employee CRUD routes
router.post('/', upload.single('profileImage'), createEmployee);
router.get('/', getEmployees);
router.get('/stats', getEmployeeStats);
router.get('/probation', getProbationEmployees);
router.get('/:id', getEmployeeById);
router.put('/:id', upload.single('profileImage'), updateEmployee);
router.delete('/:id', deleteEmployee);

// Attendance routes
router.post('/attendance/mark', markAttendance);
router.post('/attendance/bulk', markBulkAttendance);
router.post('/attendance/qr', markAttendanceByQR); // Added QR code attendance endpoint
router.get('/attendance/list', getAttendance);
router.get('/attendance/export', exportAttendance);

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