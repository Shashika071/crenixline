import * as XLSX from 'xlsx';

import {
  Building,
  Download,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Truck,
  User
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { supplierAPI } from '../../services/api';

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierAPI.getAll();
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      alert('Error fetching suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await supplierAPI.delete(id);
        setSuppliers(suppliers.filter(supplier => supplier._id !== id));
        alert('Supplier deleted successfully!');
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Error deleting supplier. Please try again.');
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingSupplier) {
        const response = await supplierAPI.update(editingSupplier._id, formData);
        setSuppliers(suppliers.map(sup => 
          sup._id === editingSupplier._id ? response.data.data : sup
        ));
        alert('Supplier updated successfully!');
      } else {
        const response = await supplierAPI.create(formData);
        setSuppliers([...suppliers, response.data.data]);
        alert('Supplier added successfully!');
      }
      setShowAddModal(false);
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Error saving supplier. Please try again.');
    }
  };

  const exportToExcel = () => {
    if (filteredSuppliers.length === 0) {
      alert('No data to export!');
      return;
    }

    const exportData = filteredSuppliers.map(supplier => ({
      'Company Name': supplier.name,
      'Type': supplier.type,
      'Contact Number': supplier.contactNo,
      'Email': supplier.email || 'N/A',
      'Address': supplier.address,
      'Contact Person': supplier.contactPerson?.name || 'N/A',
      'Contact Person Phone': supplier.contactPerson?.phone || 'N/A',
      'Contact Person Email': supplier.contactPerson?.email || 'N/A',
      'Status': supplier.status,
      'Rating': supplier.rating,
      'Balance': supplier.balance || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');
    
    const fileName = `suppliers_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || supplier.type === filterType;
    const matchesStatus = filterStatus === 'all' || supplier.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supplier Management</h1>
          <p className="text-slate-600 mt-1">Manage your suppliers and agents</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Statistics */}
      <SupplierStats suppliers={suppliers} />

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
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
                <option value="Supplier">Supplier</option>
                <option value="Agent">Agent</option>
                <option value="Client">Client</option>
                <option value="Both">Both</option>
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={fetchSuppliers}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
            <button 
              onClick={exportToExcel}
              disabled={filteredSuppliers.length === 0}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={16} />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading suppliers...</p>
        </div>
      )}

      {/* Suppliers Grid */}
      {!loading && filteredSuppliers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard 
              key={supplier._id} 
              supplier={supplier} 
              onEdit={() => {
                setEditingSupplier(supplier);
                setShowAddModal(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredSuppliers.length === 0 && suppliers.length > 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <Truck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No suppliers found</h3>
          <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* No Suppliers State */}
      {!loading && suppliers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <Truck className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No suppliers yet</h3>
          <p className="text-slate-500 mb-4">Get started by adding your first supplier.</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Add First Supplier
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <SupplierModal 
          supplier={editingSupplier}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowAddModal(false);
            setEditingSupplier(null);
          }}
        />
      )}
    </div>
  );
};

const SupplierStats = ({ suppliers }) => {
  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'Active').length,
    suppliers: suppliers.filter(s => s.type === 'Supplier').length,
    agents: suppliers.filter(s => s.type === 'Agent').length,
    clients: suppliers.filter(s => s.type === 'Client').length,
    both: suppliers.filter(s => s.type === 'Both').length,
  };

  const activePercentage = stats.total > 0 ? (stats.active / stats.total * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Suppliers"
        value={stats.total}
        icon={<Truck className="w-6 h-6" />}
        color="from-blue-500 to-blue-600"
      />
      <StatCard
        title="Active"
        value={stats.active}
        percentage={activePercentage}
        icon={<Star className="w-6 h-6" />}
        color="from-green-500 to-green-600"
      />
      <StatCard
        title="Material Suppliers"
        value={stats.suppliers}
        icon={<Building className="w-6 h-6" />}
        color="from-purple-500 to-purple-600"
      />
      <StatCard
        title="Agents"
        value={stats.agents}
        icon={<User className="w-6 h-6" />}
        color="from-orange-500 to-orange-600"
      />
    </div>
  );
};

const SupplierCard = ({ supplier, onEdit, onDelete }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'Supplier': return 'bg-blue-100 text-blue-800';
      case 'Agent': return 'bg-green-100 text-green-800';
      case 'Client': return 'bg-purple-100 text-purple-800';
      case 'Both': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusColor = (status) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 truncate max-w-[150px]">{supplier.name}</h3>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(supplier.type)}`}>
              {supplier.type}
            </span>
          </div>
        </div>
        <div className="flex space-x-1">
          <button 
            onClick={() => onEdit(supplier)}
            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
            title="Edit Supplier"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => onDelete(supplier._id)}
            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
            title="Delete Supplier"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Phone size={14} />
          <span className="truncate">{supplier.contactNo}</span>
        </div>
        
        {supplier.email && (
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Mail size={14} />
            <span className="truncate">{supplier.email}</span>
          </div>
        )}
        
        {supplier.contactPerson?.name && (
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <User size={14} />
            <span className="truncate">Contact: {supplier.contactPerson.name}</span>
          </div>
        )}
        
        <div className="flex items-start space-x-2 text-sm text-slate-600">
          <MapPin size={14} className="mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{supplier.address}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(supplier.status)}`}>
          {supplier.status}
        </span>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star}
              size={12}
              className={star <= supplier.rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const SupplierModal = ({ supplier, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contactNo: supplier?.contactNo || '',
    address: supplier?.address || '',
    email: supplier?.email || '',
    type: supplier?.type || 'Supplier',
    status: supplier?.status || 'Active',
    contactPerson: {
      name: supplier?.contactPerson?.name || '',
      phone: supplier?.contactPerson?.phone || '',
      email: supplier?.contactPerson?.email || ''
    },
    rating: supplier?.rating || 3,
    balance: supplier?.balance || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleContactPersonChange = (field, value) => {
    setFormData({
      ...formData,
      contactPerson: {
        ...formData.contactPerson,
        [field]: value
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Company Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="Enter company name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              >
                <option value="Supplier">Supplier</option>
                <option value="Agent">Agent</option>
                <option value="Client">Client</option>
                <option value="Both">Both</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number *</label>
              <input
                type="tel"
                required
                value={formData.contactNo}
                onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="Enter contact number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="Enter email address"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="Enter full address"
              />
            </div>
            
            <div className="md:col-span-2 border-t pt-6">
              <h3 className="font-medium text-slate-900 mb-4 text-lg">Contact Person Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.contactPerson.name}
                    onChange={(e) => handleContactPersonChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Contact person name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.contactPerson.phone}
                    onChange={(e) => handleContactPersonChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Contact person phone"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.contactPerson.email}
                    onChange={(e) => handleContactPersonChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    placeholder="Contact person email"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
              >
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Balance ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
            >
              {supplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, percentage, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {percentage !== undefined && (
          <p className="text-sm text-green-600 mt-1">{percentage}% of total</p>
        )}
      </div>
      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

export default SupplierManagement;