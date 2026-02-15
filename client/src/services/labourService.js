import axiosInstance from '../utils/axios';

export const labourService = {
  // Get all labour entries
  getAll: async (params = {}) => {
    const response = await axiosInstance.get('/labour', { params });
    return response.data.data;
  },

  // Get single labour entry
  getById: async (id) => {
    const response = await axiosInstance.get(`/labour/${id}`);
    return response.data.data;
  },

  // Create new labour entry
  create: async (data) => {
    const response = await axiosInstance.post('/labour', data);
    return response.data.data;
  },

  // Update labour entry
  update: async (id, data) => {
    const response = await axiosInstance.put(`/labour/${id}`, data);
    return response.data.data;
  },

  // Mark labour as paid
  markAsPaid: async (id) => {
    const response = await axiosInstance.patch(`/labour/pay?id=${id}`);
    return response.data.data;
  },

  // Delete labour entry
  delete: async (id) => {
    const response = await axiosInstance.delete(`/labour/${id}`);
    return response.data;
  },

  // Get pending labour wages
  getPending: async () => {
    const response = await axiosInstance.get('/labour/pending');
    return response.data.data;
  },
};
