// models/Payslip.js

import mongoose from 'mongoose';

const payslipSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  realId: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^CL\/\d{2}\/[A-Z]{2}\d{4}(-\d+)?$/.test(v);
      },
      message: 'Employee ID must be in format CL/YY/AB1234'
    }
  },
   grossSalary: { type: Number, default: 0 },
  month: { type: String, required: true },
  basicSalary: { type: Number, required: true },
  epfDeduction: { type: Number, default: 0 },
  etfContribution: { type: Number, default: 0 },
  allowances: [{ name: String, amount: Number }],
  totalAllowances: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  sundayWorkHours: { type: Number, default: 0 },
  sundayWorkPay: { type: Number, default: 0 },
  holidayWorkHours: { type: Number, default: 0 },
  holidayWorkPay: { type: Number, default: 0 },
  deductions: [{ name: String, amount: Number }],
  totalDeductions: { type: Number, default: 0 },
  salaryAdvances: [{ advanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SalaryAdvance' }, amount: Number }],
  totalAdvances: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  status: { type: String, enum: ['draft', 'finalized', 'paid'], default: 'draft' },
  paidDate: Date,
  finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  finalizedDate: Date,
  calculationInfo: { 
    workingDays: Number, 
    paidDays: Number, 
    unpaidLeaveDays: Number, 
    absentDays: Number, 
    dailyRate: Number, 
    hourlyRate: Number 
  }
}, { timestamps: true });

payslipSchema.index({ employeeId: 1, month: 1 }, { unique: true });

export default mongoose.model('Payslip', payslipSchema);