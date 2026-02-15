import axiosInstance from '../utils/axios';

export const dashboardService = {
  // Get dashboard summary
  getSummary: async () => {
    const response = await axiosInstance.get('/dashboard/summary');
    return response.data.data;
  },

  // Get monthly revenue data
  getMonthlyRevenue: async (year) => {
    const response = await axiosInstance.get('/dashboard/monthly-revenue', {
      params: { year },
    });
    return response.data;
  },

  // Get monthly expense data
  getMonthlyExpenses: async (year) => {
    const response = await axiosInstance.get('/dashboard/monthly-expenses', {
      params: { year },
    });
    return response.data;
  },

  // Get profit trend
  getProfitTrend: async (year) => {
    const response = await axiosInstance.get('/dashboard/profit-trend', {
      params: { year },
    });
    return response.data;
  },
};
