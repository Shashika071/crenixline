import { Cpu, Download, Package, RefreshCw, Search } from 'lucide-react';

import React from 'react';

const InventoryTabs = ({
  activeTab,
  setActiveTab,
  materialsCount,
  machinesCount,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  materialTypes,
  machineTypes,
  onRefresh,
  onExport,
  children
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
            activeTab === 'materials'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Package size={18} />
            <span>Raw Materials</span>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
              {materialsCount}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('machines')}
          className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
            activeTab === 'machines'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Cpu size={18} />
            <span>Machines & Equipment</span>
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
              {machinesCount}
            </span>
          </div>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-64"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Types</option>
              {(activeTab === 'materials' ? materialTypes : machineTypes).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            
            <button 
              onClick={onExport}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
};

export default InventoryTabs;