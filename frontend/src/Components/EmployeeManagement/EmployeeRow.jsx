import { CheckCircle, DollarSign, Edit, Eye, FileText, RefreshCw, Trash2, UserCheck, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { employeeAPI } from '../../services/api';

const EmployeeRow = ({ 
  employee, 
  onEdit, 
  onDelete, 
  onMarkAttendance, 
  onViewLeaveBalances,
  onViewDetails  
}) => {
  const [dynamicRates, setDynamicRates] = useState({
    hourlyRate: 0,
    overtimeRate: 0,
    totalWorkingDays: 0,
    isLoading: false,
    lastUpdated: null
  });
  
  const isInProbation = new Date() < new Date(employee.probationEndDate);

  // Fixed OT calculation (always based on 30 days)
  const calculateFixedRates = () => {
    const fixedMonthlyHours = 30 * 8;
    const fixedHourlyRate = employee.salary > 0 ? employee.salary / fixedMonthlyHours : 0;
    const fixedOvertimeRate = fixedHourlyRate * 1.5;
    
    return { fixedHourlyRate, fixedOvertimeRate };
  };

  const { fixedHourlyRate, fixedOvertimeRate } = calculateFixedRates();

  // Function to fetch dynamic rates based on actual working days
  const fetchDynamicRates = async () => {
    try {
      setDynamicRates(prev => ({ ...prev, isLoading: true }));
      
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1; // 1-12
      const year = currentDate.getFullYear();

      // Call salary calculation API to get working days
      const response = await employeeAPI.calculateSalary({
        employeeId: employee._id,
        month: month,
        year: year
      });

      if (response.data.success) {
        const salaryData = response.data.data;
        const workingDays = salaryData.totalWorkingDays || 0;
        
        // Calculate dynamic hourly rate based on actual working days
        const dynamicMonthlyHours = workingDays > 0 ? workingDays * 8 : 1; // Avoid division by zero
        const dynamicHourlyRate = workingDays > 0 ? employee.salary / dynamicMonthlyHours : 0;
        
        setDynamicRates({
          hourlyRate: dynamicHourlyRate,
          overtimeRate: fixedOvertimeRate, // OT rate remains fixed
          totalWorkingDays: workingDays,
          isLoading: false,
          lastUpdated: new Date().toLocaleTimeString()
        });
      }
    } catch (error) {
      console.error('Error fetching dynamic rates:', error);
      // Fallback to fixed calculation if API fails
      setDynamicRates({
        hourlyRate: fixedHourlyRate,
        overtimeRate: fixedOvertimeRate,
        totalWorkingDays: 0,
        isLoading: false,
        lastUpdated: 'Error - Using fixed rates'
      });
    }
  };

  // Enhanced calculate salary function
  

  // Fetch dynamic rates when component mounts
  useEffect(() => {
    fetchDynamicRates();
  }, [employee._id, employee.salary]);

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
        
        <div className="text-xs text-slate-400 mt-1">
          <div>Hourly: Rs. {dynamicRates.hourlyRate > 0 ? dynamicRates.hourlyRate.toFixed(2) : '0.00'}</div>
          <div>OT Rate: Rs. {dynamicRates.overtimeRate.toFixed(2)}</div>
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
            onClick={() => onViewDetails(employee)}  
            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
            title="View Full Details"
          >
            <FileText size={16} />
          </button>
          
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

export default EmployeeRow;