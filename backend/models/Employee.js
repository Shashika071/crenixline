// models/Employee.js

import mongoose from "mongoose";

const medicalLeaveSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  medicalCertificate: {
    filename: String,
    originalName: String,
    uploadDate: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  days: {
    type: Number,
    required: true
  },
  notes: String,
  appliedDate: {
    type: Date,
    default: Date.now
  },
  processedDate: Date,
  adminNotes: String
});

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  breakStart: Date,
  breakEnd: Date,
  totalHours: Number,
  overtimeHours: Number,
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day', 'Leave', 'Medical Leave', 'Factory Closure', 'No Pay'],
    default: 'Present'
  },
  notes: String,
  isHalfDay: Boolean,
  isMedical: Boolean,
  isFactoryClosure: Boolean,
  isPaidLeave: {
    type: Boolean,
    default: true
  }
});

const bankDetailsSchema = new mongoose.Schema({
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['Savings', 'Current', 'Salary'],
    default: 'Savings'
  },
  ifscCode: {
    type: String,
    trim: true
  }
});

const employeeSchema = new mongoose.Schema({
  // EPF Fields - Fixed with proper unique constraint
  epfNumber: {
    type: String,
    unique: true,
    sparse: true,  // This allows multiple null values
    trim: true,
     default: undefined,
  
  },
  hasEPF: {
    type: Boolean,
    default: true
  },
  
  // Salary and Rates
  salary: {
    type: Number,
    required: true
  },
  overtimeRate: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number, 
    default: 0
  },
  
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  nic: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  contactNo: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true
  },
  
  // Employment Details
  joinDate: {
    type: Date,
    default: Date.now
  },
  probationEndDate: {
    type: Date
  },
  employmentStatus: {
    type: String,
    enum: ['Probation', 'Confirmed', 'Contract', 'Permanent'],
    default: 'Probation'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave'],
    default: 'Active'
  },
  
  // Financial Details
  bankDetails: bankDetailsSchema,
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  // Work Schedule
  workingSchedule: {
    monday: { start: String, end: String, working: Boolean },
    tuesday: { start: String, end: String, working: Boolean },
    wednesday: { start: String, end: String, working: Boolean },
    thursday: { start: String, end: String, working: Boolean },
    friday: { start: String, end: String, working: Boolean },
    saturday: { start: String, end: String, working: Boolean },
    sunday: { start: String, end: String, working: Boolean }
  },
  
  // Attendance and Leaves
  attendance: [attendanceSchema],
  medicalLeaves: [medicalLeaveSchema],
  leaveBalances: {
    annual: { type: Number, default: 0 },
    medical: { type: Number, default: 24 },
    probation: { type: Number, default: 2 },
    halfDays: { type: Number, default: 0 }
  },
  leaveHistory: [{
    year: Number,
    takenAnnual: { type: Number, default: 0 },
    takenMedical: { type: Number, default: 0 },
    monthlyLeaves: { type: [Number], default: Array(12).fill(0) },
    monthlyHalfDays: { type: [Number], default: Array(12).fill(0) }
  }]
}, {
  timestamps: true
});

// Updated pre-save middleware with proper EPF handling
employeeSchema.pre('save', async function(next) {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Handle EPF number - ensure it's null if empty or when hasEPF is false
  if (!this.hasEPF) {
    this.epfNumber = undefined; // No EPF at all
  } else if (this.epfNumber && this.epfNumber.trim() === '') {
    this.epfNumber = undefined; // EPF enabled but number is empty
  } else if (this.epfNumber) {
    this.epfNumber = this.epfNumber.trim(); // Clean the EPF number
  }

  // Only recalc probationEndDate if employmentStatus or joinDate changed
  if (this.isModified('employmentStatus') || this.isModified('joinDate')) {
    if (this.employmentStatus === 'Probation') {
      this.probationEndDate = new Date(this.joinDate);
      this.probationEndDate.setMonth(this.probationEndDate.getMonth() + 6);
    } else {
      this.probationEndDate = new Date(this.joinDate);
    }
  }

  // Initialize leave history for current year if not present with proper structure
  let leaveHistory = this.leaveHistory.find(l => l.year === currentYear);
  if (!leaveHistory) {
    leaveHistory = {
      year: currentYear,
      takenAnnual: 0,
      takenMedical: 0,
      monthlyLeaves: Array(12).fill(0),
      monthlyHalfDays: Array(12).fill(0)
    };
    this.leaveHistory.push(leaveHistory);
  } else {
    // Ensure existing leave history has the proper structure
    if (!leaveHistory.monthlyLeaves || leaveHistory.monthlyLeaves.length !== 12) {
      leaveHistory.monthlyLeaves = Array(12).fill(0);
    }
    if (!leaveHistory.monthlyHalfDays || leaveHistory.monthlyHalfDays.length !== 12) {
      leaveHistory.monthlyHalfDays = Array(12).fill(0);
    }
  }

  // Update leave balances if employmentStatus changed to Confirmed
  if (this.isModified('employmentStatus') && this.employmentStatus === 'Confirmed' && this.leaveBalances.annual === 0) {
    this.leaveBalances.annual = 21;
    this.leaveBalances.halfDays = 0;
    this.leaveBalances.probation = 0;
  }

  // Calculate hourly rate based on salary (assuming 8 hours/day, 26 days/month)
  if (this.isModified('salary') && this.salary > 0) {
    const monthlyHours = 8 * 26; // 8 hours/day * 26 working days
    this.hourlyRate = parseFloat((this.salary / monthlyHours).toFixed(2));
    
    // Overtime rate is typically 1.5x hourly rate
    this.overtimeRate = parseFloat((this.hourlyRate * 1.5).toFixed(2));
  }

  next();
});

// Static method to check for duplicate EPF numbers
employeeSchema.statics.checkDuplicateEPF = async function(epfNumber, excludeId = null) {
  if (!epfNumber || epfNumber.trim() === '') {
    return null; // No check needed for null/empty EPF numbers
  }
  
  const query = { epfNumber: epfNumber.trim() };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return await this.findOne(query);
};

// Instance method to validate EPF uniqueness
employeeSchema.methods.isEPFUnique = async function() {
  if (!this.epfNumber || this.epfNumber.trim() === '') {
    return true; // Null/empty EPF numbers are always considered unique
  }
  
  const existingEmployee = await this.constructor.findOne({
    epfNumber: this.epfNumber.trim(),
    _id: { $ne: this._id }
  });
  
  return !existingEmployee;
};

// Indexes
employeeSchema.index({ nic: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ 'attendance.date': 1 });
employeeSchema.index({ probationEndDate: 1 });
employeeSchema.index({ epfNumber: 1 }); // Sparse unique index is defined in schema

// Virtual for formatted EPF display
employeeSchema.virtual('formattedEPF').get(function() {
  return this.epfNumber || 'Not Provided';
});

// Virtual for employment duration
employeeSchema.virtual('employmentDuration').get(function() {
  const joinDate = this.joinDate;
  const today = new Date();
  const diffTime = Math.abs(today - joinDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  
  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
  }
  return `${months} month${months > 1 ? 's' : ''}`;
});

// Transform output to include virtuals
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

export default mongoose.model("Employee", employeeSchema);