import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'Material', 'Transport', 'Machine Maintenance', 'Labor', 
      'Electricity', 'Rent', 'Overtime', 'Miscellaneous'
    ]
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
  description: {
    type: String,
    required: true
  },
  paidTo: String,
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Card'],
    default: 'Cash'
  },
  referenceNo: String,
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  approvedBy: String,
  receipt: String // URL to receipt image
}, {
  timestamps: true
});

expenseSchema.index({ category: 1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ orderId: 1 });

export default mongoose.model("Expense", expenseSchema);