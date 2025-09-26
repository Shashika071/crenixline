// components/ReportsSection.jsx

import * as XLSX from 'xlsx';

import { Calendar, Download, FileText, Loader, Users } from 'lucide-react';
import React, { useState } from 'react';
import { employeeAPI, salaryAPI } from '../../services/api';

const ReportsSection = ({ employees }) => { 
  const [exportLoading, setExportLoading] = useState({
    employee: false,
    attendance: false,
    salary: false
  });
  const [attendanceStartDate, setAttendanceStartDate] = useState('');
  const [attendanceEndDate, setAttendanceEndDate] = useState('');
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));

  const exportToExcel = () => {
    try {
      const data = employees.map(emp => ({
        'Employee ID': emp._id,
        'Employee Name': emp.name,
        'NIC': emp.nic,
        'Role': emp.role,
        'Basic Salary': emp.salary,
        'Status': emp.status,
        'Employment Status': emp.employmentStatus,
        'Bank Name': emp.bankDetails?.bankName || 'N/A',
        'Account Number': emp.bankDetails?.accountNumber || 'N/A',
        'Branch': emp.bankDetails?.branch || 'N/A',
        'Account Type': emp.bankDetails?.accountType || 'N/A',
        'Join Date': emp.joinDate ? new Date(emp.joinDate).toLocaleDateString('en-CA') : 'N/A',
        'Probation End Date': emp.probationEndDate ? new Date(emp.probationEndDate).toLocaleDateString('en-CA') : 'N/A',
       
 
        'Address': emp.address || 'N/A'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // Employee ID
        { wch: 25 }, // Employee Name
        { wch: 15 }, // NIC
        { wch: 20 }, // Role
        { wch: 15 }, // Basic Salary
        { wch: 12 }, // Status
        { wch: 18 }, // Employment Status
        { wch: 20 }, // Bank Name
        { wch: 15 }, // Account Number
        { wch: 15 }, // Branch
        { wch: 15 }, // Account Type
        { wch: 12 }, // Join Date
        { wch: 15 }, // Probation End Date
        { wch: 15 }, // Contact Number
        { wch: 25 }, // Email
        { wch: 30 }  // Address
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Employees");
      XLSX.writeFile(wb, `employees_master_list_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting employee data:', error);
      alert('Error exporting employee data: ' + error.message);
    }
  };

  const exportAttendanceReport = async () => {
    if (!attendanceStartDate || !attendanceEndDate) {
      alert('Please select both start and end dates for attendance report');
      return;
    }

    setExportLoading(prev => ({ ...prev, attendance: true }));
    try {
      const response = await employeeAPI.exportAttendance({
        startDate: attendanceStartDate,
        endDate: attendanceEndDate,
        format: 'excel'
      });

      // Check if response contains data
      if (response.data && response.data.size > 0) {
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_report_${attendanceStartDate}_to_${attendanceEndDate}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        alert('Attendance report exported successfully!');
      } else {
        alert('No attendance data found for the selected period');
      }
    } catch (error) {
      console.error('Error exporting attendance:', error);
      alert('Error exporting attendance report: ' + (error.response?.data?.message || error.message));
    } finally {
      setExportLoading(prev => ({ ...prev, attendance: false }));
    }
  };

  const exportSalaryReport = async () => {
    if (!salaryMonth) {
      alert('Please select a month for salary report');
      return;
    }

    setExportLoading(prev => ({ ...prev, salary: true }));
    try {
      // First, get all payslips for the selected month
      const payslipsResponse = await salaryAPI.getPayslips({ month: salaryMonth });
      const payslips = payslipsResponse.data.data || payslipsResponse.data || [];

      if (payslips.length === 0) {
        alert('No salary data found for the selected month. Please ensure payslips are calculated and finalized.');
        return;
      }

      // Create detailed salary report data
      const salaryData = payslips.map(payslip => {
        const employee = payslip.employeeId || {};
        const allowances = payslip.allowances || [];
        const deductions = payslip.deductions || [];
        const salaryAdvances = payslip.salaryAdvances || [];

        return {
          'Month': payslip.month,
          'Employee ID': employee._id || 'N/A',
          'Employee Name': employee.name || 'N/A',
          'NIC': employee.nic || 'N/A',
          'Role': employee.role || 'N/A',
          'Basic Salary': payslip.basicSalary || 0,
          'Total Allowances': payslip.totalAllowances || 0,
          'Overtime Hours': payslip.overtimeHours || 0,
          'Overtime Rate': payslip.overtimeHours > 0 ? (payslip.overtimePay / payslip.overtimeHours).toFixed(2) : 0,
          'Overtime Pay': payslip.overtimePay || 0,
          'EPF Deduction': payslip.epfDeduction || 0,
          'Total Deductions': payslip.totalDeductions || 0,
          'Total Advances': payslip.totalAdvances || 0,
          'Net Salary': payslip.netSalary || 0,
          'Status': payslip.status || 'N/A',
          'Finalized Date': payslip.finalizedDate ? new Date(payslip.finalizedDate).toLocaleDateString() : 'Not Finalized',
          'Bank Name': employee.bankDetails?.bankName || 'N/A',
          'Account Number': employee.bankDetails?.accountNumber || 'N/A'
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(salaryData);
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 12 }, // Month
        { wch: 20 }, // Employee ID
        { wch: 25 }, // Employee Name
        { wch: 15 }, // NIC
        { wch: 20 }, // Role
        { wch: 15 }, // Basic Salary
        { wch: 18 }, // Total Allowances
        { wch: 15 }, // Overtime Hours
        { wch: 15 }, // Overtime Rate
        { wch: 15 }, // Overtime Pay
        { wch: 15 }, // EPF Deduction
        { wch: 18 }, // Total Deductions
        { wch: 15 }, // Total Advances
        { wch: 15 }, // Net Salary
        { wch: 12 }, // Status
        { wch: 15 }, // Finalized Date
        { wch: 20 }, // Bank Name
        { wch: 15 }  // Account Number
      ];
      ws['!cols'] = colWidths;

      // Create workbook and save
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Salary Report");
      XLSX.writeFile(wb, `salary_report_${salaryMonth}.xlsx`);
      
      alert('Salary report exported successfully!');
    } catch (error) {
      console.error('Error exporting salary report:', error);
      alert('Error exporting salary report: ' + (error.response?.data?.message || error.message));
    } finally {
      setExportLoading(prev => ({ ...prev, salary: false }));
    }
  };

  // Alternative: Use backend API for salary report (if you prefer server-side generation)
  const exportSalaryReportBackend = async () => {
    if (!salaryMonth) {
      alert('Please select a month for salary report');
      return;
    }

    setExportLoading(prev => ({ ...prev, salary: true }));
    try {
      const year = new Date(salaryMonth).getFullYear();
      const month = new Date(salaryMonth).getMonth() + 1;

      const response = await employeeAPI.exportSalaryReport({
        month: month,
        year: year,
        format: 'excel'
      });

      if (response.data && response.data.size > 0) {
        const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `salary_report_${salaryMonth}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        alert('Salary report exported successfully!');
      } else {
        // Fallback to frontend generation if backend returns no data
        alert('No data from backend, using frontend generation...');
        exportSalaryReport();
      }
    } catch (error) {
      console.error('Backend salary export failed, using frontend:', error);
      // Fallback to frontend generation
      exportSalaryReport();
    }
  };

  const ReportCard = ({ title, description, icon, onAction, actionText, loading, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-slate-600 text-sm mt-1">{description}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          {icon}
        </div>
      </div>
      
      {children}
      
      <button
        onClick={onAction}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 mt-4"
      >
        {loading ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
        <span>{actionText}</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard
          title="Employee Master List"
          description="Export complete employee database with all details"
          icon={<Users className="w-6 h-6 text-blue-600" />}
          onAction={exportToExcel}
          actionText="Export Excel"
          loading={exportLoading.employee}
        />

        <ReportCard
          title="Attendance Report"
          description="Export attendance records for selected period"
          icon={<Calendar className="w-6 h-6 text-green-600" />}
          onAction={exportAttendanceReport}
          actionText="Export Attendance"
          loading={exportLoading.attendance}
        >
          <div className="space-y-2 mt-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={attendanceStartDate}
                onChange={(e) => setAttendanceStartDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={attendanceEndDate}
                onChange={(e) => setAttendanceEndDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </ReportCard>

        <ReportCard
          title="Salary Report"
          description="Export detailed salary calculations and payslips"
          icon={<FileText className="w-6 h-6 text-purple-600" />}
          onAction={exportSalaryReport} // Use exportSalaryReportBackend if you prefer backend generation
          actionText="Export Salary Report"
          loading={exportLoading.salary}
        >
          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Month</label>
            <input
              type="month"
              value={salaryMonth}
              onChange={(e) => setSalaryMonth(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </ReportCard>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">{employees.length}</div>
          <div className="text-sm text-slate-600">Total Employees</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {employees.filter(e => e.status === 'Active').length}
          </div>
          <div className="text-sm text-slate-600">Active Employees</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
          <div className="text-2xl font-bold text-orange-600">
            {employees.filter(e => e.probationEndDate && new Date() < new Date(e.probationEndDate)).length}
          </div>
          <div className="text-sm text-slate-600">In Probation</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {employees.filter(e => e.status === 'Inactive').length}
          </div>
          <div className="text-sm text-slate-600">Inactive Employees</div>
        </div>
      </div>
    </div>
  );
};

export default ReportsSection;