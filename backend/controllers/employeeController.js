// controllers/employeeController.js

import * as XLSX from "xlsx";

import Employee from "../models/Employee.js";
import EmployeeAllowance from '../models/EmployeeAllowance.js';
import FactoryClosure from "../models/FactoryClosure.js";
import Payslip from '../models/Payslip.js';
import SalaryAdvance from '../models/SalaryAdvance.js';

// controllers/employeeController.js

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
    
    // Handle EPF number properly
    const hasEPF = req.body.hasEPF !== false; // Default to true if not specified
    let epfNumber = null;
    
    if (hasEPF && req.body.epfNumber && req.body.epfNumber.trim() !== '') {
      epfNumber = req.body.epfNumber.trim();
      
      // Check for duplicate EPF number
      const existingEmployee = await Employee.findOne({ epfNumber });
      if (existingEmployee) {
        return res.status(400).json({ 
          success: false, 
          message: `EPF number ${epfNumber} is already assigned to another employee` 
        });
      }
    }

    const employeeData = {
      ...req.body,
      hasEPF: hasEPF,
      epfNumber: epfNumber,
      workingSchedule: req.body.workingSchedule || defaultSchedule,
      leaveBalances: {
        annual: 0,
        medical: 24,
        probation: 2,
        halfDays: 0
      },
      leaveHistory: [{
        year: currentYear,
        takenAnnual: 0,
        takenMedical: 0,
        monthlyLeaves: Array(12).fill(0),
        monthlyHalfDays: Array(12).fill(0)
      }]
    };

    const employee = new Employee(employeeData);
    
    // Validate EPF uniqueness
    if (!await employee.isEPFUnique()) {
      return res.status(400).json({ 
        success: false, 
        message: 'EPF number must be unique' 
      });
    }
    
    await employee.save();
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
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

    // Handle EPF number properly in updates
    const hasEPF = req.body.hasEPF !== false; // Default to true if not specified
    let epfNumber = null;

    if (hasEPF && req.body.epfNumber && req.body.epfNumber.trim() !== '') {
      epfNumber = req.body.epfNumber.trim();
      
      // Check for duplicate EPF number (excluding current employee)
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
    }

    // Prepare update data with proper EPF handling
    const updateData = {
      ...req.body,
      hasEPF: hasEPF,
      epfNumber: epfNumber
    };

    // Use set() to apply changes and trigger middleware
    employee.set(updateData);

    // Validate EPF uniqueness using instance method
    if (!await employee.isEPFUnique()) {
      return res.status(400).json({ 
        success: false, 
        message: 'EPF number must be unique' 
      });
    }

    // Validate the document before saving
    await employee.validate();

    await employee.save();

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('Error updating employee:', error);
    
    // Handle specific MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return res.status(400).json({ 
        success: false, 
        message: `${field} '${value}' already exists` 
      });
    }
    
    // Handle validation errors
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

 export const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, breakStart, breakEnd, status, notes, isHalfDay = false, isMedical = false } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const attendanceDate = new Date(date);
    const isInProbation = employee.employmentStatus === 'Probation';
    const currentYear = attendanceDate.getFullYear();
    const currentMonth = attendanceDate.getMonth();
    
    // Get or create leave history for current year
    let leaveHistory = employee.leaveHistory.find(l => l.year === currentYear);
    if (!leaveHistory) {
      leaveHistory = { 
        year: currentYear, 
        takenAnnual: 0, 
        takenMedical: 0, 
        monthlyLeaves: Array(12).fill(0),
        monthlyHalfDays: Array(12).fill(0)
      };
      employee.leaveHistory.push(leaveHistory);
    }

    // Ensure arrays are properly initialized
    if (!leaveHistory.monthlyLeaves || leaveHistory.monthlyLeaves.length !== 12) {
      leaveHistory.monthlyLeaves = Array(12).fill(0);
    }
    if (!leaveHistory.monthlyHalfDays || leaveHistory.monthlyHalfDays.length !== 12) {
      leaveHistory.monthlyHalfDays = Array(12).fill(0);
    }

    let canTakeLeave = true;
    let leaveMessage = '';
    let leaveType = '';

    // Calculate medical days based on half-day or full day
    const medicalDays = isHalfDay ? 0.5 : 1;

    if (isMedical) {
      // Medical leaves: 24 per year for all employees
      leaveType = 'medical';
      
      // Check if medical leave limit is exceeded
      if (leaveHistory.takenMedical + medicalDays > 24) {
        canTakeLeave = false;
        leaveMessage = `Medical leave limit (24 days per year) exceeded. Only ${24 - leaveHistory.takenMedical} days remaining. This will be unpaid leave.`;
      }
    } else if (status === 'Leave' || status === 'Half Day') {
      if (isInProbation) {
        // Probation: 2 full leaves and 2 half-days per month
        if (status === 'Leave') {
          leaveType = 'probation_full';
          if (leaveHistory.monthlyLeaves[currentMonth] >= 2) {
            canTakeLeave = false;
            leaveMessage = 'Monthly full leave limit (2 days) exceeded for probation. This will be unpaid leave.';
          }
        } else if (status === 'Half Day') {
          leaveType = 'probation_half';
          if (leaveHistory.monthlyHalfDays[currentMonth] >= 2) {
            canTakeLeave = false;
            leaveMessage = 'Monthly half-day limit (2) exceeded for probation. This will be unpaid leave.';
          }
        }
      } else {
        // Confirmed: 21 annual leaves per year and 2 half-days per month
        if (status === 'Leave') {
          leaveType = 'annual_full';
          if (leaveHistory.takenAnnual >= 21) {
            canTakeLeave = false;
            leaveMessage = 'Annual leave limit (21 days per year) exceeded. This will be unpaid leave.';
          }
        } else if (status === 'Half Day') {
          leaveType = 'annual_half';
          if (leaveHistory.monthlyHalfDays[currentMonth] >= 2) {
            canTakeLeave = false;
            leaveMessage = 'Monthly half-day limit (2) exceeded. This will be unpaid leave.';
          }
        }
      }
    }

    // FIX: Properly deduct medical leaves when within limits
    if (canTakeLeave) {
      if (isMedical) {
        // Deduct medical leaves for both full days and half days
        leaveHistory.takenMedical += medicalDays;
        console.log(`Medical leave deducted: ${medicalDays} days. Total used: ${leaveHistory.takenMedical}/24`);
      } else if (status === 'Half Day') {
        // Count half-days as 1 each for limit tracking
        leaveHistory.monthlyHalfDays[currentMonth] += 1;
      } else if (status === 'Leave') {
        if (isInProbation) {
          leaveHistory.monthlyLeaves[currentMonth] += 1;
        } else {
          leaveHistory.takenAnnual += 1;
        }
      }
    }

    const isPaidLeaveFlag = canTakeLeave;

    const factoryClosure = await FactoryClosure.findOne({
      date: { $eq: new Date(date).setHours(0, 0, 0, 0) },
      status: 'Active'
    });

    let finalStatus = status;
    let calculatedHours = { totalHours: 0, overtimeHours: 0 };
    let isFactoryClosureDay = false;

    if (factoryClosure) {
      const isAffected = factoryClosure.isForAllEmployees || 
        factoryClosure.affectedEmployees.includes(employeeId);
      
      if (isAffected) {
        finalStatus = 'Factory Closure';
        isFactoryClosureDay = true;
      }
    } else if (isMedical) {
      finalStatus = 'Medical Leave';
    } else if (status === 'Half Day') {
      calculatedHours = calculateHalfDayHours(checkIn, checkOut, breakStart, breakEnd);
    } else if (status === 'Present' && checkIn) {
      calculatedHours = calculateWorkHours(checkIn, checkOut, breakStart, breakEnd, employee.workingSchedule, date);
    }

    const attendanceRecord = {
      date: attendanceDate,
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      breakStart: breakStart ? new Date(breakStart) : null,
      breakEnd: breakEnd ? new Date(breakEnd) : null,
      totalHours: calculatedHours.totalHours || 0,
      overtimeHours: calculatedHours.overtimeHours || 0,
      status: finalStatus,
      notes: leaveMessage ? `${notes} (${leaveMessage})` : notes,
      isHalfDay: status === 'Half Day',
      isMedical,
      isFactoryClosure: isFactoryClosureDay,
      isPaidLeave: canTakeLeave,
      leaveType: leaveType,
      medicalDaysDeducted: isMedical ? medicalDays : 0 // For debugging
    };

    // Remove existing record for the same date
    employee.attendance = employee.attendance.filter(record => 
      record.date.toDateString() !== attendanceDate.toDateString()
    );

    employee.attendance.push(attendanceRecord);
    
    // FIX: Save the employee to persist the medical leave deduction
    await employee.save();

    // Calculate remaining balances for response
    const remainingMedical = 24 - leaveHistory.takenMedical;
    const remainingAnnual = isInProbation ? 0 : 21 - leaveHistory.takenAnnual;
    const remainingMonthlyLeaves = isInProbation ? Math.max(0, 2 - leaveHistory.monthlyLeaves[currentMonth]) : 0;
    const remainingMonthlyHalfDays = Math.max(0, 2 - leaveHistory.monthlyHalfDays[currentMonth]);

    res.json({ 
      success: true, 
      data: attendanceRecord,
      leaveBalance: {
        annual: remainingAnnual,
        medical: remainingMedical,
        monthlyLeaves: remainingMonthlyLeaves,
        monthlyHalfDays: remainingMonthlyHalfDays,
        // Debug information
        debugInfo: {
          medicalUsed: leaveHistory.takenMedical,
          annualUsed: leaveHistory.takenAnnual,
          monthlyLeavesUsed: leaveHistory.monthlyLeaves[currentMonth],
          monthlyHalfDaysUsed: leaveHistory.monthlyHalfDays[currentMonth],
          medicalDaysDeducted: isMedical ? medicalDays : 0
        }
      },
      message: leaveMessage || `Attendance marked successfully${isMedical ? ` (Medical leave: ${medicalDays} day(s) deducted)` : ''}`,
      employmentStatus: employee.employmentStatus,
      isInProbation
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

async function calculateMonthlySalary(employee, month, year) {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    // Filter attendance records for the specific month
    const monthAttendance = employee.attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Get ACTUAL working days considering factory closures
    const workingDays = await getWorkingDaysInMonth(month, year, employee.workingSchedule, employee._id);

    let paidDays = 0;
    let unpaidLeaveDays = 0;
    let absentDays = 0;
    let totalOvertimeHours = 0;
    let totalWorkedHours = 0;

    const isInProbation = employee.employmentStatus === 'Probation';
    const currentYear = new Date().getFullYear();
    const leaveHistory = employee.leaveHistory.find(l => l.year === currentYear) || {
      takenAnnual: 0, 
      takenMedical: 0, 
      monthlyLeaves: Array(12).fill(0), 
      monthlyHalfDays: Array(12).fill(0)
    };

    // Process each attendance record
    monthAttendance.forEach(record => {
      const recordDate = new Date(record.date);
      const dayOfWeek = recordDate.getDay();
      const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const isWorkingDay = employee.workingSchedule[weekDays[dayOfWeek]]?.working;

      if (!isWorkingDay) return;

      // Calculate paid days based on attendance status
      switch (record.status) {
        case 'Present':
        case 'Factory Closure':
          paidDays += 1;
          totalWorkedHours += record.totalHours || 0;
          totalOvertimeHours += record.overtimeHours || 0;
          break;

        case 'Medical Leave':
          if (record.isPaidLeave) {
            paidDays += 1;
          } else {
            unpaidLeaveDays += 1;
          }
          break;

        case 'Leave':
          if (record.isPaidLeave) {
            paidDays += 1;
          } else {
            unpaidLeaveDays += 1;
          }
          break;

        case 'Half Day':
          if (record.isPaidLeave) {
            paidDays += 1;
            totalWorkedHours += record.totalHours || 4;
            totalOvertimeHours += record.overtimeHours || 0;
          } else {
            unpaidLeaveDays += 0.5;
          }
          break;

        case 'Absent':
        case 'No Pay':
          absentDays += 1;
          break;

        default:
          unpaidLeaveDays += 1;
          break;
      }
    });

    // Calculate basic salary proportionally based on paid days
    const dailyRate = workingDays > 0 ? employee.salary / workingDays : 0;
    const basicSalary = workingDays > 0 ? (paidDays * dailyRate) : 0;

    // Calculate EPF deduction (8% of basic salary)
    const epfDeduction = employee.hasEPF !== false ? basicSalary * 0.08 : 0;

    // FIXED OT CALCULATION: Always based on 30 days (NOT working days)
    const fixedMonthlyHours = 30 * 8; // Always 240 hours (30 days × 8 hours)
    const fixedHourlyRate = employee.salary / fixedMonthlyHours;
    const fixedOvertimeRate = fixedHourlyRate * 1.5; // 1.5x for overtime
    
    const overtimePay = totalOvertimeHours * fixedOvertimeRate;

    // DYNAMIC HOURLY RATE: Based on ACTUAL working days (for basic salary calculation only)
    const dynamicMonthlyHours = workingDays * 8; // Actual working hours in the month
    const dynamicHourlyRate = workingDays > 0 ? employee.salary / dynamicMonthlyHours : 0;

    // Get employee allowances for the month
    const employeeAllowances = await EmployeeAllowance.find({
      employeeId: employee._id,
      isActive: true,
      effectiveDate: { $lte: endDate }
    }).populate('allowanceId');

    // Calculate total allowances
    let totalAllowances = 0;
    const allowancesBreakdown = [];

    employeeAllowances.forEach(ea => {
      let allowanceAmount = 0;
      
      if (ea.allowanceId.type === 'percentage') {
        allowanceAmount = (ea.amount / 100) * basicSalary;
      } else {
        allowanceAmount = ea.amount;
      }
      
      totalAllowances += allowanceAmount;
      allowancesBreakdown.push({
        name: ea.allowanceId.name,
        amount: Math.round(allowanceAmount * 100) / 100,
        type: ea.allowanceId.type
      });
    });

    // Get salary advances for the month
    const salaryAdvances = await SalaryAdvance.find({
      employeeId: employee._id,
      deductionMonth: `${year}-${String(month + 1).padStart(2, '0')}`,
      status: { $in: ['approved', 'deducted'] }
    });

    const totalAdvances = salaryAdvances.reduce((sum, advance) => sum + advance.amount, 0);

    // Calculate net salary
    const totalDeductions = epfDeduction + totalAdvances;
    const grossSalary = basicSalary + totalAllowances + overtimePay;
    const netSalary = grossSalary - totalDeductions;

    return {
      // Basic Information
      basicSalary: Math.round(basicSalary * 100) / 100,
      dailyRate: Math.round(dailyRate * 100) / 100,
      
      // Attendance Summary
      totalWorkingDays: workingDays,
      paidDays: paidDays,
      unpaidLeaveDays: Math.round(unpaidLeaveDays * 100) / 100,
      absentDays: absentDays,
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
      
      // Overtime Calculation (FIXED - based on 30 days)
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      fixedHourlyRate: Math.round(fixedHourlyRate * 100) / 100,
      fixedOvertimeRate: Math.round(fixedOvertimeRate * 100) / 100,
      overtimePay: Math.round(overtimePay * 100) / 100,
      
      // Dynamic Hourly Rate (based on ACTUAL working days)
      dynamicHourlyRate: Math.round(dynamicHourlyRate * 100) / 100,
      dynamicMonthlyHours: dynamicMonthlyHours,
      
      // Allowances
      allowances: allowancesBreakdown,
      totalAllowances: Math.round(totalAllowances * 100) / 100,
      
      // Deductions
      epfDeduction: Math.round(epfDeduction * 100) / 100,
      totalAdvances: Math.round(totalAdvances * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      
      // Final Salary Calculation
      grossSalary: Math.round(grossSalary * 100) / 100,
      netSalary: Math.round(netSalary * 100) / 100,
      
      // Metadata
      month: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      calculationDate: new Date(),
      isInProbation: isInProbation,
      employmentStatus: employee.employmentStatus,
      
      // Leave Information
      leaveUsage: {
        annualLeavesUsed: leaveHistory.takenAnnual,
        annualLeavesRemaining: Math.max(0, 21 - leaveHistory.takenAnnual),
        medicalLeavesUsed: leaveHistory.takenMedical,
        medicalLeavesRemaining: Math.max(0, 24 - leaveHistory.takenMedical),
        monthlyFullLeavesUsed: leaveHistory.monthlyLeaves[month],
        monthlyFullLeavesRemaining: Math.max(0, 2 - leaveHistory.monthlyLeaves[month]),
        monthlyHalfDaysUsed: leaveHistory.monthlyHalfDays[month],
        monthlyHalfDaysRemaining: Math.max(0, 2 - leaveHistory.monthlyHalfDays[month])
      },
      
      // Formula breakdown for transparency
      calculationFormula: {
        basicSalary: `(Paid Days ${paidDays} / Working Days ${workingDays}) × Monthly Salary Rs.${employee.salary}`,
        dailyRate: `Monthly Salary / ${workingDays} working days`,
        dynamicHourlyRate: `Monthly Salary / (${workingDays} days × 8 hours) = Rs.${dynamicHourlyRate.toFixed(2)}/hour`,
        fixedOvertimeRate: `(Monthly Salary / (30 days × 8 hours)) × 1.5 = Rs.${fixedOvertimeRate.toFixed(2)}/hour`,
        overtimePay: `Overtime Hours ${totalOvertimeHours} × Fixed OT Rate Rs.${fixedOvertimeRate.toFixed(2)}`,
        epfDeduction: `8% of Basic Salary`,
        grossSalary: `Basic Salary + Allowances + Overtime Pay`,
        netSalary: `Gross Salary - (EPF + Advances)`
      }
    };
  } catch (error) {
    console.error('Error in calculateMonthlySalary:', error);
    throw error;
  }
}


export const getLeaveBalances = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    let leaveHistory = employee.leaveHistory.find(l => l.year === currentYear);
    
    if (!leaveHistory) {
      leaveHistory = {
        year: currentYear,
        takenAnnual: 0,
        takenMedical: 0,
        monthlyLeaves: Array(12).fill(0),
        monthlyHalfDays: Array(12).fill(0)
      };
      employee.leaveHistory.push(leaveHistory);
      await employee.save();
    }

    // Ensure proper array structure
    if (!leaveHistory.monthlyLeaves || leaveHistory.monthlyLeaves.length !== 12) {
      leaveHistory.monthlyLeaves = Array(12).fill(0);
    }
    
    if (!leaveHistory.monthlyHalfDays || leaveHistory.monthlyHalfDays.length !== 12) {
      leaveHistory.monthlyHalfDays = Array(12).fill(0);
    }

    const isInProbation = employee.employmentStatus === 'Probation';

    // FIX: Return REMAINING balances, not used counts
    const balances = {
      // Medical leaves remaining
      medical: Math.max(0, 24 - leaveHistory.takenMedical),
      
      // Annual leaves remaining (0 for probation)
      annual: isInProbation ? 0 : Math.max(0, 21 - leaveHistory.takenAnnual),
      
      // Monthly full leaves remaining (for probation only)
      monthlyLeaves: isInProbation ? Math.max(0, 2 - leaveHistory.monthlyLeaves[currentMonth]) : 0,
      
      // Monthly half-days remaining (for all employees)
      monthlyHalfDays: Math.max(0, 2 - leaveHistory.monthlyHalfDays[currentMonth]),
      
      isInProbation: isInProbation,
      employmentStatus: employee.employmentStatus
    };

    res.json({ 
      success: true, 
      data: balances,
      // Add debug info
      debug: {
        takenMedical: leaveHistory.takenMedical,
        takenAnnual: leaveHistory.takenAnnual,
        monthlyLeavesUsed: leaveHistory.monthlyLeaves[currentMonth],
        monthlyHalfDaysUsed: leaveHistory.monthlyHalfDays[currentMonth]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
 
function calculateWorkHours(checkIn, checkOut, breakStart, breakEnd, schedule, date) {
  try {
    // Validate inputs
    if (!checkIn) {
      return { totalHours: 0, overtimeHours: 0 };
    }

    const checkInTime = parseTime(checkIn, date);
    if (!checkInTime || isNaN(checkInTime.getTime())) {
      console.error('Invalid check-in time:', checkIn);
      return { totalHours: 0, overtimeHours: 0 };
    }

    // Use current time if checkOut is not provided
    const checkOutTime = checkOut ? parseTime(checkOut, date) : new Date();
    if (!checkOutTime || isNaN(checkOutTime.getTime())) {
      console.error('Invalid check-out time:', checkOut);
      return { totalHours: 0, overtimeHours: 0 };
    }

    // Handle overnight shifts (check-out next day)
    if (checkOutTime < checkInTime) {
      checkOutTime.setDate(checkOutTime.getDate() + 1);
    }

    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const daySchedule = schedule[dayNames[dayOfWeek]];
    
    if (!daySchedule || !daySchedule.working) {
      return { totalHours: 0, overtimeHours: 0 };
    }

    // Calculate total time at work in hours
    const totalMilliseconds = checkOutTime - checkInTime;
    const totalTimeAtWork = totalMilliseconds / (1000 * 60 * 60);
    
    console.log(`Check-in: ${checkInTime}, Check-out: ${checkOutTime}`);
    console.log(`Total time at work: ${totalTimeAtWork} hours`);

    // Calculate break duration
    let breakDuration = 0;
    if (breakStart && breakEnd) {
      const breakStartTime = parseTime(breakStart, date);
      const breakEndTime = parseTime(breakEnd, date);
      
      if (breakStartTime && breakEndTime && !isNaN(breakStartTime.getTime()) && !isNaN(breakEndTime.getTime())) {
        const breakMilliseconds = breakEndTime - breakStartTime;
        breakDuration = breakMilliseconds / (1000 * 60 * 60);
        console.log(`Break duration: ${breakDuration} hours`);
      }
    }

    const netWorkingHours = Math.max(0, totalTimeAtWork - breakDuration);
    
    // Get scheduled hours for the day
    const scheduledStart = parseTime(daySchedule.start, date);
    const scheduledEnd = parseTime(daySchedule.end, date);
    let scheduledHours = 0;
    
    if (scheduledStart && scheduledEnd) {
      if (scheduledEnd < scheduledStart) {
        scheduledEnd.setDate(scheduledEnd.getDate() + 1);
      }
      scheduledHours = (scheduledEnd - scheduledStart) / (1000 * 60 * 60);
      
      // Subtract break time from scheduled hours (assuming 1 hour break for full day)
      const isSaturday = dayOfWeek === 6;
      const standardBreak = isSaturday ? 1 : 1; // 30 min break on Saturday, 1 hour on weekdays
      scheduledHours = Math.max(0, scheduledHours - standardBreak);
    } else {
      // Default scheduled hours if schedule not properly set
      scheduledHours = dayOfWeek === 6 ? 5 : 8; // 5 hours on Saturday, 8 on weekdays
    }

    const overtimeHours = Math.max(0, netWorkingHours - scheduledHours);

    console.log(`Net working hours: ${netWorkingHours}, Scheduled: ${scheduledHours}, Overtime: ${overtimeHours}`);

    return {
      totalHours: parseFloat(netWorkingHours.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2))
    };
  } catch (error) {
    console.error('Error in calculateWorkHours:', error);
    return { totalHours: 0, overtimeHours: 0 };
  }
} 

 function calculateHalfDayHours(checkIn, checkOut, breakStart, breakEnd) {
  try {
    if (!checkIn) return { totalHours: 4, overtimeHours: 0 };

    const checkInTime = new Date(checkIn);
    if (isNaN(checkInTime.getTime())) {
      return { totalHours: 4, overtimeHours: 0 };
    }

    const checkOutTime = checkOut ? new Date(checkOut) : new Date(checkInTime.getTime() + (4 * 60 * 60 * 1000));
    
    if (isNaN(checkOutTime.getTime())) {
      return { totalHours: 4, overtimeHours: 0 };
    }
    
    // Handle overnight scenario
    if (checkOutTime < checkInTime) {
      checkOutTime.setDate(checkOutTime.getDate() + 1);
    }

    let totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    let breakDuration = 0;
    
    if (breakStart && breakEnd) {
      const breakStartTime = new Date(breakStart);
      const breakEndTime = new Date(breakEnd);
      
      if (!isNaN(breakStartTime.getTime()) && !isNaN(breakEndTime.getTime())) {
        if (breakEndTime < breakStartTime) {
          breakEndTime.setDate(breakEndTime.getDate() + 1);
        }
        breakDuration = (breakEndTime - breakStartTime) / (1000 * 60 * 60);
      }
    }

    const netHours = Math.max(0, totalHours - breakDuration);
    const overtimeHours = Math.max(0, netHours - 4);

    return {
      totalHours: parseFloat(Math.min(netHours, 4).toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2))
    };
  } catch (error) {
    console.error('Error in calculateHalfDayHours:', error);
    return { totalHours: 4, overtimeHours: 0 };
  }
}

export const calculateSalary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const employee = await Employee.findById(employeeId).populate('bankDetails');
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const salaryData = await calculateMonthlySalary(employee, targetMonth, targetYear);
    
    res.json({ 
      success: true, 
      data: salaryData,
      employeeInfo: {
        name: employee.name,
        role: employee.role,
        employeeId: employee._id,
        bankDetails: employee.bankDetails
      }
    });
  } catch (error) {
    console.error('Error calculating salary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
 
async function getLeaveUsageForMonth(employee, month, year) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  const monthLeaves = employee.attendance.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= startDate && recordDate <= endDate && 
           (record.status === 'Leave' || record.status === 'Medical Leave' || record.status === 'Half Day');
  });

  const currentYear = new Date().getFullYear();
  const leaveHistory = employee.leaveHistory.find(l => l.year === currentYear) || { 
    takenAnnual: 0, 
    takenMedical: 0, 
    monthlyLeaves: Array(12).fill(0),
    monthlyHalfDays: Array(12).fill(0)
  };

  return {
    annualLeavesUsed: leaveHistory.takenAnnual,
    annualLeavesRemaining: Math.max(0, 21 - leaveHistory.takenAnnual),
    medicalLeavesUsed: leaveHistory.takenMedical,
    medicalLeavesRemaining: Math.max(0, 24 - leaveHistory.takenMedical),
    monthlyFullLeavesUsed: leaveHistory.monthlyLeaves[month],
    monthlyFullLeavesRemaining: Math.max(0, 2 - leaveHistory.monthlyLeaves[month]),
    monthlyHalfDaysUsed: leaveHistory.monthlyHalfDays[month],
    monthlyHalfDaysRemaining: Math.max(0, 2 - leaveHistory.monthlyHalfDays[month]),
    leavesThisMonth: monthLeaves.length
  };
}
 
async function getWorkingDaysInMonth(month, year, schedule, employeeId = null) {
  let workingDays = 0;
  const date = new Date(year, month, 1);
  
  // Get all factory closures for this month
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  
  const factoryClosures = await FactoryClosure.find({
    date: { 
      $gte: startOfMonth, 
      $lte: endOfMonth 
    },
    status: 'Active'
  });

  while (date.getMonth() === month) {
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    if (schedule[dayNames[dayOfWeek]]?.working) {
      // Check if this day is a factory closure
      const isFactoryClosure = factoryClosures.some(closure => {
        const closureDate = new Date(closure.date);
        const isSameDate = closureDate.toDateString() === date.toDateString();
        
        if (!isSameDate) return false;
        
        // Check if this closure affects the specific employee or all employees
        return closure.isForAllEmployees || 
               (employeeId && closure.affectedEmployees.includes(employeeId));
      });
      
      // Only count as working day if it's NOT a factory closure
      if (!isFactoryClosure) {
        workingDays++;
      }
    }
    date.setDate(date.getDate() + 1);
  }
  
  return workingDays;
}
 
export const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });
    const probationEmployees = await Employee.countDocuments({ 
      probationEndDate: { $gt: new Date() } 
    });
    const employeesByRole = await Employee.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        probationEmployees,
        confirmedEmployees: totalEmployees - probationEmployees,
        employeesByRole
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    
    let query = {};
    if (employeeId) query._id = employeeId;

    const employees = await Employee.find(query);
    
    let attendanceData = [];
    employees.forEach(employee => {
      employee.attendance.forEach(record => {
        const recordDate = new Date(record.date);
        const shouldInclude = (!startDate || recordDate >= new Date(startDate)) &&
                            (!endDate || recordDate <= new Date(endDate));
        
        if (shouldInclude) {
          attendanceData.push({
            employeeId: employee._id,
            employeeName: employee.name,
            employeeRole: employee.role,
            ...record.toObject()
          });
        }
      });
    });

    attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, data: attendanceData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate, format = 'excel' } = req.query;
    
    const attendanceData = await getAttendanceData(startDate, endDate);
    
    if (format === 'excel') {
      const data = attendanceData.map(record => ({
        'Employee Name': record.employeeName,
        'Role': record.employeeRole,
        'Date': new Date(record.date).toLocaleDateString('en-CA'),
        'Check In': record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A',
        'Check Out': record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A',
        'Status': record.status,
        'Total Hours': record.totalHours || 0,
        'Overtime Hours': record.overtimeHours || 0,
        'Half Day': record.isHalfDay ? 'Yes' : 'No',
        'Medical Leave': record.isMedical ? 'Yes' : 'No',
        'Notes': record.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_${startDate || 'all'}_to_${endDate || 'all'}.xlsx`);
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.send(buffer);
    } else {
      res.json({ success: true, data: attendanceData });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Keep this function for other parts of your code, but make it robust:
function parseTime(timeStr, baseDate = new Date()) {
  if (!timeStr) return null;
  try {
    // If it's already a Date object, return it
    if (timeStr instanceof Date) return timeStr;
    
    // If it's an ISO string
    if (typeof timeStr === 'string' && timeStr.includes('T')) {
      const date = new Date(timeStr);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // If it's a time string like "08:00" or "08:00:00"
    if (typeof timeStr === 'string' && timeStr.includes(':')) {
      const timeParts = timeStr.split(':');
      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      const seconds = timeParts[2] ? parseInt(timeParts[2]) : 0;
      
      const date = new Date(baseDate);
      date.setHours(hours, minutes, seconds, 0);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing time:', error, timeStr);
    return null;
  }
}
export const exportSalaryReport = async (req, res) => {
  try {
    const { month, year, format = 'excel' } = req.query;
    
    const employees = await Employee.find({ status: 'Active' });
    const salaryReports = [];
    
    for (const employee of employees) {
      const salaryData = await calculateMonthlySalary(
        employee, 
        month ? parseInt(month) - 1 : new Date().getMonth(),
        year ? parseInt(year) : new Date().getFullYear()
      );
      
      salaryReports.push({
        employeeName: employee.name,
        employeeRole: employee.role,
        employmentStatus: new Date() < employee.probationEndDate ? 'Probation' : 'Confirmed',
        basicSalary: employee.salary,
        ...salaryData
      });
    }

    if (format === 'excel') {
      const data = salaryReports.map(report => ({
        'Employee Name': report.employeeName,
        'Role': report.employeeRole,
        'Employment Status': report.employmentStatus,
        'Basic Salary': report.basicSalary,
        'Total Working Days': report.totalWorkingDays,
        'Paid Days': report.paidDays,
        'Absent Days': report.absentDays,
        'Total Overtime Hours': report.totalOvertimeHours,
        'Overtime Pay': report.overtimePay,
        'Total Salary': report.totalSalary,
        'Month': report.month
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Salary Report");
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=salary_report_${month || 'all'}_${year || 'all'}.xlsx`);
      
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.send(buffer);
    } else {
      res.json({ success: true, data: salaryReports });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFactoryClosure = async (req, res) => {
  try {
    const closure = new FactoryClosure(req.body);
    await closure.save();
    res.status(201).json({ success: true, data: closure });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getFactoryClosures = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };

    const closures = await FactoryClosure.find(filter).populate('affectedEmployees', 'name role');
    res.json({ success: true, data: closures });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProbationEmployees = async (req, res) => {
  try {
    const probationEmployees = await Employee.find({
      employmentStatus: 'Probation', // Updated to use employmentStatus
      status: 'Active'
    }).sort({ probationEndDate: 1 });

    res.json({ success: true, data: probationEmployees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const applyMedicalLeave = async (req, res) => {
  try {
    const { employeeId, startDate, endDate, reason, notes } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Medical leaves are allowed during probation
    const currentYear = new Date().getFullYear();
    let leaveHistory = employee.leaveHistory.find(l => l.year === currentYear);
    
    if (!leaveHistory) {
      leaveHistory = { year: currentYear, takenAnnual: 0, takenMedical: 0, takenProbation: 0, takenHalfDays: 0 };
      employee.leaveHistory.push(leaveHistory);
    }

    const remainingMedical = 24 - leaveHistory.takenMedical;
    
    if (days > remainingMedical) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${remainingMedical} medical leaves remaining. Requested ${days} days.` 
      });
    }

    const medicalLeave = {
      startDate: start,
      endDate: end,
      reason,
      days,
      notes,
      status: 'Pending',
      appliedDate: new Date()
    };

    employee.medicalLeaves.push(medicalLeave);
    await employee.save();

    res.json({ 
      success: true, 
      message: 'Medical leave application submitted for approval',
      data: medicalLeave 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMedicalLeaveStatus = async (req, res) => {
  try {
    const { employeeId, leaveId, status, adminNotes } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const medicalLeave = employee.medicalLeaves.id(leaveId);
    if (!medicalLeave) {
      return res.status(404).json({ success: false, message: "Medical leave not found" });
    }

    medicalLeave.status = status;
    medicalLeave.adminNotes = adminNotes;
    medicalLeave.processedDate = new Date();

    if (status === 'Approved') {
      const currentYear = new Date().getFullYear();
      let leaveHistory = employee.leaveHistory.find(l => l.year === currentYear);
      
      if (!leaveHistory) {
        leaveHistory = { year: currentYear, takenAnnual: 0, takenMedical: 0, takenProbation: 0, takenHalfDays: 0 };
        employee.leaveHistory.push(leaveHistory);
      }

      leaveHistory.takenMedical += medicalLeave.days;
    }

    await employee.save();

    res.json({ 
      success: true, 
      message: `Medical leave ${status.toLowerCase()}`,
      data: medicalLeave 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

async function getAttendanceData(startDate, endDate) {
  const query = {};
  const employees = await Employee.find(query);
  
  let attendanceData = [];
  
  employees.forEach(employee => {
    employee.attendance.forEach(record => {
      const recordDate = new Date(record.date);
      const shouldInclude = (!startDate || recordDate >= new Date(startDate)) &&
                          (!endDate || recordDate <= new Date(endDate));
      
      if (shouldInclude) {
        attendanceData.push({
          employeeId: employee._id,
          employeeName: employee.name,
          employeeRole: employee.role,
          ...record.toObject()
        });
      }
    });
  });

  attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date));

  return attendanceData;
}
// Add this to your employeeController.js
export const markBulkAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;
    
    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ 
        success: false, 
        message: "Attendance records array is required" 
      });
    }

    const results = [];
    
    for (const record of attendanceRecords) {
      try {
        const { employeeId, date, checkIn, checkOut, breakStart, breakEnd, status, notes, isHalfDay = false, isMedical = false } = record;
        
        const employee = await Employee.findById(employeeId);
        if (!employee) {
          results.push({
            employeeId,
            success: false,
            message: "Employee not found"
          });
          continue;
        }
 

        const attendanceDate = new Date(date);
        const isInProbation = employee.employmentStatus === 'Probation';
        const currentYear = attendanceDate.getFullYear();
        const currentMonth = attendanceDate.getMonth();
        
        // Get or create leave history
        let leaveHistory = employee.leaveHistory.find(l => l.year === currentYear);
        if (!leaveHistory) {
          leaveHistory = { 
            year: currentYear, 
            takenAnnual: 0, 
            takenMedical: 0, 
            monthlyLeaves: Array(12).fill(0),
            monthlyHalfDays: Array(12).fill(0)
          };
          employee.leaveHistory.push(leaveHistory);
        }

        // Ensure arrays are properly initialized
        if (!leaveHistory.monthlyLeaves || leaveHistory.monthlyLeaves.length !== 12) {
          leaveHistory.monthlyLeaves = Array(12).fill(0);
        }
        if (!leaveHistory.monthlyHalfDays || leaveHistory.monthlyHalfDays.length !== 12) {
          leaveHistory.monthlyHalfDays = Array(12).fill(0);
        }

        let canTakeLeave = true;
        let leaveMessage = '';
        let leaveType = '';

        const medicalDays = isHalfDay ? 0.5 : 1;

        if (isMedical) {
          leaveType = 'medical';
          if (leaveHistory.takenMedical + medicalDays > 24) {
            canTakeLeave = false;
            leaveMessage = `Medical leave limit exceeded. Only ${24 - leaveHistory.takenMedical} days remaining.`;
          }
        } else if (status === 'Leave' || status === 'Half Day') {
          if (isInProbation) {
            if (status === 'Leave') {
              leaveType = 'probation_full';
              if (leaveHistory.monthlyLeaves[currentMonth] >= 2) {
                canTakeLeave = false;
                leaveMessage = 'Monthly full leave limit exceeded for probation.';
              }
            } else if (status === 'Half Day') {
              leaveType = 'probation_half';
              if (leaveHistory.monthlyHalfDays[currentMonth] >= 2) {
                canTakeLeave = false;
                leaveMessage = 'Monthly half-day limit exceeded for probation.';
              }
            }
          } else {
            if (status === 'Leave') {
              leaveType = 'annual_full';
              if (leaveHistory.takenAnnual >= 21) {
                canTakeLeave = false;
                leaveMessage = 'Annual leave limit exceeded.';
              }
            } else if (status === 'Half Day') {
              leaveType = 'annual_half';
              if (leaveHistory.monthlyHalfDays[currentMonth] >= 2) {
                canTakeLeave = false;
                leaveMessage = 'Monthly half-day limit exceeded.';
              }
            }
          }
        }

        // Update leave balances
        if (canTakeLeave) {
          if (isMedical) {
            leaveHistory.takenMedical += medicalDays;
          } else if (status === 'Half Day') {
            leaveHistory.monthlyHalfDays[currentMonth] += 1;
          } else if (status === 'Leave') {
            if (isInProbation) {
              leaveHistory.monthlyLeaves[currentMonth] += 1;
            } else {
              leaveHistory.takenAnnual += 1;
            }
          }
        }

        const isPaidLeaveFlag = canTakeLeave;

        // Check for factory closures
        const factoryClosure = await FactoryClosure.findOne({
          date: { $eq: new Date(date).setHours(0, 0, 0, 0) },
          status: 'Active'
        });

        let finalStatus = status;
        let calculatedHours = { totalHours: 0, overtimeHours: 0 };
        let isFactoryClosureDay = false;

        if (factoryClosure) {
          const isAffected = factoryClosure.isForAllEmployees || 
            factoryClosure.affectedEmployees.includes(employeeId);
          
          if (isAffected) {
            finalStatus = 'Factory Closure';
            isFactoryClosureDay = true;
          }
        } else if (isMedical) {
          finalStatus = 'Medical Leave';
        } else if (status === 'Half Day') {
          calculatedHours = calculateHalfDayHours(checkIn, checkOut, breakStart, breakEnd);
        } else if (status === 'Present' && checkIn) {
          // FIX: Ensure break times are properly passed
          calculatedHours = calculateWorkHours(
            checkIn, 
            checkOut, 
            breakStart || '12:00', // Default break start if not provided
            breakEnd || '13:00',   // Default break end if not provided
            employee.workingSchedule, 
            date
          );
   
        }

        const attendanceRecord = {
          date: attendanceDate,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          breakStart: breakStart ? new Date(breakStart) : null,
          breakEnd: breakEnd ? new Date(breakEnd) : null,
          totalHours: calculatedHours.totalHours || 0,
          overtimeHours: calculatedHours.overtimeHours || 0,
          status: finalStatus,
          notes: leaveMessage ? `${notes} (${leaveMessage})` : notes,
          isHalfDay: status === 'Half Day',
          isMedical,
          isFactoryClosure: isFactoryClosureDay,
          isPaidLeave: canTakeLeave,
          leaveType: leaveType
        };

        // Remove existing record for the same date
        employee.attendance = employee.attendance.filter(attRecord => 
          attRecord.date.toDateString() !== attendanceDate.toDateString()
        );

        employee.attendance.push(attendanceRecord);
        await employee.save();

        results.push({
          employeeId,
          success: true,
          data: attendanceRecord,
          employeeName: employee.name,
          calculatedHours: calculatedHours,
          message: `Attendance marked successfully for ${employee.name} - Total: ${calculatedHours.totalHours}h, Overtime: ${calculatedHours.overtimeHours}h`
        });

      } catch (error) {
        results.push({
          employeeId: record.employeeId,
          success: false,
          message: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: results,
      summary: {
        total: attendanceRecords.length,
        successful,
        failed
      },
      message: `Bulk attendance completed. Successful: ${successful}, Failed: ${failed}`
    });

  } catch (error) {
    console.error('Error in bulk attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
const calculateSalaryForPayslip = async (employee, month, year) => {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    // Filter attendance records for the specific month
    const monthAttendance = employee.attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Get ACTUAL working days considering factory closures
    const workingDays = await getWorkingDaysInMonth(month, year, employee.workingSchedule, employee._id);

    let paidDays = 0;
    let unpaidLeaveDays = 0;
    let absentDays = 0;
    let totalOvertimeHours = 0;
    let totalWorkedHours = 0;

    const isInProbation = employee.employmentStatus === 'Probation';

    // Process each attendance record
    monthAttendance.forEach(record => {
      const recordDate = new Date(record.date);
      const dayOfWeek = recordDate.getDay();
      const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const isWorkingDay = employee.workingSchedule[weekDays[dayOfWeek]]?.working;

      if (!isWorkingDay) return;

      // Calculate paid days based on attendance status
      switch (record.status) {
        case 'Present':
        case 'Factory Closure':
          paidDays += 1;
          totalWorkedHours += record.totalHours || 0;
          totalOvertimeHours += record.overtimeHours || 0;
          break;

        case 'Medical Leave':
          if (record.isPaidLeave) {
            paidDays += 1;
          } else {
            unpaidLeaveDays += 1;
          }
          break;

        case 'Leave':
          if (record.isPaidLeave) {
            paidDays += 1;
          } else {
            unpaidLeaveDays += 1;
          }
          break;

        case 'Half Day':
          if (record.isPaidLeave) {
            paidDays += 1;
            totalWorkedHours += record.totalHours || 4;
            totalOvertimeHours += record.overtimeHours || 0;
          } else {
            unpaidLeaveDays += 0.5;
          }
          break;

        case 'Absent':
        case 'No Pay':
          absentDays += 1;
          break;

        default:
          unpaidLeaveDays += 1;
          break;
      }
    });

    // Calculate basic salary proportionally based on paid days
    const dailyRate = workingDays > 0 ? employee.salary / workingDays : 0;
    const basicSalary = workingDays > 0 ? (paidDays * dailyRate) : 0;
    const basicSalary2 = employee.salary;
    // FIXED OT CALCULATION: Always based on 30 days (NOT working days)
    const fixedMonthlyHours = 30 * 8; // Always 240 hours (30 days × 8 hours)
    const fixedHourlyRate = employee.salary / fixedMonthlyHours;
    const fixedOvertimeRate = fixedHourlyRate * 1.5; // 1.5x for overtime
    
    const overtimePay = totalOvertimeHours * fixedOvertimeRate;

    // DYNAMIC HOURLY RATE: Based on ACTUAL working days (for basic salary calculation only)
    const dynamicMonthlyHours = workingDays * 8; // Actual working hours in the month
    const dynamicHourlyRate = workingDays > 0 ? employee.salary / dynamicMonthlyHours : 0;

    return {
      basicSalary2: Math.round(basicSalary2 * 100) / 100,
      basicSalary: Math.round(basicSalary * 100) / 100,
      paidDays,
      unpaidLeaveDays: Math.round(unpaidLeaveDays * 100) / 100,
      absentDays,
      totalWorkingDays: workingDays,
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      
      // OVERTIME CALCULATION
      fixedHourlyRate: Math.round(fixedHourlyRate * 100) / 100,
      fixedOvertimeRate: Math.round(fixedOvertimeRate * 100) / 100,
      overtimePay: Math.round(overtimePay * 100) / 100,
      
      // Dynamic hourly rate for reference
      dynamicHourlyRate: Math.round(dynamicHourlyRate * 100) / 100,
      dynamicMonthlyHours: dynamicMonthlyHours,
      
      isInProbation,
      employmentStatus: employee.employmentStatus
    };
  } catch (error) {
    console.error('Error in calculateSalaryForPayslip:', error);
    throw error;
  }
};

export const calculatePayslip = async (req, res) => {
  try {
    const { employeeId, month, additionalDeductions = [] } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Use the updated function with OT calculation
    const salaryData = await calculateSalaryForPayslip(
      employee,
      new Date(month + '-01').getMonth(),
      new Date(month + '-01').getFullYear()
    );

    // Get employee allowances
    const employeeAllowances = await EmployeeAllowance.find({
      employeeId,
      isActive: true
    }).populate('allowanceId');

    const allowances = employeeAllowances.map(ea => ({
      name: ea.allowanceId.name,
      amount: ea.amount
    }));

    const totalAllowances = allowances.reduce((sum, allowance) => sum + allowance.amount, 0);

    // Calculate EPF (8% of basic salary)
    const epfDeduction = employee.hasEPF ? salaryData.basicSalary2 * 0.08 : 0;

    // Get salary advances for this month
    const salaryAdvances = await SalaryAdvance.find({
      employeeId,
      deductionMonth: month,
      status: 'approved'
    });

    const advances = salaryAdvances.map(advance => ({
      advanceId: advance._id,
      amount: advance.amount
    }));

    const totalAdvances = advances.reduce((sum, advance) => sum + advance.amount, 0);

    // Calculate total deductions
    const totalDeductions = epfDeduction + totalAdvances + 
      additionalDeductions.reduce((sum, ded) => sum + ded.amount, 0);

    // Calculate net salary (INCLUDES OVERTIME PAY)
    const netSalary = salaryData.basicSalary + totalAllowances + salaryData.overtimePay - totalDeductions;

    const payslipData = {
      employeeId,
      month,
      basicSalary: salaryData.basicSalary,
      epfDeduction,
      allowances,
      totalAllowances,
      overtimeHours: salaryData.totalOvertimeHours,
      overtimePay: salaryData.overtimePay,
      deductions: additionalDeductions,
      totalDeductions,
      salaryAdvances: advances,
      totalAdvances,
      netSalary,
      status: 'draft',
      
      // Additional info for transparency
      calculationInfo: {
        workingDays: salaryData.totalWorkingDays,
        paidDays: salaryData.paidDays,
        fixedOvertimeRate: salaryData.fixedOvertimeRate,
        dynamicHourlyRate: salaryData.dynamicHourlyRate
      }
    };

    // Check if payslip already exists
    let payslip = await Payslip.findOne({ employeeId, month });
    
    if (payslip) {
      payslip = await Payslip.findByIdAndUpdate(payslip._id, payslipData, { new: true });
    } else {
      payslip = new Payslip(payslipData);
      await payslip.save();
    }

    await payslip.populate('employeeId', 'name role nic bankDetails');
    await payslip.populate('salaryAdvances.advanceId');

    res.json({ 
      success: true, 
      data: payslip,
      calculationDetails: {
        workingDays: salaryData.totalWorkingDays,
        paidDays: salaryData.paidDays,
        overtimeHours: salaryData.totalOvertimeHours,
        overtimeRate: salaryData.fixedOvertimeRate,
        overtimePay: salaryData.overtimePay
      }
    });
  } catch (error) {
    console.error('Error calculating payslip:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const finalizePayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalizedBy } = req.body;

    const payslip = await Payslip.findByIdAndUpdate(
      id,
      {
        status: 'finalized',
        finalizedBy,
        finalizedDate: new Date()
      },
      { new: true }
    )
    .populate('employeeId', 'name role nic bankDetails')
    .populate('salaryAdvances.advanceId');

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    // Update salary advances status to deducted
    await SalaryAdvance.updateMany(
      {
        _id: { $in: payslip.salaryAdvances.map(sa => sa.advanceId) },
        status: 'approved'
      },
      { status: 'deducted' }
    );

    res.json({ success: true, data: payslip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPayslips = async (req, res) => {
  try {
    const { month, employeeId, status } = req.query;
    const filter = {};
    
    if (month) filter.month = month;
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;

    const payslips = await Payslip.find(filter)
      .populate('employeeId', 'name role nic bankDetails')
      .populate('finalizedBy', 'name')
      .sort({ month: -1, createdAt: -1 });

    res.json({ success: true, data: payslips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPayslipById = async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id)
      .populate('employeeId', 'name role nic bankDetails')
      .populate('finalizedBy', 'name')
      .populate('salaryAdvances.advanceId');

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    res.json({ success: true, data: payslip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const payslip = await Payslip.findByIdAndUpdate(
      id,
      {
        status: 'paid',
        paidDate: new Date()
      },
      { new: true }
    );

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    res.json({ success: true, data: payslip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const deletePayslip = async (req, res) => {
  try {
    const { id } = req.params;

    const payslip = await Payslip.findById(id);
    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    // Only allow deletion of draft payslips
    if (payslip.status !== 'draft') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only draft payslips can be deleted' 
      });
    }

    // Revert salary advances status back to approved
    await SalaryAdvance.updateMany(
      {
        _id: { $in: payslip.salaryAdvances.map(sa => sa.advanceId) },
        status: 'deducted'
      },
      { status: 'approved' }
    );

    await Payslip.findByIdAndDelete(id);

    res.json({ success: true, message: 'Payslip deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};