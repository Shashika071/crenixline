import * as XLSX from "xlsx";

import Employee from "../models/Employee.js";
import EmployeeAllowance from '../models/EmployeeAllowance.js';
import FactoryClosure from "../models/FactoryClosure.js";
import SalaryAdvance from '../models/SalaryAdvance.js';

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
        employmentStatus: employee.employmentStatus,
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
        'Unpaid Leave Days': report.unpaidLeaveDays,
        'Absent Days': report.absentDays,
        'Total Overtime Hours': report.totalOvertimeHours,
        'Overtime Pay': report.overtimePay,
        'Sunday Work Hours': report.sundayWorkHours,
        'Sunday Work Pay': report.sundayWorkPay,
        'Total Salary': report.totalSalary,
        'EPF Deduction': report.epfDeduction,
        'ETF Contribution': report.etfContribution,
        'Net Salary': report.netSalary,
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

 
async function calculateMonthlySalary(employee, month, year) {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const monthAttendance = employee.attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Calculate available working days (excluding Sundays and factory closures)
    const availableWorkingDays = await getAvailableWorkingDays(month, year, employee.workingSchedule, employee._id);
    
    let paidDays = 0;
    let unpaidLeaveDays = 0;
    let absentDays = 0;
    let totalOvertimeHours = 0;
    
    // Detailed breakdown of paid days
    let normalPaidDays = 0;
    let sundayWorkDays = 0;
    let holidayWorkDays = 0;
    let sundayWorkHours = 0;
    let holidayWorkHours = 0;

    // Use 26 fixed days for ALL rate calculations
    const fixedDailyRate = employee.salary / 26;
    const fixedHourlyRate = fixedDailyRate / 8;
    const fixedOvertimeRate = fixedHourlyRate * 1.5;

    // Use available days for normal paid days calculation
    const normalDaysRate = employee.salary / availableWorkingDays;

    monthAttendance.forEach(record => {
      const recordDate = new Date(record.date);
      const dayOfWeek = recordDate.getDay();
      const isSunday = dayOfWeek === 0;

      // Sunday work - should be counted as Sunday paid days
      if (record.isSundayWork && record.totalHours > 0) {
        sundayWorkDays += 1;
        paidDays += 1;
        const sundayHours = record.totalHours || 0;
        sundayWorkHours += sundayHours;
        console.log(`✅ Sunday work detected: ${recordDate.toDateString()} - ${sundayHours} hours`);
        return; // Skip further processing
      }

      // Holiday work - should be counted as Holiday paid days  
      if (record.isHolidayWork && record.totalHours > 0) {
        holidayWorkDays += 1;
        paidDays += 1;
        const holidayHours = record.totalHours || 0;
        holidayWorkHours += holidayHours;
        console.log(`✅ Holiday work detected: ${recordDate.toDateString()} - ${holidayHours} hours`);
        return; // Skip further processing
      }

      // Regular day processing - only for non-Sunday, non-Holiday work
      const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const isWorkingDay = employee.workingSchedule[weekDays[dayOfWeek]]?.working;

      if (!isWorkingDay) return;

      switch (record.status) {
        case 'Present':
        case 'Factory Closure':
        case 'Holiday': // Regular holiday (non-work) counts as normal paid day
          normalPaidDays += 1;
          paidDays += 1;
          
          // Overtime calculation for regular days only
          if (record.overtimeHours >= 1) {
            totalOvertimeHours += Math.floor(record.overtimeHours);
          }
          break;

        case 'Medical Leave':
        case 'Casual Leave':
          if (record.isPaidLeave) {
            normalPaidDays += 1;
            paidDays += 1;
          } else {
            unpaidLeaveDays += record.leaveDaysDeducted || 1;
          }
          break;

        case 'Leave': // Annual leave
          if (record.isPaidLeave) {
            normalPaidDays += 1;
            paidDays += 1;
          } else {
            unpaidLeaveDays += record.leaveDaysDeducted || 1;
          }
          break;

        case 'Half Day':
          if (record.isPaidLeave) {
            normalPaidDays += 1;
            paidDays += 1;
            
            if (record.overtimeHours >= 1) {
              totalOvertimeHours += Math.floor(record.overtimeHours);
            }
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

    console.log(`=== FINAL PAID DAYS BREAKDOWN for ${employee.name} ===`);
    console.log(`Normal: ${normalPaidDays}, Sunday: ${sundayWorkDays}, Holiday: ${holidayWorkDays}`);
    console.log(`Sunday Work Hours: ${sundayWorkHours}, Holiday Work Hours: ${holidayWorkHours}`);

    // Calculate salary components using your formula:
    // Basic Salary/Available Days * Normal paid days
    const normalSalary = (employee.salary / availableWorkingDays) * normalPaidDays;
    
    // Basic Salary/26 * 2 * Holiday paid days (double pay for each holiday day worked)
    const holidaySalary = (employee.salary / 26) * 2 * holidayWorkDays;
    
    // Basic Salary/26 * 2 * Sunday paid days (double pay for each sunday day worked)  
    const sundaySalary = (employee.salary / 26) * 2 * sundayWorkDays;
    
    // Basic Salary/(26*8) * 1.5 * Overtime hours
    const overtimeSalary = (employee.salary / (26 * 8)) * 1.5 * totalOvertimeHours;

    // Current Net Salary (no deductions)
    const currentNetSalary = normalSalary + holidaySalary + sundaySalary + overtimeSalary;

    return {
      // Salary components
      currentNetSalary: Math.round(currentNetSalary * 100) / 100,
      salaryComponents: {
        normalSalary: Math.round(normalSalary * 100) / 100,
        holidaySalary: Math.round(holidaySalary * 100) / 100,
        sundaySalary: Math.round(sundaySalary * 100) / 100,
        overtimeSalary: Math.round(overtimeSalary * 100) / 100
      },
      
      // Rates (for display)
      normalDayRate: Math.round(employee.salary / availableWorkingDays * 100) / 100,
      holidayDayRate: Math.round(employee.salary / 26 * 2 * 100) / 100,
      sundayDayRate: Math.round(employee.salary / 26 * 2 * 100) / 100,
      overtimeHourlyRate: Math.round(employee.salary / (26 * 8) * 1.5 * 100) / 100,
      
      // Days breakdown
      availableWorkingDays: availableWorkingDays,
      paidDays: paidDays,
      paidDaysBreakdown: {
        normal: normalPaidDays,
        sunday: sundayWorkDays,
        holiday: holidayWorkDays,
        total: paidDays
      },
      unpaidLeaveDays: Math.round(unpaidLeaveDays * 100) / 100,
      absentDays: absentDays,
      
      // Hours
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      sundayWorkHours: Math.round(sundayWorkHours * 100) / 100,
      holidayWorkHours: Math.round(holidayWorkHours * 100) / 100,
      
      // Additional info
      month: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      calculationDate: new Date(),
      employmentStatus: employee.employmentStatus,
      
      calculationFormula: {
        normalSalary: `(Rs.${employee.salary} / ${availableWorkingDays} available days) × ${normalPaidDays} normal days = Rs.${normalSalary.toFixed(2)}`,
        holidaySalary: `(Rs.${employee.salary} / 26 × 2) × ${holidayWorkDays} holiday days = Rs.${holidaySalary.toFixed(2)}`,
        sundaySalary: `(Rs.${employee.salary} / 26 × 2) × ${sundayWorkDays} sunday days = Rs.${sundaySalary.toFixed(2)}`, 
        overtimeSalary: `(Rs.${employee.salary} / 208 × 1.5) × ${totalOvertimeHours} overtime hours = Rs.${overtimeSalary.toFixed(2)}`
      }
    };
  } catch (error) {
    console.error('Error in calculateMonthlySalary:', error);
    throw error;
  }
}
// getAvailableWorkingDays function remains the same
async function getAvailableWorkingDays(month, year, schedule, employeeId = null) {
  let availableDays = 0;
  const date = new Date(year, month, 1);
  
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
      const isFactoryClosure = factoryClosures.some(closure => {
        const closureDate = new Date(closure.date);
        const isSameDate = closureDate.toDateString() === date.toDateString();
        
        if (!isSameDate) return false;
        
        return closure.isForAllEmployees || 
               (employeeId && closure.affectedEmployees.includes(employeeId));
      });
      
      if (!isFactoryClosure) {
        availableDays++;
      }
    }
    date.setDate(date.getDate() + 1);
  }
  
  return availableDays;
} 

async function getWorkingDaysInMonth(month, year, schedule, employeeId = null) {
  let workingDays = 0;
  const date = new Date(year, month, 1);
  
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
      const isFactoryClosure = factoryClosures.some(closure => {
        const closureDate = new Date(closure.date);
        const isSameDate = closureDate.toDateString() === date.toDateString();
        
        if (!isSameDate) return false;
        
        return closure.isForAllEmployees || 
               (employeeId && closure.affectedEmployees.includes(employeeId));
      });
      
      if (!isFactoryClosure) {
        workingDays++;
      }
    }
    date.setDate(date.getDate() + 1);
  }
  
  return workingDays;
}