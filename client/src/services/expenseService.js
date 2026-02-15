import axiosInstance from '../utils/axios';

export const expenseService = {
  // Get all expenses
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/expenses', { params });
    return response.data.data;
  },

  // Get single expense
  getById: async (id) => {
    const response = await axiosInstance.get(`/expenses/${id}`);
    return response.data.data;
  },

  // Create new expense
  create: async (data) => {
    const response = await axiosInstance.post('/expenses', data);
    return response.data.data;
  },

  // Update expense
  update: async (id, data) => {
    const response = await axiosInstance.put(`/expenses/${id}`, data);
    return response.data.data;
  },

  // Delete expense
  delete: async (id) => {
    const response = await axiosInstance.delete(`/expenses/${id}`);
    return response.data;
  },

  // Get expense summary
  getSummary: async (params = {}) => {
    const response = await axiosInstance.get('/expenses/summary', { params });
    return response.data.data;
  },

  // Get expenses by category
  getByCategory: async () => {
    const response = await axiosInstance.get('/expenses/by-category');
    return response.data.data;
  },
};
