import Machine from '../models/Machine.js';
import Material from '../models/Material.js';
import emailService from './emailService.js';

class AutoAlertService {
  constructor() {
    this.checkInterval = 30 * 60 * 1000; // Check every 30 minutes
  }

  async startAutoAlerts() {
    console.log('Starting automatic alert service...');
    
    // Initial check
    await this.checkAlerts();
    
    // Set up periodic checking
    setInterval(() => {
      this.checkAlerts();
    }, this.checkInterval);
  }

  async checkAlerts() {
    try {
      console.log('Checking for alerts...');
      
      // Check low stock alerts
      await this.checkLowStockAlerts();
      
      // Check maintenance alerts
      await this.checkMaintenanceAlerts();
      
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  async checkLowStockAlerts() {
    const lowStockMaterials = await Material.find({
      $expr: { $lte: ['$availableQty', '$reorderLevel'] },
      isActive: true
    });

    if (lowStockMaterials.length === 0) {
      return;
    }

    // Filter materials that need alerts
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const materialsNeedingAlert = lowStockMaterials.filter(material => 
      !material.lastAlertSent || 
      material.lastAlertSent < oneHourAgo ||
      !material.wasLowStock
    );

    if (materialsNeedingAlert.length > 0) {
      console.log(`Sending low stock alert for ${materialsNeedingAlert.length} items`);
      
      const result = await emailService.sendLowStockAlert(materialsNeedingAlert);
      
      if (result.success) {
        // Update lastAlertSent for all alerted materials
        const materialIds = materialsNeedingAlert.map(m => m._id);
        await Material.updateMany(
          { _id: { $in: materialIds } },
          { 
            lastAlertSent: new Date(),
            wasLowStock: true
          }
        );
      }
    }
  }

  async checkMaintenanceAlerts() {
    const needsMaintenanceMachines = await Machine.find({
      $or: [
        { status: 'Maintenance' },
        { status: 'Broken' },
        { nextMaintenance: { $lte: new Date() } }
      ]
    });

    if (needsMaintenanceMachines.length === 0) {
      return;
    }

    // Filter machines that need alerts
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const machinesNeedingAlert = needsMaintenanceMachines.filter(machine => 
      !machine.lastAlertSent || 
      machine.lastAlertSent < oneHourAgo ||
      !machine.wasNeedingMaintenance
    );

    if (machinesNeedingAlert.length > 0) {
      console.log(`Sending maintenance alert for ${machinesNeedingAlert.length} machines`);
      
      const result = await emailService.sendMaintenanceAlert(machinesNeedingAlert);
      
      if (result.success) {
        // Update lastAlertSent for all alerted machines
        const machineIds = machinesNeedingAlert.map(m => m._id);
        await Machine.updateMany(
          { _id: { $in: machineIds } },
          { 
            lastAlertSent: new Date(),
            wasNeedingMaintenance: true
          }
        );
      }
    }
  }

  // Manual trigger for immediate alerts
  async triggerImmediateAlerts() {
    await this.checkAlerts();
  }
}

export default new AutoAlertService();