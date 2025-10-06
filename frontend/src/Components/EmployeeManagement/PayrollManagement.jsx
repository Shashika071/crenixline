// components/PayrollManagement.jsx

import { Calendar, DollarSign, Download, FileText, Filter, Search, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { employeeAPI } from '../../services/api';

const PayrollManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [salaryReports, setSalaryReports] = useState([]);
  const [factoryClosures, setFactoryClosures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchEmployees();
    fetchFactoryClosures();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      calculateAllSalaries();
    }
  }, [selectedMonth, employees, factoryClosures]);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      setEmployees(response.data.data.filter(emp => emp.status === 'Active'));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchFactoryClosures = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees/factory-closures');
      const data = await response.json();
      if (data.success) {
        setFactoryClosures(data.data);
      }
    } catch (error) {
      console.error('Error fetching factory closures:', error);
    }
  };

  const calculateActualWorkingDays = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    let workingDays = 0;

    const closuresForMonth = factoryClosures.filter(closure => {
      const closureDate = new Date(closure.date);
      return closure.status === 'Active' &&
             closureDate.getFullYear() === year &&
             closureDate.getMonth() + 1 === month;
    });

    const closureDates = closuresForMonth.map(closure => 
      new Date(closure.date).getDate()
    );

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek !== 0 && !closureDates.includes(day)) {
        workingDays++;
      }
    }

    return {
      totalDays: daysInMonth,
      workingDays,
      sundays: Math.floor(daysInMonth / 7) + (new Date(year, month - 1, 1).getDay() === 0 ? 1 : 0),
      factoryClosures: closuresForMonth.length,
      closuresForMonth
    };
  };

  const calculateAllSalaries = async () => {
    try {
      setLoading(true);
      const reports = [];
      const monthInfo = calculateActualWorkingDays();
      
      for (const employee of employees) {
        try {
          const response = await employeeAPI.calculateSalary({
            employeeId: employee._id,
            month: new Date(selectedMonth).getMonth() + 1,
            year: new Date(selectedMonth).getFullYear()
          });
          
          const salaryData = response.data.data;
          
          reports.push({
            employee,
            salaryData: {
              ...salaryData,
              monthInfo
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
  const monthInfo = calculateActualWorkingDays();

  // Component for paid days breakdown with better styling
  const PaidDaysBreakdown = ({ breakdown }) => {
    if (!breakdown) return null;
    
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs font-medium text-slate-700">N:{breakdown.normal}</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-xs font-medium text-slate-700">S:{breakdown.sunday}</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-xs font-medium text-slate-700">H:{breakdown.holiday}</span>
        </div>
      </div>
    );
  };

  // Component for salary breakdown
  const SalaryBreakdown = ({ components }) => {
    if (!components) return null;
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Normal:</span>
          <span className="font-medium">Rs. {components.normalSalary?.toLocaleString()}</span>
        </div>
        {components.sundaySalary > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-blue-600">Sunday:</span>
            <span className="font-medium text-blue-600">+ Rs. {components.sundaySalary?.toLocaleString()}</span>
          </div>
        )}
        {components.holidaySalary > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-purple-600">Holiday:</span>
            <span className="font-medium text-purple-600">+ Rs. {components.holidaySalary?.toLocaleString()}</span>
          </div>
        )}
        {components.overtimeSalary > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-orange-600">Overtime:</span>
            <span className="font-medium text-orange-600">+ Rs. {components.overtimeSalary?.toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h3 className="text-lg font-semibold">Payroll Management</h3>
            <p className="text-slate-600">Current Net Salary for {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
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
          </div>
        </div>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
          <div className="text-2xl font-bold">Rs. {totalPayroll.toLocaleString()}</div>
          <div className="text-blue-100">Total Current Salary</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
          <div className="text-2xl font-bold">{employeesWithSalary}</div>
          <div className="text-green-100">Employees Calculated</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
          <div className="text-2xl font-bold">{totalEmployees}</div>
          <div className="text-purple-100">Total Employees</div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-6">
          <div className="text-2xl font-bold">{monthInfo.workingDays}</div>
          <div className="text-red-100">
            Available Days
            <div className="text-xs opacity-90">
              {monthInfo.sundays} Sundays + {monthInfo.factoryClosures} closures
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-slate-700">N: Normal Days</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-slate-700">S: Sunday Work</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-slate-700">H: Holiday Work</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-slate-700">OT: Overtime</span>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Employee Current Net Salary</h3>
          <span className="text-sm text-slate-600">
            {employeesWithSalary} of {totalEmployees} employees • {monthInfo.workingDays} available days
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Basic Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Available Days</th>
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
                    {salaryData ? (
                      <div className="text-center">
                        <div className="text-green-600 font-bold text-lg">
                          {salaryData.availableWorkingDays}
                        </div>
                        <div className="text-xs text-slate-500">
                          Available
                        </div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {salaryData ? (
                      <div className="space-y-2">
                        <div className="text-center">
                          <span className="font-bold text-slate-900 text-lg">
                            {salaryData.paidDays}
                          </span>
                          <div className="text-xs text-slate-500">Total</div>
                        </div>
                        <PaidDaysBreakdown breakdown={salaryData.paidDaysBreakdown} />
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {salaryData ? (
                      <div className="text-center">
                        {salaryData.totalOvertimeHours > 0 ? (
                          <>
                            <div className="font-bold text-orange-600 text-lg">
                              {salaryData.totalOvertimeHours}h
                            </div>
                            <div className="text-xs text-orange-600 font-medium">
                              +Rs. {salaryData.salaryComponents?.overtimeSalary?.toLocaleString()}
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-400 text-sm">No OT</div>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {salaryData ? (
                      <div className="space-y-2">
                        <div className="text-center">
                          <span className="font-bold text-green-600 text-xl">
                            Rs. {salaryData.currentNetSalary?.toLocaleString()}
                          </span>
                        </div>
                        <SalaryBreakdown components={salaryData.salaryComponents} />
                      </div>
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
            <p className="text-slate-600 mt-2">Calculating salaries...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollManagement;