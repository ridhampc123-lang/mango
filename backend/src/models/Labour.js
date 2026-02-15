const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema(
  {
    workerName: {
      type: String,
      required: [true, 'Worker name is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    hoursWorked: {
      type: Number,
      required: [true, 'Hours worked is required'],
      min: [0.1, 'Hours worked must be greater than 0'],
      default: 0,
    },
    ratePerHour: {
      type: Number,
      required: [true, 'Rate per hour is required'],
      min: [0.01, 'Rate per hour must be greater than 0'],
      default: 0,
    },
    wage: {
      type: Number,
      required: [true, 'Wage amount is required'],
      min: [0, 'Wage cannot be negative'],
    },
    workDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
labourSchema.index({ workDate: -1 });
labourSchema.index({ isPaid: 1 });
labourSchema.index({ workerName: 1 });

module.exports = mongoose.model('Labour', labourSchema);
