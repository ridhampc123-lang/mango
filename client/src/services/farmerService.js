import axiosInstance from '../utils/axios';

export const farmerService = {
  // Get all farmers
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/farmers', { params });
    return response.data.data;
  },

  // Get single farmer
  getById: async (id) => {
    const response = await axiosInstance.get(`/farmers/${id}`);
    return response.data.data;
  },

  // Create new farmer
  create: async (data) => {
    const response = await axiosInstance.post('/farmers', data);
    return response.data.data;
  },

  // Update farmer
  update: async (id, data) => {
    const response = await axiosInstance.put(`/farmers/${id}`, data);
    return response.data.data;
  },

  // Delete farmer
  delete: async (id) => {
    const response = await axiosInstance.delete(`/farmers/${id}`);
    return response.data;
  },

  // Create farmer purchase
  createPurchase: async (data) => {
    const response = await axiosInstance.post('/farmers/purchase', data);
    return response.data;
  },

  // Make payment to farmer
  makePayment: async (id, data) => {
    const response = await axiosInstance.post(`/farmers/${id}/payment`, data);
    return response.data;
  },

  // Get farmer ledger
  getLedger: async (id) => {
    const response = await axiosInstance.get(`/farmers/${id}/ledger`);
    return response.data.data;
  },

  // Export farmers to Excel
  exportToExcel: async () => {
    const response = await axiosInstance.get('/farmers/export', {
      responseType: 'blob',
    });
    return response.data;
  },
};
