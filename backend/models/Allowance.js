import mongoose from 'mongoose';

const allowanceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['fixed', 'percentage'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Allowance', allowanceSchema);