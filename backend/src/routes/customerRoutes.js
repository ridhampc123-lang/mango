const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerByMobile,
  getCustomersWithPendingBalance,
  updateCustomer,
  updateCustomerBalance,
  addCredit,
  addPayment,
  deleteCustomer,
  exportCustomersToExcel,
} = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

// IMPORTANT: Specific routes MUST come before parameterized routes
router.get('/pending-balance', protect, getCustomersWithPendingBalance);
router.get('/export', protect, exportCustomersToExcel);
router.get('/mobile/:mobile', protect, getCustomerByMobile);

// General CRUD routes
router.route('/').get(protect, getAllCustomers).post(protect, createCustomer);

// Parameterized routes
router
  .route('/:id')
  .get(protect, getCustomerById)
  .put(protect, updateCustomer)
  .delete(protect, deleteCustomer);

// Customer transactions
router.post('/:id/credit', protect, addCredit);
router.post('/:id/payment', protect, addPayment);

module.exports = router;
