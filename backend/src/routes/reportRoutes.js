const express = require('express');
const router = express.Router();
const {
  getSummary,
  getMonthlySales,
  getTopCustomers,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getSummary);
router.get('/monthly-sales', protect, getMonthlySales);
router.get('/top-customers', protect, getTopCustomers);

module.exports = router;
