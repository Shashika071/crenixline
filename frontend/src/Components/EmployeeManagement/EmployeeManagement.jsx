// components/EmployeeManagement.jsx

import * as XLSX from 'xlsx';

import {
  AlertTriangle,
  BarChart3,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit,
  Eye,
  Filter,
  Loader,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  Upload,
  User,
  UserCheck,
  Users,
  XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { employeeAPI } from '../../services/api';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Modals
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showFactoryClosureModal, setShowFactoryClosureModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryData, setSalaryData] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [showLeaveBalancesModal, setShowLeaveBalancesModal] = useState(false);

  // Date filters
  const [attendanceStartDate, setAttendanceStartDate] = useState('');
  const [attendanceEndDate, setAttendanceEndDate] = useState('');
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeAPI.delete(id);
        setEmployees(employees.filter(emp => emp._id !== id));
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowAddModal(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingEmployee) {
        await employeeAPI.update(editingEmployee._id, formData);
        setEmployees(employees.map(emp => 
          emp._id === editingEmployee._id ? { ...emp, ...formData } : emp
        ));
      } else {
        const response = await employeeAPI.create(formData);
        setEmployees([...employees, response.data.data]);
      }
      setShowAddModal(false);
      setEditingEmployee(null);
      fetchEmployees(); // Refresh the list
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error saving employee: ' + error.response?.data?.message || error.message);
    }
  };

  // Enhanced Attendance Function
  const handleMarkAttendance = async (employee) => {
    setSelectedEmployee(employee);
    try {
      const response = await employeeAPI.getLeaveBalances(employee._id);
      setLeaveBalances(response.data.data);
      setShowAttendanceModal(true);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      setShowAttendanceModal(true);
    }
  };

 
const handleSubmitAttendance = async (attendanceData) => {
  try {
    const response = await employeeAPI.markAttendance({
      employeeId: selectedEmployee._id,
      ...attendanceData
    });
    
    setShowAttendanceModal(false);
    setSelectedEmployee(null);
    setLeaveBalances(null);
    fetchEmployees();
    
    let message = 'Attendance marked successfully!';
    if (response.data.message) {
      message += `\n${response.data.message}`;
    }
    
    if (response.data.leaveBalance) {
      message += `\n\nLeave Balances:\n` +
        `Medical: ${response.data.leaveBalance.medical} days remaining\n` +
        (response.data.leaveBalance.isInProbation ? 
          `Probation Leaves: ${response.data.leaveBalance.probation} remaining` :
          `Annual Leaves: ${response.data.leaveBalance.annual} days remaining`);
    }
    
    alert(message);
  } catch (error) {
    console.error('Error marking attendance:', error);
    alert('Error marking attendance: ' + error.response?.data?.message || error.message);
  }
};

  // Factory Closure Functions
  const handleCreateFactoryClosure = async (closureData) => {
    try {
      await employeeAPI.createFactoryClosure(closureData);
      setShowFactoryClosureModal(false);
      alert('Factory closure recorded successfully!');
    } catch (error) {
      console.error('Error creating factory closure:', error);
      alert('Error: ' + error.response?.data?.message || error.message);
    }
  };

  const handleViewAttendance = async (employee) => {
    setSelectedEmployee(employee);
    try {
      const response = await employeeAPI.getAttendance({
        employeeId: employee._id,
        startDate: attendanceStartDate,
        endDate: attendanceEndDate
      });
      setAttendanceData(response.data.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleCalculateSalary = async (employee) => {
    setSelectedEmployee(employee);
    try {
      const response = await employeeAPI.calculateSalary({
        employeeId: employee._id,
        month: new Date(salaryMonth).getMonth() + 1,
        year: new Date(salaryMonth).getFullYear()
      });
      setSalaryData(response.data.data);
      setShowSalaryModal(true);
    } catch (error) {
      console.error('Error calculating salary:', error);
      alert('Error calculating salary: ' + error.response?.data?.message || error.message);
    }
  };

  const handleViewLeaveBalances = async (employee) => {
    setSelectedEmployee(employee);
    try {
      const response = await employeeAPI.getLeaveBalances(employee._id);
      setLeaveBalances(response.data.data);
      setShowLeaveBalancesModal(true);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
    }
  };

  // Export functions
  const exportToExcel = () => {
    const data = employees.map(emp => ({
      'Employee Name': emp.name,
      'NIC': emp.nic,
      'Role': emp.role,
      'Basic Salary': emp.salary,
      'Status': emp.status,
      'Employment Status': emp.employmentStatus,
      'Bank Name': emp.bankDetails?.bankName || 'N/A',
      'Account Number': emp.bankDetails?.accountNumber || 'N/A',
      'Branch': emp.bankDetails?.branch || 'N/A',
      'Join Date': new Date(emp.joinDate).toLocaleDateString('en-CA'),
      'Probation End Date': emp.probationEndDate ? new Date(emp.probationEndDate).toLocaleDateString('en-CA') : 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportAttendanceReport = async () => {
    setExportLoading(true);
    try {
      const response = await employeeAPI.exportAttendance({
        startDate: attendanceStartDate,
        endDate: attendanceEndDate,
        format: 'excel'
      });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_report_${attendanceStartDate || 'all'}_to_${attendanceEndDate || 'all'}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting attendance:', error);
      alert('Error exporting attendance report');
    } finally {
      setExportLoading(false);
    }
  };

  const exportSalaryReport = async () => {
    setExportLoading(true);
    try {
      const response = await employeeAPI.exportSalaryReport({
        month: new Date(salaryMonth).getMonth() + 1,
        year: new Date(salaryMonth).getFullYear(),
        format: 'excel'
      });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `salary_report_${salaryMonth}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting salary report:', error);
      alert('Error exporting salary report');
    } finally {
      setExportLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.nic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || employee.role === filterRole;
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Management</h1>
          <p className="text-slate-600 mt-1">Complete workforce management with bank details & leave tracking</p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button 
            onClick={() => setShowFactoryClosureModal(true)}
            className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <Building size={16} />
            <span>Factory Closure</span>
          </button>
          <button 
            onClick={() => {
              setEditingEmployee(null);
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <EmployeeStats employees={employees} />

      {/* Report Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Reports & Exports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Attendance Period</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={attendanceStartDate}
                onChange={(e) => setAttendanceStartDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
              />
              <input
                type="date"
                value={attendanceEndDate}
                onChange={(e) => setAttendanceEndDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Salary Month</label>
            <input
              type="month"
              value={salaryMonth}
              onChange={(e) => setSalaryMonth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button 
              onClick={exportAttendanceReport}
              disabled={exportLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {exportLoading ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
              <span>Export Attendance</span>
            </button>
            <button 
              onClick={exportSalaryReport}
              disabled={exportLoading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {exportLoading ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
              <span>Export Salary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-64"
              />
            </div>
            
            <div className="flex space-x-4">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Roles</option>
                <option value="Tailor">Tailor</option>
                <option value="Cutter">Cutter</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Quality Checker">Quality Checker</option>
                <option value="Packer">Packer</option>
                <option value="Manager">Manager</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-slate-600">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">Employee List</h2>
          <div className="flex space-x-2">
            <button 
              onClick={exportToExcel}
              disabled={exportLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportLoading ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span>Export Excel</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employment</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role & Salary</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bank Details</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredEmployees.map((employee) => (
                <EmployeeRow 
                  key={employee._id} 
                  employee={employee} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onMarkAttendance={handleMarkAttendance}
                  onViewAttendance={handleViewAttendance}
                  onCalculateSalary={handleCalculateSalary}
                  onViewLeaveBalances={handleViewLeaveBalances}
                />
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No employees found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <EmployeeModal 
          employee={editingEmployee}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowAddModal(false);
            setEditingEmployee(null);
          }}
        />
      )}

      {showAttendanceModal && selectedEmployee && (
        <AttendanceModal 
          employee={selectedEmployee}
          leaveBalances={leaveBalances}
          onSubmit={handleSubmitAttendance}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedEmployee(null);
            setLeaveBalances(null);
          }}
        />
      )}

      {showFactoryClosureModal && (
        <FactoryClosureModal 
          employees={employees}
          onSubmit={handleCreateFactoryClosure}
          onClose={() => setShowFactoryClosureModal(false)}
        />
      )}

      {showSalaryModal && (
        <SalaryReportModal 
          salaryData={salaryData}
          employee={selectedEmployee}
          month={salaryMonth}
          onClose={() => {
            setShowSalaryModal(false);
            setSelectedEmployee(null);
            setSalaryData(null);
          }}
        />
      )}

      {showLeaveBalancesModal && selectedEmployee && leaveBalances && (
        <LeaveBalancesModal 
          employee={selectedEmployee}
          leaveBalances={leaveBalances}
          onClose={() => {
            setShowLeaveBalancesModal(false);
            setSelectedEmployee(null);
            setLeaveBalances(null);
          }}
        />
      )}

      {attendanceData.length > 0 && selectedEmployee && (
        <AttendanceDataModal 
          employee={selectedEmployee}
          attendanceData={attendanceData}
          onClose={() => {
            setAttendanceData([]);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
};

// Employee Row Component
const EmployeeRow = ({ employee, onEdit, onDelete, onMarkAttendance, onViewAttendance, onCalculateSalary, onViewLeaveBalances }) => {
  const isInProbation = new Date() < new Date(employee.probationEndDate);
  
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isInProbation ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-blue-400 to-purple-500'
          }`}>
            <span className="text-white font-medium text-sm">
              {employee.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{employee.name}</div>
            <div className="text-sm text-slate-500">NIC: {employee.nic}</div>
            <div className="text-xs text-slate-400">{employee.contactNo}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900">{employee.employmentStatus}</div>
        <div className="text-sm text-slate-500">
          {isInProbation ? 'Probation' : 'Confirmed'}
        </div>
        {isInProbation && (
          <div className="text-xs text-orange-600">
            Ends: {new Date(employee.probationEndDate).toLocaleDateString()}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900">{employee.role}</div>
        <div className="text-sm text-slate-500">
          <span className="font-semibold">Basic: Rs. {employee.salary?.toLocaleString()}</span>
        </div>
        <div className="text-xs text-slate-400">
          Hourly: Rs. {employee.hourlyRate?.toFixed(2)} | OT: Rs. {employee.overtimeRate?.toFixed(2)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {employee.bankDetails ? (
          <div>
            <div className="text-sm font-medium text-slate-900">{employee.bankDetails.bankName}</div>
            <div className="text-sm text-slate-500">A/C: ••••{employee.bankDetails.accountNumber?.slice(-4)}</div>
            <div className="text-xs text-slate-400">{employee.bankDetails.branch}</div>
          </div>
        ) : (
          <div className="text-sm text-slate-400">No bank details</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
          employee.status === 'Active' 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : employee.status === 'On Leave'
            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
            : 'bg-red-100 text-red-800 border-red-200'
        }`}>
          {employee.status === 'Active' ? <CheckCircle size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
          {employee.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-500">
          {new Date(employee.joinDate).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onViewLeaveBalances(employee)}
            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-2 rounded-lg transition-colors"
            title="View Leave Balances"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => onMarkAttendance(employee)}
            className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors"
            title="Mark Attendance"
          >
            <UserCheck size={16} />
          </button>
          <button 
            onClick={() => onViewAttendance(employee)}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
            title="View Attendance"
          >
            <Calendar size={16} />
          </button>
          <button 
            onClick={() => onCalculateSalary(employee)}
            className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 p-2 rounded-lg transition-colors"
            title="Calculate Salary"
          >
            <DollarSign size={16} />
          </button>
          <button 
            onClick={() => onEdit(employee)}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(employee._id)}
            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Statistics Component
const EmployeeStats = ({ employees }) => {
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'Active').length,
    onLeave: employees.filter(e => e.status === 'On Leave').length,
    inactive: employees.filter(e => e.status === 'Inactive').length,
    probation: employees.filter(e => new Date() < new Date(e.probationEndDate)).length,
    confirmed: employees.filter(e => new Date() >= new Date(e.probationEndDate)).length
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      <StatCard
        title="Total Employees"
        value={stats.total}
        icon={<Users className="w-6 h-6" />}
        color="from-blue-500 to-blue-600"
      />
      <StatCard
        title="Active"
        value={stats.active}
        percentage={(stats.active / stats.total * 100).toFixed(1)}
        icon={<CheckCircle className="w-6 h-6" />}
        color="from-green-500 to-green-600"
      />
      <StatCard
        title="On Leave"
        value={stats.onLeave}
        icon={<Clock className="w-6 h-6" />}
        color="from-yellow-500 to-yellow-600"
      />
      <StatCard
        title="Inactive"
        value={stats.inactive}
        icon={<XCircle className="w-6 h-6" />}
        color="from-red-500 to-red-600"
      />
      <StatCard
        title="Probation"
        value={stats.probation}
        icon={<AlertTriangle className="w-6 h-6" />}
        color="from-orange-500 to-orange-600"
      />
      <StatCard
        title="Confirmed"
        value={stats.confirmed}
        icon={<UserCheck className="w-6 h-6" />}
        color="from-purple-500 to-purple-600"
      />
    </div>
  );
};

const StatCard = ({ title, value, percentage, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {percentage && <p className="text-sm text-green-600 mt-1">{percentage}% of total</p>}
      </div>
      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

// Employee Modal Component with Bank Details
const EmployeeModal = ({ employee, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    nic: employee?.nic || '',
    address: employee?.address || '',
    contactNo: employee?.contactNo || '',
    role: employee?.role || 'Tailor',
    salary: employee?.salary || '',
    status: employee?.status || 'Active',
    joinDate: employee?.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    // Bank Details
    bankDetails: {
      accountNumber: employee?.bankDetails?.accountNumber || '',
      bankName: employee?.bankDetails?.bankName || '',
      branch: employee?.bankDetails?.branch || '',
      accountType: employee?.bankDetails?.accountType || 'Savings',
      ifscCode: employee?.bankDetails?.ifscCode || ''
    },
    // Emergency Contact
    emergencyContact: {
      name: employee?.emergencyContact?.name || '',
      relationship: employee?.emergencyContact?.relationship || '',
      phone: employee?.emergencyContact?.phone || ''
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleBankDetailChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value
      }
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIC Number *</label>
                <input
                  type="text"
                  required
                  value={formData.nic}
                  onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.contactNo}
                  onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="Tailor">Tailor</option>
                  <option value="Cutter">Cutter</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Quality Checker">Quality Checker</option>
                  <option value="Packer">Packer</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Basic Salary (Rs.) *</label>
                <input
                  type="number"
                  required
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Monthly basic salary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Join Date *</label>
                <input
                  type="date"
                  required
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  required
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) => handleBankDetailChange('accountNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  value={formData.bankDetails.bankName}
                  onChange={(e) => handleBankDetailChange('bankName', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Branch *</label>
                <input
                  type="text"
                  required
                  value={formData.bankDetails.branch}
                  onChange={(e) => handleBankDetailChange('branch', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                <select
                  value={formData.bankDetails.accountType}
                  onChange={(e) => handleBankDetailChange('accountType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                  <option value="Salary">Salary</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) => handleBankDetailChange('ifscCode', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-800">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Optional"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                <input
                  type="text"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Spouse, Parent, Sibling"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              {employee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced Attendance Modal with Medical Leave Option for Probation
const AttendanceModal = ({ employee, leaveBalances, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:00',
    checkOut: '12:00', // Default to half day end time
    breakStart: '',
    breakEnd: '',
    status: 'Present',
    notes: '',
    isHalfDay: false,
    isMedical: false
  });

  const isInProbation = leaveBalances?.isInProbation || false;

  // Handle status changes
  const handleStatusChange = (newStatus) => {
    if (newStatus === 'Half Day') {
      setFormData(prev => ({
        ...prev,
        status: 'Half Day',
        isHalfDay: true,
        checkOut: '12:00',
        breakStart: '',
        breakEnd: ''
      }));
    } else if (newStatus === 'Medical Leave') {
      setFormData(prev => ({
        ...prev,
        status: 'Medical Leave',
        isMedical: true,
        isHalfDay: false,
        checkIn: '',
        checkOut: '',
        breakStart: '',
        breakEnd: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        status: newStatus,
        isHalfDay: false,
        isMedical: false,
        checkOut: newStatus === 'Present' ? '17:00' : '',
        checkIn: newStatus === 'Present' ? '08:00' : '',
        breakStart: newStatus === 'Present' ? '12:00' : '',
        breakEnd: newStatus === 'Present' ? '13:00' : ''
      }));
    }
  };

  // Handle half day toggle
  const handleHalfDayToggle = (checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        isHalfDay: true,
        status: prev.isMedical ? 'Medical Leave' : 'Half Day',
        checkOut: '12:00',
        breakStart: '',
        breakEnd: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        isHalfDay: false,
        status: prev.isMedical ? 'Medical Leave' : 'Present',
        checkOut: '17:00'
      }));
    }
  };

  // Handle medical leave toggle
  const handleMedicalToggle = (checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        isMedical: true,
        status: prev.isHalfDay ? 'Half Day' : 'Medical Leave',
        checkIn: prev.isHalfDay ? '08:00' : '',
        checkOut: prev.isHalfDay ? '12:00' : '',
        breakStart: '',
        breakEnd: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        isMedical: false,
        status: prev.isHalfDay ? 'Half Day' : 'Present',
        checkIn: prev.isHalfDay ? '08:00' : '08:00',
        checkOut: prev.isHalfDay ? '12:00' : '17:00',
        breakStart: prev.isHalfDay ? '' : '12:00',
        breakEnd: prev.isHalfDay ? '' : '13:00'
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const selectedDate = new Date(formData.date);
    
    const combineDateTime = (date, timeStr) => {
      if (!timeStr) return null;
      const [hours, minutes] = timeStr.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      return newDate.toISOString();
    };

    // Determine final status based on selections
    let finalStatus = formData.status;
    
    if (formData.isMedical && formData.isHalfDay) {
      finalStatus = 'Half Day'; // Medical half day
    } else if (formData.isMedical) {
      finalStatus = 'Medical Leave'; // Full medical leave
    } else if (formData.isHalfDay) {
      finalStatus = 'Half Day'; // Regular half day
    }

    const attendanceData = {
      date: selectedDate.toISOString(),
      checkIn: (finalStatus === 'Present' || finalStatus === 'Half Day') && formData.checkIn ? 
               combineDateTime(selectedDate, formData.checkIn) : null,
      checkOut: (finalStatus === 'Present' || finalStatus === 'Half Day') && formData.checkOut ? 
                combineDateTime(selectedDate, formData.checkOut) : null,
      breakStart: finalStatus === 'Present' && formData.breakStart ? 
                  combineDateTime(selectedDate, formData.breakStart) : null,
      breakEnd: finalStatus === 'Present' && formData.breakEnd ? 
                combineDateTime(selectedDate, formData.breakEnd) : null,
      status: finalStatus,
      notes: formData.notes,
      isHalfDay: formData.isHalfDay,
      isMedical: formData.isMedical
    };

    onSubmit(attendanceData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Mark Attendance - {employee.name}
          </h2>
          {leaveBalances && (
            <div className="mt-2 text-sm text-slate-600">
              <div className="font-semibold">Leave Balances:</div>
              <div>Medical: {leaveBalances.medical} days remaining</div>
              {isInProbation ? (
                <div>Probation Leaves: {leaveBalances.probation} remaining</div>
              ) : (
                <div>Annual: {leaveBalances.annual} days remaining</div>
              )}
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="Present">Present</option>
              <option value="Leave">Leave</option>
              <option value="Half Day">Half Day</option>
              <option value="Medical Leave">Medical Leave</option>
              <option value="Absent">Absent</option>
            </select>
          </div>

          {/* Show time inputs only for Present or Half Day status */}
          {(formData.status === 'Present' || formData.status === 'Half Day') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check In</label>
                  <input
                    type="time"
                    required={formData.status === 'Present' || formData.status === 'Half Day'}
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check Out</label>
                  <input
                    type="time"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {formData.status === 'Present' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Break Start</label>
                    <input
                      type="time"
                      value={formData.breakStart}
                      onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Break End</label>
                    <input
                      type="time"
                      value={formData.breakEnd}
                      onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Checkboxes for Half Day and Medical Leave */}
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isHalfDay}
                onChange={(e) => handleHalfDayToggle(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-700">Half Day</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isMedical}
                onChange={(e) => handleMedicalToggle(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-700">Medical Leave</span>
            </label>
          </div>

          {/* Status information and warnings */}
          <div className="space-y-2">
            {formData.isMedical && formData.isHalfDay && (
              <div className="bg-purple-50 p-2 rounded-lg">
                <p className="text-xs text-purple-800">
                  💊 Medical Half Day: Will count as 0.5 medical leave
                </p>
              </div>
            )}
            
            {formData.isMedical && !formData.isHalfDay && (
              <div className="bg-blue-50 p-2 rounded-lg">
                <p className="text-xs text-blue-800">
                  💊 Full Medical Leave: Will count as 1 medical leave
                </p>
              </div>
            )}
            
            {!formData.isMedical && formData.isHalfDay && (
              <div className="bg-yellow-50 p-2 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ Regular Half Day: Will count against {isInProbation ? 'probation' : 'annual'} leave balance
                </p>
              </div>
            )}
            
            {formData.status === 'Leave' && !formData.isMedical && (
              <div className="bg-orange-50 p-2 rounded-lg">
                <p className="text-xs text-orange-800">
                  📅 Regular Leave: Will count against {isInProbation ? 'probation' : 'annual'} leave balance
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Mark Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// Factory Closure Modal
const FactoryClosureModal = ({ employees, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: 'Holiday',
    description: '',
    affectedEmployees: [],
    isForAllEmployees: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Record Factory Closure</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Closure Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="Holiday">Holiday</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Power Outage">Power Outage</option>
              <option value="Weather">Weather</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              rows="3"
              placeholder="Describe the reason for closure..."
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isForAllEmployees}
                onChange={(e) => setFormData({ ...formData, isForAllEmployees: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-700">Affects all employees</span>
            </label>
          </div>

          {!formData.isForAllEmployees && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Affected Employees</label>
              <select
                multiple
                value={formData.affectedEmployees}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  affectedEmployees: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg h-32"
              >
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple employees</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Record Closure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

 // Update the SalaryReportModal component
const SalaryReportModal = ({ salaryData, employee, month, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {employee ? `${employee.name} - Salary Report` : 'Salary Report'}
          </h2>
          <p className="text-slate-600">
            {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div className="p-6">
          {salaryData ? (
            <div className="space-y-4">
              {/* Basic Salary Info */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-900">Monthly Basic Salary:</span>
                  <span className="font-bold text-blue-900">Rs. {employee.salary?.toLocaleString()}</span>
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="bg-slate-50 p-3 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-2">Attendance Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Working Days:</span>
                    <span>{salaryData.totalWorkingDays}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Paid Days (Including Approved Leaves):</span>
                    <span className="font-semibold">{salaryData.paidDays}</span>
                  </div>
                  {salaryData.unpaidLeaveDays > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Unpaid Leave Days (Beyond Limits):</span>
                      <span className="font-semibold">{salaryData.unpaidLeaveDays}</span>
                    </div>
                  )}
                  {salaryData.absentDays > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Absent Days (Not Paid):</span>
                      <span className="font-semibold">{salaryData.absentDays}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Salary Calculation */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pro-rated Basic Salary:</span>
                  <span>Rs. {salaryData.basicSalary?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Overtime Hours:</span>
                  <span>{salaryData.totalOvertimeHours} hrs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Overtime Pay (Rs. {employee.overtimeRate?.toFixed(2)}/hr):</span>
                  <span>Rs. {salaryData.overtimePay?.toLocaleString()}</span>
                </div>
              </div>

              {/* Total Salary */}
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Net Salary:</span>
                <span className="text-green-600">Rs. {salaryData.totalSalary?.toLocaleString()}</span>
              </div>

              {/* Leave Policy Info */}
            <div className="bg-gray-50 p-3 rounded-lg mt-2">
  <h4 className="font-semibold text-gray-800 text-sm mb-1">Leave Policy:</h4>
  <p className="text-xs text-gray-600">
    {salaryData.isInProbation ? 
      "Probation: 2 leaves + 2 half leaves per month, 24 medical leaves per year" : 
      "Confirmed: 21 leaves + 24 medical leaves per year"
    }
  </p>
</div>

              {salaryData.isInProbation && (
                <div className="bg-yellow-50 p-2 rounded-lg">
                  <p className="text-xs text-yellow-800 text-center">
                    ⚠️ Employee is in probation period
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Select an employee to calculate salary</p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Leave Balances Modal
const LeaveBalancesModal = ({ employee, leaveBalances, onClose }) => {
  const isInProbation = leaveBalances?.isInProbation || false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Leave Balances - {employee.name}
          </h2>
          <p className="text-slate-600">
            {isInProbation ? 'Probation Period' : 'Confirmed Employee'}
          </p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {/* Medical leaves available for everyone */}
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-semibold text-blue-800">Medical Leaves:</span>
              <span className="font-bold text-blue-800">{leaveBalances.medical} / 24</span>
            </div>
            
            {isInProbation ? (
              <>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="font-semibold text-yellow-800">Probation Leaves:</span>
                  <span className="font-bold text-yellow-800">{leaveBalances.probation} / 2</span>
                </div>
                <p className="text-sm text-yellow-700 text-center">
                  During probation, employees can take maximum 2 regular leaves per month. Medical leaves are available from the start.
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-semibold text-green-800">Annual Leaves:</span>
                  <span className="font-bold text-green-800">{leaveBalances.annual} / 21</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="font-semibold text-purple-800">Half Days:</span>
                  <span className="font-bold text-purple-800">{leaveBalances.halfDays} / 2</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Attendance Data Modal
const AttendanceDataModal = ({ employee, attendanceData, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Attendance Details - {employee.name}
          </h2>
          <p className="text-slate-600">Basic Salary: Rs. {employee.salary?.toLocaleString()} | OT Rate: Rs. {employee.overtimeRate?.toFixed(2)}/hour</p>
        </div>
        
        <div className="p-6">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Day</th>
                <th className="px-4 py-2 text-left">Check In</th>
                <th className="px-4 py-2 text-left">Check Out</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Total Hours</th>
                <th className="px-4 py-2 text-left">Overtime</th>
                <th className="px-4 py-2 text-left">OT Value</th>
                <th className="px-4 py-2 text-left">Notes</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record, index) => {
                const date = new Date(record.date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                const isSaturday = dayName === 'Saturday';
                const scheduledHours = isSaturday ? 5 : 8;
                const otValue = (record.overtimeHours || 0) * employee.overtimeRate;
                
                return (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{date.toLocaleDateString()}</td>
                    <td className="px-4 py-2">{dayName}</td>
                    <td className="px-4 py-2">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}</td>
                    <td className="px-4 py-2">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        record.status === 'Present' ? 'bg-green-100 text-green-800' :
                        record.status === 'Factory Closure' ? 'bg-blue-100 text-blue-800' :
                        record.status === 'Medical Leave' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                        {record.isHalfDay && ' (Half Day)'}
                        {record.isMedical && ' (Medical)'}
                      </span>
                    </td>
                    <td className="px-4 py-2">{record.totalHours || 0}h</td>
                    <td className="px-4 py-2">
                      <span className={record.overtimeHours > 0 ? "text-green-600 font-semibold" : ""}>
                        {record.overtimeHours || 0}h
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {otValue > 0 ? `Rs. ${otValue.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-2">{record.notes || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;