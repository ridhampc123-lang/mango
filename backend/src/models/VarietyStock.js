const mongoose = require('mongoose');

const varietyStockSchema = new mongoose.Schema(
  {
    variety: {
      type: String,
      required: [true, 'Mango variety is required'],
      unique: true,
      trim: true,
    },
    box5Total: {
      type: Number,
      default: 0,
      min: [0, 'Box 5kg total cannot be negative'],
    },
    box10Total: {
      type: Number,
      default: 0,
      min: [0, 'Box 10kg total cannot be negative'],
    },
    box5Sold: {
      type: Number,
      default: 0,
      min: [0, 'Box 5kg sold cannot be negative'],
    },
    box10Sold: {
      type: Number,
      default: 0,
      min: [0, 'Box 10kg sold cannot be negative'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Virtual fields for remaining stock
varietyStockSchema.virtual('box5Remaining').get(function () {
  return this.box5Total - this.box5Sold;
});

varietyStockSchema.virtual('box10Remaining').get(function () {
  return this.box10Total - this.box10Sold;
});

// Ensure virtuals are included in JSON
varietyStockSchema.set('toJSON', { virtuals: true });
varietyStockSchema.set('toObject', { virtuals: true });

// Index for faster queries
varietyStockSchema.index({ variety: 1 });

module.exports = mongoose.model('VarietyStock', varietyStockSchema);
