const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const Stock = require('../models/Stock');
const Farmer = require('../models/Farmer');

// Helper function to generate batch ID
const generateBatchId = (variety) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(10 + Math.random() * 90);
  return `BATCH-${variety.toUpperCase()}-${year}${month}${day}-${random}`;
};

// @desc    Create a new batch
// @route   POST /api/batches
// @access  Private
exports.createBatch = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      farmerId,
      variety,
      box5,
      box10,
      costPerBox5,
      costPerBox10,
    } = req.body;

    // 1. Validate farmer exists
    const farmer = await Farmer.findById(farmerId).session(session);
    if (!farmer) {
      await session.abortTransaction();
      res.status(404);
      throw new Error('Farmer not found');
    }

    // 2. Generate batch ID
    const batchId = generateBatchId(variety);

    // 3. Calculate total cost
    const totalCost = (box5 || 0) * (costPerBox5 || 0) + (box10 || 0) * (costPerBox10 || 0);

    // 4. Create batch
    const batch = await Batch.create([{
      batchId,
      farmerId,
      variety,
      box5: box5 || 0,
      box10: box10 || 0,
      costPerBox5: costPerBox5 || 0,
      costPerBox10: costPerBox10 || 0,
      totalCost,
    }], { session });

    // 5. Update or create stock
    let stock = await Stock.findOne({ variety }).session(session);
    
    if (stock) {
      stock.box5Total += (box5 || 0);
      stock.box10Total += (box10 || 0);
      await stock.save({ session });
    } else {
      await Stock.create([{
        variety,
        box5Total: box5 || 0,
        box10Total: box10 || 0,
      }], { session });
    }

    // 6. Update farmer pending payment
    farmer.pendingPayment += totalCost;
    await farmer.save({ session });

    // Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      data: batch[0],
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Get all batches
// @route   GET /api/batches
// @access  Private
exports.getAllBatches = async (req, res, next) => {
  try {
    const batches = await Batch.find()
      .populate('farmerId', 'name mobile village')
      .sort({ arrivalDate: -1 });

    res.json({
      success: true,
      message: 'Batches retrieved successfully',
      count: batches.length,
      data: batches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single batch
// @route   GET /api/batches/:id
// @access  Private
exports.getBatchById = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('farmerId', 'name mobile village');

    if (!batch) {
      res.status(404);
      throw new Error('Batch not found');
    }

    res.json({
      success: true,
      message: 'Batch retrieved successfully',
      data: batch,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete batch
// @route   DELETE /api/batches/:id
// @access  Private
exports.deleteBatch = async (req, res, next) => {
  try {
    const batch = await Batch.findById(req.params.id);

    if (!batch) {
      res.status(404);
      throw new Error('Batch not found');
    }

    await batch.deleteOne();

    res.json({
      success: true,
      message: 'Batch deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
