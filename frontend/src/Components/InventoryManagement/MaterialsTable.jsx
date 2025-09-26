import { Eye, Package, RefreshCw, Trash2, TrendingDown, TrendingUp } from 'lucide-react';

import React from 'react';

const MaterialRow = ({ material, onStockUpdate, onDelete, onView }) => {
  const isLowStock = material.availableQty <= material.reorderLevel;
  const stockPercentage = Math.min((material.availableQty / (material.reorderLevel * 3)) * 100, 100);

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{material.name}</div>
            <div className="text-sm text-slate-500">SKU: {material.sku || 'N/A'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800">
          {material.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <div className="w-20 bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                isLowStock ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${stockPercentage}%` }}
            ></div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">
              {material.availableQty} {material.unit}
            </div>
            <div className="text-xs text-slate-500">Reorder: {material.reorderLevel}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-900">
          {material.supplierId?.name || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900">
          Rs. {material.costPerUnit?.toLocaleString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
          isLowStock 
            ? 'bg-red-100 text-red-800 border-red-200' 
            : 'bg-green-100 text-green-800 border-green-200'
        }`}>
          {isLowStock ? <TrendingDown size={12} className="mr-1" /> : <TrendingUp size={12} className="mr-1" />}
          {isLowStock ? 'Low Stock' : 'In Stock'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onStockUpdate(material)}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
            title="Update Stock"
          >
            <RefreshCw size={16} />
          </button>
          <button 
            onClick={() => onView(material)}
            className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => onDelete(material._id)}
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

const MaterialsTable = ({ materials, onStockUpdate, onDelete, onView }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Material</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stock Level</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Supplier</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cost</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {materials.map((material) => (
            <MaterialRow 
              key={material._id} 
              material={material} 
              onStockUpdate={onStockUpdate}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </tbody>
      </table>
      
      {materials.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No materials found</h3>
          <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
};

export default MaterialsTable;