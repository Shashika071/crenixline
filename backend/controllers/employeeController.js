import * as XLSX from "xlsx";

import Employee from "../models/Employee.js";

export const createEmployee = async (req, res) => {
  try {
    // Set default working schedule
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
      workingSchedule: req.body.workingSchedule || defaultSchedule
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
    const { status, role } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;

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

export const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });
    const employeesByRole = await Employee.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        employeesByRole
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Attendance Management
export const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, breakStart, breakEnd, status, notes } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Calculate working hours and overtime
    const workData = calculateWorkHours(checkIn, checkOut, breakStart, breakEnd, employee.workingSchedule, date);

    const attendanceRecord = {
      date: new Date(date),
      checkIn: new Date(checkIn),
      checkOut: checkOut ? new Date(checkOut) : null,
      breakStart: breakStart ? new Date(breakStart) : null,
      breakEnd: breakEnd ? new Date(breakEnd) : null,
      totalHours: workData.totalHours,
      overtimeHours: workData.overtimeHours,
      status: status || 'Present',
      notes
    };

    // Remove existing record for the same date
    employee.attendance = employee.attendance.filter(record => 
      record.date.toDateString() !== new Date(date).toDateString()
    );

    employee.attendance.push(attendanceRecord);
    await employee.save();

    res.json({ success: true, data: attendanceRecord });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
        if ((!startDate || new Date(record.date) >= new Date(startDate)) &&
            (!endDate || new Date(record.date) <= new Date(endDate))) {
          attendanceData.push({
            employeeId: employee._id,
            employeeName: employee.name,
            ...record.toObject()
          });
        }
      });
    });

    res.json({ success: true, data: attendanceData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Salary Calculation
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

// Export Functions
export const exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate, format = 'excel' } = req.query;
    
    const attendanceData = await getAttendanceData(startDate, endDate);
    
    if (format === 'excel') {
      const data = attendanceData.map(record => ({
        'Employee Name': record.employeeName,
        'Date': new Date(record.date).toLocaleDateString('en-CA'),
        'Check In': record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A',
        'Check Out': record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A',
        'Total Hours': record.totalHours || 0,
        'Overtime Hours': record.overtimeHours || 0,
        'Status': record.status
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
      const salaryData = await calculateMonthlySalary(employee, 
        month ? parseInt(month) - 1 : new Date().getMonth(),
        year ? parseInt(year) : new Date().getFullYear()
      );
      salaryReports.push({
        employeeName: employee.name,
        ...salaryData
      });
    }

    if (format === 'excel') {
      const data = salaryReports.map(report => ({
        'Employee Name': report.employeeName,
        'Basic Salary': report.basicSalary,
        'Total Working Days': report.totalWorkingDays,
        'Present Days': report.presentDays,
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

// Helper Functions
function calculateWorkHours(checkIn, checkOut, breakStart, breakEnd, schedule, date) {
  const checkInTime = new Date(checkIn);
  const checkOutTime = checkOut ? new Date(checkOut) : new Date();
  
  const dayOfWeek = new Date(date).getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const daySchedule = schedule[dayNames[dayOfWeek]];
  
  if (!daySchedule.working) {
    return { totalHours: 0, overtimeHours: 0 };
  }

  // Calculate break duration
  let breakDuration = 0;
  if (breakStart && breakEnd) {
    breakDuration = (new Date(breakEnd) - new Date(breakStart)) / (1000 * 60 * 60);
  }

  // Calculate total worked hours
  const totalMilliseconds = checkOutTime - checkInTime;
  const totalHours = (totalMilliseconds / (1000 * 60 * 60)) - breakDuration;

  // Calculate scheduled hours
  const [schedStartHour, schedStartMin] = daySchedule.start.split(':').map(Number);
  const [schedEndHour, schedEndMin] = daySchedule.end.split(':').map(Number);
  
  const scheduledHours = schedEndHour + (schedEndMin/60) - (schedStartHour + (schedStartMin/60));
  
  // Calculate overtime
  const overtimeHours = Math.max(0, totalHours - scheduledHours);

  return {
    totalHours: Math.max(0, totalHours),
    overtimeHours: Math.max(0, overtimeHours)
  };
}

async function calculateMonthlySalary(employee, month, year) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  const monthAttendance = employee.attendance.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= startDate && recordDate <= endDate;
  });

  const presentDays = monthAttendance.filter(record => record.status === 'Present').length;
  const totalOvertimeHours = monthAttendance.reduce((sum, record) => sum + (record.overtimeHours || 0), 0);
  
  // Calculate working days in month
  const workingDays = getWorkingDaysInMonth(month, year, employee.workingSchedule);
  const absentDays = workingDays - presentDays;

  const basicSalary = (presentDays / workingDays) * employee.salary;
  const overtimePay = totalOvertimeHours * employee.overtimeRate;
  const totalSalary = basicSalary + overtimePay;

  return {
    basicSalary: Math.round(basicSalary * 100) / 100,
    totalWorkingDays: workingDays,
    presentDays,
    absentDays,
    totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    totalSalary: Math.round(totalSalary * 100) / 100,
    month: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  };
}

function getWorkingDaysInMonth(month, year, schedule) {
  let workingDays = 0;
  const date = new Date(year, month, 1);
  
  while (date.getMonth() === month) {
    const dayOfWeek = date.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    if (schedule[dayNames[dayOfWeek]].working) {
      workingDays++;
    }
    date.setDate(date.getDate() + 1);
  }
  
  return workingDays;
}

async function getAttendanceData(startDate, endDate) {
  const query = {};
  if (startDate || endDate) {
    query['attendance.date'] = {};
    if (startDate) query['attendance.date'].$gte = new Date(startDate);
    if (endDate) query['attendance.date'].$lte = new Date(endDate);
  }

  const employees = await Employee.find(query);
  let attendanceData = [];
  
  employees.forEach(employee => {
    employee.attendance.forEach(record => {
      if ((!startDate || new Date(record.date) >= new Date(startDate)) &&
          (!endDate || new Date(record.date) <= new Date(endDate))) {
        attendanceData.push({
          employeeId: employee._id,
          employeeName: employee.name,
          ...record.toObject()
        });
      }
    });
  });

  return attendanceData;
}