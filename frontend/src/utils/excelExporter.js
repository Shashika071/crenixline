// utils/excelExporter.js

import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate Excel file and trigger download
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Specific exporters for materials and machines
export const exportMaterialsToExcel = (materials) => {
  const exportData = materials.map(material => ({
    'Material Name': material.name,
    'Type': material.type,
    'SKU': material.sku || 'N/A',
    'Available Quantity': material.availableQty,
    'Unit': material.unit,
    'Reorder Level': material.reorderLevel,
    'Cost per Unit': material.costPerUnit,
    'Total Value': material.availableQty * material.costPerUnit,
    'Supplier': material.supplierId?.name || 'N/A',
    'Location': material.location || 'N/A',
    'Color': material.color || 'N/A',
    'Size': material.size || 'N/A',
    'Status': material.availableQty <= material.reorderLevel ? 'Low Stock' : 'In Stock',
    'Last Restocked': material.lastRestocked ? new Date(material.lastRestocked).toLocaleDateString() : 'Never',
    'Description': material.description || 'N/A'
  }));
  
  exportToExcel(exportData, `materials-export-${new Date().toISOString().split('T')[0]}`, 'Materials');
};

export const exportMachinesToExcel = (machines) => {
  const exportData = machines.map(machine => ({
    'Machine Name': machine.name,
    'Type': machine.type,
    'Model': machine.model || 'N/A',
    'Serial Number': machine.serialNumber || 'N/A',
    'Status': machine.status,
    'Ownership': machine.isRental ? 'Rental' : 'Owned',
    'Rental Provider': machine.isRental ? (machine.rentalProvider || 'N/A') : 'N/A',
    'Monthly Rent': machine.isRental ? (machine.monthlyRent || 0) : 0,
    'Purchase Value': !machine.isRental ? (machine.purchaseValue || 0) : 0,
    'Location': machine.location || 'N/A',
    'Capacity': machine.capacity || 'N/A',
    'Power Requirement': machine.powerRequirement || 'N/A',
    'Manufacturer': machine.manufacturer || 'N/A',
    'Last Maintenance': machine.lastMaintenance ? new Date(machine.lastMaintenance).toLocaleDateString() : 'Never',
    'Next Maintenance': machine.nextMaintenance ? new Date(machine.nextMaintenance).toLocaleDateString() : 'Not Set',
    'Maintenance Due': machine.nextMaintenance && new Date(machine.nextMaintenance) <= new Date() ? 'Yes' : 'No',
    'Description': machine.description || 'N/A'
  }));
  
  exportToExcel(exportData, `machines-export-${new Date().toISOString().split('T')[0]}`, 'Machines');
};

// Export for low stock alerts
export const exportLowStockToExcel = (materials) => {
  const lowStockMaterials = materials.filter(m => m.availableQty <= m.reorderLevel);
  exportMaterialsToExcel(lowStockMaterials, `low-stock-alert-${new Date().toISOString().split('T')[0]}`);
};

// Export for maintenance alerts
export const exportMaintenanceAlertsToExcel = (machines) => {
  const maintenanceMachines = machines.filter(m => 
    m.status === 'Maintenance' || m.status === 'Broken' ||
    (m.nextMaintenance && new Date(m.nextMaintenance) <= new Date())
  );
  exportMachinesToExcel(maintenanceMachines, `maintenance-alert-${new Date().toISOString().split('T')[0]}`);
};