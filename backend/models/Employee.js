import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nic: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    required: true
  },
  contactNo: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Tailor', 'Cutter', 'Supervisor', 'Quality Checker', 'Packer', 'Manager']
  },
  salary: {
    type: Number,
    required: true
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave'],
    default: 'Active'
  },
  overtimeRate: {
    type: Number,
    default: 0
  },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    branch: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  }
}, {
  timestamps: true
});

employeeSchema.index({ nic: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ status: 1 });

export default mongoose.model("Employee", employeeSchema);