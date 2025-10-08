import mongoose from 'mongoose';

const rentalPaymentSchema = new mongoose.Schema({
  machineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  month: {
    type: String, // Format: "2025-10" for October 2025
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Card'],
    default: 'Cash'
  },
  remarks: {
    type: String
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }
}, {
  timestamps: true
});

// Indexes
rentalPaymentSchema.index({ machineId: 1, month: 1 }, { unique: true });
rentalPaymentSchema.index({ status: 1 });
rentalPaymentSchema.index({ dueDate: 1 });

const RentalPayment = mongoose.model('RentalPayment', rentalPaymentSchema);

export default RentalPayment;
