// components/EmployeeManagement.jsx

import * as XLSX from 'xlsx';

import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  Filter,
  Loader,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
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
  
  // Attendance states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryData, setSalaryData] = useState(null);

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
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error saving employee: ' + error.response?.data?.message || error.message);
    }
  };

  // Attendance functions
  const handleMarkAttendance = (employee) => {
    setSelectedEmployee(employee);
    setShowAttendanceModal(true);
  };

  const handleSubmitAttendance = async (attendanceData) => {
    try {
      await employeeAPI.markAttendance({
        employeeId: selectedEmployee._id,
        ...attendanceData
      });
      setShowAttendanceModal(false);
      setSelectedEmployee(null);
      fetchEmployees(); // Refresh to get updated attendance
      alert('Attendance marked successfully!');
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error marking attendance: ' + error.response?.data?.message || error.message);
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

  // Export functions
  const exportToExcel = () => {
    const data = employees.map(emp => ({
      Name: emp.name,
      NIC: emp.nic,
      Address: emp.address,
      "Contact No": emp.contactNo,
      Role: emp.role,
      Salary: emp.salary,
      "Hourly Rate": emp.hourlyRate,
      "Overtime Rate": emp.overtimeRate,
      Status: emp.status,
      "Join Date": new Date(emp.joinDate).toLocaleDateString('en-CA')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    
    // Set column widths
    const wscols = [
      {wch: 20}, {wch: 15}, {wch: 30}, {wch: 15}, 
      {wch: 15}, {wch: 12}, {wch: 12}, {wch: 12}, 
      {wch: 10}, {wch: 12}
    ];
    ws['!cols'] = wscols;
    
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

      // Create blob and download
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
          <p className="text-slate-600 mt-1">Manage your factory workforce</p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button 
            onClick={() => setShowSalaryModal(true)}
            className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <DollarSign size={16} />
            <span>Salary Report</span>
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
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role & Salary</th>
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

      {/* Add/Edit Modal */}
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

      {/* Attendance Modal */}
      {showAttendanceModal && selectedEmployee && (
        <AttendanceModal 
          employee={selectedEmployee}
          onSubmit={handleSubmitAttendance}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      {/* Salary Modal */}
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

      {/* Attendance Data Modal */}
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

const EmployeeRow = ({ employee, onEdit, onDelete, onMarkAttendance, onViewAttendance, onCalculateSalary }) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {employee.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-slate-900">{employee.name}</div>
          <div className="text-sm text-slate-500">NIC: {employee.nic}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm text-slate-900 flex items-center space-x-1">
        <Phone size={14} />
        <span>{employee.contactNo}</span>
      </div>
      <div className="text-sm text-slate-500 flex items-center space-x-1 mt-1">
        <MapPin size={14} />
        <span className="truncate max-w-xs">{employee.address}</span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm font-medium text-slate-900">{employee.role}</div>
      <div className="text-sm text-slate-500">Rs. {employee.salary?.toLocaleString()}</div>
      <div className="text-xs text-slate-400">Rate: Rs. {employee.hourlyRate?.toFixed(2)}/hr</div>
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
          className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-2 rounded-lg transition-colors"
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

const EmployeeStats = ({ employees }) => {
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'Active').length,
    onLeave: employees.filter(e => e.status === 'On Leave').length,
    inactive: employees.filter(e => e.status === 'Inactive').length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

// Employee Modal Component (Add/Edit)
const EmployeeModal = ({ employee, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    nic: employee?.nic || '',
    address: employee?.address || '',
    contactNo: employee?.contactNo || '',
    role: employee?.role || 'Tailor',
    salary: employee?.salary || '',
    status: employee?.status || 'Active',
    joinDate: employee?.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">NIC Number</label>
              <input
                type="text"
                required
                value={formData.nic}
                onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
              <input
                type="tel"
                required
                value={formData.contactNo}
                onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Salary (Rs.)</label>
              <input
                type="number"
                required
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Join Date</label>
              <input
                type="date"
                required
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              {employee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Attendance Modal Component
const AttendanceModal = ({ employee, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:00',
    checkOut: '17:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    status: 'Present',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Mark Attendance - {employee.name}
          </h2>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Check In</label>
              <input
                type="time"
                required
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
              <option value="Leave">Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              rows="3"
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

// Salary Report Modal
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
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Basic Salary:</span>
                <span className="font-semibold">Rs. {salaryData.basicSalary?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Working Days:</span>
                <span>{salaryData.presentDays}/{salaryData.totalWorkingDays}</span>
              </div>
              <div className="flex justify-between">
                <span>Overtime Hours:</span>
                <span>{salaryData.totalOvertimeHours}</span>
              </div>
              <div className="flex justify-between">
                <span>Overtime Pay:</span>
                <span className="font-semibold">Rs. {salaryData.overtimePay?.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total Salary:</span>
                <span className="text-green-600">Rs. {salaryData.totalSalary?.toLocaleString()}</span>
              </div>
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

// Attendance Data Modal
const AttendanceDataModal = ({ employee, attendanceData, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Attendance - {employee.name}
          </h2>
        </div>
        
        <div className="p-6">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Check In</th>
                <th className="px-4 py-2 text-left">Check Out</th>
                <th className="px-4 py-2 text-left">Total Hours</th>
                <th className="px-4 py-2 text-left">Overtime</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}</td>
                  <td className="px-4 py-2">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}</td>
                  <td className="px-4 py-2">{record.totalHours || 0}</td>
                  <td className="px-4 py-2">{record.overtimeHours || 0}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.status === 'Present' ? 'bg-green-100 text-green-800' :
                      record.status === 'Absent' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
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