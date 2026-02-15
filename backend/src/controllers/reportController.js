const Order = require('../models/Order');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Farmer = require('../models/Farmer');
const Batch = require('../models/Batch');

// @desc    Get business summary report
// @route   GET /api/reports/summary
// @access  Private
exports.getSummary = async (req, res, next) => {
  try {
    // Calculate total sales (all paid orders)
    const paidOrders = await Order.find({
      paymentStatus: { $in: ['Cash', 'UPI'] },
    });
    const totalSales = paidOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate total expenses
    const expenses = await Expense.find();
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate profit
    const profit = totalSales - totalExpenses;

    // Get pending customer payments
    const customers = await Customer.find({ balance: { $gt: 0 } });
    const pendingCustomerPayments = customers.reduce(
      (sum, customer) => sum + customer.balance,
      0
    );

    // Get pending farmer payments
    const farmers = await Farmer.find({ pendingPayment: { $gt: 0 } });
    const pendingFarmerPayments = farmers.reduce(
      (sum, farmer) => sum + farmer.pendingPayment,
      0
    );

    // Total revenue (including pending)
    const allOrders = await Order.find();
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Total purchase cost from batches
    const batches = await Batch.find();
    const totalPurchaseCost = batches.reduce((sum, batch) => sum + batch.totalCost, 0);

    res.json({
      success: true,
      message: 'Summary report retrieved successfully',
      data: {
        totalSales,
        totalExpenses,
        profit,
        pendingCustomerPayments,
        pendingFarmerPayments,
        totalRevenue,
        totalPurchaseCost,
        netProfit: totalRevenue - totalExpenses - totalPurchaseCost,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly sales report
// @route   GET /api/reports/monthly-sales
// @access  Private
exports.getMonthlySales = async (req, res, next) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const monthlySales = await Order.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${targetYear}-01-01`),
            $lt: new Date(`${targetYear + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$date' },
          totalAmount: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Format the response
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const formattedData = monthNames.map((month, index) => {
      const data = monthlySales.find((item) => item._id === index + 1);
      return {
        month,
        totalAmount: data ? data.totalAmount : 0,
        totalOrders: data ? data.totalOrders : 0,
      };
    });

    res.json({
      success: true,
      message: 'Monthly sales report retrieved successfully',
      data: formattedData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top customers
// @route   GET /api/reports/top-customers
// @access  Private
exports.getTopCustomers = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const topCustomers = await Customer.find()
      .sort({ totalPurchase: -1 })
      .limit(limit);

    res.json({
      success: true,
      message: 'Top customers retrieved successfully',
      data: topCustomers,
    });
  } catch (error) {
    next(error);
  }
};
