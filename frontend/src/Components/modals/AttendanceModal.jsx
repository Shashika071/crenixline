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
    isMedical: false
  });

  const [loading, setLoading] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [isInProbation, setIsInProbation] = useState(false);

  // Fetch leave balances when component mounts
  useEffect(() => {
    fetchLeaveBalances();
  }, [employee]);

  const fetchLeaveBalances = async () => {
    try {
      const response = await employeeAPI.getLeaveBalances(employee._id);
      setLeaveBalances(response.data.data);
      setIsInProbation(response.data.data.isInProbation || false);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // FIX: Properly handle time fields for different statuses
    const attendanceData = {
      employeeId: employee._id,
      date: new Date(formData.date).toISOString(),
      status: formData.status,
      notes: formData.notes,
      isHalfDay: formData.isHalfDay,
      isMedical: formData.isMedical
    };

    // Include time fields for both Present and Half Day statuses
    if (formData.status === 'Present' || formData.status === 'Half Day') {
      attendanceData.checkIn = formData.checkIn ? `${formData.date}T${formData.checkIn}` : null;
      attendanceData.checkOut = formData.checkOut ? `${formData.date}T${formData.checkOut}` : null;
      
      // Only include break times for Present status, NOT for Half Day
      if (formData.status === 'Present') {
        attendanceData.breakStart = formData.breakStart ? `${formData.date}T${formData.breakStart}` : null;
        attendanceData.breakEnd = formData.breakEnd ? `${formData.date}T${formData.breakEnd}` : null;
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

 

    const response = await employeeAPI.markAttendance(attendanceData);
    
    // Show the response message with updated leave balances
    let message = response.data.message || 'Attendance marked successfully!';
    
    if (response.data.leaveBalance) {
      const balance = response.data.leaveBalance;
      message += `\n\nUpdated Leave Balances:\n` +
        `Medical: ${balance.medical} days remaining\n`;
      
      if (balance.isInProbation) {
        message += `Monthly Leaves: ${balance.monthlyLeaves} remaining\n` +
                   `Monthly Half Days: ${balance.monthlyHalfDays} remaining`;
      } else {
        message += `Annual Leaves: ${balance.annual} days remaining\n` +
                   `Monthly Half Days: ${balance.monthlyHalfDays} remaining`;
      }
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
    { value: 'Leave', label: 'Leave', color: 'blue' },
    { value: 'Medical Leave', label: 'Medical Leave', color: 'purple' },
    { value: 'Absent', label: 'Absent', color: 'red' }
  ];
 
const handleStatusChange = (newStatus) => {
  setFormData(prev => ({
    ...prev,
    status: newStatus,
    // Reset times when switching to non-present status - use null instead of empty strings
    checkIn: (newStatus === 'Present' || newStatus === 'Half Day') ? '08:00' : null,
    checkOut: (newStatus === 'Present' || newStatus === 'Half Day') ? '17:00' : null,
    // Only set break times for Present status
    breakStart: newStatus === 'Present' ? '12:00' : null,
    breakEnd: newStatus === 'Present' ? '13:00' : null,
    isHalfDay: newStatus === 'Half Day',
    isMedical: newStatus === 'Medical Leave' ? true : prev.isMedical
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
  const getUsedMonthlyLeaves = () => {
    return leaveBalances ? 2 - (leaveBalances.monthlyLeaves || 2) : 0;
  };

  const getUsedMonthlyHalfDays = () => {
    return leaveBalances ? 2 - (leaveBalances.monthlyHalfDays || 2) : 0;
  };

  const getUsedAnnual = () => {
    return leaveBalances ? 21 - (leaveBalances.annual || 21) : 0;
  };

  const getUsedMedical = () => {
    return leaveBalances ? 24 - (leaveBalances.medical || 24) : 0;
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
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Medical: {leaveBalances.medical} days remaining (Used: {getUsedMedical()})</div>
                {isInProbation ? (
                  <>
                    <div>Monthly Leaves: {leaveBalances.monthlyLeaves} remaining (Used: {getUsedMonthlyLeaves()})</div>
                    <div>Half Days: {leaveBalances.monthlyHalfDays} remaining (Used: {getUsedMonthlyHalfDays()})</div>
                  </>
                ) : (
                  <>
                    <div>Annual: {leaveBalances.annual} days remaining (Used: {getUsedAnnual()})</div>
                    <div>Half Days: {leaveBalances.monthlyHalfDays} remaining (Used: {getUsedMonthlyHalfDays()})</div>
                  </>
                )}
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

          {(formData.status === 'Leave' || formData.status === 'Half Day' || formData.status === 'Medical Leave') && (
            <div className="flex space-x-4">
              {formData.status !== 'Medical Leave' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isHalfDay}
                    onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">Half Day</span>
                </label>
              )}
              
              {formData.status !== 'Medical Leave' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isMedical}
                    onChange={(e) => setFormData({ ...formData, isMedical: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-700">Medical Leave</span>
                </label>
              )}
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
                  Will count against medical leave balance (24 days per year)
                </p>
              </div>
            )}
            
            {formData.status === 'Leave' && formData.isMedical && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  💊 Medical Leave (Regular)
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Will count as 1 medical leave against annual medical balance
                </p>
              </div>
            )}
            
            {formData.status === 'Leave' && !formData.isMedical && (
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-800 font-medium">
                  📅 Regular Leave
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Will count against {isInProbation ? 'monthly probation leaves' : 'annual leaves'}
                </p>
              </div>
            )}
            
            {formData.status === 'Half Day' && formData.isMedical && (
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-purple-800 font-medium">
                  💊 Medical Half Day
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Will count as 0.5 medical leave against annual medical balance
                </p>
              </div>
            )}
            
            {formData.status === 'Half Day' && !formData.isMedical && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ Regular Half Day
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Will count against {isInProbation ? 'monthly probation half-days' : 'monthly half-days'}
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