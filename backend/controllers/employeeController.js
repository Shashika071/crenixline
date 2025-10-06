// controllers/employeeController.js

import Employee from "../models/Employee.js";
import { generateEmployeeId } from "../utils/employeeIdGenerator.js";

export const createEmployee = async (req, res) => {
  try {
    const defaultSchedule = {
      monday: { start: "08:00", end: "17:00", working: true },
      tuesday: { start: "08:00", end: "17:00", working: true },
      wednesday: { start: "08:00", end: "17:00", working: true },
      thursday: { start: "08:00", end: "17:00", working: true },
      friday: { start: "08:00", end: "17:00", working: true },
      saturday: { start: "08:00", end: "14:00", working: true },
      sunday: { start: "08:00", end: "17:00", working: false }  
    };

    const currentYear = new Date().getFullYear();
    
    const joinDate = req.body.joinDate || new Date();
    const name = req.body.name;
    const nic = req.body.nic;
    
    if (!name || !nic) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and NIC are required to generate employee ID' 
      });
    }
    
    const employeeId = await generateEmployeeId(joinDate, name, nic);
    
    let hasEPF = true;
    if (req.body.hasEPF !== undefined) {
      hasEPF = typeof req.body.hasEPF === 'string' 
        ? req.body.hasEPF === 'true' 
        : Boolean(req.body.hasEPF);
    }
    
    let epfNumber = null;
    
    if (hasEPF && req.body.epfNumber && req.body.epfNumber.trim() !== '') {
      epfNumber = req.body.epfNumber.trim();
      
      const existingEmployee = await Employee.findOne({ epfNumber });
      if (existingEmployee) {
        return res.status(400).json({ 
          success: false, 
          message: `EPF number ${epfNumber} is already assigned to another employee` 
        });
      }
    } else if (hasEPF) {
      return res.status(400).json({ 
        success: false, 
        message: 'EPF number is required when hasEPF is true' 
      });
    }

    let bankDetails = req.body.bankDetails;
    let emergencyContact = req.body.emergencyContact;

    if (typeof bankDetails === 'string') {
      try {
        bankDetails = JSON.parse(bankDetails);
      } catch (error) {
        console.error('Error parsing bankDetails:', error);
        bankDetails = {};
      }
    }

    if (typeof emergencyContact === 'string') {
      try {
        emergencyContact = JSON.parse(emergencyContact);
      } catch (error) {
        console.error('Error parsing emergencyContact:', error);
        emergencyContact = {};
      }
    }

    const employeeData = {
      ...req.body,
      employeeId: employeeId,
      profileImage: req.file ? `/uploads/employees/${req.file.filename}` : null,
      hasEPF: hasEPF,
      epfNumber: epfNumber,
      bankDetails: bankDetails,
      emergencyContact: emergencyContact,
      workingSchedule: req.body.workingSchedule || defaultSchedule,
      leaveBalances: {
        annual: 14,
        medical: 7,
        casual: 7,
        maternity: 42
      },
      leaveHistory: [{
        year: currentYear,
        takenAnnual: 0,
        takenMedical: 0,
        takenCasual: 0,
        monthlyLeaves: Array(12).fill(0)
      }],
      sundayWorkSummary: {
        totalDays: 0,
        totalHours: 0,
        lastUpdated: new Date()
      },
      holidayWorkSummary: {
        totalDays: 0,
        totalHours: 0,
        lastUpdated: new Date()
      }
    };

    if (employeeData.salary) {
      employeeData.salary = parseFloat(employeeData.salary);
    }

    if (!employeeData.joinDate) {
      employeeData.joinDate = new Date();
    }
 
    const employee = new Employee(employeeData);
    await employee.save();
    
    res.status(201).json({ 
      success: true, 
      data: employee,
      message: `Employee created successfully with ID: ${employeeId}`
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    
    if (error.code === 11000 && error.keyPattern && error.keyPattern.employeeId) {
      try {
        const joinDate = req.body.joinDate || new Date();
        const name = req.body.name;
        const nic = req.body.nic;
        const employeeId = await generateEmployeeId(joinDate, name, nic + Date.now().toString().slice(-2));
        
        const employeeData = { ...req.body, employeeId };
        const employee = new Employee(employeeData);
        await employee.save();
        
        return res.status(201).json({ 
          success: true, 
          data: employee,
          message: `Employee created successfully with ID: ${employeeId}`
        });
      } catch (retryError) {
        return res.status(400).json({ 
          success: false, 
          message: 'Failed to generate unique employee ID' 
        });
      }
    }
    
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const { status, role, employmentStatus } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (employmentStatus) filter.employmentStatus = employmentStatus;

    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    let employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const { employeeId, ...updateBody } = req.body;

    const nameChanged = updateBody.name && updateBody.name !== employee.name;
    const nicChanged = updateBody.nic && updateBody.nic !== employee.nic;
    
    let newEmployeeId = employee.employeeId;
    
    if (nameChanged || nicChanged) {
      const joinDate = updateBody.joinDate || employee.joinDate;
      const name = updateBody.name || employee.name;
      const nic = updateBody.nic || employee.nic;
      
      newEmployeeId = await generateEmployeeId(joinDate, name, nic, req.params.id);
    }

    let hasEPF = employee.hasEPF;
    if (updateBody.hasEPF !== undefined) {
      hasEPF = typeof updateBody.hasEPF === 'string' 
        ? updateBody.hasEPF === 'true' 
        : Boolean(updateBody.hasEPF);
    }

    let epfNumber = employee.epfNumber;

    if (hasEPF && updateBody.epfNumber !== undefined) {
      if (updateBody.epfNumber && updateBody.epfNumber.trim() !== '') {
        epfNumber = updateBody.epfNumber.trim();
        
        if (epfNumber !== employee.epfNumber) {
          const existingEmployee = await Employee.findOne({ 
            epfNumber: epfNumber,
            _id: { $ne: req.params.id }
          });
          
          if (existingEmployee) {
            return res.status(400).json({ 
              success: false, 
              message: `EPF number ${epfNumber} is already assigned to another employee` 
            });
          }
        }
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'EPF number is required when hasEPF is true' 
        });
      }
    } else if (!hasEPF && updateBody.epfNumber === undefined) {
      epfNumber = employee.epfNumber;
    }

    const updateData = {
      ...updateBody,
      employeeId: newEmployeeId,
      hasEPF: hasEPF,
      epfNumber: epfNumber,
      ...(req.file && { profileImage: `/uploads/employees/${req.file.filename}` })
    };

    employee.set(updateData);

    if (hasEPF && !await employee.isEPFUnique()) {
      return res.status(400).json({ 
        success: false, 
        message: 'EPF number must be unique' 
      });
    }

    await employee.validate();
    await employee.save();

    res.json({ 
      success: true, 
      data: employee,
      message: (nameChanged || nicChanged) ? 
        `Employee updated successfully. New ID: ${newEmployeeId}` : 
        'Employee updated successfully'
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return res.status(400).json({ 
        success: false, 
        message: `${field} '${value}' already exists` 
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: messages.join(', ') 
      });
    }

    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });
    const probationEmployees = await Employee.countDocuments({ 
      employmentStatus: 'Probation'
    });
    const employeesByRole = await Employee.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const sundayWorkStats = await Employee.aggregate([
      { $match: { status: 'Active' } },
      { $unwind: '$attendance' },
      { $match: { 
        'attendance.isSundayWork': true,
        $expr: { 
          $and: [
            { $eq: [{ $year: '$attendance.date' }, currentYear] },
            { $eq: [{ $month: '$attendance.date' }, currentMonth + 1] }
          ]
        }
      }},
      { $group: { 
        _id: '$employeeId',
        name: { $first: '$name' },
        employmentStatus: { $first: '$employmentStatus' },
        sundayWorkDays: { $sum: 1 },
        totalSundayHours: { $sum: '$attendance.totalHours' }
      }}
    ]);

    const holidayWorkStats = await Employee.aggregate([
      { $match: { status: 'Active' } },
      { $unwind: '$attendance' },
      { $match: { 
        'attendance.isHolidayWork': true,
        $expr: { 
          $and: [
            { $eq: [{ $year: '$attendance.date' }, currentYear] },
            { $eq: [{ $month: '$attendance.date' }, currentMonth + 1] }
          ]
        }
      }},
      { $group: { 
        _id: '$employeeId',
        name: { $first: '$name' },
        employmentStatus: { $first: '$employmentStatus' },
        holidayWorkDays: { $sum: 1 },
        totalHolidayHours: { $sum: '$attendance.totalHours' }
      }}
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        probationEmployees,
        confirmedEmployees: totalEmployees - probationEmployees,
        employeesByRole,
        sundayWorkStats: {
          employeesWithSundayWork: sundayWorkStats.length,
          totalSundayWorkDays: sundayWorkStats.reduce((sum, emp) => sum + emp.sundayWorkDays, 0),
          totalSundayWorkHours: sundayWorkStats.reduce((sum, emp) => sum + emp.totalSundayHours, 0),
          details: sundayWorkStats
        },
        holidayWorkStats: {
          employeesWithHolidayWork: holidayWorkStats.length,
          totalHolidayWorkDays: holidayWorkStats.reduce((sum, emp) => sum + emp.holidayWorkDays, 0),
          totalHolidayWorkHours: holidayWorkStats.reduce((sum, emp) => sum + emp.totalHolidayHours, 0),
          details: holidayWorkStats
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProbationEmployees = async (req, res) => {
  try {
    const probationEmployees = await Employee.find({
      employmentStatus: 'Probation',
      status: 'Active'
    }).sort({ probationEndDate: 1 });

    res.json({ success: true, data: probationEmployees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};