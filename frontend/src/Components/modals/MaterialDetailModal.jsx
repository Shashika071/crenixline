import {
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  User,
  X
} from 'lucide-react';

import React from 'react';

const MaterialDetailModal = ({ material, onClose }) => {
  if (!material) return null;

  const isLowStock = material.availableQty <= material.reorderLevel;
  const stockPercentage = Math.min((material.availableQty / (material.reorderLevel * 3)) * 100, 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Material Details</h2>
            <p className="text-sm text-slate-600 mt-1">Complete information about {material.name}</p>
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
                <label className="block text-sm font-medium text-slate-600 mb-1">Material Name</label>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <Package className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-900">{material.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">SKU</label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-mono text-slate-900">{material.sku || 'Not specified'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                    {material.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Supplier</label>
                <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <User className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-900">
                    {material.supplierId?.name || 'No supplier assigned'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Unit of Measurement</label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-900">{material.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${
                    isLowStock 
                      ? 'bg-red-100 text-red-800 border-red-200' 
                      : 'bg-green-100 text-green-800 border-green-200'
                  }`}>
                    {isLowStock ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Stock Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{material.availableQty}</div>
                <div className="text-sm text-slate-600">Available Quantity</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{material.reorderLevel}</div>
                <div className="text-sm text-slate-600">Reorder Level</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">Rs. {material.costPerUnit?.toLocaleString()}</div>
                <div className="text-sm text-slate-600">Cost per Unit</div>
              </div>
            </div>

            {/* Stock Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Stock Level</span>
                <span className="text-sm text-slate-600">{stockPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    isLowStock ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${stockPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0%</span>
                <span>Reorder Level: {Math.round((material.reorderLevel / (material.reorderLevel * 3)) * 100)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Last Restocked</label>
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-900">
                  {material.lastRestocked 
                    ? new Date(material.lastRestocked).toLocaleDateString() 
                    : 'Never restocked'
                  }
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Total Value</label>
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-900">
                  Rs. {(material.availableQty * material.costPerUnit).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {material.description && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Description</label>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-700">{material.description}</p>
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

export default MaterialDetailModal;