import autoAlertService from '../services/autoAlertService.js';
import mongoose from "mongoose";

const machineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true
  },
  model: String,
  serialNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Ownership information
  isRental: {
    type: Boolean,
    default: false
  },
  
  // For owned machines
  purchaseDate: Date,
  purchaseValue: {
    type: Number,
    min: 0
  },
  
  // For rental machines
  rentalProvider: String,
  rentalStartDate: Date,
  rentalEndDate: Date,
  monthlyRent: {
    type: Number,
    min: 0
  },
  
  status: {
    type: String,
    enum: ['Operational', 'Maintenance', 'Broken', 'Idle'],
    default: 'Operational'
  },
  lastMaintenance: Date,
  nextMaintenance: Date,
  maintenanceNotes: String,
  description: String,
  location: String,
  capacity: String,
  powerRequirement: String,
  manufacturer: String,
  installationDate: Date,
  warrantyExpiry: Date,
  
  // Alert tracking fields
  lastAlertSent: {
    type: Date,
    default: null
  },
  wasNeedingMaintenance: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
machineSchema.index({ status: 1 });
machineSchema.index({ nextMaintenance: 1 });
machineSchema.index({ type: 1 });
machineSchema.index({ isRental: 1 });

// Virtuals
machineSchema.virtual('needsMaintenance').get(function() {
  if (!this.nextMaintenance) return false;
  return new Date(this.nextMaintenance) <= new Date();
});

machineSchema.virtual('rentalStatus').get(function() {
  if (!this.isRental) return 'Owned';
  if (!this.rentalEndDate) return 'Active Rental';
  return new Date(this.rentalEndDate) < new Date() ? 'Rental Expired' : 'Active Rental';
});

// Post-save hook for automatic maintenance alerts
machineSchema.post('save', async function(doc) {
  try {
    const needsAlert = 
      doc.status === 'Maintenance' || 
      doc.status === 'Broken' ||
      (doc.nextMaintenance && new Date(doc.nextMaintenance) <= new Date());
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // If needs maintenance NOW
    if (needsAlert) {
      // Check if we should send alert
      const shouldSendAlert = 
        !doc.lastAlertSent || 
        doc.lastAlertSent < oneHourAgo ||
        !doc.wasNeedingMaintenance;
      
      if (shouldSendAlert) {
        setTimeout(async () => {
          try {
            await autoAlertService.triggerImmediateAlerts();
            
            // Update alert tracking
            await mongoose.model('Machine').findByIdAndUpdate(doc._id, {
              lastAlertSent: new Date(),
              wasNeedingMaintenance: true
            });
          } catch (error) {
            console.error('Error triggering alert after machine save:', error);
          }
        }, 2000);
      }
    } 
    // If maintenance is OK now but was previously needed (issue resolved) - RESET the flag
    else if (doc.wasNeedingMaintenance) {
      await mongoose.model('Machine').findByIdAndUpdate(doc._id, {
        wasNeedingMaintenance: false
      });
    }
  } catch (error) {
    console.error('Error in machine post-save hook:', error);
  }
});

// Post-update hook for bulk operations
machineSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    try {
      const needsAlert = 
        doc.status === 'Maintenance' || 
        doc.status === 'Broken' ||
        (doc.nextMaintenance && new Date(doc.nextMaintenance) <= new Date());
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (needsAlert) {
        const shouldSendAlert = 
          !doc.lastAlertSent || 
          doc.lastAlertSent < oneHourAgo ||
          !doc.wasNeedingMaintenance;
        
        if (shouldSendAlert) {
          setTimeout(async () => {
            try {
              await autoAlertService.triggerImmediateAlerts();
              await mongoose.model('Machine').findByIdAndUpdate(doc._id, {
                lastAlertSent: new Date(),
                wasNeedingMaintenance: true
              });
            } catch (error) {
              console.error('Error triggering alert after machine update:', error);
            }
          }, 2000);
        }
      } else if (doc.wasNeedingMaintenance) {
        await mongoose.model('Machine').findByIdAndUpdate(doc._id, {
          wasNeedingMaintenance: false
        });
      }
    } catch (error) {
      console.error('Error in machine post-update hook:', error);
    }
  }
});

export default mongoose.model("Machine", machineSchema);