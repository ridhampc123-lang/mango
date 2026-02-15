const Farmer = require('../models/Farmer');
const FarmerPurchase = require('../models/FarmerPurchase');
const VarietyStock = require('../models/VarietyStock');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create a new farmer
// @route   POST /api/farmers
// @access  Private
exports.createFarmer = asyncHandler(async (req, res, next) => {
  const { name, mobile, village } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Farmer name is required',
    });
  }

  // Check if farmer with same mobile already exists
  if (mobile && mobile.trim() !== '') {
    const existingFarmer = await Farmer.findOne({ mobile: mobile.trim() });
    if (existingFarmer) {
      return res.status(400).json({
        success: false,
        message: 'Farmer with this mobile number already exists',
      });
    }
  }

  const farmer = await Farmer.create({
    name: name.trim(),
    mobile: mobile?.trim() || '',
    village: village?.trim() || '',
  });

  res.status(201).json({
    success: true,
    message: 'Farmer created successfully',
    data: farmer,
  });
});

// @desc    Get all farmers
// @route   GET /api/farmers
// @access  Private
exports.getAllFarmers = asyncHandler(async (req, res, next) => {
  const { search } = req.query;

  let query = {};

  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    query = {
      $or: [
        { name: searchRegex },
        { mobile: searchRegex },
        { village: searchRegex }
      ]
    };
  }

  const farmers = await Farmer.find(query).sort({ name: 1 });

  res.status(200).json({
    success: true,
    message: 'Farmers retrieved successfully',
    count: farmers.length,
    data: farmers,
  });
});

// @desc    Get single farmer
// @route   GET /api/farmers/:id
// @access  Private
exports.getFarmerById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid farmer ID format',
    });
  }

  const farmer = await Farmer.findById(id);

  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: 'Farmer not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Farmer retrieved successfully',
    data: farmer,
  });
});

// @desc    Update farmer
// @route   PUT /api/farmers/:id
// @access  Private
exports.updateFarmer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, mobile, village } = req.body;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid farmer ID format',
    });
  }

  const farmer = await Farmer.findById(id);

  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: 'Farmer not found',
    });
  }

  // Check if mobile is being changed and if it already exists
  if (mobile && mobile.trim() !== '' && mobile !== farmer.mobile) {
    const existingFarmer = await Farmer.findOne({ mobile: mobile.trim() });
    if (existingFarmer && existingFarmer._id.toString() !== id) {
      return res.status(400).json({
        success: false,
        message: 'Another farmer with this mobile number already exists',
      });
    }
  }

  if (name && name.trim() !== '') farmer.name = name.trim();
  if (mobile !== undefined) farmer.mobile = mobile.trim();
  if (village !== undefined) farmer.village = village.trim();

  const updatedFarmer = await farmer.save();

  res.status(200).json({
    success: true,
    message: 'Farmer updated successfully',
    data: updatedFarmer,
  });
});

// @desc    Create farmer purchase (with mongoose transaction)
// @route   POST /api/farmers/purchase
// @access  Private
exports.createFarmerPurchase = asyncHandler(async (req, res, next) => {
  const { farmerId, variety, boxType, boxQuantity, ratePerBox, paymentGiven, date } = req.body;

  // STEP 1: Validate
  if (!farmerId || !farmerId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Valid farmer ID is required',
    });
  }

  if (!variety || variety.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Variety is required',
    });
  }

  const boxTypeNum = Number(boxType);
  if (!boxType || ![5, 10].includes(boxTypeNum)) {
    return res.status(400).json({
      success: false,
      message: 'Box type must be 5 or 10',
    });
  }

  const boxQuantityNum = Number(boxQuantity);
  if (!boxQuantity || boxQuantityNum < 1 || isNaN(boxQuantityNum)) {
    return res.status(400).json({
      success: false,
      message: 'Box quantity must be at least 1',
    });
  }

  const ratePerBoxNum = Number(ratePerBox);
  if (!ratePerBox || ratePerBoxNum < 1 || isNaN(ratePerBoxNum)) {
    return res.status(400).json({
      success: false,
      message: 'Rate per box must be at least 1',
    });
  }

  const paymentAmount = Number(paymentGiven) || 0;
  if (paymentAmount < 0 || isNaN(paymentAmount)) {
    return res.status(400).json({
      success: false,
      message: 'Payment given cannot be negative',
    });
  }

  // STEP 2: Calculate
  const totalKg = boxQuantityNum * boxTypeNum;
  const totalCost = boxQuantityNum * ratePerBoxNum;
  const pendingAmount = totalCost - paymentAmount;

  if (pendingAmount < 0) {
    return res.status(400).json({
      success: false,
      message: 'Payment given cannot exceed total cost',
    });
  }

  // STEP 3: Start mongoose transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify farmer exists
    const farmer = await Farmer.findById(farmerId).session(session);
    if (!farmer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Farmer not found',
      });
    }

    // STEP 4: Create FarmerPurchase record
    const purchaseData = {
      farmerId,
      variety: variety.trim(),
      boxType: boxTypeNum,
      boxQuantity: boxQuantityNum,
      ratePerBox: ratePerBoxNum,
      totalKg,
      totalCost,
      paymentGiven: paymentAmount,
      pendingAmount,
    };

    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        purchaseData.date = parsedDate;
      }
    }

    const [farmerPurchase] = await FarmerPurchase.create([purchaseData], { session });

    // STEP 5: Update Farmer
    if (boxTypeNum === 5) {
      farmer.totalBoxes5 += boxQuantityNum;
    } else {
      farmer.totalBoxes10 += boxQuantityNum;
    }

    farmer.totalPurchaseAmount += totalCost;
    farmer.totalPaymentGiven += paymentAmount;
    farmer.pendingPayment += pendingAmount;

    await farmer.save({ session });

    // STEP 6: Update or Create VarietyStock
    let varietyStock = await VarietyStock.findOne({ variety: variety.trim() }).session(session);

    if (!varietyStock) {
      // Create new stock document
      const stockData = {
        variety: variety.trim(),
        box5Total: boxTypeNum === 5 ? boxQuantityNum : 0,
        box10Total: boxTypeNum === 10 ? boxQuantityNum : 0,
      };
      [varietyStock] = await VarietyStock.create([stockData], { session });
    } else {
      // Update existing stock
      if (boxTypeNum === 5) {
        varietyStock.box5Total += boxQuantityNum;
      } else {
        varietyStock.box10Total += boxQuantityNum;
      }
      await varietyStock.save({ session });
    }

    // STEP 7: Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Farmer purchase created successfully',
      data: {
        purchase: farmerPurchase,
        farmer: {
          id: farmer._id,
          name: farmer.name,
          totalBoxes5: farmer.totalBoxes5,
          totalBoxes10: farmer.totalBoxes10,
          totalPurchaseAmount: farmer.totalPurchaseAmount,
          pendingPayment: farmer.pendingPayment,
        },
        stock: {
          variety: varietyStock.variety,
          box5Total: varietyStock.box5Total,
          box10Total: varietyStock.box10Total,
        },
      },
    });
  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

// @desc    Get farmer ledger
// @route   GET /api/farmers/:id/ledger
// @access  Private
exports.getFarmerLedger = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid farmer ID format',
    });
  }

  const farmer = await Farmer.findById(id);

  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: 'Farmer not found',
    });
  }

  const ledger = await FarmerPurchase.find({ farmerId: id }).sort({ date: -1 });

  res.status(200).json({
    success: true,
    message: 'Farmer ledger retrieved successfully',
    data: {
      farmer: {
        id: farmer._id,
        name: farmer.name,
        mobile: farmer.mobile,
        village: farmer.village,
      },
      summary: {
        totalBoxes5: farmer.totalBoxes5,
        totalBoxes10: farmer.totalBoxes10,
        totalPurchaseAmount: farmer.totalPurchaseAmount,
        totalPaymentGiven: farmer.totalPaymentGiven,
        pendingPayment: farmer.pendingPayment,
      },
      ledger,
    },
  });
});

// @desc    Make payment to farmer
// @route   POST /api/farmers/:id/payment
// @access  Private
exports.makePayment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { amount, date } = req.body;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid farmer ID format',
    });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount must be greater than 0',
    });
  }

  const farmer = await Farmer.findById(id);

  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: 'Farmer not found',
    });
  }

  const paymentAmount = Number(amount);

  if (paymentAmount > farmer.pendingPayment) {
    return res.status(400).json({
      success: false,
      message: 'Payment amount cannot exceed pending payment',
    });
  }

  farmer.totalPaymentGiven += paymentAmount;
  farmer.pendingPayment -= paymentAmount;

  await farmer.save();

  res.status(200).json({
    success: true,
    message: 'Payment recorded successfully',
    data: farmer,
  });
});

// @desc    Delete farmer
// @route   DELETE /api/farmers/:id
// @access  Private
exports.deleteFarmer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid farmer ID format',
    });
  }

  const farmer = await Farmer.findById(id);

  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: 'Farmer not found',
    });
  }

  // Allow deletion of farmers with purchases - just delete the farmer record
  // The purchase records will remain for historical reference
  await farmer.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Farmer deleted successfully',
  });
});

// @desc    Export farmers to Excel
// @route   GET /api/farmers/export
// @access  Private
exports.exportFarmersToExcel = asyncHandler(async (req, res, next) => {
  try {
    const farmers = await Farmer.find({})
      .sort({ createdAt: -1 })
      .select('name mobile totalBoxes5 totalBoxes10 totalPurchaseAmount totalPaymentGiven pendingPayment createdAt');

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Farmers');

    // Add header row
    worksheet.columns = [
      { header: 'Farmer Name', key: 'name', width: 20 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Total Boxes', key: 'totalBoxes', width: 12 },
      { header: 'Total KG', key: 'totalKg', width: 10 },
      { header: 'Total Purchase (₹)', key: 'totalPurchase', width: 15 },
      { header: 'Total Paid (₹)', key: 'totalPaid', width: 15 },
      { header: 'Remaining Balance (₹)', key: 'remainingBalance', width: 18 },
      { header: 'Created Date', key: 'createdAt', width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };

    // Add data rows
    farmers.forEach(farmer => {
      const totalBoxes = (farmer.totalBoxes5 || 0) + (farmer.totalBoxes10 || 0);
      const totalKg = (farmer.totalBoxes5 || 0) * 5 + (farmer.totalBoxes10 || 0) * 10;
      worksheet.addRow({
        name: farmer.name,
        mobile: farmer.mobile || '',
        totalBoxes: totalBoxes,
        totalKg: totalKg,
        totalPurchase: farmer.totalPurchaseAmount || 0,
        totalPaid: farmer.totalPaymentGiven || 0,
        remainingBalance: farmer.pendingPayment || 0,
        createdAt: farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString() : '',
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=farmers.xlsx');

    // Stream the workbook
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export farmers',
    });
  }
});
