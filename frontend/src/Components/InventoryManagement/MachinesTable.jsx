import { Cpu, Eye, Settings, Trash2 } from 'lucide-react';

import React from 'react';

const MachineRow = ({ machine, onMaintenanceUpdate, onDelete, onView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational': return 'bg-green-100 text-green-800 border-green-200';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Broken': return 'bg-red-100 text-red-800 border-red-200';
      case 'Idle': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isMaintenanceDue = machine.nextMaintenance && new Date(machine.nextMaintenance) <= new Date();

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{machine.name}</div>
            <div className="text-sm text-slate-500">{machine.type}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800">
          {machine.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-900">{machine.model || 'N/A'}</div>
        <div className="text-xs text-slate-500">SN: {machine.serialNumber || 'N/A'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(machine.status)}`}>
          {machine.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-900">
          {machine.lastMaintenance ? new Date(machine.lastMaintenance).toLocaleDateString() : 'Never'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className={`text-sm font-medium ${
          isMaintenanceDue ? 'text-red-600' : 'text-slate-900'
        }`}>
          {machine.nextMaintenance ? new Date(machine.nextMaintenance).toLocaleDateString() : 'Not set'}
        </div>
        {isMaintenanceDue && (
          <div className="text-xs text-red-500">Due for maintenance</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onMaintenanceUpdate(machine)}
            className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 p-2 rounded-lg transition-colors"
            title="Update Maintenance"
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={() => onView(machine)}
            className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => onDelete(machine._id)}
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

const MachinesTable = ({ machines, onMaintenanceUpdate, onDelete, onView }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Machine</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Model/Serial</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Maintenance</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Next Maintenance</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {machines.map((machine) => (
            <MachineRow 
              key={machine._id} 
              machine={machine} 
              onMaintenanceUpdate={onMaintenanceUpdate}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </tbody>
      </table>
      
      {machines.length === 0 && (
        <div className="text-center py-12">
          <Cpu className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No machines found</h3>
          <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default MachinesTable;