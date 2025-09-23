import axios from 'axios';

const API_BASE_URL = 'https://crexline.me/api';
 
// Create axios instance with default config
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
  updateProgress: (id, data) => api.patch(`/orders/${id}/progress`, data),
  getStats: () => api.get('/orders/stats'),
};

// Material API
export const materialAPI = {
  getAll: (params) => api.get('/materials', { params }),
  create: (data) => api.post('/materials', data),
  updateStock: (id, data) => api.patch(`/materials/${id}/stock`, data),
  getLowStock: () => api.get('/materials/low-stock'),
};

// Supplier API
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
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

export default api;