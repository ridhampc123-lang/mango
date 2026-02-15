import axiosInstance from '../utils/axios';

export const stockService = {
  // Get all stock entries
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/stock', { params });
    return response.data.data;
  },

  // Get single stock entry
  getById: async (id) => {
    const response = await axiosInstance.get(`/stock/${id}`);
    return response.data.data;
  },

  // Create new stock entry
  create: async (data) => {
    const response = await axiosInstance.post('/stock', data);
    return response.data.data;
  },

  // Update stock entry
  update: async (id, data) => {
    const response = await axiosInstance.put(`/stock/${id}`, data);
    return response.data.data;
  },

  // Delete stock entry
  delete: async (id) => {
    const response = await axiosInstance.delete(`/stock/${id}`);
    return response.data;
  },

  // Get low stock items
  getLowStock: async () => {
    const response = await axiosInstance.get('/stock/low-stock');
    return response.data.data;
  },
};
