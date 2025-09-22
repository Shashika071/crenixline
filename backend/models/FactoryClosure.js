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
  }
}, {
  timestamps: true
});

factoryClosureSchema.index({ date: 1 });

export default mongoose.model("FactoryClosure", factoryClosureSchema);