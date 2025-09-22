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
  estimatedHours: Number,
  actualHours: Number,
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

productionSchema.index({ orderId: 1 });
productionSchema.index({ assignedEmployeeId: 1 });
productionSchema.index({ jobType: 1 });
productionSchema.index({ status: 1 });

export default mongoose.model("Production", productionSchema);