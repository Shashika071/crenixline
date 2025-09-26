// components/PayrollManagement.jsx

import { Calendar, DollarSign, Download, FileText, Filter, Search, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { employeeAPI } from '../../services/api';
import { generateSalaryPdf } from './PdfSalarySheet';

const PayrollManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [salaryReports, setSalaryReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSalary, setEmployeeSalary] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      calculateAllSalaries();
    }
  }, [selectedMonth, employees]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      setEmployees(response.data.data.filter(emp => emp.status === 'Active'));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Calculate overtime rate and normal time rate
  const calculateRates = (basicSalary, workingDays) => {
    const overtimeRate = basicSalary / (30 * 8) * 1.5;
    const normalTimeRate = basicSalary / (workingDays * 8);
    return { overtimeRate, normalTimeRate };
  };

  // Calculate current net salary based on the formula
  const calculateCurrentNetSalary = (employee, salaryData) => {
    if (!salaryData) return 0;
    
    const basicSalary = employee.salary || 0;
    const workingDays = salaryData.totalWorkingDays || 0;
    const paidDays = salaryData.paidDays || 0;
    const overtimeHours = salaryData.totalOvertimeHours || 0;
    
    const { overtimeRate, normalTimeRate } = calculateRates(basicSalary, workingDays);
    
    // Current Net Salary = (Paid Days * 8 * normalTimeRate) + (Overtime Hours * overtimeRate)
    const normalSalary = paidDays * 8 * normalTimeRate;
    const overtimeSalary = overtimeHours * overtimeRate;
    
    return normalSalary + overtimeSalary;
  };

  const calculateAllSalaries = async () => {
    try {
      setLoading(true);
      const reports = [];
      
      for (const employee of employees) {
        try {
          const response = await employeeAPI.calculateSalary({
            employeeId: employee._id,
            month: new Date(selectedMonth).getMonth() + 1,
            year: new Date(selectedMonth).getFullYear()
          });
          
          const salaryData = response.data.data;
          // Calculate current net salary for each employee
          const currentNetSalary = calculateCurrentNetSalary(employee, salaryData);
          
          reports.push({
            employee,
            salaryData: {
              ...salaryData,
              currentNetSalary // Add calculated current net salary
            }
          });
        } catch (error) {
          console.error(`Error calculating salary for ${employee.name}:`, error);
          reports.push({
            employee,
            salaryData: null,
            error: error.response?.data?.message || 'Calculation failed'
          });
        }
      }
      
      setSalaryReports(reports);
    } catch (error) {
      console.error('Error calculating salaries:', error);
    } finally {
      setLoading(false);
    }
  };
 
 

  const totalPayroll = salaryReports.reduce((sum, report) => 
    sum + (report.salaryData?.currentNetSalary || 0), 0
  );

  const totalEmployees = salaryReports.length;
  const employeesWithSalary = salaryReports.filter(r => r.salaryData).length;

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="text-lg font-semibold">Payroll Management</h3>
            <p className="text-slate-600">Salary calculations for {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payroll Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex items-end">
              
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="text-2xl font-bold">Rs. {totalPayroll.toLocaleString()}</div>
          <div className="text-blue-100">Total Payroll</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="text-2xl font-bold">{employeesWithSalary}</div>
          <div className="text-green-100">Employees Paid</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
          <div className="text-2xl font-bold">{totalEmployees}</div>
          <div className="text-purple-100">Total Employees</div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6">
          <div className="text-2xl font-bold">Rs. {Math.round(totalPayroll / employeesWithSalary || 0).toLocaleString()}</div>
          <div className="text-orange-100">Average Salary</div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Employee Payroll</h3>
          <span className="text-sm text-slate-600">
            {employeesWithSalary} of {totalEmployees} employees calculated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Basic Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Working Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Paid Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Overtime</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Current Net Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {salaryReports.map(({ employee, salaryData, error }) => (
                <tr key={employee._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{employee.name}</div>
                    <div className="text-sm text-slate-500">{employee.employmentStatus}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{employee.role}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    Rs. {employee.salary?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {salaryData ? salaryData.totalWorkingDays : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {salaryData ? (
                      <span className={salaryData.paidDays < salaryData.totalWorkingDays ? "text-orange-600" : "text-green-600"}>
                        {salaryData.paidDays}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {salaryData ? `${salaryData.totalOvertimeHours}h` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {salaryData ? (
                      <span className="font-bold text-green-600">
                        Rs. {salaryData.currentNetSalary?.toLocaleString()}
                      </span>
                    ) : error ? (
                      <span className="text-red-600 text-sm">{error}</span>
                    ) : (
                      <span className="text-slate-400">Calculating...</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 mt-2">Calculating payroll...</p>
          </div>
        )}
      </div>

      {/* Employee Salary Detail Modal */}
      {selectedEmployee && employeeSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Salary Details - {selectedEmployee.name}</h3>
                  <p className="text-slate-600">
                    {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedEmployee(null);
                    setEmployeeSalary(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-slate-600">Basic Salary</div>
                  <div className="text-lg font-bold">Rs. {selectedEmployee.salary?.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-slate-600">Working Days</div>
                  <div className="text-lg font-bold">{employeeSalary.totalWorkingDays}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-slate-600">Paid Days</div>
                  <div className="text-lg font-bold text-green-600">{employeeSalary.paidDays}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-slate-600">Overtime Hours</div>
                  <div className="text-lg font-bold">{employeeSalary.totalOvertimeHours || 0}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-slate-600">Normal Time Rate</div>
                  <div className="text-lg font-bold">Rs. {calculateRates(selectedEmployee.salary, employeeSalary.totalWorkingDays).normalTimeRate.toFixed(2)}/hour</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-slate-600">Overtime Rate</div>
                  <div className="text-lg font-bold">Rs. {calculateRates(selectedEmployee.salary, employeeSalary.totalWorkingDays).overtimeRate.toFixed(2)}/hour</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Current Net Salary Payable:</span>
                  <span className="text-green-600">Rs. {employeeSalary.currentNetSalary?.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => downloadEmployeePayslip(selectedEmployee, employeeSalary)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <FileText size={16} />
                  <span>Download Payslip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;