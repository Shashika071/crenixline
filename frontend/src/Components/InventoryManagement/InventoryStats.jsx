import { AlertTriangle, Cpu, Package, TrendingUp } from 'lucide-react';

import React from 'react';

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

const InventoryStats = ({ materials, machines, lowStockCount, maintenanceCount }) => {
  const totalMaterialValue = materials.reduce((sum, m) => sum + (m.availableQty * (m.costPerUnit || 0)), 0);
  const totalMachineValue = machines.reduce((sum, m) => sum + (m.purchaseValue || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard
        title="Total Materials"
        value={materials.length}
        subtitle={`${materials.reduce((sum, m) => sum + (m.availableQty || 0), 0)} units`}
        icon={<Package className="w-6 h-6" />}
        color="from-blue-500 to-blue-600"
      />
      <StatCard
        title="Total Machines"
        value={machines.length}
        subtitle={`${machines.filter(m => m.status === 'Operational').length} operational`}
        icon={<Cpu className="w-6 h-6" />}
        color="from-purple-500 to-purple-600"
      />
      <StatCard
        title="Inventory Value"
        value={`Rs. ${(totalMaterialValue + totalMachineValue).toLocaleString()}`}
        icon={<TrendingUp className="w-6 h-6" />}
        color="from-green-500 to-green-600"
      />
      <StatCard
        title="Alerts"
        value={lowStockCount + maintenanceCount}
        subtitle={`${lowStockCount} low stock, ${maintenanceCount} maintenance`}
        icon={<AlertTriangle className="w-6 h-6" />}
        color="from-orange-500 to-orange-600"
      />
    </div>
  );
};

export default InventoryStats;