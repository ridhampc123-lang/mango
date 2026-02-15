const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      unique: true,
      required: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: [true, 'Farmer ID is required'],
    },
    variety: {
      type: String,
      required: [true, 'Mango variety is required'],
      trim: true,
    },
    box5: {
      type: Number,
      default: 0,
      min: [0, 'Box 5 quantity cannot be negative'],
    },
    box10: {
      type: Number,
      default: 0,
      min: [0, 'Box 10 quantity cannot be negative'],
    },
    costPerBox5: {
      type: Number,
      default: 0,
      min: [0, 'Cost per box 5 cannot be negative'],
    },
    costPerBox10: {
      type: Number,
      default: 0,
      min: [0, 'Cost per box 10 cannot be negative'],
    },
    totalCost: {
      type: Number,
      required: true,
      min: [0, 'Total cost cannot be negative'],
    },
    arrivalDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for faster queries
batchSchema.index({ farmerId: 1 });

module.exports = mongoose.model('Batch', batchSchema);
