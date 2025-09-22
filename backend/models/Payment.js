import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Inflow', 'Outflow']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Card'],
    required: true
  },
  remarks: String,
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  referenceNo: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Completed'
  },
  receivedBy: String,
  bankDetails: {
    accountNumber: String,
    bankName: String,
    transactionId: String
  }
}, {
  timestamps: true
});

paymentSchema.index({ type: 1 });
paymentSchema.index({ date: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ supplierId: 1 });

export default mongoose.model("Payment", paymentSchema);