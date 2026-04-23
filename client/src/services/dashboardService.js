import axiosInstance from '../utils/axios';

export const dashboardService = {
  // Get dashboard summary
  getSummary: async () => {
    const response = await axiosInstance.get('/dashboard/summary', {
      params: { _ts: Date.now(), _nocache: Math.random() },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    return response.data.data;
  },

  // Get monthly revenue data
  getMonthlyRevenue: async (year) => {
    const response = await axiosInstance.get('/dashboard/monthly-revenue', {
      params: { year, _ts: Date.now(), _nocache: Math.random() },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    return response.data;
  },

  // Get monthly expense data
  getMonthlyExpenses: async (year) => {
    const response = await axiosInstance.get('/dashboard/monthly-expenses', {
      params: { year, _ts: Date.now(), _nocache: Math.random() },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    return response.data;
  },

  // Get profit trend
  getProfitTrend: async (year) => {
    const response = await axiosInstance.get('/dashboard/profit-trend', {
      params: { year, _ts: Date.now(), _nocache: Math.random() },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    return response.data;
  },
};
