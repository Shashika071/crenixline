import Employee from '../models/Employee.js';
import EmployeeAllowance from '../models/EmployeeAllowance.js';
import Payslip from '../models/Payslip.js';
import SalaryAdvance from '../models/SalaryAdvance.js';

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
const calculateSalaryForPayslip = async (employee, month, year) => {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    // Filter attendance records for the specific month
    const monthAttendance = employee.attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Get working days considering factory closures
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
    const dailyRate = employee.salary / workingDays;
    const basicSalary = workingDays > 0 ? (paidDays * dailyRate) : 0;

    return {
      basicSalary: Math.round(basicSalary * 100) / 100,
      paidDays,
      unpaidLeaveDays: Math.round(unpaidLeaveDays * 100) / 100,
      absentDays,
      totalWorkingDays: workingDays,
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
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

    // Use the new function instead of importing from employeeController
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
    const epfDeduction = employee.hasEPF ? salaryData.basicSalary * 0.08 : 0;

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

    // Calculate net salary
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
      status: 'draft'
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

    res.json({ success: true, data: payslip });
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
      .populate('employeeId', 'name role')
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