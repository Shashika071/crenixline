// controllers/employeeController.js

import * as XLSX from "xlsx";

import Employee from "../models/Employee.js";
import FactoryClosure from "../models/FactoryClosure.js";

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

    const employeeData = {
      ...req.body,
      workingSchedule: req.body.workingSchedule || defaultSchedule,
      leaveBalances: {
        annual: 0,
        medical: 24, // Medical leaves available from day 1
        probation: 2,
        halfDays: 0
      }
    };

    const employee = new Employee(employeeData);
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
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
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
 // Update the markAttendance function to track leave usage properly
export const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, breakStart, breakEnd, status, notes, isHalfDay = false, isMedical = false } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const attendanceDate = new Date(date);
    const isInProbation = new Date() < employee.probationEndDate;
    const currentYear = attendanceDate.getFullYear();
    
    let leaveHistory = employee.leaveHistory.find(l => l.year === currentYear);
    if (!leaveHistory) {
      leaveHistory = { year: currentYear, takenAnnual: 0, takenMedical: 0, takenProbation: 0, takenHalfDays: 0 };
      employee.leaveHistory.push(leaveHistory);
    }

    // Check if leave is within limits before deducting
    let canTakeLeave = true;
    let leaveMessage = '';

    if (isMedical) {
      if (leaveHistory.takenMedical >= 24) {
        canTakeLeave = false;
        leaveMessage = 'Medical leave limit (24 days) exceeded. This will be unpaid leave.';
      }
    } else if (status === 'Leave' || status === 'Half Day') {
      if (isInProbation) {
        if (leaveHistory.takenProbation >= 2) {
          canTakeLeave = false;
          leaveMessage = 'Probation leave limit (2 days) exceeded. This will be unpaid leave.';
        }
      } else {
        if (leaveHistory.takenAnnual >= 21) {
          canTakeLeave = false;
          leaveMessage = 'Annual leave limit (21 days) exceeded. This will be unpaid leave.';
        }
      }
    }

  if (canTakeLeave) {
  if (status === 'Half Day') {
    leaveHistory.takenHalfDays += 0.5;
    if (isInProbation && !isMedical) {
      leaveHistory.takenProbation += 0.5;
    } else if (!isMedical) {
      leaveHistory.takenAnnual += 0.5;
    }
  } else if (status === 'Leave' && !isMedical) {
    if (isInProbation) {
      leaveHistory.takenProbation += 1;
    } else {
      leaveHistory.takenAnnual += 1;
    }
  } else if (isMedical) {
    leaveHistory.takenMedical += isHalfDay ? 0.5 : 1;
  }
}

// Set the isPaidLeave flag based on canTakeLeave
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
      totalHours: calculatedHours.totalHours,
      overtimeHours: calculatedHours.overtimeHours,
      status: finalStatus,
      notes: leaveMessage ? `${notes} (${leaveMessage})` : notes,
      isHalfDay,
      isMedical,
      isFactoryClosure: isFactoryClosureDay,
      isPaidLeave: canTakeLeave // New field to track if leave is paid
    };

    // Remove existing record for the same date
    employee.attendance = employee.attendance.filter(record => 
      record.date.toDateString() !== attendanceDate.toDateString()
    );

    employee.attendance.push(attendanceRecord);
    await employee.save();

    res.json({ 
      success: true, 
      data: attendanceRecord,
      leaveBalance: {
        annual: isInProbation ? 0 : 21 - leaveHistory.takenAnnual,
        medical: 24 - leaveHistory.takenMedical,
        probation: isInProbation ? 2 - leaveHistory.takenProbation : 0,
        halfDays: isInProbation ? 0 : 2 - leaveHistory.takenHalfDays
      },
      message: leaveMessage || 'Attendance marked successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

function calculateWorkHours(checkIn, checkOut, breakStart, breakEnd, schedule, date) {
  if (!checkIn) return { totalHours: 0, overtimeHours: 0 };

  const checkInTime = new Date(checkIn);
  const checkOutTime = checkOut ? new Date(checkOut) : new Date();
  
  if (checkOutTime < checkInTime) {
    checkOutTime.setDate(checkOutTime.getDate() + 1);
  }

  const dayOfWeek = new Date(date).getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const daySchedule = schedule[dayNames[dayOfWeek]];
  
  if (!daySchedule || !daySchedule.working) {
    return { totalHours: 0, overtimeHours: 0 };
  }

  const totalTimeAtWork = (checkOutTime - checkInTime) / (1000 * 60 * 60);
  
  let breakDuration = 0;
  if (breakStart && breakEnd) {
    const breakStartTime = new Date(breakStart);
    const breakEndTime = new Date(breakEnd);
    breakDuration = (breakEndTime - breakStartTime) / (1000 * 60 * 60);
  }

  const netWorkingHours = Math.max(0, totalTimeAtWork - breakDuration);
  const isSaturday = dayOfWeek === 6;
  const scheduledNetHours = isSaturday ? 5 : 8;
  const overtimeHours = Math.max(0, netWorkingHours - scheduledNetHours);

  return {
    totalHours: parseFloat(netWorkingHours.toFixed(2)),
    overtimeHours: parseFloat(overtimeHours.toFixed(2))
  };
}

function calculateHalfDayHours(checkIn, checkOut, breakStart, breakEnd) {
  if (!checkIn) return { totalHours: 4, overtimeHours: 0 };

  const checkInTime = new Date(checkIn);
  const checkOutTime = checkOut ? new Date(checkOut) : new Date(checkInTime.getTime() + (4 * 60 * 60 * 1000));
  
  let totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
  let breakDuration = 0.5;
  
  if (breakStart && breakEnd) {
    const breakStartTime = new Date(breakStart);
    const breakEndTime = new Date(breakEnd);
    breakDuration = (breakEndTime - breakStartTime) / (1000 * 60 * 60);
  }

  const netHours = Math.max(0, totalHours - breakDuration);
  const overtimeHours = Math.max(0, netHours - 4);

  return {
    totalHours: parseFloat(Math.min(netHours, 4).toFixed(2)),
    overtimeHours: parseFloat(overtimeHours.toFixed(2))
  };
}

export const calculateSalary = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const salaryData = await calculateMonthlySalary(employee, targetMonth, targetYear);
    res.json({ success: true, data: salaryData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

async function calculateMonthlySalary(employee, month, year) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const monthAttendance = employee.attendance.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= startDate && recordDate <= endDate;
  });

  // Pass employee ID to getWorkingDaysInMonth to check for factory closures
  const workingDays = await getWorkingDaysInMonth(month, year, employee.workingSchedule, employee._id);

  let paidDays = 0;
  let unpaidLeaveDays = 0;
  let absentDays = 0;
  let totalOvertimeHours = 0;

  // Track used leaves dynamically
  let monthlyLeavesUsed = 0;
  let monthlyHalfDaysUsed = 0;

  // Get annual leaves
  let annualLeavesUsed = employee.leaveHistory
    .filter(l => l.year === year)
    .reduce((sum, l) => sum + (l.takenAnnual || 0), 0);

  let medicalLeavesUsed = employee.leaveHistory
    .filter(l => l.year === year)
    .reduce((sum, l) => sum + (l.takenMedical || 0), 0);

  monthAttendance.forEach(record => {
    const recordDate = new Date(record.date);
    const dayOfWeek = recordDate.getDay();
    const weekDays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const isWorkingDay = employee.workingSchedule[weekDays[dayOfWeek]]?.working;

    if (!isWorkingDay) return; // Skip non-working days

    const isInProbation = recordDate < employee.probationEndDate;

    // FIRST: Check if the record was marked as unpaid during attendance marking
    if (record.isPaidLeave === false) {
      // This leave was marked as unpaid during attendance marking
      unpaidLeaveDays += record.isHalfDay ? 0.5 : 1;
      totalOvertimeHours += record.overtimeHours || 0;
      return;
    }

    switch (record.status) {
      case 'Present':
      case 'Factory Closure': // Factory closure days are paid
        paidDays += 1;
        break;

      case 'Medical Leave':
        if (medicalLeavesUsed < 24) {
          paidDays += record.isHalfDay ? 0.5 : 1;
          medicalLeavesUsed += record.isHalfDay ? 0.5 : 1;
        } else {
          unpaidLeaveDays += record.isHalfDay ? 0.5 : 1;
        }
        break;

      case 'Leave':
        if (isInProbation) {
          if (monthlyLeavesUsed < 2) {
            paidDays += 1;
            monthlyLeavesUsed += 1;
          } else {
            unpaidLeaveDays += 1;
          }
        } else {
          if (annualLeavesUsed < 21) {
            paidDays += 1;
            annualLeavesUsed += 1;
          } else {
            unpaidLeaveDays += 1;
          }
        }
        break;

      case 'Half Day':
        // Check if it's a medical half day or regular half day
        if (record.isMedical) {
          // Medical half day
          if (medicalLeavesUsed < 24) {
            paidDays += 0.5;
            medicalLeavesUsed += 0.5;
          } else {
            unpaidLeaveDays += 0.5;
          }
        } else {
          // Regular half day
          if (isInProbation) {
            if (monthlyHalfDaysUsed < 2) {
              paidDays += 0.5;
              monthlyHalfDaysUsed += 0.5;
            } else {
              unpaidLeaveDays += 0.5;
            }
          } else {
            if (annualLeavesUsed + 0.5 <= 21) {
              paidDays += 0.5;
              annualLeavesUsed += 0.5;
            } else {
              unpaidLeaveDays += 0.5;
            }
          }
        }
        break;

      case 'Absent':
      case 'No Pay':
        absentDays += 1;
        break;
    }

    totalOvertimeHours += record.overtimeHours || 0;
  });

  const basicSalary = workingDays > 0 ? (paidDays / workingDays) * employee.salary : 0;
  const overtimePay = totalOvertimeHours * employee.overtimeRate;
  const totalSalary = basicSalary + overtimePay;

  return {
    basicSalary: Math.round(basicSalary * 100) / 100,
    totalWorkingDays: workingDays, // This now excludes factory closure days
    paidDays,
    unpaidLeaveDays,
    absentDays,
    totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    totalSalary: Math.round(totalSalary * 100) / 100,
    month: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    isInProbation: new Date() < employee.probationEndDate,
    leaveUsage: {
      annualLeavesUsed,
      annualLeavesRemaining: Math.max(0, 21 - annualLeavesUsed),
      medicalLeavesUsed,
      medicalLeavesRemaining: Math.max(0, 24 - medicalLeavesUsed),
      monthlyLeavesUsed,
      monthlyLeavesRemaining: Math.max(0, 2 - monthlyLeavesUsed),
      monthlyHalfDaysUsed,
      monthlyHalfDaysRemaining: Math.max(0, 2 - monthlyHalfDaysUsed)
    }
  };
}

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
    takenProbation: 0 
  };

  return {
    annualLeavesUsed: leaveHistory.takenAnnual,
    annualLeavesRemaining: Math.max(0, 21 - leaveHistory.takenAnnual),
    medicalLeavesUsed: leaveHistory.takenMedical,
    medicalLeavesRemaining: Math.max(0, 24 - leaveHistory.takenMedical),
    probationLeavesUsed: leaveHistory.takenProbation,
    probationLeavesRemaining: Math.max(0, 2 - leaveHistory.takenProbation)
  };
}
// Update this function in your employeeController.js
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
    
    if (schedule[dayNames[dayOfWeek]].working) {
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
export const getLeaveBalances = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const currentYear = new Date().getFullYear();
    const leaveHistory = employee.leaveHistory.find(l => l.year === currentYear) || {
      takenAnnual: 0, takenMedical: 0, takenProbation: 0, takenHalfDays: 0
    };

    const isInProbation = new Date() < employee.probationEndDate;

    const balances = {
      annual: isInProbation ? 0 : 21 - leaveHistory.takenAnnual,
      medical: 24 - leaveHistory.takenMedical,
      probation: isInProbation ? 2 - leaveHistory.takenProbation : 0,
      halfDays: isInProbation ? 0 : 2 - leaveHistory.takenHalfDays,
      isInProbation: isInProbation
    };

    res.json({ success: true, data: balances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
      probationEndDate: { $gt: new Date() },
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