const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      // Not required - will be generated automatically
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerMobile: {
      type: String,
      required: [true, 'Customer mobile is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    boxSize: {
      type: String,
      enum: {
        values: ['5kg', '10kg'],
        message: 'Box size must be either 5kg or 10kg',
      },
      required: [true, 'Box size is required'],
    },
    boxPrice: {
      type: Number,
      required: [true, 'Box price is required'],
      min: [1, 'Box price must be greater than 0'],
    },
    boxQuantity: {
      type: Number,
      required: [true, 'Box quantity is required'],
      min: [1, 'Box quantity must be at least 1'],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['Paid', 'Pending'],
        message: 'Payment status must be either Paid or Pending',
      },
      default: 'Pending',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Pre-update hook to recalculate totalAmount
orderSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.$set && (update.$set.boxPrice || update.$set.boxQuantity)) {
    const boxPrice = update.$set.boxPrice || this._update.$set.boxPrice;
    const boxQuantity = update.$set.boxQuantity || this._update.$set.boxQuantity;
    if (boxPrice && boxQuantity) {
      update.$set.totalAmount = boxPrice * boxQuantity;
    }
  }
  next();
});

// Ensure no unique indexes on customerMobile (allow multiple orders per customer)
orderSchema.index({ customerMobile: 1 }, { unique: false });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
