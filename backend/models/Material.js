import autoAlertService from '../services/autoAlertService.js';
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
    trim: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['meters', 'pieces', 'kg', 'rolls', 'boxes', 'yards', 'packs', 'units']
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
    sparse: true,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  lastRestocked: Date,
  minStock: {
    type: Number,
    min: 0,
    default: 0
  },
  maxStock: {
    type: Number,
    min: 0
  },
  color: {
    type: String,
    trim: true
  },
  size: {
    type: String,
    trim: true
  },
  materialCode: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Alert tracking fields
  lastAlertSent: {
    type: Date,
    default: null
  },
  wasLowStock: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
materialSchema.index({ type: 1 });
materialSchema.index({ supplierId: 1 });
materialSchema.index({ availableQty: 1 });
materialSchema.index({ sku: 1 });
materialSchema.index({ isActive: 1 });
materialSchema.index({ name: 'text', description: 'text', type: 'text' });

// Virtuals
materialSchema.virtual('needsReorder').get(function() {
  return this.availableQty <= this.reorderLevel;
});

materialSchema.virtual('stockValue').get(function() {
  return this.availableQty * this.costPerUnit;
});

materialSchema.virtual('stockPercentage').get(function() {
  if (!this.maxStock || this.maxStock === 0) return 0;
  return (this.availableQty / this.maxStock) * 100;
});

// Methods
materialSchema.methods.canDeduct = function(quantity) {
  return this.availableQty >= quantity;
};

materialSchema.methods.addStock = function(quantity, costPerUnit = null) {
  this.availableQty += quantity;
  this.lastRestocked = new Date();
  
  // Update average cost if new cost is provided
  if (costPerUnit && costPerUnit > 0) {
    const totalValue = (this.availableQty - quantity) * this.costPerUnit + quantity * costPerUnit;
    this.costPerUnit = totalValue / this.availableQty;
  }
};

materialSchema.methods.deductStock = function(quantity) {
  if (this.availableQty < quantity) {
    throw new Error(`Insufficient stock. Available: ${this.availableQty}, Requested: ${quantity}`);
  }
  this.availableQty -= quantity;
};

// Static methods
materialSchema.statics.getLowStock = function() {
  return this.find({
    $expr: { $lte: ['$availableQty', '$reorderLevel'] },
    isActive: true
  }).populate('supplierId');
};

materialSchema.statics.getByType = function(type) {
  return this.find({ type: new RegExp(type, 'i'), isActive: true });
};

materialSchema.statics.getTotalInventoryValue = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ['$availableQty', '$costPerUnit'] } },
        totalItems: { $sum: '$availableQty' }
      }
    }
  ]);
};

// Pre-save middleware to generate SKU if not provided
materialSchema.pre('save', function(next) {
  if (!this.sku) {
    // Generate a simple SKU based on name and timestamp
    const timestamp = Date.now().toString(36);
    const nameCode = this.name.substring(0, 3).toUpperCase();
    this.sku = `${nameCode}-${timestamp}`;
  }
  next();
});

// Post-save hook for automatic low stock alerts
materialSchema.post('save', async function(doc) {
  try {
    const isLowStock = doc.availableQty <= doc.reorderLevel;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // If stock is LOW now
    if (isLowStock) {
      // Check if we should send alert (never sent OR sent long ago OR was previously resolved)
      const shouldSendAlert = 
        !doc.lastAlertSent || 
        doc.lastAlertSent < oneHourAgo ||
        !doc.wasLowStock;
      
      if (shouldSendAlert) {
        setTimeout(async () => {
          try {
            await autoAlertService.triggerImmediateAlerts();
            
            // Update alert tracking
            await mongoose.model('Material').findByIdAndUpdate(doc._id, {
              lastAlertSent: new Date(),
              wasLowStock: true
            });
          } catch (error) {
            console.error('Error triggering alert after material save:', error);
          }
        }, 2000);
      }
    } 
    // If stock is OK now but was previously low (issue resolved) - RESET the flag
    else if (doc.wasLowStock) {
      await mongoose.model('Material').findByIdAndUpdate(doc._id, {
        wasLowStock: false
      });
    }
  } catch (error) {
    console.error('Error in material post-save hook:', error);
  }
});

// Post-update hook for bulk operations
materialSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    try {
      const isLowStock = doc.availableQty <= doc.reorderLevel;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (isLowStock) {
        const shouldSendAlert = 
          !doc.lastAlertSent || 
          doc.lastAlertSent < oneHourAgo ||
          !doc.wasLowStock;
        
        if (shouldSendAlert) {
          setTimeout(async () => {
            try {
              await autoAlertService.triggerImmediateAlerts();
              await mongoose.model('Material').findByIdAndUpdate(doc._id, {
                lastAlertSent: new Date(),
                wasLowStock: true
              });
            } catch (error) {
              console.error('Error triggering alert after material update:', error);
            }
          }, 2000);
        }
      } else if (doc.wasLowStock) {
        await mongoose.model('Material').findByIdAndUpdate(doc._id, {
          wasLowStock: false
        });
      }
    } catch (error) {
      console.error('Error in material post-update hook:', error);
    }
  }
});

export default mongoose.model("Material", materialSchema);