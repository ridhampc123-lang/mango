const express = require('express');
const router = express.Router();
const {
  getAllStock,
  getStockById,
  createStock,
  updateStock,
  deleteStock,
} = require('../controllers/stockController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getAllStock).post(protect, createStock);
router
  .route('/:id')
  .get(protect, getStockById)
  .put(protect, updateStock)
  .delete(protect, deleteStock);

module.exports = router;
