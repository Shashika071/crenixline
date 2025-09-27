import { BarChart3, Calendar, CheckCircle, CreditCard, DollarSign, Download, Loader, TrendingUp, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import AllowanceManagement from './AllowanceManagement';
import AttendanceManagement from './AttendanceManagement';
import AttendanceModal from '../modals/AttendanceModal';
import EmployeeModal from '../modals/EmployeeModal';
import EmployeeStats from './EmployeeStats';
import EmployeeTable from './EmployeeTable';
import FactoryClosureCalendar from './FactoryClosureCalendar';
import FactoryClosureModal from '../modals/FactoryClosureModal';
import LeaveBalancesModal from '../modals/LeaveBalancesModal';
import PayrollManagement from './PayrollManagement';
import ReportsSection from './ReportsSection';
import SalaryAdvanceManagement from './SalaryAdvanceManagement';
import SalaryFinalization from './SalaryFinalization'
import SalaryModal from '../modals/SalaryModal';
import { employeeAPI } from '../../services/api';

const EmployeeManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCalendar, setShowCalendar] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showLeaveBalancesModal, setShowLeaveBalancesModal] = useState(false);
  const [showFactoryClosureModal, setShowFactoryClosureModal] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
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
      } else {
        await employeeAPI.create(formData);
      }
      setShowAddModal(false);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Error saving employee: ' + error.response?.data?.message || error.message);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
     { id: 'payroll', label: 'Payroll', icon: CreditCard },
    { id: 'allowances', label: 'Allowances & Deduction', icon: DollarSign },
    { id: 'advances', label: 'Salary Advances', icon: TrendingUp },
    
    { id: 'finalization', label: 'Salary Finalization', icon: CheckCircle },
   
    { id: 'reports', label: 'Reports', icon: Download },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Employee Management</h1>
              <p className="text-slate-600 mt-1">Complete workforce management system</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowFactoryClosureModal(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 sm:px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
              >
                <Users size={18} />
                <span>Factory Closure</span>
              </button>
              <button 
                onClick={() => {
                  setEditingEmployee(null);
                  setShowAddModal(true);
                }}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 sm:px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
              >
                <Users size={18} />
                <span>Add Employee</span>
              </button>
              <button
              onClick={() => setShowCalendar(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Calendar size={16} />
              <span>View Open Days</span>
            </button>
            </div>
          </div>

        
          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-3 sm:px-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar View */}
        {showCalendar && (
          <div className="mb-6">
            <FactoryClosureCalendar onClose={() => setShowCalendar(false)} />
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <EmployeeStats employees={employees} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowFactoryClosureModal(true)}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <Users className="w-6 h-6 text-orange-500 mb-2" />
                    <div className="font-medium">Factory Closure</div>
                    <div className="text-sm text-slate-600">Record closure day</div>
                  </button>
                  <button 
                    onClick={() => setActiveTab('reports')}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left"
                  >
                    <Download className="w-6 h-6 text-green-500 mb-2" />
                    <div className="font-medium">Generate Reports</div>
                    <div className="text-sm text-slate-600">Attendance & Salary</div>
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="text-slate-500 text-sm">Activity feed will appear here...</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <EmployeeTable
            employees={employees}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterRole={filterRole}
            setFilterRole={setFilterRole}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkAttendance={(employee) => {
              setSelectedEmployee(employee);
              setShowAttendanceModal(true);
            }}
            onViewLeaveBalances={(employee) => {
              setSelectedEmployee(employee);
              setShowLeaveBalancesModal(true);
            }}
            onCalculateSalary={(employee) => {
              setSelectedEmployee(employee);
              setShowSalaryModal(true);
            }}
          />
        )}

        {activeTab === 'attendance' && <AttendanceManagement />}
        {activeTab === 'allowances' && <AllowanceManagement />}
        {activeTab === 'advances' && <SalaryAdvanceManagement />}
        {activeTab === 'finalization' && <SalaryFinalization />}
        {activeTab === 'reports' && <ReportsSection employees={employees} />}
        {activeTab === 'payroll' && <PayrollManagement />}
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
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedEmployee(null);
          }}
          onSuccess={fetchEmployees}
        />
      )}

      {showSalaryModal && selectedEmployee && (
        <SalaryModal 
          employee={selectedEmployee}
          onClose={() => {
            setShowSalaryModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      {showLeaveBalancesModal && selectedEmployee && (
        <LeaveBalancesModal 
          employee={selectedEmployee}
          onClose={() => {
            setShowLeaveBalancesModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}

      {showFactoryClosureModal && (
        <FactoryClosureModal 
          employees={employees}
          onClose={() => setShowFactoryClosureModal(false)}
          onSuccess={fetchEmployees}
        />
      )}
    </div>
  );
};

export default EmployeeManagement;