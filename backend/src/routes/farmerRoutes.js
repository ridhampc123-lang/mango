const express = require('express');
const router = express.Router();
const {
  createFarmer,
  getAllFarmers,
  getFarmerById,
  updateFarmer,
  createFarmerPurchase,
  getFarmerLedger,
  makePayment,
  deleteFarmer,
  exportFarmersToExcel,
} = require('../controllers/farmerController');
const { protect } = require('../middleware/auth');

router.route('/').post(protect, createFarmer).get(protect, getAllFarmers);
router.get('/export', protect, exportFarmersToExcel);
router.post('/purchase', protect, createFarmerPurchase);
router
  .route('/:id')
  .get(protect, getFarmerById)
  .put(protect, updateFarmer)
  .delete(protect, deleteFarmer);
router.get('/:id/ledger', protect, getFarmerLedger);
router.post('/:id/payment', protect, makePayment);

module.exports = router;
