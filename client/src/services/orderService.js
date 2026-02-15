import axiosInstance from '../utils/axios';

export const orderService = {
  // Get all orders
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/orders', { params });
    return response.data.data;
  },

  // Get single order
  getById: async (id) => {
    const response = await axiosInstance.get(`/orders/${id}`);
    return response.data.data;
  },

  // Create new order
  create: async (data) => {
    const response = await axiosInstance.post('/orders', data);
    return response.data.data;
  },

  // Update order
  update: async (id, data) => {
    const response = await axiosInstance.put(`/orders/${id}`, data);
    return response.data.data;
  },

  // Update payment status
  updatePaymentStatus: async (id, paymentStatus) => {
    const response = await axiosInstance.patch(`/orders/${id}/payment`, { paymentStatus });
    return response.data.data;
  },

  // Delete order
  delete: async (id) => {
    const response = await axiosInstance.delete(`/orders/${id}`);
    return response.data;
  },

  // Export orders to Excel
  exportToExcel: async (params = {}) => {
    const response = await axiosInstance.get('/orders/export', { params, responseType: 'blob' });
    return response.data;
  },
};
