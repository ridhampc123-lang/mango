const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    supplier: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    boxType: {
      type: Number,
      enum: {
        values: [5, 10],
        message: 'Box type must be either 5 or 10',
      },
      required: [true, 'Box type is required'],
    },
    totalBoxes: {
      type: Number,
      required: [true, 'Total boxes is required'],
      min: [0, 'Total boxes cannot be negative'],
    },
    soldBoxes: {
      type: Number,
      default: 0,
      min: [0, 'Sold boxes cannot be negative'],
    },
    pricePerBox: {
      type: Number,
      min: [0, 'Price per box cannot be negative'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Stock', stockSchema);
