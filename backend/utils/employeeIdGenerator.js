// utils/employeeIdGenerator.js

import Employee from "../models/Employee.js";

export const generateEmployeeId = async (joinDate, name, nic, excludeId = null) => {
  try {
    const joinYear = new Date(joinDate).getFullYear();
    const yearSuffix = joinYear.toString().slice(-2); // Last 2 digits of join year
    
    // Get first 2 letters of name (uppercase)
    const namePrefix = name.substring(0, 2).toUpperCase();
    
    // Get last 4 digits of NIC (skip 'v' if present)
    let nicSuffix = '';
    if (nic && nic.length >= 4) {
      // Remove any non-digit characters and get last 4 digits
      const digitsOnly = nic.replace(/\D/g, '');
      nicSuffix = digitsOnly.slice(-4);
    } else {
      // If NIC is too short, use random 4 digits
      nicSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    }
    
    const baseEmployeeId = `CL/${yearSuffix}/${namePrefix}${nicSuffix}`;
    
    // Check if this employee ID already exists (excluding current employee for updates)
    const query = { employeeId: baseEmployeeId };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingEmployee = await Employee.findOne(query);
    
    if (!existingEmployee) {
      return baseEmployeeId;
    } else {
      // If duplicate exists, add a suffix
      let counter = 1;
      let newEmployeeId = baseEmployeeId;
      
      while (counter <= 10) {
        newEmployeeId = `CL/${yearSuffix}/${namePrefix}${nicSuffix}-${counter}`;
        const existingQuery = { employeeId: newEmployeeId };
        if (excludeId) {
          existingQuery._id = { $ne: excludeId };
        }
        
        const existing = await Employee.findOne(existingQuery);
        
        if (!existing) {
          return newEmployeeId;
        }
        counter++;
      }
      
      // If still duplicate, use timestamp
      const timestamp = Date.now().toString().slice(-4);
      return `CL/${yearSuffix}/${namePrefix}${timestamp}`;
    }
  } catch (error) {
    console.error('Error generating employee ID:', error);
    throw new Error("Failed to generate employee ID");
  }
};