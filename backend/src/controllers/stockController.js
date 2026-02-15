const Stock = require('../models/Stock');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all stock entries
// @route   GET /api/stock
// @access  Private
exports.getAllStock = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters',
    });
  }

  const [stocks, total] = await Promise.all([
    Stock.find().sort({ date: -1 }).skip(skip).limit(limit),
    Stock.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    message: 'Stock entries retrieved successfully',
    count: stocks.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: stocks,
  });
});

// @desc    Get single stock entry
// @route   GET /api/stock/:id
// @access  Private
exports.getStockById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid stock ID format',
    });
  }

  const stock = await Stock.findById(id);

  if (!stock) {
    return res.status(404).json({
      success: false,
      message: 'Stock entry not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Stock entry retrieved successfully',
    data: stock,
  });
});

// @desc    Create new stock entry
// @route   POST /api/stock
// @access  Private
exports.createStock = asyncHandler(async (req, res, next) => {
  const { date, supplier, boxType, totalBoxes, soldBoxes, pricePerBox } = req.body;

  // Validate required fields
  if (!supplier || typeof supplier !== 'string' || supplier.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Supplier name is required',
    });
  }

  const numericBoxType = Number(boxType);
  if (!boxType || isNaN(numericBoxType) || ![5, 10].includes(numericBoxType)) {
    return res.status(400).json({
      success: false,
      message: `Box type must be 5 or 10, received: ${boxType}`,
    });
  }

  const numericTotalBoxes = Number(totalBoxes);
  if (!totalBoxes || isNaN(numericTotalBoxes) || numericTotalBoxes <= 0) {
    return res.status(400).json({
      success: false,
      message: `Valid total boxes is required, received: ${totalBoxes}`,
    });
  }

  const stockData = {
    supplier: supplier.trim(),
    boxType: Number(boxType),
    totalBoxes: Number(totalBoxes),
  };

  // Add date - use provided date or current date
  let stockDate = new Date();
  if (date) {
    const parsedDate = new Date(date);
    console.log('Date parsing:', { input: date, parsed: parsedDate, isValid: !isNaN(parsedDate.getTime()) });
    if (!isNaN(parsedDate.getTime())) {
      stockDate = parsedDate;
    }
  }
  stockData.date = stockDate;

  // Add optional fields if provided
  if (soldBoxes !== undefined && soldBoxes >= 0) {
    stockData.soldBoxes = Number(soldBoxes);
  }

  if (pricePerBox !== undefined && pricePerBox >= 0) {
    stockData.pricePerBox = Number(pricePerBox);
  }

  try {
    const stock = await Stock.create(stockData);

    res.status(201).json({
      success: true,
      message: 'Stock entry created successfully',
      data: stock,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create stock entry',
    });
  }
});

// @desc    Update stock entry
// @route   PUT /api/stock/:id
// @access  Private
exports.updateStock = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid stock ID format',
    });
  }

  const stock = await Stock.findById(id);

  if (!stock) {
    return res.status(404).json({
      success: false,
      message: 'Stock entry not found',
    });
  }

  const { date, supplier, boxType, totalBoxes, soldBoxes, pricePerBox } = req.body;

  // Update fields if provided
  if (supplier && supplier.trim() !== '') stock.supplier = supplier.trim();
  if (boxType && [5, 10].includes(Number(boxType))) stock.boxType = Number(boxType);
  if (totalBoxes !== undefined && totalBoxes >= 0) stock.totalBoxes = Number(totalBoxes);
  if (soldBoxes !== undefined && soldBoxes >= 0) stock.soldBoxes = Number(soldBoxes);
  if (pricePerBox !== undefined && pricePerBox >= 0) stock.pricePerBox = Number(pricePerBox);

  if (date) {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      stock.date = parsedDate;
    }
  }

  const updatedStock = await stock.save();

  res.status(200).json({
    success: true,
    message: 'Stock entry updated successfully',
    data: updatedStock,
  });
});

// @desc    Delete stock entry
// @route   DELETE /api/stock/:id
// @access  Private
exports.deleteStock = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid stock ID format',
    });
  }

  const stock = await Stock.findById(id);

  if (!stock) {
    return res.status(404).json({
      success: false,
      message: 'Stock entry not found',
    });
  }

  await stock.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Stock entry deleted successfully',
  });
});
