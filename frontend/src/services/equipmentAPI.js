import api from './api';

export const equipmentAPI = {
  getAll: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  updateQuantity: (id, data) => api.patch(`/equipment/${id}/quantity`, data),
  getLowStock: () => api.get('/equipment/low-stock'),
};

export default equipmentAPI;