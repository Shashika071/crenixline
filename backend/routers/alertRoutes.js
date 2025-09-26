// routers/alertRoutes.js

import Machine from '../models/Machine.js';
import Material from '../models/Material.js';
import emailService from '../services/emailService.js';
import express from 'express';

const router = express.Router();

// Send low stock alert
router.post('/low-stock', async (req, res) => {
  try {
    const lowStockMaterials = await Material.find({
      $expr: { $lte: ['$availableQty', '$reorderLevel'] }
    });

    if (lowStockMaterials.length === 0) {
      return res.json({
        success: true,
        message: 'No low stock items found',
        sent: false
      });
    }

    const result = await emailService.sendLowStockAlert(lowStockMaterials);
    
    res.json({
      success: result.success,
      message: result.success ? 'Low stock alert sent successfully' : 'Failed to send alert',
      itemsCount: lowStockMaterials.length,
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending low stock alert',
      error: error.message
    });
  }
});

// Send maintenance alert
router.post('/maintenance', async (req, res) => {
  try {
    const needsMaintenanceMachines = await Machine.find({
      $or: [
        { status: 'Maintenance' },
        { status: 'Broken' },
        { nextMaintenance: { $lte: new Date() } }
      ]
    });

    if (needsMaintenanceMachines.length === 0) {
      return res.json({
        success: true,
        message: 'No maintenance alerts found',
        sent: false
      });
    }

    const result = await emailService.sendMaintenanceAlert(needsMaintenanceMachines);
    
    res.json({
      success: result.success,
      message: result.success ? 'Maintenance alert sent successfully' : 'Failed to send alert',
      itemsCount: needsMaintenanceMachines.length,
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending maintenance alert',
      error: error.message
    });
  }
});

// Send custom alert
router.post('/custom', async (req, res) => {
  try {
    const { to, subject, message, type } = req.body;
    
    const result = await emailService.sendEmail({
      to: to || process.env.ALERT_EMAIL,
      subject: subject || 'Inventory Management Alert',
      html: message || 'Custom alert from inventory management system'
    });

    res.json({
      success: result.success,
      message: result.success ? 'Custom alert sent successfully' : 'Failed to send alert',
      messageId: result.messageId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending custom alert',
      error: error.message
    });
  }
});

export default router;