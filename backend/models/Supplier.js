import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactNo: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Supplier', 'Agent', 'Client', 'Both']
  },
  email: {
    type: String,
    lowercase: true
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  taxId: String,
  paymentTerms: String,
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  balance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

supplierSchema.index({ type: 1 });
supplierSchema.index({ name: 1 });

export default mongoose.model("Supplier", supplierSchema);