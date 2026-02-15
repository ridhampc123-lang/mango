const mongoose = require('mongoose');

const farmerPurchaseSchema = new mongoose.Schema(
  {
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
    boxType: {
      type: Number,
      enum: {
        values: [5, 10],
        message: 'Box type must be 5 or 10',
      },
      required: [true, 'Box type is required'],
    },
    boxQuantity: {
      type: Number,
      required: [true, 'Box quantity is required'],
      min: [1, 'Box quantity must be at least 1'],
    },
    ratePerBox: {
      type: Number,
      required: [true, 'Rate per box is required'],
      min: [1, 'Rate per box must be at least 1'],
    },
    totalKg: {
      type: Number,
      required: true,
    },
    totalCost: {
      type: Number,
      required: true,
    },
    paymentGiven: {
      type: Number,
      default: 0,
      min: [0, 'Payment given cannot be negative'],
    },
    pendingAmount: {
      type: Number,
      required: true,
      min: [0, 'Pending amount cannot be negative'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for faster queries
farmerPurchaseSchema.index({ farmerId: 1, date: -1 });
farmerPurchaseSchema.index({ variety: 1 });
farmerPurchaseSchema.index({ date: -1 });

module.exports = mongoose.model('FarmerPurchase', farmerPurchaseSchema);
