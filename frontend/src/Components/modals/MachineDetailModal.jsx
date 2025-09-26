import {
  AlertCircle,
  Building,
  Calendar,
  Clock,
  Cpu,
  DollarSign,
  Settings,
  X,
  Zap
} from 'lucide-react';

import React from 'react';

const MachineDetailModal = ({ machine, onClose }) => {
  if (!machine) return null;

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
  const isRental = machine.isRental;
  const rentalEndDate = machine.rentalEndDate ? new Date(machine.rentalEndDate) : null;
  const isRentalExpired = isRental && rentalEndDate && rentalEndDate < new Date();
  const isRentalExpiringSoon = isRental && rentalEndDate && 
    rentalEndDate > new Date() && 
    rentalEndDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Machine Details</h2>
            <p className="text-sm text-slate-600 mt-1">Complete information about {machine.name}</p>
            {isRental && (
              <span className="inline-flex items-center px-3 py-1 mt-2 text-xs font-medium rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                <Building size={12} className="mr-1" />
                Rental Machine
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Machine Name</label>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <Cpu className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-900">{machine.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800">
                    {machine.type}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Model</label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-900">{machine.model || 'Not specified'}</span>
                </div>
              </div>

              {machine.manufacturer && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Manufacturer</label>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-900">{machine.manufacturer}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Serial Number</label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-mono text-slate-900">{machine.serialNumber || 'Not specified'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(machine.status)}`}>
                    {machine.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Location</label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-900">{machine.location || 'Not specified'}</span>
                </div>
              </div>

              {machine.capacity && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Capacity</label>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-900">{machine.capacity}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rental Information */}
          {isRental && (
            <div className={`rounded-lg p-4 ${
              isRentalExpired ? 'bg-red-50 border border-red-200' : 
              isRentalExpiringSoon ? 'bg-orange-50 border border-orange-200' : 
              'bg-blue-50 border border-blue-200'
            }`}>
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Rental Information
                {isRentalExpired && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                    <AlertCircle size={12} className="mr-1" />
                    Rental Expired
                  </span>
                )}
                {isRentalExpiringSoon && !isRentalExpired && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                    <AlertCircle size={12} className="mr-1" />
                    Expiring Soon
                  </span>
                )}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">Rental Provider</span>
                  </div>
                  <div className="text-sm text-slate-600">{machine.rentalProvider || 'Not specified'}</div>
                </div>
                
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">Rental Period</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    {machine.rentalStartDate ? new Date(machine.rentalStartDate).toLocaleDateString() : 'N/A'} - {' '}
                    {machine.rentalEndDate ? new Date(machine.rentalEndDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">Monthly Rent</span>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    Rs. {machine.monthlyRent?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>

              {/* Rental Status */}
              {isRentalExpired && (
                <div className="mt-3 p-3 bg-red-100 rounded-lg">
                  <div className="flex items-center text-red-700">
                    <AlertCircle size={16} className="mr-2" />
                    <span className="text-sm font-medium">This rental has expired. Please contact the provider.</span>
                  </div>
                </div>
              )}
              
              {isRentalExpiringSoon && !isRentalExpired && (
                <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                  <div className="flex items-center text-orange-700">
                    <AlertCircle size={16} className="mr-2" />
                    <span className="text-sm font-medium">
                      This rental expires in {Math.ceil((rentalEndDate - new Date()) / (1000 * 60 * 60 * 24))} days.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ownership Information for Non-Rental */}
          {!isRental && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Ownership Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {machine.purchaseDate && (
                  <div className="p-3 bg-white rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">Purchase Date</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {new Date(machine.purchaseDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
                
                {machine.purchaseValue && (
                  <div className="p-3 bg-white rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">Purchase Value</span>
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      Rs. {machine.purchaseValue.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Specifications */}
          {(machine.powerRequirement || machine.capacity) && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Technical Specifications
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {machine.powerRequirement && (
                  <div className="p-3 bg-white rounded-lg">
                    <div className="font-medium text-slate-900">Power Requirement</div>
                    <div className="text-sm text-slate-600">{machine.powerRequirement}</div>
                  </div>
                )}
                
                {machine.capacity && (
                  <div className="p-3 bg-white rounded-lg">
                    <div className="font-medium text-slate-900">Capacity</div>
                    <div className="text-sm text-slate-600">{machine.capacity}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Maintenance Information */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Maintenance Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-900">Last Maintenance</span>
                </div>
                <div className="text-sm text-slate-600">
                  {machine.lastMaintenance 
                    ? new Date(machine.lastMaintenance).toLocaleDateString() 
                    : 'Never maintained'
                  }
                </div>
              </div>
              
              <div className={`p-3 bg-white rounded-lg ${isMaintenanceDue ? 'border-2 border-red-200' : ''}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-900">Next Maintenance</span>
                </div>
                <div className={`text-sm font-medium ${
                  isMaintenanceDue ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {machine.nextMaintenance 
                    ? new Date(machine.nextMaintenance).toLocaleDateString() 
                    : 'Not scheduled'
                  }
                  {isMaintenanceDue && (
                    <div className="flex items-center mt-1 text-red-500">
                      <AlertCircle size={12} className="mr-1" />
                      <span className="text-xs">Due for maintenance</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {machine.description && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-700">{machine.description}</p>
              </div>
            </div>
          )}

          {/* Maintenance Notes */}
          {machine.maintenanceNotes && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Maintenance Notes</label>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-700">{machine.maintenanceNotes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MachineDetailModal;