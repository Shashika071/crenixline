import mongoose from "mongoose";

const productionSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  jobType: {
    type: String,
    required: true,
    enum: ['Cutting', 'Stitching', 'Finishing', 'Quality Control', 'Packing']
  },
  assignedEmployeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'],
    default: 'Not Started'
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0
  },
  qualityRating: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: String,
  defects: [{
    description: String,
    severity: {
      type: String,
      enum: ['Minor', 'Major', 'Critical']
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  outputQuantity: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
productionSchema.index({ orderId: 1 });
productionSchema.index({ assignedEmployeeId: 1 });
productionSchema.index({ jobType: 1 });
productionSchema.index({ status: 1 });
productionSchema.index({ startDate: -1 });

// Virtual for job duration
productionSchema.virtual('duration').get(function() {
  if (!this.startDate) return 0;
  const end = this.endDate || new Date();
  return Math.round((end - this.startDate) / (1000 * 60 * 60)); // hours
});

// Virtual for efficiency
productionSchema.virtual('efficiency').get(function() {
  if (!this.estimatedHours || !this.actualHours) return 0;
  return ((this.estimatedHours / this.actualHours) * 100).toFixed(1);
});

// Pre-save middleware to validate data
productionSchema.pre('save', function(next) {
  // Validate that end date is after start date
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    return next(new Error('End date cannot be before start date'));
  }
  
  // Validate that completed jobs have end date
  if (this.status === 'Completed' && !this.endDate) {
    this.endDate = new Date();
  }
  
  next();
});

// Static method to get jobs needing attention
productionSchema.statics.getJobsNeedingAttention = function() {
  return this.find({
    $or: [
      { status: 'On Hold' },
      { 
        status: 'In Progress',
        startDate: { $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Older than 7 days
      }
    ]
  }).populate('orderId').populate('assignedEmployeeId');
};

export default mongoose.model("Production", productionSchema);