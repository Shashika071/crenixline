// components/EmployeeStats.jsx

import { AlertTriangle, CheckCircle, Clock, UserCheck, Users, XCircle } from 'lucide-react';

import React from 'react';

const EmployeeStats = ({ employees }) => {
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'Active').length,
    onLeave: employees.filter(e => e.status === 'On Leave').length,
    inactive: employees.filter(e => e.status === 'Inactive').length,
    probation: employees.filter(e => new Date() < new Date(e.probationEndDate)).length,
    confirmed: employees.filter(e => new Date() >= new Date(e.probationEndDate)).length
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

export default EmployeeStats;