const Labour = require('../models/Labour');
const asyncHandler = require('../utils/asyncHandler');

// Helper function to validate and parse date
const parseDate = (dateString) => {
  if (!dateString || dateString.trim() === '') return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// @desc    Create a new labour entry
// @route   POST /api/labour
// @access  Private
exports.createLabour = asyncHandler(async (req, res, next) => {
  const { workerName, phoneNumber, hoursWorked, ratePerHour, description, date } = req.body;

  if (!workerName || workerName.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Worker name is required',
    });
  }

  if (!hoursWorked || hoursWorked <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid hours worked is required',
    });
  }

  if (!ratePerHour || ratePerHour <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid rate per hour is required',
    });
  }

  // Calculate total wage
  const wage = Number(hoursWorked) * Number(ratePerHour);

  const labourData = {
    workerName: workerName.trim(),
    phoneNumber: phoneNumber?.trim() || '',
    hoursWorked: Number(hoursWorked),
    ratePerHour: Number(ratePerHour),
    wage: wage,
    notes: description?.trim() || '',
  };

  if (date) {
    const parsedDate = parseDate(date);
    if (parsedDate) {
      labourData.workDate = parsedDate;
    }
  }

  const labour = await Labour.create(labourData);

  res.status(201).json({
    success: true,
    message: 'Labour entry created successfully',
    data: labour,
  });
});

// @desc    Get all labour entries
// @route   GET /api/labour
// @access  Private
exports.getAllLabour = asyncHandler(async (req, res, next) => {
  const { isPaid, startDate, endDate, workerName } = req.query;
  
  const filter = {};
  
  // Filter by payment status
  if (isPaid !== undefined && isPaid !== '') {
    filter.isPaid = isPaid === 'true';
  }
  
  // Filter by worker name
  if (workerName && workerName.trim() !== '') {
    filter.workerName = { $regex: workerName.trim(), $options: 'i' };
  }
  
  // Filter by date range
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (start || end) {
    filter.workDate = {};
    if (start) filter.workDate.$gte = start;
    if (end) filter.workDate.$lte = end;
  }

  const labour = await Labour.find(filter).sort({ workDate: -1 });

  res.status(200).json({
    success: true,
    message: 'Labour entries retrieved successfully',
    count: labour.length,
    data: labour,
  });
});

// @desc    Get single labour entry
// @route   GET /api/labour/:id
// @access  Private
exports.getLabourById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid labour ID format',
    });
  }

  const labour = await Labour.findById(id);

  if (!labour) {
    return res.status(404).json({
      success: false,
      message: 'Labour entry not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Labour entry retrieved successfully',
    data: labour,
  });
});

// @desc    Update labour entry
// @route   PUT /api/labour/:id
// @access  Private
exports.updateLabour = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid labour ID format',
    });
  }

  const labour = await Labour.findById(id);

  if (!labour) {
    return res.status(404).json({
      success: false,
      message: 'Labour entry not found',
    });
  }

  const { workerName, phoneNumber, hoursWorked, ratePerHour, description, date } = req.body;

  if (workerName && workerName.trim() !== '') labour.workerName = workerName.trim();
  if (phoneNumber !== undefined) labour.phoneNumber = phoneNumber?.trim() || '';
  if (description !== undefined) labour.notes = description.trim();
  
  // Update hours and rate, then recalculate wage
  if (hoursWorked !== undefined && hoursWorked > 0) labour.hoursWorked = Number(hoursWorked);
  if (ratePerHour !== undefined && ratePerHour > 0) labour.ratePerHour = Number(ratePerHour);
  
  // Recalculate wage if both hours and rate are available
  if (labour.hoursWorked && labour.ratePerHour) {
    labour.wage = labour.hoursWorked * labour.ratePerHour;
  }
  
  if (date) {
    const parsedDate = parseDate(date);
    if (parsedDate) {
      labour.workDate = parsedDate;
    }
  }

  const updatedLabour = await labour.save();

  res.status(200).json({
    success: true,
    message: 'Labour entry updated successfully',
    data: updatedLabour,
  });
});

// @desc    Mark labour as paid
// @route   PATCH /api/labour/pay
// @access  Private
exports.markAsPaid = asyncHandler(async (req, res, next) => {
  const { id } = req.query;
  
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid labour ID format',
    });
  }

  try {
    const labour = await Labour.findById(id);
    
    if (!labour) {
      return res.status(404).json({
        success: false,
        message: 'Labour entry not found',
      });
    }

    // If already paid, just return success (idempotent operation)
    if (labour.isPaid) {
      return res.status(200).json({
        success: true,
        message: 'Labour entry is already marked as paid',
        data: labour,
      });
    }

    labour.isPaid = true;
    labour.paidDate = new Date();

    const updatedLabour = await labour.save();

    res.status(200).json({
      success: true,
      message: 'Labour marked as paid successfully',
      data: updatedLabour,
    });
  } catch (error) {
    console.error('Error in markAsPaid:', error);
    throw error;
  }
});

// @desc    Delete labour entry
// @route   DELETE /api/labour/:id
// @access  Private
exports.deleteLabour = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid labour ID format',
    });
  }

  const labour = await Labour.findById(id);

  if (!labour) {
    return res.status(404).json({
      success: false,
      message: 'Labour entry not found',
    });
  }

  await labour.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Labour entry deleted successfully',
  });
});

// @desc    Get pending labour wages
// @route   GET /api/labour/pending
// @access  Private
exports.getPendingLabour = asyncHandler(async (req, res, next) => {
  const pendingLabour = await Labour.find({ isPaid: false }).sort({ workDate: -1 });

  const totalPending = pendingLabour.reduce((sum, labour) => sum + labour.wage, 0);

  res.status(200).json({
    success: true,
    message: 'Pending labour wages retrieved successfully',
    count: pendingLabour.length,
    totalPending,
    data: pendingLabour,
  });
});
