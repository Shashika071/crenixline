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

const maternityLeaveSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: true
  },
  expectedDuration: {
    type: Number,
    default: 42,
    enum: [42, 84]
  },
  medicalReason: String,
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
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
    enum: ['Present', 'Absent', 'Half Day', 'Leave', 'Medical Leave', 'Casual Leave', 'Factory Closure', 'No Pay', 'Holiday Work', 'Sunday Work'],
    default: 'Present'
  },
  notes: String,
  isHalfDay: Boolean,
  isMedical: Boolean,
  isCasual: Boolean,
  isFactoryClosure: Boolean,
  isSundayWork: {
    type: Boolean,
    default: false
  },
  isHolidayWork: {
    type: Boolean,
    default: false
  },
  isDoublePay: {
    type: Boolean,
    default: false
  },
  isPaidLeave: {
    type: Boolean,
    default: true
  },
  leaveType: {
    type: String,
    enum: ['annual', 'medical', 'casual', 'maternity', 'unpaid'],
    default: null
  },
  leaveDaysDeducted: {
    type: Number,
    default: 0
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
  employeeId: {
    type: String,
    unique: true,
    immutable: true,
    required: true,
    validate: {
      validator: function(v) {
        return /^CL\/\d{2}\/[A-Z]{2}\d{4}(-\d+)?$/.test(v);
      },
      message: 'Employee ID must be in format CL/YY/AB1234'
    }
  },
  profileImage: {
    type: String,
    default: null
  },
  epfNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    default: undefined,
  },
  hasEPF: {
    type: Boolean,
    default: true
  },
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
  dailyRate: {
    type: Number,
    default: 0
  },
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
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  role: {
    type: String,
    required: true
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
  maternityLeaves: [maternityLeaveSchema],
  leaveBalances: {
    annual: { type: Number, default: 14 },
    medical: { type: Number, default: 7 },
    casual: { type: Number, default: 7 },
    maternity: { type: Number, default: 42 }
  },
  leaveHistory: [{
    year: Number,
    takenAnnual: { type: Number, default: 0 },
    takenMedical: { type: Number, default: 0 },
    takenCasual: { type: Number, default: 0 },
    monthlyLeaves: { type: [Number], default: Array(12).fill(0) }
  }],
  sundayWorkSummary: {
    totalDays: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  holidayWorkSummary: {
    totalDays: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});
const generateEPFIdentifier = async function(name, EmployeeModel) {
  const namePrefix = name.substring(0, 2).toUpperCase();
  
  let isUnique = false;
  let generatedEPF = '';
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!isUnique && attempts < maxAttempts) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    generatedEPF = `${namePrefix}${randomNum}`;
    
    const existingEmployee = await EmployeeModel.findOne({ epfNumber: generatedEPF });
    if (!existingEmployee) {
      isUnique = true;
    }
    
    attempts++;
  }
  
  if (!isUnique) {
    const timestamp = Date.now().toString().slice(-6);
    generatedEPF = `${namePrefix}${timestamp}`;
  }
  
  return generatedEPF;
};

// UPDATED: Pre-save middleware with holiday work tracking
employeeSchema.pre('save', async function(next) {
  const now = new Date();
  const currentYear = now.getFullYear();

  if (!this.hasEPF) {
    if (!this.epfNumber || this.epfNumber === '' || this.epfNumber === undefined) {
      this.epfNumber = await generateEPFIdentifier(this.name, this.constructor);
    }
  } else {
    if (this.epfNumber && this.epfNumber.trim() === '') {
      this.epfNumber = undefined;
    } else if (this.epfNumber) {
      this.epfNumber = this.epfNumber.trim();
    }
  }

  if (this.isModified('employmentStatus') || this.isModified('joinDate')) {
    if (this.employmentStatus === 'Probation') {
      this.probationEndDate = new Date(this.joinDate);
      this.probationEndDate.setMonth(this.probationEndDate.getMonth() + 6);
    } else {
      this.probationEndDate = new Date(this.joinDate);
    }
  }

  if (this.isModified('salary') && this.salary > 0) {
    const monthlyHours = 8 * 26;
    this.hourlyRate = parseFloat((this.salary / monthlyHours).toFixed(2));
    this.dailyRate = parseFloat((this.salary / 26).toFixed(2));
    this.overtimeRate = parseFloat((this.hourlyRate * 1.5).toFixed(2));
  }

  let leaveHistory = this.leaveHistory.find(l => l.year === currentYear);
  if (!leaveHistory) {
    leaveHistory = {
      year: currentYear,
      takenAnnual: 0,
      takenMedical: 0,
      takenCasual: 0,
      monthlyLeaves: Array(12).fill(0)
    };
    this.leaveHistory.push(leaveHistory);
  } else {
    if (!leaveHistory.monthlyLeaves || leaveHistory.monthlyLeaves.length !== 12) {
      leaveHistory.monthlyLeaves = Array(12).fill(0);
    }
  }

  // UPDATED: Track both Sunday AND Holiday work
  if (this.isModified('attendance')) {
    const sundayWorkRecords = this.attendance.filter(record => record.isSundayWork);
    const holidayWorkRecords = this.attendance.filter(record => record.isHolidayWork);
    
    this.sundayWorkSummary = {
      totalDays: sundayWorkRecords.length,
      totalHours: sundayWorkRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0),
      lastUpdated: new Date()
    };
    
    this.holidayWorkSummary = {
      totalDays: holidayWorkRecords.length,
      totalHours: holidayWorkRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0),
      lastUpdated: new Date()
    };
  }

  next();
});

employeeSchema.statics.checkDuplicateEPF = async function(epfNumber, excludeId = null) {
  if (!epfNumber || epfNumber.trim() === '') {
    return null;
  }
  
  const query = { epfNumber: epfNumber.trim() };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return await this.findOne(query);
};

employeeSchema.methods.isEPFUnique = async function() {
  if (!this.epfNumber || this.epfNumber.trim() === '') {
    return true;
  }
  
  const existingEmployee = await this.constructor.findOne({
    epfNumber: this.epfNumber.trim(),
    _id: { $ne: this._id }
  });
  
  return !existingEmployee;
};

employeeSchema.methods.calculateSundayWorkPayment = function(month, year) {
  const attendanceRecords = Array.isArray(this.attendance) ? this.attendance : [];

  const sundayWorkRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    return record.isSundayWork && 
           recordDate.getMonth() === month && 
           recordDate.getFullYear() === year;
  });

  let totalPayment = 0;
  const sundayWorkDetails = sundayWorkRecords.map(record => {
    const hoursWorked = record.totalHours || 0;
    const payment = hoursWorked * this.hourlyRate * 2;
    totalPayment += payment;
    
    return {
      date: record.date,
      hoursWorked: hoursWorked,
      payment: parseFloat(payment.toFixed(2))
    };
  });

  return {
    totalPayment: parseFloat(totalPayment.toFixed(2)),
    totalHours: sundayWorkRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0),
    details: sundayWorkDetails
  };
};

// ADDED: Method to calculate Holiday work payment
employeeSchema.methods.calculateHolidayWorkPayment = function(month, year) {
  const attendanceRecords = Array.isArray(this.attendance) ? this.attendance : [];

  const holidayWorkRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    return record.isHolidayWork && 
           recordDate.getMonth() === month && 
           recordDate.getFullYear() === year;
  });

  let totalPayment = 0;
  const holidayWorkDetails = holidayWorkRecords.map(record => {
    const hoursWorked = record.totalHours || 0;
    const payment = hoursWorked * this.hourlyRate * 2; // Double pay for holiday work
    totalPayment += payment;
    
    return {
      date: record.date,
      hoursWorked: hoursWorked,
      payment: parseFloat(payment.toFixed(2))
    };
  });

  return {
    totalPayment: parseFloat(totalPayment.toFixed(2)),
    totalHours: holidayWorkRecords.reduce((sum, record) => sum + (record.totalHours || 0), 0),
    details: holidayWorkDetails
  };
};

// Indexes
employeeSchema.index({ nic: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ 'attendance.date': 1 });
employeeSchema.index({ 'attendance.isSundayWork': 1 });
employeeSchema.index({ 'attendance.isHolidayWork': 1 }); // ADDED: Index for holiday work queries
employeeSchema.index({ epfNumber: 1 });
employeeSchema.index({ probationEndDate: 1 });

employeeSchema.virtual('formattedEPF').get(function() {
  if (!this.hasEPF) {
    return `${this.epfNumber} (No EPF)`;
  }
  return this.epfNumber || 'Not Provided';
});

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

employeeSchema.virtual('currentMonthSundayWork').get(function() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  return this.calculateSundayWorkPayment(currentMonth, currentYear);
});

// ADDED: Virtual for current month holiday work summary
employeeSchema.virtual('currentMonthHolidayWork').get(function() {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  return this.calculateHolidayWorkPayment(currentMonth, currentYear);
});

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

export default mongoose.model("Employee", employeeSchema);