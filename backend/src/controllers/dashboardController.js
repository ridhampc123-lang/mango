const Order = require('../models/Order');
const Expense = require('../models/Expense');
const VarietyStock = require('../models/VarietyStock');
const Customer = require('../models/Customer');
const Labour = require('../models/Labour');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
exports.getSummary = async (req, res, next) => {
  try {
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total revenue (all time)
    const revenueResult = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    const totalRevenue = revenueResult.length > 0 ? Number(revenueResult[0].total) : 0;

    // Get today's sales
    const todaySalesResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);
    const todaySales = todaySalesResult.length > 0 ? Number(todaySalesResult[0].total) : 0;

    // Get total expenses (all time)
    const expenseResult = await Expense.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const totalExpenses = expenseResult.length > 0 ? Number(expenseResult[0].total) : 0;

    // Get today's expenses
    const todayExpenseResult = await Expense.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const todayExpense = todayExpenseResult.length > 0 ? Number(todayExpenseResult[0].total) : 0;

    // Calculate profits
    const netProfit = totalRevenue - totalExpenses;
    const todayProfit = todaySales - todayExpense;

    // Get total boxes available from VarietyStock
    const varietyStocks = await VarietyStock.find();
    let totalBoxesAvailable = 0;
    varietyStocks.forEach(stock => {
      const box5Remaining = Number(stock.box5Total || 0) - Number(stock.box5Sold || 0);
      const box10Remaining = Number(stock.box10Total || 0) - Number(stock.box10Sold || 0);
      totalBoxesAvailable += box5Remaining + box10Remaining;
    });

    // Get total credit outstanding (sum of all customer balances)
    const creditResult = await Customer.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$balance' }
        }
      }
    ]);
    const totalCreditOutstanding = creditResult.length > 0 ? Number(creditResult[0].total) : 0;

    // Get total labour pending (sum of unpaid wages)
    const labourResult = await Labour.aggregate([
      {
        $match: {
          isPaid: false
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$wage' }
        }
      }
    ]);
    const totalLabourPending = labourResult.length > 0 ? Number(labourResult[0].total) : 0;

    res.json({
      success: true,
      data: {
        totalBoxesAvailable,
        todaySales,
        todayExpense,
        todayProfit,
        totalRevenue,
        totalExpenses,
        netProfit,
        totalCreditOutstanding,
        totalLabourPending,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly revenue data
// @route   GET /api/dashboard/monthly-revenue
// @access  Private
exports.getMonthlyRevenue = async (req, res, next) => {
  try {
    const { year } = req.query;
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const revenueData = await Order.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Fill missing months with 0
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const monthData = revenueData.find(d => d._id === i + 1);
      return {
        month: i + 1,
        revenue: monthData ? monthData.total : 0
      };
    });

    res.json(monthlyRevenue);
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly expense data
// @route   GET /api/dashboard/monthly-expenses
// @access  Private
exports.getMonthlyExpenses = async (req, res, next) => {
  try {
    const { year } = req.query;
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const expenseData = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Fill missing months with 0
    const monthlyExpenses = Array.from({ length: 12 }, (_, i) => {
      const monthData = expenseData.find(d => d._id === i + 1);
      return {
        month: i + 1,
        expenses: monthData ? monthData.total : 0
      };
    });

    res.json(monthlyExpenses);
  } catch (error) {
    next(error);
  }
};

// @desc    Get profit trend
// @route   GET /api/dashboard/profit-trend
// @access  Private
exports.getProfitTrend = async (req, res, next) => {
  try {
    const { year } = req.query;
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    // Get revenue by month
    const revenueData = await Order.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get expenses by month
    const expenseData = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          expenses: { $sum: '$amount' }
        }
      }
    ]);

    // Combine and calculate profit
    const profitTrend = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const revenue = revenueData.find(d => d._id === month)?.revenue || 0;
      const expenses = expenseData.find(d => d._id === month)?.expenses || 0;
      return {
        month,
        profit: revenue - expenses
      };
    });

    res.json(profitTrend);
  } catch (error) {
    next(error);
  }
};