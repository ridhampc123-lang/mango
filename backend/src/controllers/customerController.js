const Customer = require('../models/Customer');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
exports.createCustomer = asyncHandler(async (req, res, next) => {
  const { name, mobile, address, city, state, pincode } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Customer name is required',
    });
  }

  if (!mobile || mobile.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Mobile number is required',
    });
  }

  // Check if customer already exists
  const existingCustomer = await Customer.findOne({ mobile });
  if (existingCustomer) {
    return res.status(400).json({
      success: false,
      message: 'Customer with this mobile number already exists',
    });
  }

  const customer = await Customer.create({
    name: name.trim(),
    mobile: mobile.trim(),
    address: address?.trim() || '',
    city: city?.trim() || '',
    state: state?.trim() || '',
    pincode: pincode?.trim() || '',
  });

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: customer,
  });
});

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
exports.getAllCustomers = asyncHandler(async (req, res, next) => {
  const { search } = req.query;
  
  let query = {};
  
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    query = {
      $or: [
        { name: searchRegex },
        { mobile: searchRegex }
      ]
    };
  }

  const customers = await Customer.find(query).sort({ lastOrderDate: -1 });

  res.status(200).json({
    success: true,
    message: 'Customers retrieved successfully',
    count: customers.length,
    data: customers,
  });
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomerById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid customer ID format',
    });
  }

  const customer = await Customer.findById(id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Customer retrieved successfully',
    data: customer,
  });
});

// @desc    Get customer by mobile
// @route   GET /api/customers/mobile/:mobile
// @access  Private
exports.getCustomerByMobile = asyncHandler(async (req, res, next) => {
  const { mobile } = req.params;
  
  if (!mobile || mobile.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Mobile number is required',
    });
  }

  const customer = await Customer.findOne({ mobile: mobile.trim() });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Customer retrieved successfully',
    data: customer,
  });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
exports.updateCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid customer ID format',
    });
  }

  const customer = await Customer.findById(id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  const { name, mobile, address, city, state, pincode } = req.body;

  if (name && name.trim() !== '') customer.name = name.trim();
  if (mobile && mobile.trim() !== '') customer.mobile = mobile.trim();
  if (address !== undefined) customer.address = address.trim();
  if (city !== undefined) customer.city = city.trim();
  if (state !== undefined) customer.state = state.trim();
  if (pincode !== undefined) customer.pincode = pincode.trim();

  const updatedCustomer = await customer.save();

  res.status(200).json({
    success: true,
    message: 'Customer updated successfully',
    data: updatedCustomer,
  });
});

// @desc    Update customer balance (payment received)
// @route   PUT /api/customers/:id/payment
// @access  Private
exports.updateCustomerBalance = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { amount } = req.body;
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid customer ID format',
    });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment amount',
    });
  }

  const customer = await Customer.findById(id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  if (customer.balance < amount) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount exceeds customer balance',
    });
  }

  customer.balance -= Number(amount);
  await customer.save();

  res.status(200).json({
    success: true,
    message: 'Payment received successfully',
    data: customer,
  });
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid customer ID format',
    });
  }

  const customer = await Customer.findById(id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  await customer.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Customer deleted successfully',
  });
});

// @desc    Add credit to customer
// @route   POST /api/customers/:id/credit
// @access  Private
exports.addCredit = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { amount, description } = req.body;
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid customer ID format',
    });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid credit amount is required',
    });
  }

  const customer = await Customer.findById(id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  customer.balance += Number(amount);
  customer.totalPurchase += Number(amount);
  customer.totalCredit += Number(amount);
  await customer.save();

  res.status(200).json({
    success: true,
    message: 'Credit added successfully',
    data: customer,
  });
});

// @desc    Add payment from customer
// @route   POST /api/customers/:id/payment
// @access  Private
exports.addPayment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { amount } = req.body;
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid customer ID format',
    });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid payment amount is required',
    });
  }

  const customer = await Customer.findById(id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found',
    });
  }

  if (customer.balance < amount) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount exceeds customer balance',
    });
  }

  customer.balance -= Number(amount);
  customer.totalPaid += Number(amount);
  await customer.save();

  res.status(200).json({
    success: true,
    message: 'Payment received successfully',
    data: customer,
  });
});

// @desc    Get customers with pending balance
// @route   GET /api/customers/pending-balance
// @access  Private
exports.getCustomersWithPendingBalance = asyncHandler(async (req, res, next) => {
  const customers = await Customer.find({ balance: { $gt: 0 } }).sort({ balance: -1 });

  const totalPending = customers.reduce((sum, customer) => sum + customer.balance, 0);

  res.status(200).json({
    success: true,
    message: 'Customers with pending balance retrieved successfully',
    count: customers.length,
    totalPending,
    data: customers,
  });
});

// @desc    Export customers to Excel
// @route   GET /api/customers/export
// @access  Private
exports.exportCustomersToExcel = asyncHandler(async (req, res, next) => {
  try {
    const customers = await Customer.find({})
      .sort({ createdAt: -1 })
      .select('name mobile address totalOrders totalCredit createdAt');

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customers');

    // Add header row
    worksheet.columns = [
      { header: 'Customer Name', key: 'name', width: 20 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Total Orders', key: 'totalOrders', width: 12 },
      { header: 'Total Credit', key: 'totalCredit', width: 12 },
      { header: 'Created Date', key: 'createdAt', width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };

    // Add data rows
    customers.forEach(customer => {
      worksheet.addRow({
        name: customer.name,
        mobile: customer.mobile,
        address: customer.address || '',
        totalOrders: customer.totalOrders || 0,
        totalCredit: customer.totalCredit || 0,
        createdAt: customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '',
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=customers.xlsx');

    // Stream the workbook
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export customers',
    });
  }
});
