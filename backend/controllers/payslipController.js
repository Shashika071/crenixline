// controllers/payslipController.js

import * as XLSX from "xlsx";

import Employee from "../models/Employee.js";
import EmployeeAllowance from '../models/EmployeeAllowance.js';
import FactoryClosure from "../models/FactoryClosure.js";
import Payslip from '../models/Payslip.js';
import SalaryAdvance from '../models/SalaryAdvance.js';

const calculateSalaryForPayslip = async (employee, month, year) => {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    console.log('=== DEBUG: Salary Calculation ===');
    console.log(`Calculating for: ${year}-${month + 1}`);
    console.log(`Date range: ${startDate.toDateString()} to ${endDate.toDateString()}`);

    // Filter attendance records for the specific month
    const monthAttendance = employee.attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    console.log(`Total attendance records in month: ${monthAttendance.length}`);

    let paidDays = 0;
    let unpaidLeaveDays = 0;
    let absentDays = 0;
    let totalOvertimeHours = 0;
    let totalWorkedHours = 0;
    let sundayWorkHours = 0;
    let sundayWorkPay = 0;
    let holidayWorkHours = 0;
    let holidayWorkPay = 0;

    // Calculate rates based on 26 working days
    const dailyRate = employee.salary / 26;
    const hourlyRate = dailyRate / 8;
    const overtimeRate = hourlyRate * 1.5;

    console.log(`Rates - Daily: ${dailyRate}, Hourly: ${hourlyRate}, Overtime: ${overtimeRate}`);

    // Process each attendance record
    monthAttendance.forEach(record => {
      const recordDate = new Date(record.date);
      
      console.log(`Processing: ${recordDate.toDateString()}, Status: ${record.status}, isHolidayWork: ${record.isHolidayWork}, isSundayWork: ${record.isSundayWork}`);

      // SUNDAY WORK CALCULATION (Double pay, NO overtime)
      if (record.isSundayWork && record.totalHours > 0) {
        const sundayHours = record.totalHours || 0;
        sundayWorkHours += sundayHours;
        sundayWorkPay += sundayHours * hourlyRate * 2; // Double pay for Sunday
        
        console.log(`✅ Sunday work detected: ${sundayHours} hours = LKR ${sundayHours * hourlyRate * 2}`);
        
        // NO OVERTIME FROM SUNDAY WORK - this is the key change
        // totalOvertimeHours remains unchanged
        
        return; // Skip further processing for Sunday work
      }

      // HOLIDAY WORK CALCULATION (Double pay, NO overtime)
      if (record.isHolidayWork && record.totalHours > 0) {
        const holidayHours = record.totalHours || 0;
        holidayWorkHours += holidayHours;
        holidayWorkPay += holidayHours * hourlyRate * 2; // Double pay for holiday work
        
        console.log(`✅ Holiday work detected: ${holidayHours} hours = LKR ${holidayHours * hourlyRate * 2}`);
        
        // NO OVERTIME FROM HOLIDAY WORK - this is the key change
        // totalOvertimeHours remains unchanged
        
        return; // Skip further processing for holiday work
      }

      // REGULAR DAY PROCESSING (only for non-special days)
      const weekDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = recordDate.getDay();
      const isWorkingDay = employee.workingSchedule[weekDays[dayOfWeek]]?.working;

      if (!isWorkingDay) return;

      // Calculate paid days based on attendance status
      switch (record.status) {
        case 'Present':
        case 'Factory Closure': // Factory closure counts as paid day
        case 'Holiday': // Holiday (non-work) counts as paid day
          paidDays += 1;
          totalWorkedHours += record.totalHours || 0;
          
          if (record.overtimeHours >= 1) {
            totalOvertimeHours += Math.floor(record.overtimeHours);
          }
          break;

        case 'Medical Leave':
        case 'Casual Leave':
          if (record.isPaidLeave) {
            paidDays += 1;
          } else {
            unpaidLeaveDays += record.leaveDaysDeducted || 1;
          }
          break;

        case 'Leave': // Annual leave
          if (record.isPaidLeave) {
            paidDays += 1;
          } else {
            unpaidLeaveDays += record.leaveDaysDeducted || 1;
          }
          break;

        case 'Half Day':
          if (record.isPaidLeave) {
            paidDays += 1;
            totalWorkedHours += record.totalHours || 4;
            
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

    // Basic salary calculation - only unpaid leave and absences reduce salary
    const basicSalary = Math.max(0, (26 - unpaidLeaveDays - absentDays) * dailyRate);

    // Overtime calculation with hourly rate (only for regular days)
    const overtimePay = totalOvertimeHours * overtimeRate;

    console.log('=== FINAL CALCULATION RESULTS ===');
    console.log(`Basic Salary: ${basicSalary} (based on 26 working days)`);
    console.log(`Paid Days: ${paidDays}, Unpaid Leave: ${unpaidLeaveDays}, Absent: ${absentDays}`);
    console.log(`Sunday Work Hours: ${sundayWorkHours}, Pay: ${sundayWorkPay}`);
    console.log(`Holiday Work Hours: ${holidayWorkHours}, Pay: ${holidayWorkPay}`);
    console.log(`Overtime Hours: ${totalOvertimeHours}, Pay: ${overtimePay}`);

    return {
      basicSalary: Math.round(basicSalary * 100) / 100,
      dailyRate: Math.round(dailyRate * 100) / 100,
      hourlyRate: Math.round(hourlyRate * 100) / 100,
      paidDays,
      unpaidLeaveDays: Math.round(unpaidLeaveDays * 100) / 100,
      absentDays,
      totalWorkingDays: 26, // FIXED: Always 26 working days
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      overtimePay: Math.round(overtimePay * 100) / 100,
      sundayWorkHours: Math.round(sundayWorkHours * 100) / 100,
      sundayWorkPay: Math.round(sundayWorkPay * 100) / 100,
      holidayWorkHours: Math.round(holidayWorkHours * 100) / 100,
      holidayWorkPay: Math.round(holidayWorkPay * 100) / 100,
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
    
    console.log('=== PAYSLIP CALCULATION START ===');
    console.log(`Employee: ${employeeId}, Month: ${month}`);

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Parse month correctly
    let monthDate;
    if (month.includes('-')) {
      monthDate = new Date(month + '-01');
    } else {
      monthDate = new Date(month);
    }
    
    if (isNaN(monthDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid month format" });
    }

    const monthNum = monthDate.getMonth();
    const yearNum = monthDate.getFullYear();

    console.log(`Parsed - Month: ${monthNum + 1}, Year: ${yearNum}`);
    console.log(`Employee attendance records: ${employee.attendance.length}`);

    // Debug: Check all Sunday and Holiday work records
    const allSundayRecords = employee.attendance.filter(record => record.isSundayWork);
    const allHolidayRecords = employee.attendance.filter(record => record.isHolidayWork);
    console.log(`Total Sunday work records in employee: ${allSundayRecords.length}`);
    console.log(`Total Holiday work records in employee: ${allHolidayRecords.length}`);

    // Use the updated function with new policy calculations
    const salaryData = await calculateSalaryForPayslip(employee, monthNum, yearNum);

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

    // FIXED: EPF calculation (8% from employee - DEDUCTION)
    const epfDeduction = employee.hasEPF ? salaryData.basicSalary * 0.08 : 0;

    // FIXED: ETF calculation (3% from employer - ADDED TO SALARY, not deducted)
    const etfContribution = salaryData.basicSalary * 0.03;

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

    // FIXED: Calculate total deductions (only EPF and advances)
    const totalDeductions = epfDeduction + totalAdvances + 
      additionalDeductions.reduce((sum, ded) => sum + ded.amount, 0);

    // FIXED: Calculate net salary (INCLUDES ETF as employer contribution)
    const grossSalary = salaryData.basicSalary + totalAllowances + 
                       salaryData.overtimePay + salaryData.sundayWorkPay + 
                       salaryData.holidayWorkPay;

    const netSalary = grossSalary + etfContribution - totalDeductions;

    console.log('=== PAYSLIP FINAL TOTALS ===');
    console.log(`Basic: ${salaryData.basicSalary}`);
    console.log(`Sunday Pay: ${salaryData.sundayWorkPay}`);
    console.log(`Holiday Pay: ${salaryData.holidayWorkPay}`);
    console.log(`ETF Contribution (Added): ${etfContribution}`);
    console.log(`EPF Deduction: ${epfDeduction}`);
    console.log(`Gross Salary: ${grossSalary}`);
    console.log(`Net Salary: ${netSalary}`);

    const payslipData = {
      employeeId,
      month,
      basicSalary: salaryData.basicSalary,
      epfDeduction,
      etfContribution,
      allowances,
      totalAllowances,
      overtimeHours: salaryData.totalOvertimeHours,
      overtimePay: salaryData.overtimePay,
      sundayWorkHours: salaryData.sundayWorkHours,
      sundayWorkPay: salaryData.sundayWorkPay,
      holidayWorkHours: salaryData.holidayWorkHours,
      holidayWorkPay: salaryData.holidayWorkPay,
      deductions: additionalDeductions,
      totalDeductions,
      salaryAdvances: advances,
      totalAdvances,
      grossSalary, // ADDED: Show gross salary before ETF
      netSalary,
      status: 'draft',
      
      // Additional info for transparency
      calculationInfo: {
        workingDays: salaryData.totalWorkingDays,
        paidDays: salaryData.paidDays,
        unpaidLeaveDays: salaryData.unpaidLeaveDays,
        absentDays: salaryData.absentDays,
        dailyRate: salaryData.dailyRate,
        hourlyRate: salaryData.hourlyRate
      }
    };
    
    payslipData.realId = employee.employeeId; 

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
        unpaidLeaveDays: salaryData.unpaidLeaveDays,
        overtimeHours: salaryData.totalOvertimeHours,
        overtimeRate: salaryData.hourlyRate,
        overtimePay: salaryData.overtimePay,
        sundayWorkHours: salaryData.sundayWorkHours,
        sundayWorkPay: salaryData.sundayWorkPay,
        holidayWorkHours: salaryData.holidayWorkHours,
        holidayWorkPay: salaryData.holidayWorkPay,
        etfContribution: etfContribution, // Show ETF as positive contribution
        epfDeduction: epfDeduction, // Show EPF as deduction
        debug: {
          totalRecords: employee.attendance.length,
          monthRecords: employee.attendance.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === monthNum && recordDate.getFullYear() === yearNum;
          }).length,
          sundayRecords: allSundayRecords.length,
          holidayRecords: allHolidayRecords.length
        }
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

export const generatePayslipReport = async (req, res) => {
  try {
    const { month, format = 'json' } = req.query;

    const filter = { month };
    const payslips = await Payslip.find(filter)
      .populate('employeeId', 'name role nic bankDetails')
      .populate('finalizedBy', 'name')
      .sort({ 'employeeId.name': 1 });

    if (format === 'excel') {
      // Generate Excel report
      const data = payslips.map(payslip => ({
        'Employee Name': payslip.employeeId.name,
        'Role': payslip.employeeId.role,
        'NIC': payslip.employeeId.nic || 'N/A',
        'Month': payslip.month,
        'Basic Salary': payslip.basicSalary,
        'Overtime Pay': payslip.overtimePay,
        'Sunday Work Pay': payslip.sundayWorkPay || 0,
        'Holiday Work Pay': payslip.holidayWorkPay || 0, // NEW: Add holiday work pay
        'Total Allowances': payslip.totalAllowances,
        'EPF Deduction': payslip.epfDeduction,
        'ETF Contribution': payslip.etfContribution || 0,
        'Total Advances': payslip.totalAdvances,
        'Total Deductions': payslip.totalDeductions,
        'Net Salary': payslip.netSalary,
        'Status': payslip.status,
        'Finalized Date': payslip.finalizedDate ? payslip.finalizedDate.toLocaleDateString() : 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Payslip Report");
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=payslip_report_${month}.xlsx`);
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.send(buffer);
    } else {
      res.json({ 
        success: true, 
        data: payslips,
        summary: {
          totalPayslips: payslips.length,
          totalNetSalary: payslips.reduce((sum, p) => sum + p.netSalary, 0),
          totalOvertimePay: payslips.reduce((sum, p) => sum + p.overtimePay, 0),
          totalSundayWorkPay: payslips.reduce((sum, p) => sum + (p.sundayWorkPay || 0), 0),
          totalHolidayWorkPay: payslips.reduce((sum, p) => sum + (p.holidayWorkPay || 0), 0), // NEW: Add holiday work pay total
          finalizedCount: payslips.filter(p => p.status === 'finalized').length,
          paidCount: payslips.filter(p => p.status === 'paid').length,
          draftCount: payslips.filter(p => p.status === 'draft').length
        }
      });
    }
  } catch (error) {
    console.error('Error generating payslip report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const payslip = await Payslip.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('employeeId', 'name role nic bankDetails')
    .populate('salaryAdvances.advanceId');

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    res.json({ success: true, data: payslip });
  } catch (error) {
    console.error('Error updating payslip:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployeePayslips = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, status } = req.query;

    const filter = { employeeId };
    
    if (year) {
      filter.month = { $regex: `^${year}-`, $options: 'i' };
    }
    
    if (status) {
      filter.status = status;
    }

    const payslips = await Payslip.find(filter)
      .populate('employeeId', 'name role nic bankDetails')
      .populate('finalizedBy', 'name')
      .sort({ month: -1 });

    res.json({ 
      success: true, 
      data: payslips,
      employee: payslips.length > 0 ? payslips[0].employeeId : null
    });
  } catch (error) {
    console.error('Error getting employee payslips:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recalculatePayslip = async (req, res) => {
  try {
    const { id } = req.params;

    const payslip = await Payslip.findById(id).populate('employeeId');
    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    // Only allow recalculation of draft payslips
    if (payslip.status !== 'draft') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only draft payslips can be recalculated' 
      });
    }

    // Recalculate the payslip
    const monthDate = new Date(payslip.month + '-01');
    const salaryData = await calculateSalaryForPayslip(
      payslip.employeeId,
      monthDate.getMonth(),
      monthDate.getFullYear()
    );

    // Get updated allowances
    const employeeAllowances = await EmployeeAllowance.find({
      employeeId: payslip.employeeId._id,
      isActive: true
    }).populate('allowanceId');

    const allowances = employeeAllowances.map(ea => ({
      name: ea.allowanceId.name,
      amount: ea.amount
    }));

    const totalAllowances = allowances.reduce((sum, allowance) => sum + allowance.amount, 0);

    // Get updated salary advances
    const salaryAdvances = await SalaryAdvance.find({
      employeeId: payslip.employeeId._id,
      deductionMonth: payslip.month,
      status: 'approved'
    });

    const advances = salaryAdvances.map(advance => ({
      advanceId: advance._id,
      amount: advance.amount
    }));

    const totalAdvances = advances.reduce((sum, advance) => sum + advance.amount, 0);

    // FIXED: Recalculate EPF and ETF correctly
    const epfDeduction = payslip.employeeId.hasEPF ? salaryData.basicSalary * 0.08 : 0;
    const etfContribution = salaryData.basicSalary * 0.03;

    // FIXED: Calculate totals correctly
    const grossSalary = salaryData.basicSalary + totalAllowances + 
                       salaryData.overtimePay + salaryData.sundayWorkPay + 
                       salaryData.holidayWorkPay;

    const totalDeductions = epfDeduction + totalAdvances + 
      (payslip.deductions?.reduce((sum, ded) => sum + ded.amount, 0) || 0);

    const netSalary = grossSalary + etfContribution - totalDeductions;

    // Update the payslip
    const updatedPayslip = await Payslip.findByIdAndUpdate(
      id,
      {
        basicSalary: salaryData.basicSalary,
        epfDeduction,
        etfContribution,
        allowances,
        totalAllowances,
        overtimeHours: salaryData.totalOvertimeHours,
        overtimePay: salaryData.overtimePay,
        sundayWorkHours: salaryData.sundayWorkHours,
        sundayWorkPay: salaryData.sundayWorkPay,
        holidayWorkHours: salaryData.holidayWorkHours,
        holidayWorkPay: salaryData.holidayWorkPay,
        salaryAdvances: advances,
        totalAdvances,
        grossSalary, // ADDED: Include gross salary
        totalDeductions,
        netSalary,
        calculationInfo: {
          workingDays: salaryData.totalWorkingDays,
          paidDays: salaryData.paidDays,
          unpaidLeaveDays: salaryData.unpaidLeaveDays,
          absentDays: salaryData.absentDays,
          dailyRate: salaryData.dailyRate,
          hourlyRate: salaryData.hourlyRate
        }
      },
      { new: true }
    )
    .populate('employeeId', 'name role nic bankDetails')
    .populate('salaryAdvances.advanceId');

    res.json({ 
      success: true, 
      data: updatedPayslip,
      message: 'Payslip recalculated successfully'
    });
  } catch (error) {
    console.error('Error recalculating payslip:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};