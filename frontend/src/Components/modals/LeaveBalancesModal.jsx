// components/modals/LeaveBalancesModal.jsx

import { AlertTriangle, Calendar, CheckCircle, Clock, Heart, RefreshCw, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { employeeAPI } from '../../services/api';

const LeaveBalancesModal = ({ employee, onClose }) => {
  const [leaveBalances, setLeaveBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaveBalances();
  }, [employee]);

  const fetchLeaveBalances = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getLeaveBalances(employee._id);
      console.log('Leave balances API response:', response.data); // Debug log
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

  // Calculate pro-rated annual leave based on joining month
  const calculateAnnualEntitlement = () => {
    if (!employee?.joinDate) return 14;
    
    const joinDate = new Date(employee.joinDate);
    const currentYear = new Date().getFullYear();
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth();
    
    if (joinYear < currentYear) return 14;
    
    if (joinMonth <= 2) return 14;
    else if (joinMonth <= 5) return 10;
    else if (joinMonth <= 8) return 7;
    else return 4;
  };

  // FIXED: Proper calculation functions that read from the correct API response structure
  const getUsedAnnual = () => {
    if (!leaveBalances?.leaveHistory?.[0]) return 0;
    return leaveBalances.leaveHistory[0].takenAnnual || 0;
  };

  const getUsedMedical = () => {
    if (!leaveBalances?.leaveHistory?.[0]) return 0;
    return leaveBalances.leaveHistory[0].takenMedical || 0;
  };

  const getUsedCasual = () => {
    if (!leaveBalances?.leaveHistory?.[0]) return 0;
    return leaveBalances.leaveHistory[0].takenCasual || 0;
  };

  const getAnnualEntitlement = () => {
    if (!leaveBalances?.leaveHistory?.[0]) return calculateAnnualEntitlement();
    return leaveBalances.leaveHistory[0].annualEntitlement || calculateAnnualEntitlement();
  };

  const getMedicalEntitlement = () => {
    if (!leaveBalances?.leaveHistory?.[0]) return 7;
    return leaveBalances.leaveHistory[0].medicalEntitlement || 7;
  };

  const getCasualEntitlement = () => {
    if (!leaveBalances?.leaveHistory?.[0]) return 7;
    return leaveBalances.leaveHistory[0].casualEntitlement || 7;
  };

  // FIXED: Get current balances from the main leaveBalances object
  const getCurrentAnnualBalance = () => {
    if (!leaveBalances?.leaveBalances) return calculateAnnualEntitlement();
    return leaveBalances.leaveBalances.annual || (getAnnualEntitlement() - getUsedAnnual());
  };

  const getCurrentMedicalBalance = () => {
    if (!leaveBalances?.leaveBalances) return 7;
    return leaveBalances.leaveBalances.medical || (getMedicalEntitlement() - getUsedMedical());
  };

  const getCurrentCasualBalance = () => {
    if (!leaveBalances?.leaveBalances) return 7;
    return leaveBalances.leaveBalances.casual || (getCasualEntitlement() - getUsedCasual());
  };

  // Check if employee is in first year
  const isFirstYearEmployee = () => {
    if (!employee?.joinDate) return false;
    const joinDate = new Date(employee.joinDate);
    const currentYear = new Date().getFullYear();
    const joinYear = joinDate.getFullYear();
    return joinYear === currentYear;
  };

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

  // Debug information
  console.log('Current leave balances state:', leaveBalances);
  console.log('Calculated values:', {
    annual: {
      current: getCurrentAnnualBalance(),
      used: getUsedAnnual(),
      entitlement: getAnnualEntitlement()
    },
    medical: {
      current: getCurrentMedicalBalance(),
      used: getUsedMedical(),
      entitlement: getMedicalEntitlement()
    },
    casual: {
      current: getCurrentCasualBalance(),
      used: getUsedCasual(),
      entitlement: getCasualEntitlement()
    }
  });

  // FIXED: Leave balance card component
  const LeaveBalanceCard = ({ title, used, total, remaining, color, icon, description, isProRated = false }) => {
    const percentage = total > 0 ? Math.min(100, (used / total) * 100) : 0;
    
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-700">{title}</span>
          <div className="flex items-center space-x-2">
            {icon}
            <span className="text-sm font-medium" style={{ color }}>
              {remaining} remaining
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
          <span>Used: {used}/{total}</span>
          <span>{Math.round(percentage)}% used</span>
        </div>
        {isProRated && (
          <div className="text-xs text-orange-600 mt-1 font-medium">
            ⚠️ Pro-rated (first year)
          </div>
        )}
      </div>
    );
  };

  const annualEntitlement = getAnnualEntitlement();
  const medicalEntitlement = getMedicalEntitlement();
  const casualEntitlement = getCasualEntitlement();
  const currentAnnual = getCurrentAnnualBalance();
  const currentMedical = getCurrentMedicalBalance();
  const currentCasual = getCurrentCasualBalance();

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

          {/* Unified Policy Notice */}
          <div className="mt-2 flex items-center space-x-1 text-green-600 text-sm bg-green-50 p-2 rounded">
            <CheckCircle size={14} />
            <span>Unified Leave Policy Applied</span>
          </div>

          {isFirstYearEmployee() && (
            <div className="mt-2 flex items-center space-x-1 text-orange-600 text-sm bg-orange-50 p-2 rounded">
              <AlertTriangle size={14} />
              <span>First-year employee (pro-rated annual leave)</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Annual Leaves */}
          <LeaveBalanceCard
            title="Annual Leaves"
            used={getUsedAnnual()}
            total={annualEntitlement}
            remaining={currentAnnual}
            color="#10b981"
            icon={<CheckCircle size={16} className="text-green-500" />}
            description={`${annualEntitlement} days per year`}
            isProRated={isFirstYearEmployee()}
          />

          {/* Medical Leaves */}
          <LeaveBalanceCard
            title="Medical Leaves"
            used={getUsedMedical()}
            total={medicalEntitlement}
            remaining={currentMedical}
            color="#3b82f6"
            icon={<Calendar size={16} className="text-blue-500" />}
            description="7 days per year"
          />

          {/* Casual Leaves */}
          <LeaveBalanceCard
            title="Casual Leaves"
            used={getUsedCasual()}
            total={casualEntitlement}
            remaining={currentCasual}
            color="#8b5cf6"
            icon={<Clock size={16} className="text-purple-500" />}
            description="7 days per year"
          />

          {/* Current Balance Summary */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-medium text-slate-800 mb-3 text-sm">Current Balance Summary</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">{currentAnnual}</div>
                <div className="text-xs text-slate-600">Annual</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">{currentMedical}</div>
                <div className="text-xs text-slate-600">Medical</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{currentCasual}</div>
                <div className="text-xs text-slate-600">Casual</div>
              </div>
            </div>
          </div>

          {/* Maternity Leave Info (for female employees) */}
          {employee.gender === 'Female' && (
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Heart size={16} className="text-pink-500" />
                <span className="font-semibold text-pink-700">Maternity Leave</span>
              </div>
              <div className="text-sm text-pink-600 space-y-1">
                <p>• 42 days standard maternity leave</p>
                <p>• 84 days for special medical cases</p>
                <p>• Available when needed</p>
              </div>
            </div>
          )}

          {/* Policy Information */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2 text-sm">Leave Policy Notes:</h4>
            <div className="text-xs text-blue-700 space-y-1">
              <p>• All employees receive same leave entitlements</p>
              <p>• Half days deduct 0.5 from annual leave</p>
              <p>• Unpaid leave when balances exhausted</p>
              {isFirstYearEmployee() && (
                <p>• Annual leave pro-rated based on joining month</p>
              )}
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