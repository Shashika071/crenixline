import { AlertTriangle, Download, Mail, Settings } from 'lucide-react';

import React from 'react';

const AlertBanner = ({ 
  type, 
  items, 
  activeTab, 
  onViewAll, 
  onExport 
}) => {
  if (items.length === 0 || 
      (type === 'material' && activeTab !== 'materials') ||
      (type === 'machine' && activeTab !== 'machines') ||
      (type === 'equipment' && activeTab !== 'equipment')) {
    return null;
  }

  const config = {
    material: {
      icon: AlertTriangle,
      title: 'Low Stock Alert',
      message: `${items.length} materials need immediate attention`,
      color: 'red',
      exportLabel: 'Export Low Stock'
    },
    machine: {
      icon: Settings,
      title: 'Maintenance Alert',
      message: `${items.length} machines need maintenance`,
      color: 'orange',
      exportLabel: 'Export Maintenance'
    },
    equipment: {
      icon: AlertTriangle,
      title: 'Low Equipment Stock',
      message: `${items.length} equipment items need restocking`,
      color: 'red',
      exportLabel: 'Export Low Stock Equipment'
    }
  };

  const { icon: Icon, title, message, color, exportLabel } = config[type];

  return (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-xl p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className={`w-5 h-5 text-${color}-600`} />
          <div>
            <h3 className={`font-medium text-${color}-800`}>{title}</h3>
            <p className={`text-${color}-600 text-sm`}>{message}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={onExport}
            className={`border border-${color}-600 text-${color}-600 px-3 py-1 rounded text-sm hover:bg-${color}-50 transition-colors flex items-center space-x-1`}
          >
            <Download className="w-4 h-4" />
            <span>{exportLabel}</span>
          </button>
          
          <button 
            onClick={onViewAll}
            className={`text-${color}-700 hover:text-${color}-800 text-sm font-medium`}
          >
            View All
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertBanner;