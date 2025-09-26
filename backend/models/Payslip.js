import mongoose from 'mongoose';

const payslipSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: String, // Format: YYYY-MM
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  epfDeduction: {
    type: Number,
    default: 0
  },
  allowances: [{
    name: String,
    amount: Number
  }],
  totalAllowances: {
    type: Number,
    default: 0
  },
  overtimeHours: {
    type: Number,
    default: 0
  },
  overtimePay: {
    type: Number,
    default: 0
  },
  deductions: [{
    name: String,
    amount: Number
  }],
  totalDeductions: {
    type: Number,
    default: 0
  },
  salaryAdvances: [{
    advanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalaryAdvance'
    },
    amount: Number
  }],
  totalAdvances: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'finalized', 'paid'],
    default: 'draft'
  },
  paidDate: Date,
  finalizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  finalizedDate: Date
}, {
  timestamps: true
});

payslipSchema.index({ employeeId: 1, month: 1 }, { unique: true });

export default mongoose.model('Payslip', payslipSchema);