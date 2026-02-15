const express = require('express');
const router = express.Router();
const {
  createBatch,
  getAllBatches,
  getBatchById,
  deleteBatch,
} = require('../controllers/batchController');
const { protect } = require('../middleware/auth');

router.route('/').post(protect, createBatch).get(protect, getAllBatches);
router.route('/:id').get(protect, getBatchById).delete(protect, deleteBatch);

module.exports = router;
