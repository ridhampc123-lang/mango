const express = require('express');
const router = express.Router();
const {
  createLabour,
  getAllLabour,
  getLabourById,
  updateLabour,
  markAsPaid,
  deleteLabour,
  getPendingLabour,
} = require('../controllers/labourController');
const { protect } = require('../middleware/auth');

// IMPORTANT: Specific routes MUST come before parameterized routes
router.get('/pending', protect, getPendingLabour);

// Parameterized routes with specific actions
router.patch('/pay', protect, markAsPaid);

// General CRUD routes
router.route('/').post(protect, createLabour).get(protect, getAllLabour);

// Parameterized routes
router
  .route('/:id')
  .get(protect, getLabourById)
  .put(protect, updateLabour)
  .delete(protect, deleteLabour);

module.exports = router;
