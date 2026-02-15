const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { customerName, customerMobile, address, boxSize, boxPrice, boxQuantity, paymentStatus } = req.body;

  // Validate required fields
  if (!customerName || customerName.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Customer name is required',
    });
  }

  if (!customerMobile || customerMobile.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Customer mobile is required',
    });
  }

  if (!address || address.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Address is required',
    });
  }

  if (!boxSize) {
    return res.status(400).json({
      success: false,
      message: 'Box size is required',
    });
  }

  if (!boxPrice || boxPrice <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Box price must be greater than 0',
    });
  }

  if (!boxQuantity || boxQuantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Box quantity must be at least 1',
    });
  }

  // Calculate total amount on backend (never trust frontend)
  const totalAmount = Number(boxPrice) * Number(boxQuantity);

  // Generate unique invoice number
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;
  
  // Find the highest invoice number for this year
  const lastOrder = await Order.findOne(
    { invoiceNumber: new RegExp(`^${prefix}`) },
    { invoiceNumber: 1 },
    { sort: { invoiceNumber: -1 } }
  );
  
  let nextNumber = 1;
  if (lastOrder && lastOrder.invoiceNumber) {
    const lastNumber = parseInt(lastOrder.invoiceNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  const invoiceNumber = `${prefix}${nextNumber.toString().padStart(4, '0')}`;

  const order = await Order.create({
    invoiceNumber,
    customerName: customerName.trim(),
    customerMobile: customerMobile.trim(),
    address: address.trim(),
    boxSize,
    boxPrice: Number(boxPrice),
    boxQuantity: Number(boxQuantity),
    totalAmount,
    paymentStatus: paymentStatus || 'Pending',
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order,
  });
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getAllOrders = asyncHandler(async (req, res, next) => {
  const { search, paymentStatus } = req.query;

  let query = {};

  // Search by customer name or mobile
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { customerName: searchRegex },
      { customerMobile: searchRegex }
    ];
  }

  // Filter by payment status
  if (paymentStatus && paymentStatus !== 'All') {
    query.paymentStatus = paymentStatus;
  }

  const orders = await Order.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    count: orders.length,
    data: orders,
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order ID format',
    });
  }

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Order retrieved successfully',
    data: order,
  });
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { customerMobile, address, boxSize, boxPrice, boxQuantity, paymentStatus } = req.body;

  // Validate ObjectId
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order ID format',
    });
  }

  let order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  // Validate fields if provided
  if (boxPrice !== undefined && boxPrice <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Box price must be greater than 0',
    });
  }

  if (boxQuantity !== undefined && boxQuantity < 1) {
    return res.status(400).json({
      success: false,
      message: 'Box quantity must be at least 1',
    });
  }

  // Update fields
  if (customerMobile !== undefined) order.customerMobile = customerMobile.trim();
  if (address !== undefined) order.address = address.trim();
  if (boxSize !== undefined) order.boxSize = boxSize;
  if (boxPrice !== undefined) order.boxPrice = Number(boxPrice);
  if (boxQuantity !== undefined) order.boxQuantity = Number(boxQuantity);
  if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;

  // Recalculate totalAmount
  order.totalAmount = order.boxPrice * order.boxQuantity;

  await order.save();

  res.status(200).json({
    success: true,
    message: 'Order updated successfully',
    data: order,
  });
});

// @desc    Update order payment status
// @route   PATCH /api/orders/:id/payment
// @access  Private
exports.updatePaymentStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  // Validate ObjectId
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order ID format',
    });
  }

  // Validate payment status
  if (!paymentStatus || !['Paid', 'Pending'].includes(paymentStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Valid payment status is required (Paid or Pending)',
    });
  }

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  order.paymentStatus = paymentStatus;
  await order.save();

  res.status(200).json({
    success: true,
    message: 'Payment status updated successfully',
    data: order,
  });
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private
exports.deleteOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order ID format',
    });
  }

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  await order.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Order deleted successfully',
  });
});

// @desc    Export orders to Excel
// @route   GET /api/orders/export
// @access  Private
exports.exportOrdersToExcel = asyncHandler(async (req, res, next) => {
  try {
    const { sortBy = 'createdAt', sortOrder = 'desc', startDate, endDate, paymentStatus, search } = req.query;

    // Build query safely
    const query = {};
    if (paymentStatus && paymentStatus !== 'All') query.paymentStatus = paymentStatus;
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: searchRegex },
        { customerMobile: searchRegex },
        { invoiceNumber: searchRegex },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const sd = new Date(startDate);
        sd.setHours(0, 0, 0, 0);
        query.createdAt.$gte = sd;
      }
      if (endDate) {
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        query.createdAt.$lte = ed;
      }
    }

    // Sorting - whitelist fields
    const allowedSort = ['createdAt', 'totalAmount', 'invoiceNumber'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortObj = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const orders = await Order.find(query)
      .sort(sortObj)
      .select('invoiceNumber customerName customerMobile address boxSize boxQuantity boxPrice totalAmount paymentStatus createdAt');

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
      { header: 'Invoice', key: 'invoiceNumber', width: 18 },
      { header: 'Customer Name', key: 'customerName', width: 24 },
      { header: 'Mobile', key: 'customerMobile', width: 15 },
      { header: 'Address', key: 'address', width: 32 },
      { header: 'Box Size', key: 'boxSize', width: 10 },
      { header: 'Quantity', key: 'boxQuantity', width: 10 },
      { header: 'Price (₹)', key: 'boxPrice', width: 14 },
      { header: 'Total (₹)', key: 'totalAmount', width: 14 },
      { header: 'Payment Status', key: 'paymentStatus', width: 14 },
      { header: 'Created Date', key: 'createdAt', width: 15 },
    ];

    // header style
    worksheet.getRow(1).font = { bold: true };

    // add rows (ensure date is Date type so Excel shows it correctly)
    orders.forEach((o) => {
      const row = worksheet.addRow({
        invoiceNumber: o.invoiceNumber,
        customerName: o.customerName,
        customerMobile: o.customerMobile || '',
        address: o.address || '',
        boxSize: o.boxSize || '',
        boxQuantity: o.boxQuantity || 0,
        boxPrice: o.boxPrice != null ? Number(o.boxPrice) : 0,
        totalAmount: o.totalAmount != null ? Number(o.totalAmount) : 0,
        paymentStatus: o.paymentStatus || '',
        createdAt: o.createdAt ? new Date(o.createdAt) : null,
      });

      // ensure createdAt cell is Date (ExcelJS will recognise it)
      if (o.createdAt) {
        const createdCell = row.getCell(10);
        createdCell.value = new Date(o.createdAt);
        createdCell.numFmt = 'dd-mmm-yyyy';
      }
    });

    // format currency columns (boxPrice, totalAmount)
    worksheet.getColumn(7).numFmt = '"₹"#,##0.00;[Red]-"₹"#,##0.00';
    worksheet.getColumn(8).numFmt = '"₹"#,##0.00;[Red]-"₹"#,##0.00';

    // auto-adjust column widths (robust for Date objects)
    worksheet.columns.forEach((column) => {
      let maxLength = (column.header || '').toString().length;
      column.eachCell({ includeEmpty: true }, (cell) => {
        let value = '';
        if (cell.value === null || cell.value === undefined) {
          value = '';
        } else if (cell.value instanceof Date) {
          value = cell.value.toLocaleDateString();
        } else if (typeof cell.value === 'object' && cell.value.text) {
          value = cell.value.text.toString();
        } else {
          value = cell.value.toString();
        }
        maxLength = Math.max(maxLength, value.length);
      });
      column.width = Math.min(50, maxLength + 2);
    });

    // set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');

    // stream workbook
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to export orders' });
  }
});
