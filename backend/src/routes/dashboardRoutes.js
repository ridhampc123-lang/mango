const express = require('express');
const router = express.Router();
const {
  getSummary,
  getMonthlyRevenue,
  getMonthlyExpenses,
  getProfitTrend,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getSummary);
router.get('/monthly-revenue', protect, getMonthlyRevenue);
router.get('/monthly-expenses', protect, getMonthlyExpenses);
router.get('/profit-trend', protect, getProfitTrend);

module.exports = router;