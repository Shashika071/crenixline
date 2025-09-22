import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Fabric', 'Button', 'Zipper', 'Thread', 'Label', 'Tag', 'Packaging', 'Other']
  },
  unit: {
    type: String,
    required: true,
    enum: ['meters', 'pieces', 'kg', 'rolls', 'boxes']
  },
  availableQty: {
    type: Number,
    required: true,
    min: 0
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: 0
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  costPerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  location: String,
  description: String,
  lastRestocked: Date
}, {
  timestamps: true
});

materialSchema.index({ type: 1 });
materialSchema.index({ supplierId: 1 });
materialSchema.index({ availableQty: 1 });

materialSchema.virtual('needsReorder').get(function() {
  return this.availableQty <= this.reorderLevel;
});

export default mongoose.model("Material", materialSchema);