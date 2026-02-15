const express = require('express');
const router = express.Router();
const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  getExpensesByCategory,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

// IMPORTANT: Specific routes MUST come before parameterized routes
// Otherwise /:id will catch /summary and /by-category
router.get('/summary', protect, getExpenseSummary);
router.get('/by-category', protect, getExpensesByCategory);

// General CRUD routes
router.route('/').post(protect, createExpense).get(protect, getAllExpenses);

// Parameterized route - MUST be last
router
  .route('/:id')
  .get(protect, getExpenseById)
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

module.exports = router;
