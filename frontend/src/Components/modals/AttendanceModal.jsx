// components/modals/AttendanceModal.jsx

import { AlertTriangle, Calendar, CheckCircle, Clock, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { employeeAPI } from '../../services/api';

const AttendanceModal = ({ employee, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:00',
    checkOut: '17:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    status: 'Present',
    notes: '',
    isHalfDay: false,
    isMedical: false,
    isCasual: false
  });

  const [loading, setLoading] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState(null);

  // Fetch leave balances when component mounts
  useEffect(() => {
    fetchLeaveBalances();
  }, [employee]);

  const fetchLeaveBalances = async () => {
    try {
      const response = await employeeAPI.getLeaveBalances(employee._id);
      setLeaveBalances(response.data.data);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
    }
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // FIXED: Properly handle leaveType with correct enum values
    const attendanceData = {
      employeeId: employee._id,
      date: new Date(formData.date).toISOString(),
      status: formData.status,
      notes: formData.notes,
      isHalfDay: formData.isHalfDay,
      isMedical: formData.isMedical,
      isCasual: formData.isCasual
    };

    // FIXED: Map status to leaveType with proper enum values
    if (formData.status === 'Medical Leave') {
      attendanceData.leaveType = 'medical';
    } else if (formData.status === 'Casual Leave') {
      attendanceData.leaveType = 'casual';
    } else if (formData.status === 'Leave') {
      attendanceData.leaveType = 'annual';
    } else if (formData.status === 'Half Day') {
      attendanceData.leaveType = 'annual'; // Half day also uses annual leave
    } else {
      // For Present, Absent, Factory Closure, etc. - set to null, NOT empty string
      attendanceData.leaveType = null;
    }

    // FIXED: Clean up empty values - set to null instead of empty strings
    Object.keys(attendanceData).forEach(key => {
      if (attendanceData[key] === '' || attendanceData[key] === undefined) {
        attendanceData[key] = null;
      }
    });

    // FIXED: Proper date-time formatting for time fields
    if (formData.status === 'Present' || formData.status === 'Half Day') {
      // Use proper ISO string format for dates
      if (formData.checkIn) {
        attendanceData.checkIn = new Date(`${formData.date}T${formData.checkIn}`).toISOString();
      }
      if (formData.checkOut) {
        attendanceData.checkOut = new Date(`${formData.date}T${formData.checkOut}`).toISOString();
      }
      
      // Only include break times for Present status, NOT for Half Day
      if (formData.status === 'Present') {
        if (formData.breakStart) {
          attendanceData.breakStart = new Date(`${formData.date}T${formData.breakStart}`).toISOString();
        }
        if (formData.breakEnd) {
          attendanceData.breakEnd = new Date(`${formData.date}T${formData.breakEnd}`).toISOString();
        }
      } else {
        // For Half Day, explicitly set break times to null
        attendanceData.breakStart = null;
        attendanceData.breakEnd = null;
      }
    } else {
      // For non-present statuses, explicitly set all time fields to null
      attendanceData.checkIn = null;
      attendanceData.checkOut = null;
      attendanceData.breakStart = null;
      attendanceData.breakEnd = null;
    }

    // FIXED: Ensure leaveDaysDeducted is properly set
    if (formData.status === 'Half Day') {
      attendanceData.leaveDaysDeducted = 0.5;
    } else if (formData.status === 'Leave' || formData.status === 'Medical Leave' || formData.status === 'Casual Leave') {
      attendanceData.leaveDaysDeducted = formData.isHalfDay ? 0.5 : 1;
    } else {
      attendanceData.leaveDaysDeducted = 0;
    }

    console.log('Sending attendance data:', attendanceData);

    const response = await employeeAPI.markAttendance(attendanceData);
    
    // Show the response message with updated leave balances
    let message = response.data.message || 'Attendance marked successfully!';
    
    if (response.data.leaveBalance) {
      const balance = response.data.leaveBalance;
      message += `\n\nUpdated Leave Balances:\n` +
        `Annual: ${balance.annual} days remaining\n` +
        `Medical: ${balance.medical} days remaining\n` +
        `Casual: ${balance.casual} days remaining`;
    }

    alert(message);
    onSuccess();
    onClose();
  } catch (error) {
    console.error('Error marking attendance:', error);
    alert('Error: ' + (error.response?.data?.message || error.message));
  } finally {
    setLoading(false);
  }
};

  const statusOptions = [
    { value: 'Present', label: 'Present', color: 'green' },
    { value: 'Half Day', label: 'Half Day', color: 'orange' },
    { value: 'Leave', label: 'Annual Leave', color: 'blue' },
    { value: 'Medical Leave', label: 'Medical Leave', color: 'purple' },
    { value: 'Casual Leave', label: 'Casual Leave', color: 'teal' },
    { value: 'Absent', label: 'Absent', color: 'red' },
    { value: 'Factory Closure', label: 'Factory Closure', color: 'indigo' }
  ];

  const handleStatusChange = (newStatus) => {
    setFormData(prev => ({
      ...prev,
      status: newStatus,
      // Reset times when switching to non-present status
      checkIn: (newStatus === 'Present' || newStatus === 'Half Day') ? '08:00' : '',
      checkOut: (newStatus === 'Present' || newStatus === 'Half Day') ? '17:00' : '',
      // Only set break times for Present status
      breakStart: newStatus === 'Present' ? '12:00' : '',
      breakEnd: newStatus === 'Present' ? '13:00' : '',
      isHalfDay: newStatus === 'Half Day',
      isMedical: newStatus === 'Medical Leave',
      isCasual: newStatus === 'Casual Leave'
    }));
  };

  // Get current month name for display
  const getCurrentMonthName = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[new Date().getMonth()];
  };

  // Calculate used values from remaining balances
  const getUsedAnnual = () => {
    return leaveBalances ? (leaveBalances.takenAnnual || 0) : 0;
  };

  const getUsedMedical = () => {
    return leaveBalances ? (leaveBalances.takenMedical || 0) : 0;
  };

  const getUsedCasual = () => {
    return leaveBalances ? (leaveBalances.takenCasual || 0) : 0;
  };

  const getAnnualEntitlement = () => {
    return leaveBalances ? (leaveBalances.annualEntitlement || 14) : 14;
  };

  const getMedicalEntitlement = () => {
    return leaveBalances ? (leaveBalances.medicalEntitlement || 7) : 7;
  };

  const getCasualEntitlement = () => {
    return leaveBalances ? (leaveBalances.casualEntitlement || 7) : 7;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Calendar size={20} />
            <span>Mark Attendance - {employee.name}</span>
          </h2>
          {leaveBalances && (
            <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
              <div className="font-semibold mb-1">Current Leave Balances ({getCurrentMonthName()}):</div>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div>Annual: {leaveBalances.annual || 0} days remaining (Used: {getUsedAnnual()}/{getAnnualEntitlement()})</div>
                <div>Medical: {leaveBalances.medical || 0} days remaining (Used: {getUsedMedical()}/{getMedicalEntitlement()})</div>
                <div>Casual: {leaveBalances.casual || 0} days remaining (Used: {getUsedCasual()}/{getCasualEntitlement()})</div>
              </div>
              <div className="mt-2 text-xs text-green-600 font-medium">
                ✓ Unified Leave Policy Applied
              </div>
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
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {(formData.status === 'Present' || formData.status === 'Half Day') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check In</label>
                  <input
                    type="time"
                    value={formData.checkIn || ''}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check Out</label>
                  <input
                    type="time"
                    value={formData.checkOut || ''}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Only show break times for Present status, not for Half Day */}
              {formData.status === 'Present' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Break Start</label>
                    <input
                      type="time"
                      value={formData.breakStart || ''}
                      onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Break End</label>
                    <input
                      type="time"
                      value={formData.breakEnd || ''}
                      onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Leave type selection for Annual Leave */}
          {(formData.status === 'Leave' || formData.status === 'Medical Leave' || formData.status === 'Casual Leave') && (
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isHalfDay}
                  onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">
                  Half Day ({formData.isHalfDay ? '0.5' : '1'} day deducted)
                </span>
              </label>
            </div>
          )}

          {/* Status information and warnings */}
          <div className="space-y-2">
            {formData.status === 'Medical Leave' && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-purple-800 font-medium">
                  💊 Medical Leave
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Will count against medical leave balance (7 days per year)
                </p>
              </div>
            )}
            
            {formData.status === 'Casual Leave' && (
              <div className="bg-teal-50 p-3 rounded-lg">
                <p className="text-sm text-teal-800 font-medium">
                  🎯 Casual Leave
                </p>
                <p className="text-xs text-teal-600 mt-1">
                  Will count against casual leave balance (7 days per year)
                </p>
              </div>
            )}
            
            {formData.status === 'Leave' && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  📅 Annual Leave
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {formData.isHalfDay 
                    ? 'Will count as 0.5 day against annual leave balance' 
                    : 'Will count as 1 day against annual leave balance'
                  }
                </p>
              </div>
            )}
            
            {formData.status === 'Half Day' && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Half Day
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Will count as 0.5 day against annual leave balance
                </p>
              </div>
            )}

            {/* Unified Policy Notice */}
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 font-medium flex items-center">
                <CheckCircle size={16} className="mr-2" />
                Unified Leave Policy
              </p>
              <p className="text-xs text-green-600 mt-1">
                All employees receive: 14 days annual, 7 days medical, 7 days casual
              </p>
            </div>
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
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckCircle size={16} />
              )}
              <span>Mark Attendance</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceModal;