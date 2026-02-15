const Expense = require('../models/Expense');
const asyncHandler = require('../utils/asyncHandler');

// Helper function to validate and parse date
const parseDate = (dateString) => {
  if (!dateString || dateString.trim() === '') return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// Helper function to build safe filter from query params
const buildFilter = (query) => {
  const filter = {};
  
  const { category, startDate, endDate } = query;
  
  // Handle category filter
  if (category && category.trim() !== '') {
    filter.category = category.trim();
  }
  
  // Handle date range filter
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (start || end) {
    filter.date = {};
    if (start) filter.date.$gte = start;
    if (end) filter.date.$lte = end;
  }
  
  return filter;
};

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = asyncHandler(async (req, res, next) => {
  const { title, amount, category, date } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Expense title is required',
    });
  }

  if (!amount || amount < 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid expense amount is required',
    });
  }

  const expenseData = {
    title: title.trim(),
    amount: Number(amount),
    category: category && category.trim() !== '' ? category.trim() : 'General',
  };

  // Validate date if provided
  if (date) {
    const parsedDate = parseDate(date);
    if (parsedDate) {
      expenseData.date = parsedDate;
    }
  }

  const expense = await Expense.create(expenseData);

  res.status(201).json({
    success: true,
    message: 'Expense created successfully',
    data: expense,
  });
});

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
exports.getAllExpenses = asyncHandler(async (req, res, next) => {
  // Build safe filter from query params
  const filter = buildFilter(req.query);
  
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  
  // Validate pagination params
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters',
    });
  }

  const [expenses, total] = await Promise.all([
    Expense.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
    Expense.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Expenses retrieved successfully',
    count: expenses.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: expenses,
  });
});

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpenseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // Validate MongoDB ObjectId
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid expense ID format',
    });
  }

  const expense = await Expense.findById(id);

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Expense retrieved successfully',
    data: expense,
  });
});

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // Validate MongoDB ObjectId
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid expense ID format',
    });
  }

  const expense = await Expense.findById(id);

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found',
    });
  }

  const { title, amount, category, date } = req.body;

  // Update fields if provided
  if (title && title.trim() !== '') expense.title = title.trim();
  if (amount !== undefined && amount >= 0) expense.amount = Number(amount);
  if (category && category.trim() !== '') expense.category = category.trim();
  
  if (date) {
    const parsedDate = parseDate(date);
    if (parsedDate) {
      expense.date = parsedDate;
    }
  }

  const updatedExpense = await expense.save();

  res.status(200).json({
    success: true,
    message: 'Expense updated successfully',
    data: updatedExpense,
  });
});

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  // Validate MongoDB ObjectId
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid expense ID format',
    });
  }

  const expense = await Expense.findById(id);

  if (!expense) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found',
    });
  }

  await expense.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Expense deleted successfully',
  });
});

// @desc    Get expense summary
// @route   GET /api/expenses/summary
// @access  Private
exports.getExpenseSummary = asyncHandler(async (req, res, next) => {
  // Build safe filter from query params
  const filter = buildFilter(req.query);

  try {
    const result = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Handle empty result gracefully
    const summary = result.length > 0 
      ? { totalExpenses: result[0].totalAmount || 0, count: result[0].count || 0 }
      : { totalExpenses: 0, count: 0 };

    res.status(200).json({
      success: true,
      message: 'Expense summary retrieved successfully',
      data: summary,
    });
  } catch (error) {
    // Handle aggregation errors
    console.error('Aggregation error in getExpenseSummary:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating expense summary',
    });
  }
});

// @desc    Get expenses by category
// @route   GET /api/expenses/by-category
// @access  Private
exports.getExpensesByCategory = asyncHandler(async (req, res, next) => {
  // Build safe filter from query params for date range
  const filter = buildFilter(req.query);

  try {
    const pipeline = [];
    
    // Add match stage if there are filters
    if (Object.keys(filter).length > 0) {
      pipeline.push({ $match: filter });
    }
    
    // Group by category
    pipeline.push(
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalAmount: 1,
          count: 1,
        },
      },
      { $sort: { totalAmount: -1 } }
    );

    const expensesByCategory = await Expense.aggregate(pipeline);

    // Return empty array if no data, never null
    res.status(200).json({
      success: true,
      message: 'Expenses by category retrieved successfully',
      data: expensesByCategory || [],
    });
  } catch (error) {
    // Handle aggregation errors
    console.error('Aggregation error in getExpensesByCategory:', error);
    return res.status(500).json({
      success: false,
      message: 'Error grouping expenses by category',
    });
  }
});
