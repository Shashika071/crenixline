import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  designName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  completedQuantity: {
    type: Number,
    min: 0,
    default: 0  // Start with 0 completed units
  },
  materialRequired: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    quantity: Number,
    unit: String
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Production', 'Completed', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  assignedEmployees: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    role: String,
    assignedDate: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  specialInstructions: String,
  totalCost: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0  // Start with 0% progress
  }
  ,productionStages: [{
    stage: {
      type: String,
      enum: ['Cutting', 'Stitching', 'Finishing', 'Quality Control', 'Packing'],
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'On Hold'],
      default: 'Pending'
    },
    assignedEmployees: [{
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      },
      role: {
        type: String,
        enum: ['Primary', 'Secondary', 'Helper'],
        default: 'Primary'
      },
      assignedDate: Date,
      completedDate: Date
    }],
    assignedMachines: [{
      machine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Machine'
      },
      role: {
        type: String,
        enum: ['Primary', 'Secondary'],
        default: 'Primary'
      }
    }],
    materialsUsed: [{
      material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material'
      },
      quantity: Number,
      unit: String
    }],
    startDate: Date,
    endDate: Date,
    estimatedHours: Number,
    actualHours: Number,
    outputQuantity: Number,
    qualityRating: Number,
    notes: String
  }],
  
  // Overall production status
  currentStage: {
    type: String,
    enum: ['Cutting', 'Stitching', 'Finishing', 'Quality Control', 'Packing', 'Completed'],
    default: 'Cutting'
  },
  
 
  assignedDate: Date,
  expectedCompletionDate: Date
}, {
  timestamps: true
});
 
orderSchema.pre('save', function(next) {
  // Only create production stages if they don't exist (for new orders)
  if (this.isNew && (!this.productionStages || this.productionStages.length === 0)) {
    this.productionStages = [
      { stage: 'Cutting', status: 'Pending' },
      { stage: 'Stitching', status: 'Pending' },
      { stage: 'Finishing', status: 'Pending' },
      { stage: 'Quality Control', status: 'Pending' },
      { stage: 'Packing', status: 'Pending' }
    ];
  }
  next();
});
// Method to calculate progress percentage
orderSchema.methods.calculateProgress = function() {
  if (this.quantity <= 0) return 0;
  const progress = (this.completedQuantity / this.quantity) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
};

// Auto-calculate progress before saving
orderSchema.pre('save', function(next) {
  // Only auto-update completedQuantity based on status if status is being modified
  if (this.isModified('status') && !this.isNew) {
    switch (this.status) {
      case 'Completed':
        this.completedQuantity = this.quantity;
        break;
      case 'Delivered':
        this.completedQuantity = Math.min(this.quantity, Math.max(this.completedQuantity, Math.round(this.quantity * 0.9)));
        break;
      case 'In Production':
        this.completedQuantity = Math.min(this.quantity, Math.max(this.completedQuantity, Math.round(this.quantity * 0.5)));
        break;
      case 'Pending':
        // Keep current completedQuantity, don't force to 10%
        this.completedQuantity = Math.min(this.quantity, Math.max(this.completedQuantity, 0));
        break;
      case 'Cancelled':
        this.completedQuantity = 0;
        break;
    }
  }
  
  // Always recalculate progress
  this.progress = this.calculateProgress();
  next();
});

orderSchema.index({ orderId: 1 });
orderSchema.index({ agentId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ dueDate: 1 });

export default mongoose.model("Order", orderSchema);