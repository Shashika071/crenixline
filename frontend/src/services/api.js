import axios from 'axios';

const API_BASE_URL = 'https://crexline.me/api';


//const API_BASE_URL = 'http://localhost:5000/api';
export const FILE_BASE_URL = 'http://localhost:5000';
const api = axios.create({
  baseURL: API_BASE_URL,
  // Remove the default Content-Type header - let axios handle it automatically
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.token = token;
    }
    
    // IMPORTANT: If data is FormData, don't set Content-Type header
    // Let the browser set it automatically with the proper boundary
    if (config.data instanceof FormData) {
      // Remove any existing Content-Type header for FormData
      delete config.headers['Content-Type'];
    } else {
      // For JSON data, set Content-Type to application/json
      config.headers['Content-Type'] = 'application/json';
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

// Employee API - Update create and update methods for FormData support
export const employeeAPI = {
  // Basic employee operations
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  
  // Updated create method with FormData support
  create: (data) => {
    // If data is FormData, use multipart/form-data
    if (data instanceof FormData) {
      return api.post('/employees', data, {
        // No need to set headers here - the interceptor handles it
        timeout: 30000, // Increase timeout for file uploads
      });
    } else {
      // For regular JSON data
      return api.post('/employees', data);
    }
  },
  
  // Updated update method with FormData support
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/employees/${id}`, data, {
        timeout: 30000, // Increase timeout for file uploads
      });
    } else {
      return api.put(`/employees/${id}`, data);
    }
  },
  
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

// Material API
export const materialAPI = {
  getAll: (params) => api.get('/materials', { params }),
  getById: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
  updateStock: (id, data) => api.patch(`/materials/${id}/stock`, data),
  getLowStock: () => api.get('/materials/low-stock'),
};

// Machine API
export const machineAPI = {
  getAll: (params) => api.get('/machines', { params }),
  getById: (id) => api.get(`/machines/${id}`),
  create: (data) => api.post('/machines', data),
  update: (id, data) => api.put(`/machines/${id}`, data),
  delete: (id) => api.delete(`/machines/${id}`),
  updateMaintenance: (id, data) => api.patch(`/machines/${id}/maintenance`, data),
  getMaintenanceSchedule: () => api.get('/machines/maintenance/schedule'),
  getMachinesNeedingMaintenance: () => api.get('/machines/maintenance/needed'),
};

// Supplier API
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
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

// Finance API
export const financeAPI = {
  getSummary: (params) => api.get('/finance/summary', { params }),
  
  // Expense management
  getExpenses: (params) => api.get('/finance/expenses', { params }),
  createExpense: (data) => api.post('/finance/expenses', data),
  updateExpense: (id, data) => api.put(`/finance/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/finance/expenses/${id}`),
  getExpenseSummary: (params) => api.get('/finance/expenses/summary', { params }),
  
  // Income management
  createIncome: (data) => paymentAPI.create({ 
    ...data, 
    type: 'Inflow',
    paymentMode: data.paymentMethod || data.paymentMode || 'Cash' // Map paymentMethod to paymentMode
  }),
  updateIncome: (id, data) => api.put(`/payments/${id}`, { 
    ...data, 
    type: 'Inflow',
    paymentMode: data.paymentMethod || data.paymentMode || 'Cash' // Map paymentMethod to paymentMode
  }),
  deleteIncome: (id) => api.delete(`/payments/${id}`),
  
  // Machine rentals
  getMachineRentals: (params) => api.get('/finance/rentals', { params }),
  markRentalAsPaid: (machineId, month, data) => api.patch(`/finance/rentals/${machineId}/${month}/paid`, data),
  markRentalsBulkPaid: (data) => api.post('/finance/rentals/bulk-paid', data),
  
  // Statutory contributions
  getStatutoryContributions: (params) => api.get('/finance/statutory', { params }),
  
  // Salary expenses
  getSalaryExpenses: (params) => api.get('/finance/salaries', { params }),
  markSalaryAsPaid: (id, data) => api.patch(`/finance/salaries/${id}/paid`, data),
  markSalariesBulkPaid: (data) => api.post('/finance/salaries/bulk-paid', data),
};

// Report API
export const reportAPI = {
  getDashboardStats: () => api.get('/reports/dashboard'),
  getOrderReport: (params) => api.get('/reports/orders', { params }),
};

// Alert API
export const alertAPI = {
  sendLowStockAlert: () => api.post('/alerts/low-stock'),
  sendMaintenanceAlert: () => api.post('/alerts/maintenance'),
  sendCustomAlert: (data) => api.post('/alerts/custom', data),
};

// Salary API
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

// Equipment API
export const equipmentAPI = {
  getAll: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  updateQuantity: (id, data) => api.patch(`/equipment/${id}/quantity`, data),
  getLowStock: () => api.get('/equipment/low-stock')
};

export default api;