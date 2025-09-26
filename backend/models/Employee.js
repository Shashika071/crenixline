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
  // EPF Fields
  epfNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
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

// Remove the pre-save middleware for rate calculations since they should be dynamic
employeeSchema.pre('save', function(next) {
  const now = new Date();
  const currentYear = now.getFullYear();

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
  if (this.employmentStatus === 'Confirmed' && this.leaveBalances.annual === 0) {
    this.leaveBalances.annual = 21;
    this.leaveBalances.halfDays = 0;
    this.leaveBalances.probation = 0;
  }

  next();
});

employeeSchema.index({ nic: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ 'attendance.date': 1 });
employeeSchema.index({ probationEndDate: 1 });
employeeSchema.index({ epfNumber: 1 });

export default mongoose.model("Employee", employeeSchema);