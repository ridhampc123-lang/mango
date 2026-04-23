const Order = require('../models/Order');
const Expense = require('../models/Expense');
const Stock = require('../models/Stock');
const FarmerPurchase = require('../models/FarmerPurchase');
const Customer = require('../models/Customer');
const Labour = require('../models/Labour');

const setNoCacheHeaders = (res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  res.set('X-Accel-Expires', '0');
};

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
exports.getSummary = async (req, res, next) => {
  try {
    setNoCacheHeaders(res);

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

    // Calculate box availability dynamically from source records minus sold orders.
    // Priority: if manual Stock entries exist, use Stock inflow; otherwise use FarmerPurchase inflow.
    const [stockAgg, farmerPurchaseAgg, soldOrdersAgg] = await Promise.all([
      Stock.aggregate([
        {
          $group: {
            _id: null,
            entries: { $sum: 1 },
            totalBoxes5: {
              $sum: {
                $cond: [{ $eq: ['$boxType', 5] }, { $ifNull: ['$totalBoxes', 0] }, 0],
              },
            },
            totalBoxes10: {
              $sum: {
                $cond: [{ $eq: ['$boxType', 10] }, { $ifNull: ['$totalBoxes', 0] }, 0],
              },
            },
          },
        },
      ]),
      FarmerPurchase.aggregate([
        {
          $group: {
            _id: null,
            entries: { $sum: 1 },
            totalBoxes5: {
              $sum: {
                $cond: [{ $eq: ['$boxType', 5] }, { $ifNull: ['$boxQuantity', 0] }, 0],
              },
            },
            totalBoxes10: {
              $sum: {
                $cond: [{ $eq: ['$boxType', 10] }, { $ifNull: ['$boxQuantity', 0] }, 0],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        {
          $project: {
            normalizedBoxType: {
              $switch: {
                branches: [
                  {
                    case: {
                      $or: [
                        { $eq: ['$boxSize', '5kg'] },
                        { $eq: ['$boxSize', '5'] },
                        { $eq: ['$boxSize', 5] },
                      ],
                    },
                    then: 5,
                  },
                  {
                    case: {
                      $or: [
                        { $eq: ['$boxSize', '10kg'] },
                        { $eq: ['$boxSize', '10'] },
                        { $eq: ['$boxSize', 10] },
                      ],
                    },
                    then: 10,
                  },
                ],
                default: null,
              },
            },
            boxQuantity: { $ifNull: ['$boxQuantity', 0] },
          },
        },
        {
          $match: {
            normalizedBoxType: { $in: [5, 10] },
          },
        },
        {
          $group: {
            _id: '$normalizedBoxType',
            totalSold: { $sum: '$boxQuantity' },
          },
        },
      ]),
    ]);

    const stockMetrics = stockAgg[0] || {
      entries: 0,
      totalBoxes5: 0,
      totalBoxes10: 0,
    };

    const farmerPurchaseMetrics = farmerPurchaseAgg[0] || {
      entries: 0,
      totalBoxes5: 0,
      totalBoxes10: 0,
    };

    const soldBoxes5 = Number(soldOrdersAgg.find((row) => row._id === 5)?.totalSold || 0);
    const soldBoxes10 = Number(soldOrdersAgg.find((row) => row._id === 10)?.totalSold || 0);

    const sourceMetrics = stockMetrics.entries > 0 ? stockMetrics : farmerPurchaseMetrics;
    const boxDataSource = stockMetrics.entries > 0 ? 'stock' : 'purchase';

    const totalBoxes5Available = Math.max(
      0,
      Number(sourceMetrics.totalBoxes5 || 0) - soldBoxes5
    );
    const totalBoxes10Available = Math.max(
      0,
      Number(sourceMetrics.totalBoxes10 || 0) - soldBoxes10
    );
    const totalBoxesAvailable = totalBoxes5Available + totalBoxes10Available;

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
        totalBoxes5Available,
        totalBoxes10Available,
        boxDataSource,
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
    setNoCacheHeaders(res);

    const requestedYear = Number(req.query.year);
    const year = Number.isFinite(requestedYear) && requestedYear > 0
      ? requestedYear
      : new Date().getFullYear();
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
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
    setNoCacheHeaders(res);

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
    setNoCacheHeaders(res);

    const requestedYear = Number(req.query.year);
    const year = Number.isFinite(requestedYear) && requestedYear > 0
      ? requestedYear
      : new Date().getFullYear();
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // Get revenue by month
    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
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