import {
  AlertTriangle,
  Download,
  Edit,
  Eye,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Warehouse
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { materialAPI, supplierAPI } from '../../services/api';

const InventoryManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [materialsRes, suppliersRes] = await Promise.all([
        materialAPI.getAll(),
        supplierAPI.getAll({ type: 'Supplier' })
      ]);
      setMaterials(materialsRes.data.data);
      setSuppliers(suppliersRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (materialId, operation, quantity) => {
    try {
      await materialAPI.updateStock(materialId, { operation, quantity });
      fetchData(); // Refresh data
      setShowStockModal(false);
      setSelectedMaterial(null);
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        // Add delete API call when available
        console.log('Delete material:', id);
        // await materialAPI.delete(id);
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || material.type === filterType;
    return matchesSearch && matchesType;
  });

  const lowStockMaterials = materials.filter(m => m.availableQty <= m.reorderLevel);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-600 mt-1">Manage raw materials and track stock levels</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Material</span>
        </button>
      </div>

      {/* Statistics */}
      <InventoryStats materials={materials} lowStockCount={lowStockMaterials.length} />

      {/* Low Stock Alert */}
      {lowStockMaterials.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Low Stock Alert</h3>
                <p className="text-red-600 text-sm">
                  {lowStockMaterials.length} items need immediate attention
                </p>
              </div>
            </div>
            <button 
              onClick={() => setFilterType('all')}
              className="text-red-700 hover:text-red-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-64"
              />
            </div>
            
            <div className="flex space-x-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Types</option>
                <option value="Fabric">Fabric</option>
                <option value="Button">Button</option>
                <option value="Zipper">Zipper</option>
                <option value="Thread">Thread</option>
                <option value="Label">Label</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchData}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700">
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900">Inventory Items</h2>
          <div className="text-sm text-slate-600">
            {filteredMaterials.length} items found
          </div>
        </div>
        
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
              {filteredMaterials.map((material) => (
                <MaterialRow 
                  key={material._id} 
                  material={material} 
                  onStockUpdate={(material) => {
                    setSelectedMaterial(material);
                    setShowStockModal(true);
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredMaterials.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No materials found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <MaterialModal 
          suppliers={suppliers}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchData}
        />
      )}

      {showStockModal && selectedMaterial && (
        <StockModal 
          material={selectedMaterial}
          onClose={() => {
            setShowStockModal(false);
            setSelectedMaterial(null);
          }}
          onUpdate={handleStockUpdate}
        />
      )}
    </div>
  );
};

const InventoryStats = ({ materials, lowStockCount }) => {
  const totalValue = materials.reduce((sum, m) => sum + (m.availableQty * m.costPerUnit), 0);
  const totalItems = materials.reduce((sum, m) => sum + m.availableQty, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard
        title="Total Items"
        value={materials.length}
        subtitle={`${totalItems} units`}
        icon={<Package className="w-6 h-6" />}
        color="from-blue-500 to-blue-600"
      />
      <StatCard
        title="Inventory Value"
        value={`Rs. ${totalValue.toLocaleString()}`}
        icon={<TrendingUp className="w-6 h-6" />}
        color="from-green-500 to-green-600"
      />
      <StatCard
        title="Low Stock"
        value={lowStockCount}
        subtitle="Need reorder"
        icon={<AlertTriangle className="w-6 h-6" />}
        color="from-orange-500 to-orange-600"
      />
      <StatCard
        title="Categories"
        value={new Set(materials.map(m => m.type)).size}
        subtitle="Different types"
        icon={<Warehouse className="w-6 h-6" />}
        color="from-purple-500 to-purple-600"
      />
    </div>
  );
};

const MaterialRow = ({ material, onStockUpdate, onDelete }) => {
  const isLowStock = material.availableQty <= material.reorderLevel;
  const stockPercentage = (material.availableQty / (material.reorderLevel * 3)) * 100;

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
              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
            ></div>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-900">{material.availableQty} {material.unit}</div>
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
        <div className="text-xs text-slate-500">per {material.unit}</div>
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
          <button className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors">
            <Eye size={16} />
          </button>
          <button className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Material Modal Component
const MaterialModal = ({ suppliers, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Fabric',
    unit: 'meters',
    availableQty: 0,
    reorderLevel: 0,
    costPerUnit: 0,
    supplierId: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add create API call when available
      console.log('Create material:', formData);
      // await materialAPI.create(formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating material:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Add New Material</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Material Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="Fabric">Fabric</option>
                <option value="Button">Button</option>
                <option value="Zipper">Zipper</option>
                <option value="Thread">Thread</option>
                <option value="Label">Label</option>
                <option value="Packaging">Packaging</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="meters">Meters</option>
                <option value="pieces">Pieces</option>
                <option value="kg">Kilograms</option>
                <option value="rolls">Rolls</option>
                <option value="boxes">Boxes</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
              <select
                required
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Available Quantity</label>
              <input
                type="number"
                required
                value={formData.availableQty}
                onChange={(e) => setFormData({ ...formData, availableQty: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
              <input
                type="number"
                required
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cost per Unit (Rs.)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Add Material
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Stock Update Modal
const StockModal = ({ material, onClose, onUpdate }) => {
  const [operation, setOperation] = useState('add');
  const [quantity, setQuantity] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quantity && !isNaN(quantity)) {
      onUpdate(material._id, operation, parseInt(quantity));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Update Stock</h2>
          <p className="text-slate-600 text-sm mt-1">{material.name}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Operation</label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="add">Add Stock</option>
                <option value="subtract">Use Stock</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder={`Enter quantity in ${material.unit}`}
              />
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span>Current Stock:</span>
              <span className="font-medium">{material.availableQty} {material.unit}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>After {operation === 'add' ? 'Adding' : 'Using'}:</span>
              <span className="font-medium">
                {material.availableQty + (operation === 'add' ? parseInt(quantity || 0) : -parseInt(quantity || 0))} {material.unit}
              </span>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Update Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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

export default InventoryManagement;