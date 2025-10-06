// models/FactoryClosure.js

import mongoose from "mongoose";

const factoryClosureSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['Holiday', 'Maintenance', 'Power Outage', 'Weather', 'Other']
  },
  description: String,
  affectedEmployees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  isForAllEmployees: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Active', 'Completed'],
    default: 'Active'
  },
  isActualClosure: {
    type: Boolean,
    default: true
  },
  allowWorkWithDoublePay: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

factoryClosureSchema.pre('save', function(next) {
  if (this.reason === 'Holiday') {
    this.isActualClosure = false;
    this.allowWorkWithDoublePay = true;
  } else {
    this.isActualClosure = true;
    this.allowWorkWithDoublePay = false;
  }
  next();
});

factoryClosureSchema.index({ date: 1 });

export default mongoose.model("FactoryClosure", factoryClosureSchema);