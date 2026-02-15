const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Farmer name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    village: {
      type: String,
      trim: true,
    },
    totalBoxes5: {
      type: Number,
      default: 0,
      min: [0, 'Total 5kg boxes cannot be negative'],
    },
    totalBoxes10: {
      type: Number,
      default: 0,
      min: [0, 'Total 10kg boxes cannot be negative'],
    },
    totalPurchaseAmount: {
      type: Number,
      default: 0,
      min: [0, 'Total purchase amount cannot be negative'],
    },
    totalPaymentGiven: {
      type: Number,
      default: 0,
      min: [0, 'Total payment given cannot be negative'],
    },
    pendingPayment: {
      type: Number,
      default: 0,
      min: [0, 'Pending payment cannot be negative'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for faster queries
farmerSchema.index({ name: 1 });
farmerSchema.index({ mobile: 1 });
farmerSchema.index({ pendingPayment: -1 });

module.exports = mongoose.model('Farmer', farmerSchema);
