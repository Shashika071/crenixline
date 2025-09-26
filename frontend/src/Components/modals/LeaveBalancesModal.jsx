// components/modals/LeaveBalancesModal.jsx

import { AlertTriangle, Calendar, CheckCircle, Clock, RefreshCw, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { employeeAPI } from '../../services/api';

const LeaveBalancesModal = ({ employee, onClose }) => {
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetchLeaveBalances();
  }, [employee]);

  const fetchLeaveBalances = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getLeaveBalances(employee._id);
      setLeaveBalances(response.data.data);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      alert('Error fetching leave balances: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaveBalances();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // FIX: Proper calculation functions
  const getUsedMonthlyLeaves = () => {
    if (!leaveBalances) return 0;
    return leaveBalances.isInProbation ? (2 - leaveBalances.monthlyLeaves) : 0;
  };

  const getUsedMonthlyHalfDays = () => {
    if (!leaveBalances) return 0;
    return 2 - leaveBalances.monthlyHalfDays;
  };

  const getUsedAnnual = () => {
    if (!leaveBalances) return 0;
    return leaveBalances.isInProbation ? 0 : (21 - leaveBalances.annual);
  };

  const getUsedMedical = () => {
    if (!leaveBalances) return 0;
    return 24 - leaveBalances.medical;
  };

  // FIX: Check if selected month is current month for "resets next month" message
  const isCurrentMonth = selectedMonth === new Date().getMonth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 mt-2">Loading leave balances...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!leaveBalances) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600">Failed to load leave balances</p>
            <button 
              onClick={fetchLeaveBalances}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isInProbation = leaveBalances.isInProbation || false;

  // FIX: Proper balance card component with correct calculations
  const LeaveBalanceCard = ({ title, used, total, color, icon, description, isMonthly = false }) => {
    const remaining = Math.max(0, total - used);
    const percentage = total > 0 ? Math.min(100, (used / total) * 100) : 0;
    
    // FIX: Show correct display values
    const displayUsed = used;
    const displayRemaining = remaining;
    const displayTotal = total;

    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-700">{title}</span>
          <div className="flex items-center space-x-2">
            {icon}
            <span className="text-sm font-medium" style={{ color }}>
              {displayRemaining} / {displayTotal}
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-500 mb-2">{description}</div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Used: {displayUsed}</span>
          <span>Remaining: {displayRemaining}</span>
        </div>
        {isMonthly && isCurrentMonth && (
          <div className="text-xs text-green-600 mt-1 font-medium">
            ✓ Resets next month
          </div>
        )}
        {isMonthly && !isCurrentMonth && (
          <div className="text-xs text-orange-600 mt-1 font-medium">
            ⚠️ Historical data
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        
        {/* Sticky Header */}
        <div className="p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Leave Balances</h2>
              <p className="text-slate-600">{employee.name}</p>
              <p className="text-sm text-slate-500">{employee.role} • {employee.employmentStatus}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                title="Refresh balances"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Month Selector */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              View balances for:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>
                  {month} {index === new Date().getMonth() ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {isInProbation && (
            <div className="mt-2 flex items-center space-x-1 text-orange-600 text-sm bg-orange-50 p-2 rounded">
              <AlertTriangle size={14} />
              <span>Employee is in probation period</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Medical Leaves - Available for all employees */}
          <LeaveBalanceCard
            title="Medical Leaves"
            used={getUsedMedical()}
            total={24}
            color="#3b82f6"
            icon={<Calendar size={16} className="text-blue-500" />}
            description="24 days per year (available from day 1)"
          />

          {isInProbation ? (
            <>
              {/* Probation: Monthly Full Leaves */}
              <LeaveBalanceCard
                title="Monthly Full Leaves"
                used={getUsedMonthlyLeaves()}
                total={2}
                color="#f59e0b"
                icon={<AlertTriangle size={16} className="text-orange-500" />}
                description="2 full leaves per month during probation"
                isMonthly={true}
              />
              
              {/* Probation: Monthly Half Days */}
              <LeaveBalanceCard
                title="Monthly Half Days"
                used={getUsedMonthlyHalfDays()}
                total={2}
                color="#8b5cf6"
                icon={<Clock size={16} className="text-purple-500" />}
                description="2 half days per month during probation"
                isMonthly={true}
              />
            </>
          ) : (
            <>
              {/* Confirmed: Annual Leaves */}
              <LeaveBalanceCard
                title="Annual Leaves"
                used={getUsedAnnual()}
                total={21}
                color="#10b981"
                icon={<CheckCircle size={16} className="text-green-500" />}
                description="21 days per year"
              />
              
              {/* Confirmed: Monthly Half Days */}
              <LeaveBalanceCard
                title="Monthly Half Days"
                used={getUsedMonthlyHalfDays()}
                total={2}
                color="#8b5cf6"
                icon={<Clock size={16} className="text-purple-500" />}
                description="2 half days per month"
                isMonthly={true}
              />
            </>
          )}

          {/* Debug Information (remove in production) */}
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-mono text-slate-600">
              <div>Debug Info:</div>
              <div>Medical: {leaveBalances.medical}</div>
              <div>Annual: {leaveBalances.annual}</div>
              <div>Monthly Leaves: {leaveBalances.monthlyLeaves}</div>
              <div>Monthly Half Days: {leaveBalances.monthlyHalfDays}</div>
              <div>Probation: {isInProbation ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 sticky bottom-0 z-10 flex justify-between items-center">
          <div className="text-sm text-slate-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalancesModal;  