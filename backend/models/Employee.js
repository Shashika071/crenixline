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
 // Update the attendance schema in models/Employee.js
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
  isPaidLeave: {  // New field to track if leave is paid
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
  overtimeRate: {
    type: Number,
    default: 0
  },
  bankDetails: bankDetailsSchema,
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  workingSchedule: {
    monday: { start: String, end: String, working: Boolean },
    tuesday: { start: String, end: String, working: Boolean },
    wednesday: { start: String, end: String, working: Boolean },
    thursday: { start: String, end: String, working: Boolean },
    friday: { start: String, end: String, working: Boolean },
    saturday: { start: String, end: String, working: Boolean },
    sunday: { start: String, end: String, working: Boolean }
  },
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
    takenProbation: { type: Number, default: 0 },
    takenHalfDays: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

// Pre-save middleware
employeeSchema.pre('save', function(next) {
  // Set probation end date (6 months from join date)
  if (this.isModified('joinDate') || !this.probationEndDate) {
    this.probationEndDate = new Date(this.joinDate);
    this.probationEndDate.setMonth(this.probationEndDate.getMonth() + 6);
  }
  
  // Update employment status and leave balances
  const now = new Date();
  const currentYear = now.getFullYear();
  
  if (now >= this.probationEndDate && this.employmentStatus === 'Probation') {
    this.employmentStatus = 'Confirmed';
    // Initialize regular leave balances after probation
    this.leaveBalances.annual = 21;
    this.leaveBalances.halfDays = 2;
    this.leaveBalances.probation = 0;
  }
  
  // Initialize leave history for current year
  if (!this.leaveHistory.find(l => l.year === currentYear)) {
    this.leaveHistory.push({
      year: currentYear,
      takenAnnual: 0,
      takenMedical: 0,
      takenProbation: 0,
      takenHalfDays: 0
    });
  }
  
  // Calculate hourly rates
  if (this.isModified('salary')) {
    const workingDaysPerMonth = 26;
    const hoursPerDay = 8;
    this.hourlyRate = this.salary / (workingDaysPerMonth * hoursPerDay);
    this.overtimeRate = this.hourlyRate * 1.5;
  }
  
  next();
});

employeeSchema.index({ nic: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ 'attendance.date': 1 });
employeeSchema.index({ probationEndDate: 1 });

export default mongoose.model("Employee", employeeSchema);