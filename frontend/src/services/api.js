import axios from 'axios';

const API_BASE_URL = 'https://crexline.me/api';


//const API_BASE_URL = 'http://localhost:5000/api';
 
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.token = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
};

// Employee API
export const employeeAPI = {
  // Basic employee operations
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getStats: () => api.get('/employees/stats'),
  
  // Attendance operations
  markAttendance: (data) => api.post('/employees/attendance/mark', data),
  getAttendance: (params) => api.get('/employees/attendance/list', { params }),
  exportAttendance: (params) => api.get('/employees/attendance/export', { 
    params,
    responseType: 'blob' 
  }),
   markBulkAttendance: (data) => api.post('/employees/attendance/bulk', data),
  // Salary operations
  calculateSalary: (params) => api.get('/employees/salary/calculate', { params }),
  exportSalaryReport: (params) => api.get('/employees/salary/export', { 
    params,
    responseType: 'blob' 
  }),
  
  // Leave operations
  getLeaveBalances: (id) => api.get(`/employees/${id}/leave-balances`),
  applyMedicalLeave: (data) => api.post('/employees/medical-leave', data),
  updateMedicalLeaveStatus: (data) => api.patch('/employees/medical-leave/update', data),
  
  // Factory closure operations
  createFactoryClosure: (data) => api.post('/employees/factory-closures', data),
  getFactoryClosures: (params) => api.get('/employees/factory-closures', { params }),
  
  // Probation employees
  getProbationEmployees: () => api.get('/employees/probation')
};
// Order API
// services/api.js - Update orderAPI
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  updateProgress: (id, data) => api.patch(`/orders/${id}/progress`, data),
  updateQuantity: (id, data) => api.patch(`/orders/${id}/quantity`, data),
  getStats: () => api.get('/orders/stats'),
  
  // Production job methods
  assignJob: (id, data) => api.patch(`/orders/${id}/assign-job`, data),
  updateJobAssignment: (id, data) => api.patch(`/orders/${id}/update-job`, data),  
  completeStage: (id, data) => api.patch(`/orders/${id}/complete-stage`, data),  
  getProductionStatus: (id) => api.get(`/orders/${id}/production-status`),
};
// services/api.js - Update the Material and Machine API sections

// Material API
export const materialAPI = {
  getAll: (params) => api.get('/materials', { params }),
  getById: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`), // Add this line
  updateStock: (id, data) => api.patch(`/materials/${id}/stock`, data),
  getLowStock: () => api.get('/materials/low-stock'),
};

// Machine API
export const machineAPI = {
  getAll: (params) => api.get('/machines', { params }),
  getById: (id) => api.get(`/machines/${id}`),
  create: (data) => api.post('/machines', data), // Make sure this exists
  update: (id, data) => api.put(`/machines/${id}`, data),
  delete: (id) => api.delete(`/machines/${id}`), // Add this line
  updateMaintenance: (id, data) => api.patch(`/machines/${id}/maintenance`, data),
  getMaintenanceSchedule: () => api.get('/machines/maintenance/schedule'),
  getMachinesNeedingMaintenance: () => api.get('/machines/maintenance/needed'),
};
// Supplier API
// Supplier API
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`), // Add delete method
};

// Expense API
export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  getSummary: (params) => api.get('/expenses/summary', { params }),
};

// Production API
export const productionAPI = {
  getAll: (params) => api.get('/production', { params }),
  create: (data) => api.post('/production', data),
  updateStatus: (id, data) => api.patch(`/production/${id}/status`, data),
};

// Payment API
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
  getFinancialSummary: (params) => api.get('/payments/financial-summary', { params }),
};

// Report API
export const reportAPI = {
  getDashboardStats: () => api.get('/reports/dashboard'),
  getOrderReport: (params) => api.get('/reports/orders', { params }),
};

// services/api.js - Add to your existing API file
export const alertAPI = {
  sendLowStockAlert: () => api.post('/alerts/low-stock'),
  sendMaintenanceAlert: () => api.post('/alerts/maintenance'),
  sendCustomAlert: (data) => api.post('/alerts/custom', data),
};
export const salaryAPI = {
  // Allowances
  createAllowance: (data) => api.post('/salary/allowances', data),
  getAllowances: () => api.get('/salary/allowances'),
  updateAllowance: (id, data) => api.put(`/salary/allowances/${id}`, data),
  deleteAllowance: (id) => api.delete(`/salary/allowances/${id}`),
  assignAllowance: (data) => api.post('/salary/allowances/assign', data),
  getEmployeeAllowances: (employeeId) => api.get(`/salary/employees/${employeeId}/allowances`),
  
  // Salary Advances
  requestAdvance: (data) => api.post('/salary/salary-advances', data),
  getAdvances: (params) => api.get('/salary/salary-advances', { params }),
  updateAdvanceStatus: (id, data) => api.patch(`/salary/salary-advances/${id}/status`, data),
  getPendingAdvances: () => api.get('/salary/salary-advances/pending'),
  deleteAdvance: (id) => api.delete(`/salary/${id}`),
  // Payslips
  calculatePayslip: (data) => api.post('/salary/payslips/calculate', data),
  finalizePayslip: (id, data) => api.patch(`/salary/payslips/${id}/finalize`, data),
  getPayslips: (params) => api.get('/salary/payslips', { params }),
  getPayslip: (id) => api.get(`/salary/payslips/${id}`),
  markAsPaid: (id) => api.patch(`/salary/payslips/${id}/paid`),
 
deletePayslip: (payslipId) => api.delete(`/salary/payslips/${payslipId}`)
};
export default api;