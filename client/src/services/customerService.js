import axiosInstance from '../utils/axios';

export const customerService = {
  // Get all customers
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/customers', { params });
    return response.data.data;
  },

  // Get single customer
  getById: async (id) => {
    const response = await axiosInstance.get(`/customers/${id}`);
    return response.data.data;
  },

  // Create new customer
  create: async (data) => {
    const response = await axiosInstance.post('/customers', data);
    return response.data.data;
  },

  // Update customer
  update: async (id, data) => {
    const response = await axiosInstance.put(`/customers/${id}`, data);
    return response.data.data;
  },

  // Delete customer
  delete: async (id) => {
    const response = await axiosInstance.delete(`/customers/${id}`);
    return response.data;
  },

  // Add credit to customer
  addCredit: async (customerId, data) => {
    const response = await axiosInstance.post(`/customers/${customerId}/credit`, data);
    return response.data.data;
  },

  // Add payment from customer
  addPayment: async (customerId, data) => {
    const response = await axiosInstance.post(`/customers/${customerId}/payment`, data);
    return response.data.data;
  },

  // Get customers with pending balance
  getWithPendingBalance: async () => {
    const response = await axiosInstance.get('/customers/pending-balance');
    return response.data.data;
  },

  // Export customers to Excel
  exportToExcel: async () => {
    const response = await axiosInstance.get('/customers/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get customer transaction history
  getTransactionHistory: async (customerId) => {
    const response = await axiosInstance.get(`/customers/${customerId}/transactions`);
    return response.data;
  },
};
