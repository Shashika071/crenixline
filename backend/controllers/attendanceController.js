// controllers/attendanceController.js

import * as XLSX from "xlsx";

import Employee from "../models/Employee.js";
import FactoryClosure from "../models/FactoryClosure.js";

// controllers/attendanceController.js

// controllers/attendanceController.js

export const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, breakStart, breakEnd, status, notes, isHalfDay = false, isMedical = false, isCasual = false } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const attendanceDate = new Date(date);
    const currentYear = attendanceDate.getFullYear();
    const currentMonth = attendanceDate.getMonth();
    const dayOfWeek = attendanceDate.getDay();
    const isSunday = dayOfWeek === 0;
    
    let leaveHistory = employee.leaveHistory.find(l => l.year === currentYear);
    if (!leaveHistory) {
      leaveHistory = { 
        year: currentYear, 
        takenAnnual: 0, 
        takenMedical: 0,
        takenCasual: 0,
        monthlyLeaves: Array(12).fill(0)
      };
      employee.leaveHistory.push(leaveHistory);
    }

    if (!leaveHistory.annualEntitlement) {
      const joinDate = new Date(employee.joinDate);
      const joinYear = joinDate.getFullYear();
      const joinMonth = joinDate.getMonth();
      
      if (joinYear === currentYear) {
        if (joinMonth <= 2) {
          leaveHistory.annualEntitlement = 14;
        } else if (joinMonth <= 5) {
          leaveHistory.annualEntitlement = 10;
        } else if (joinMonth <= 8) {
          leaveHistory.annualEntitlement = 7;
        } else {
          leaveHistory.annualEntitlement = 4;
        }
        leaveHistory.medicalEntitlement = 7;
        leaveHistory.casualEntitlement = 7;
      } else {
        leaveHistory.annualEntitlement = 14;
        leaveHistory.medicalEntitlement = 7;
        leaveHistory.casualEntitlement = 7;
      }
    }

    let canTakeLeave = true;
    let leaveMessage = '';
    let leaveType = null;
    let leaveDays = 0;

    if (isMedical) {
      leaveType = 'medical';
      leaveDays = isHalfDay ? 0.5 : 1;
      if (leaveHistory.takenMedical + leaveDays > leaveHistory.medicalEntitlement) {
        canTakeLeave = false;
        leaveMessage = `Medical leave limit (${leaveHistory.medicalEntitlement} days per year) exceeded. This will be unpaid leave.`;
      }
    } else if (isCasual) {
      leaveType = 'casual';
      leaveDays = isHalfDay ? 0.5 : 1;
      if (leaveHistory.takenCasual + leaveDays > leaveHistory.casualEntitlement) {
        canTakeLeave = false;
        leaveMessage = `Casual leave limit (${leaveHistory.casualEntitlement} days per year) exceeded. This will be unpaid leave.`;
      }
    } else if (status === 'Leave') {
      leaveType = 'annual';
      leaveDays = isHalfDay ? 0.5 : 1;
      if (leaveHistory.takenAnnual + leaveDays > leaveHistory.annualEntitlement) {
        canTakeLeave = false;
        leaveMessage = `Annual leave limit (${leaveHistory.annualEntitlement} days per year) exceeded. This will be unpaid leave.`;
      }
    } else if (status === 'Half Day') {
      leaveType = 'annual';
      leaveDays = 0.5;
      if (leaveHistory.takenAnnual + leaveDays > leaveHistory.annualEntitlement) {
        canTakeLeave = false;
        leaveMessage = `Annual leave limit (${leaveHistory.annualEntitlement} days per year) exceeded. This will be unpaid leave.`;
      }
    }

    if (canTakeLeave && leaveDays > 0) {
      if (isMedical) {
        leaveHistory.takenMedical += leaveDays;
      } else if (isCasual) {
        leaveHistory.takenCasual += leaveDays;
      } else if (status === 'Half Day' || status === 'Leave') {
        leaveHistory.takenAnnual += leaveDays;
      }
      
      employee.leaveBalances.annual = Math.max(0, leaveHistory.annualEntitlement - leaveHistory.takenAnnual);
      employee.leaveBalances.medical = Math.max(0, leaveHistory.medicalEntitlement - leaveHistory.takenMedical);
      employee.leaveBalances.casual = Math.max(0, leaveHistory.casualEntitlement - leaveHistory.takenCasual);
    }

    const isPaidLeaveFlag = canTakeLeave;
    const isUnpaidLeave = !canTakeLeave && (status === 'Leave' || status === 'Half Day' || isMedical || isCasual);

    // Check for Factory Closure/Holiday FIRST
   const targetDate = new Date(date);
const factoryClosure = await FactoryClosure.findOne({
  date: {
    $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
    $lt: new Date(targetDate.setHours(23, 59, 59, 999))
  },
  status: 'Active'
});

    let finalStatus = status;
    let calculatedHours = { 
      totalHours: 0, 
      overtimeHours: 0, 
      isSunday: isSunday, 
      isDoublePay: false, 
      isHolidayWork: false, 
      isSundayWork: false 
    };
    let isFactoryClosureDay = false;
    let isHolidayWork = false;
    let isSundayWork = false;

    // FIXED LOGIC: Check Factory Closure/Holiday FIRST, then Sunday
    if (factoryClosure) {
      const isAffected = factoryClosure.isForAllEmployees || 
        factoryClosure.affectedEmployees.includes(employeeId);
      
      if (isAffected) {
        if (factoryClosure.isActualClosure) {
          // ACTUAL FACTORY CLOSURE
          finalStatus = 'Factory Closure';
          isFactoryClosureDay = true;
          
          if (checkIn && status === 'Present') {
            finalStatus = 'Factory Closure Work';
            calculatedHours = calculateWorkHours(checkIn, checkOut, breakStart, breakEnd, employee.workingSchedule, date, false, false);
          }
        } else {
          // HOLIDAY (not actual closure)
          finalStatus = 'Holiday';
          
          // Check if work is allowed on this holiday with double pay
          if (checkIn && status === 'Present' && factoryClosure.allowWorkWithDoublePay) {
            isHolidayWork = true;
            finalStatus = 'Holiday Work';
            calculatedHours = calculateWorkHours(checkIn, checkOut, breakStart, breakEnd, employee.workingSchedule, date, true, false); // isHoliday=true, isSunday=false
            calculatedHours.isHolidayWork = true;
            calculatedHours.isDoublePay = true;
            calculatedHours.isSundayWork = false; // Explicitly set to false
          }
        }
      }
    } 
    
    // FIXED: Only check for Sunday work if it's NOT already a holiday work day
    if (!isHolidayWork && isSunday && status === 'Present' && checkIn) {
      // SUNDAY WORK - only if not already marked as holiday work
      isSundayWork = true;
      finalStatus = 'Sunday Work';
      calculatedHours = calculateWorkHours(checkIn, checkOut, breakStart, breakEnd, employee.workingSchedule, date, false, true); // isHoliday=false, isSunday=true
      calculatedHours.isSundayWork = true;
      calculatedHours.isHolidayWork = false; // Explicitly set to false
      calculatedHours.isDoublePay = true;
    } else if (isMedical) {
      finalStatus = 'Medical Leave';
    } else if (isCasual) {
      finalStatus = 'Casual Leave';
    } else if (status === 'Half Day') {
      calculatedHours = calculateHalfDayHours(checkIn, checkOut, breakStart, breakEnd);
    } else if (status === 'Present' && checkIn) {
      calculatedHours = calculateWorkHours(checkIn, checkOut, breakStart, breakEnd, employee.workingSchedule, date, false, false);
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
      isCasual,
      isFactoryClosure: isFactoryClosureDay,
      isHolidayWork: isHolidayWork,
      isSundayWork: isSundayWork, // Use the separate variable
      isDoublePay: calculatedHours.isDoublePay || false,
      isPaidLeave: isPaidLeaveFlag,
      isUnpaidLeave: isUnpaidLeave,
      leaveDaysDeducted: leaveDays
    };

    if (leaveType && ['annual', 'medical', 'casual', 'maternity', 'unpaid'].includes(leaveType)) {
      attendanceRecord.leaveType = leaveType;
    }

    employee.attendance = employee.attendance.filter(record => 
      record.date.toDateString() !== attendanceDate.toDateString()
    );

    employee.attendance.push(attendanceRecord);
    await employee.save();

    res.json({ 
      success: true, 
      data: attendanceRecord,
      leaveBalance: {
        annual: employee.leaveBalances.annual,
        medical: employee.leaveBalances.medical,
        casual: employee.leaveBalances.casual,
        takenAnnual: leaveHistory.takenAnnual,
        takenMedical: leaveHistory.takenMedical,
        takenCasual: leaveHistory.takenCasual,
        annualEntitlement: leaveHistory.annualEntitlement,
        medicalEntitlement: leaveHistory.medicalEntitlement,
        casualEntitlement: leaveHistory.casualEntitlement
      },
      message: leaveMessage || `Attendance marked successfully${leaveDays > 0 ? ` (${leaveDays} day(s) deducted from ${leaveType} leave)` : ''}`,
      isUnpaidLeave: isUnpaidLeave,
      isHolidayWork: isHolidayWork,
      isSundayWork: isSundayWork
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};
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
        const { employeeId, date, checkIn, checkOut, breakStart, breakEnd, status, notes, isHalfDay = false, isMedical = false, isCasual = false } = record;
        
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
        const currentYear = attendanceDate.getFullYear();
        const currentMonth = attendanceDate.getMonth();
        const dayOfWeek = attendanceDate.getDay();
        const isSunday = dayOfWeek === 0;
        
        let leaveHistory = employee.leaveHistory.find(l => l.year === currentYear);
        if (!leaveHistory) {
          leaveHistory = { 
            year: currentYear, 
            takenAnnual: 0, 
            takenMedical: 0,
            takenCasual: 0,
            monthlyLeaves: Array(12).fill(0)
          };
          employee.leaveHistory.push(leaveHistory);
        }

        // Initialize leave balances if not present
        if (!leaveHistory.annualEntitlement) {
          const joinDate = new Date(employee.joinDate);
          const joinYear = joinDate.getFullYear();
          const joinMonth = joinDate.getMonth();
          
          if (joinYear === currentYear) {
            if (joinMonth <= 2) leaveHistory.annualEntitlement = 14;
            else if (joinMonth <= 5) leaveHistory.annualEntitlement = 10;
            else if (joinMonth <= 8) leaveHistory.annualEntitlement = 7;
            else leaveHistory.annualEntitlement = 4;
            
            leaveHistory.medicalEntitlement = 7;
            leaveHistory.casualEntitlement = 7;
          } else {
            leaveHistory.annualEntitlement = 14;
            leaveHistory.medicalEntitlement = 7;
            leaveHistory.casualEntitlement = 7;
          }
        }

        let canTakeLeave = true;
        let leaveMessage = '';
        let leaveType = null;
        let leaveDays = 0;

        // Unified leave policy
        if (isMedical) {
          leaveType = 'medical';
          leaveDays = isHalfDay ? 0.5 : 1;
          if (leaveHistory.takenMedical + leaveDays > leaveHistory.medicalEntitlement) {
            canTakeLeave = false;
            leaveMessage = `Medical leave limit exceeded. Only ${leaveHistory.medicalEntitlement - leaveHistory.takenMedical} days remaining.`;
          }
        } else if (isCasual) {
          leaveType = 'casual';
          leaveDays = isHalfDay ? 0.5 : 1;
          if (leaveHistory.takenCasual + leaveDays > leaveHistory.casualEntitlement) {
            canTakeLeave = false;
            leaveMessage = `Casual leave limit exceeded. Only ${leaveHistory.casualEntitlement - leaveHistory.takenCasual} days remaining.`;
          }
        } else if (status === 'Leave') {
          leaveType = 'annual';
          leaveDays = isHalfDay ? 0.5 : 1;
          if (leaveHistory.takenAnnual + leaveDays > leaveHistory.annualEntitlement) {
            canTakeLeave = false;
            leaveMessage = `Annual leave limit exceeded. Only ${leaveHistory.annualEntitlement - leaveHistory.takenAnnual} days remaining.`;
          }
        } else if (status === 'Half Day') {
          leaveType = 'annual';
          leaveDays = 0.5;
          if (leaveHistory.takenAnnual + leaveDays > leaveHistory.annualEntitlement) {
            canTakeLeave = false;
            leaveMessage = `Annual leave limit exceeded. Only ${leaveHistory.annualEntitlement - leaveHistory.takenAnnual} days remaining.`;
          }
        }

        if (canTakeLeave && leaveDays > 0) {
          if (isMedical) {
            leaveHistory.takenMedical += leaveDays;
          } else if (isCasual) {
            leaveHistory.takenCasual += leaveDays;
          } else if (status === 'Half Day' || status === 'Leave') {
            leaveHistory.takenAnnual += leaveDays;
          }
          
          // Update the main leaveBalances object
          employee.leaveBalances.annual = Math.max(0, leaveHistory.annualEntitlement - leaveHistory.takenAnnual);
          employee.leaveBalances.medical = Math.max(0, leaveHistory.medicalEntitlement - leaveHistory.takenMedical);
          employee.leaveBalances.casual = Math.max(0, leaveHistory.casualEntitlement - leaveHistory.takenCasual);
        }

        const isPaidLeaveFlag = canTakeLeave;
        const isUnpaidLeave = !canTakeLeave && (status === 'Leave' || status === 'Half Day' || isMedical || isCasual);

        const factoryClosure = await FactoryClosure.findOne({
          date: { $eq: new Date(date).setHours(0, 0, 0, 0) },
          status: 'Active'
        });

        let finalStatus = status;
        let calculatedHours = { totalHours: 0, overtimeHours: 0, isSunday: isSunday, isDoublePay: false };
        let isFactoryClosureDay = false;
        let isHolidayWork = false;

        if (factoryClosure) {
          const isAffected = factoryClosure.isForAllEmployees || 
            factoryClosure.affectedEmployees.includes(employeeId);
          
          if (isAffected) {
            finalStatus = 'Holiday';
            isFactoryClosureDay = true;
            
            if (checkIn && status === 'Present') {
              isHolidayWork = true;
              finalStatus = 'Holiday Work';
              calculatedHours = calculateWorkHours(checkIn, checkOut, breakStart, breakEnd, employee.workingSchedule, date, true);
            }
          }
        } else if (isMedical) {
          finalStatus = 'Medical Leave';
        } else if (isCasual) {
          finalStatus = 'Casual Leave';
        } else if (status === 'Half Day') {
          calculatedHours = calculateHalfDayHours(checkIn, checkOut, breakStart, breakEnd);
        } else if (status === 'Present' && checkIn) {
          calculatedHours = calculateWorkHours(checkIn, checkOut, breakStart, breakEnd, employee.workingSchedule, date, false, isSunday);
        }

        // Create attendance record with proper leaveType handling
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
          isCasual,
          isFactoryClosure: isFactoryClosureDay,
          isHolidayWork: isHolidayWork,
          isSundayWork: isSunday && status === 'Present',
          isDoublePay: calculatedHours.isDoublePay || false,
          isPaidLeave: isPaidLeaveFlag,
          isUnpaidLeave: isUnpaidLeave,
          leaveDaysDeducted: leaveDays
        };

        // Only add leaveType if it's not null (valid enum value)
        if (leaveType && ['annual', 'medical', 'casual', 'maternity', 'unpaid'].includes(leaveType)) {
          attendanceRecord.leaveType = leaveType;
        }

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
          leaveBalance: {
            annual: employee.leaveBalances.annual,
            medical: employee.leaveBalances.medical,
            casual: employee.leaveBalances.casual,
            takenAnnual: leaveHistory.takenAnnual,
            takenMedical: leaveHistory.takenMedical,
            takenCasual: leaveHistory.takenCasual
          },
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
            employmentStatus: employee.employmentStatus,
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
        'Employment Status': record.employmentStatus,
        'Date': new Date(record.date).toLocaleDateString('en-CA'),
        'Check In': record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A',
        'Check Out': record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A',
        'Status': record.status,
        'Total Hours': record.totalHours || 0,
        'Overtime Hours': record.overtimeHours || 0,
        'Half Day': record.isHalfDay ? 'Yes' : 'No',
        'Medical Leave': record.isMedical ? 'Yes' : 'No',
        'Casual Leave': record.isCasual ? 'Yes' : 'No',
        'Sunday Work': record.isSundayWork ? 'Yes' : 'No',
        'Double Pay': record.isDoublePay ? 'Yes' : 'No',
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
 // controllers/attendanceController.js

function calculateWorkHours(checkIn, checkOut, breakStart, breakEnd, schedule, date, isHoliday = false, isSunday = false) {
  try {
    if (!checkIn) {
      return { 
        totalHours: 0, 
        overtimeHours: 0, 
        isDoublePay: false, 
        isHolidayWork: false, 
        isSundayWork: false 
      };
    }

    const checkInTime = parseTime(checkIn, date);
    const checkOutTime = checkOut ? parseTime(checkOut, date) : new Date();
    
    if (checkOutTime < checkInTime) {
      checkOutTime.setDate(checkOutTime.getDate() + 1);
    }

    const dayOfWeek = new Date(date).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const daySchedule = schedule[dayNames[dayOfWeek]];
    
    const totalMilliseconds = checkOutTime - checkInTime;
    const totalTimeAtWork = totalMilliseconds / (1000 * 60 * 60);
    
    let breakDuration = 0;
    if (breakStart && breakEnd) {
      const breakStartTime = parseTime(breakStart, date);
      const breakEndTime = parseTime(breakEnd, date);
      
      if (breakStartTime && breakEndTime) {
        let breakMillis = breakEndTime - breakStartTime;
        if (breakMillis < 0) breakMillis += 24 * 60 * 60 * 1000;
        breakDuration = breakMillis / (1000 * 60 * 60);
      }
    }

    const netWorkingHours = Math.max(0, totalTimeAtWork - breakDuration);
    
    // FIXED: Clear separation between Sunday work and Holiday work
    if (isSunday) {
      // SUNDAY WORK: Double pay, NO overtime
      return {
        totalHours: parseFloat(netWorkingHours.toFixed(2)),
        overtimeHours: 0, // No OT for Sunday work
        isDoublePay: true,
        isSundayWork: true,  // Only this should be true
        isHolidayWork: false // Explicitly false
      };
    }

    if (isHoliday) {
      // HOLIDAY WORK: Double pay, NO overtime
      return {
        totalHours: parseFloat(netWorkingHours.toFixed(2)),
        overtimeHours: 0, // No OT for holiday work
        isDoublePay: true,
        isSundayWork: false, // Explicitly false
        isHolidayWork: true  // Only this should be true
      };
    }

    // Regular day overtime calculation
    let scheduledHours = 0;
    let minimumHoursForOT = 0;
    
    if (dayOfWeek === 6) { // Saturday
      scheduledHours = 5;
      minimumHoursForOT = 5;
    } else {
      scheduledHours = 8;
      minimumHoursForOT = 8;
    }

    let overtimeHours = 0;
    if (netWorkingHours >= minimumHoursForOT) {
      overtimeHours = Math.max(0, netWorkingHours - scheduledHours);
    }

    return {
      totalHours: parseFloat(netWorkingHours.toFixed(2)),
      overtimeHours: parseFloat(overtimeHours.toFixed(2)),
      isDoublePay: false,
      isSundayWork: false,
      isHolidayWork: false
    };
  } catch (error) {
    console.error('Error in calculateWorkHours:', error);
    return { 
      totalHours: 0, 
      overtimeHours: 0, 
      isDoublePay: false, 
      isHolidayWork: false, 
      isSundayWork: false 
    };
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

function parseTime(timeStr, baseDate = new Date()) {
  if (!timeStr) return null;
  try {
    if (timeStr instanceof Date) return timeStr;
    
    if (typeof timeStr === 'string' && timeStr.includes('T')) {
      const date = new Date(timeStr);
      return isNaN(date.getTime()) ? null : date;
    }
    
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
          employmentStatus: employee.employmentStatus,
          ...record.toObject()
        });
      }
    });
  });

  attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date));

  return attendanceData;
}