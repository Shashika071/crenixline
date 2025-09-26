import mongoose from 'mongoose';

const salaryAdvanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  deductionMonth: {
    type: String, // Format: YYYY-MM
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'deducted'],
    default: 'pending'
  },
  reason: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedDate: Date
}, {
  timestamps: true
});

export default mongoose.model('SalaryAdvance', salaryAdvanceSchema);