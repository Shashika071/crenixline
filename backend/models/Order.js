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
    default: 0
  }
}, {
  timestamps: true
});

orderSchema.index({ orderId: 1 });
orderSchema.index({ agentId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ dueDate: 1 });

export default mongoose.model("Order", orderSchema);