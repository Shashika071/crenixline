import mongoose from 'mongoose';

const employeeAllowanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  allowanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Allowance',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

employeeAllowanceSchema.index({ employeeId: 1, allowanceId: 1 }, { unique: true });

export default mongoose.model('EmployeeAllowance', employeeAllowanceSchema);