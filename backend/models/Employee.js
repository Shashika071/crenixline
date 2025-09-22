import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date,
    required: true
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
    enum: ['Present', 'Absent', 'Half Day', 'Leave'],
    default: 'Present'
  },
  notes: String
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
  attendance: [attendanceSchema]
}, {
  timestamps: true
});

// Pre-save middleware to calculate hourly rate
employeeSchema.pre('save', function(next) {
  if (this.isModified('salary')) {
    // Calculate hourly rate based on monthly salary
    const workingDaysPerMonth = 26; // Monday to Saturday
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

export default mongoose.model("Employee", employeeSchema);