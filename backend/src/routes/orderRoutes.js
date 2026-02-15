const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  updatePaymentStatus,
  deleteOrder,
  exportOrdersToExcel,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.route('/').post(protect, createOrder).get(protect, getAllOrders);
router.get('/export', protect, exportOrdersToExcel);
router
  .route('/:id')
  .get(protect, getOrderById)
  .put(protect, updateOrder)
  .delete(protect, deleteOrder);

router.route('/:id/payment').patch(protect, updatePaymentStatus);

module.exports = router;
