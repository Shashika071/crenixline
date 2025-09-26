import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  DollarSign,
  Edit,
  Filter,
  MoreVertical,
  Package,
  Plus,
  Search,
  Trash2,
  Truck,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { employeeAPI, orderAPI, supplierAPI } from '../../services/api';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    agentId: '',
    priority: '',
    dateRange: {
      start: '',
      end: ''
    },
    progressMin: '',
    progressMax: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters, searchTerm]);

const fetchData = async () => {
  try {
    setLoading(true); // Show loading state
    const [ordersRes, suppliersRes, employeesRes] = await Promise.all([
      orderAPI.getAll(),
      supplierAPI.getAll({ type: 'Agent' }),
      employeeAPI.getAll()
    ]);
    setOrders(ordersRes.data.data);
    setFilteredOrders(ordersRes.data.data); // Also update filtered orders
    setSuppliers(suppliersRes.data.data);
    setEmployees(employeesRes.data.data);
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    setLoading(false);
  }
};

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.designName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Agent filter
    if (filters.agentId) {
      filtered = filtered.filter(order => order.agentId?._id === filters.agentId || order.agentId === filters.agentId);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }

    // Date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(order => new Date(order.dueDate) >= new Date(filters.dateRange.start));
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(order => new Date(order.dueDate) <= new Date(filters.dateRange.end));
    }

    // Progress range filter
    if (filters.progressMin) {
      filtered = filtered.filter(order => (order.progress || 0) >= parseInt(filters.progressMin));
    }
    if (filters.progressMax) {
      filtered = filtered.filter(order => (order.progress || 0) <= parseInt(filters.progressMax));
    }

    setFilteredOrders(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDateRangeChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [key]: value
      }
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      agentId: '',
      priority: '',
      dateRange: { start: '', end: '' },
      progressMin: '',
      progressMax: ''
    });
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.agentId) count++;
    if (filters.priority) count++;
    if (filters.dateRange.start) count++;
    if (filters.dateRange.end) count++;
    if (filters.progressMin) count++;
    if (filters.progressMax) count++;
    if (searchTerm) count++;
    return count;
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setShowModal(true);
  };

  const handleDelete = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await orderAPI.delete(orderId);
        fetchData();
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error deleting order');
      }
    }
  };

  const handleStatusUpdate = (order) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null);
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setSelectedOrder(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Production': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Delivered': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={16} />;
      case 'In Production': return <Clock size={16} />;
      case 'Pending': return <AlertCircle size={16} />;
      case 'Delivered': return <Truck size={16} />;
      case 'Cancelled': return <AlertCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const statusOptions = [
    { value: 'Pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'In Production', label: 'In Production', color: 'bg-blue-100 text-blue-800' },
    { value: 'Delivered', label: 'Delivered', color: 'bg-purple-100 text-purple-800' },
    { value: 'Completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'Cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  const priorityOptions = [
    { value: 'Low', label: 'Low', color: 'text-green-600' },
    { value: 'Medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'High', label: 'High', color: 'text-orange-600' },
    { value: 'Urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
          <p className="text-slate-600 mt-1">Manage production orders and track progress</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Create Order</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search orders by design name or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Filter size={16} />
              <span>Filters</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
              <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X size={16} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Status</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Agent Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agent</label>
                <select
                  value={filters.agentId}
                  onChange={(e) => handleFilterChange('agentId', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Agents</option>
                  {suppliers.map(supplier => (
                    <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Priorities</option>
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Progress Range */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Progress Range</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min %"
                    min="0"
                    max="100"
                    value={filters.progressMin}
                    onChange={(e) => handleFilterChange('progressMin', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max %"
                    min="0"
                    max="100"
                    value={filters.progressMax}
                    onChange={(e) => handleFilterChange('progressMax', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-slate-600">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
        {getActiveFilterCount() > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <X size={14} />
            <span>Clear all filters</span>
          </button>
        )}
      </div>

      {/* Order Statistics */}
      <OrderStats orders={filteredOrders} />

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No orders found</h3>
          <p className="text-slate-600 mb-4">
            {orders.length === 0 ? 'No orders have been created yet.' : 'Try adjusting your filters or search terms.'}
          </p>
          {orders.length === 0 && (
            <button 
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Create Your First Order
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard 
              key={order._id} 
              order={order} 
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              onEdit={() => handleEdit(order)}
              onDelete={() => handleDelete(order._id)}
              onStatusUpdate={() => handleStatusUpdate(order)}
            />
          ))}
        </div>
      )}

      {/* Order Modal */}
      {showModal && (
        <OrderModal 
          order={editingOrder}
          suppliers={suppliers}
          employees={employees}
          onClose={handleCloseModal}
          onSuccess={fetchData}
        />
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <StatusModal 
          order={selectedOrder}
          statusOptions={statusOptions}
          onClose={handleCloseStatusModal}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

// OrderCard component remains the same as previous implementation
const OrderCard = ({ order, getStatusColor, getStatusIcon, onEdit, onDelete, onStatusUpdate }) => {
  // Calculate progress percentage from order data
  const progressPercentage = order.quantity > 0 
    ? Math.round(((order.completedQuantity || 0) / order.quantity) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">{order.designName}</h3>
          <p className="text-sm text-slate-500">Order #: {order.orderId}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)}
            <span>{order.status}</span>
          </span>
          <button 
            onClick={onStatusUpdate}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Update Status"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Quantity:</span>
          <span className="font-medium">
            {order.completedQuantity || 0}/{order.quantity} units
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Due Date:</span>
          <span className="font-medium">{new Date(order.dueDate).toLocaleDateString()}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Price:</span>
          <span className="font-medium">Rs. {order.sellingPrice?.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Priority:</span>
          <span className={`font-medium ${
            order.priority === 'Urgent' ? 'text-red-600' :
            order.priority === 'High' ? 'text-orange-600' :
            order.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {order.priority}
          </span>
        </div>
        
        {/* Progress Section - Fixed to show actual progress */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500">Progress</span>
            <span className="text-xs font-medium">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-4">
        <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors">
          View Details
        </button>
        <button 
          onClick={onEdit}
          className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          title="Edit Order"
        >
          <Edit size={16} />
        </button>
        <button 
          onClick={onDelete}
          className="bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          title="Delete Order"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// Status Modal Component (Enhanced with Quantity Input)
const StatusModal = ({ order, statusOptions, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    status: order.status,
    completedQuantity: order.completedQuantity || 0,
    notes: ''
  });

  // Calculate progress percentage
  const progressPercentage = order.quantity > 0 
    ? Math.round((formData.completedQuantity / order.quantity) * 100)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await orderAPI.updateProgress(order._id, {
        status: formData.status,
        completedQuantity: formData.completedQuantity
      });
      
      onSuccess(); // This should refresh the data
      onClose();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status');
    }
  };

  const handleStatusChange = (status) => {
    let newCompletedQuantity = formData.completedQuantity;
    
    // Auto-set quantity based on status (but don't force 10% for Pending)
    switch (status) {
      case 'Completed':
        newCompletedQuantity = order.quantity;
        break;
      case 'Delivered':
        newCompletedQuantity = Math.min(order.quantity, Math.max(formData.completedQuantity, Math.round(order.quantity * 0.9)));
        break;
      case 'In Production':
        newCompletedQuantity = Math.min(order.quantity, Math.max(formData.completedQuantity, Math.round(order.quantity * 0.5)));
        break;
      case 'Pending':
        // Keep current quantity, don't force to 10%
        newCompletedQuantity = Math.min(order.quantity, Math.max(formData.completedQuantity, 0));
        break;
      case 'Cancelled':
        newCompletedQuantity = 0;
        break;
    }

    setFormData(prev => ({
      ...prev,
      status,
      completedQuantity: newCompletedQuantity
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Update Order Progress</h2>
          <p className="text-sm text-slate-600 mt-1">{order.designName} - {order.orderId}</p>
          <p className="text-sm text-slate-600">Total Quantity: {order.quantity} units</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Order Status</label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleStatusChange(option.value)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.status === option.value 
                      ? `${option.color} border-current` 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Progress */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Completed: {formData.completedQuantity} / {order.quantity} units ({progressPercentage}%)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max={order.quantity}
                value={formData.completedQuantity}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  completedQuantity: parseInt(e.target.value) || 0 
                }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            {/* Manual Quantity Input */}
            <div className="mt-2">
              <input
                type="number"
                min="0"
                max={order.quantity}
                value={formData.completedQuantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setFormData(prev => ({ 
                    ...prev, 
                    completedQuantity: Math.min(order.quantity, Math.max(0, value))
                  }));
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                placeholder="Enter completed quantity"
              />
            </div>
          </div>

          {/* Progress Bar Visualization */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-500">Current Progress</span>
              <span className="text-xs font-medium">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about the progress update..."
              rows="3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
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
              Update Progress
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};;
// Order Modal Component (Updated with status field)
const OrderModal = ({ order, suppliers, employees, onClose, onSuccess }) => {
  const isEditing = !!order;
  
  const [formData, setFormData] = useState({
    agentId: order?.agentId?._id || order?.agentId || '',
    designName: order?.designName || '',
    quantity: order?.quantity || '',
    sellingPrice: order?.sellingPrice || '',
    dueDate: order?.dueDate ? new Date(order.dueDate).toISOString().split('T')[0] : '',
    priority: order?.priority || 'Medium',
    status: order?.status || 'Pending' // Added status field
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await orderAPI.update(order._id, formData);
      } else {
        await orderAPI.create(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} order:`, error);
      alert(`Error ${isEditing ? 'updating' : 'creating'} order`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Edit Order' : 'Create New Order'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Agent</label>
              <select
                required
                value={formData.agentId}
                onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select Agent</option>
                {suppliers.map(supplier => (
                  <option key={supplier._id} value={supplier._id}>{supplier.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Design Name</label>
              <input
                type="text"
                required
                value={formData.designName}
                onChange={(e) => setFormData({ ...formData, designName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (Rs.)</label>
              <input
                type="number"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Status Field for Editing */}
            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Production">In Production</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            )}
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
              {isEditing ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
const OrderStats = ({ orders }) => {
  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === 'Completed').length,
    inProduction: orders.filter(o => o.status === 'In Production').length,
    pending: orders.filter(o => o.status === 'Pending').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    cancelled: orders.filter(o => o.status === 'Cancelled').length,
  
    totalRevenue: orders.filter(o => o.status === 'Completed')
      .reduce((sum, o) => sum + ((o.sellingPrice || 0) * (o.completedQuantity || 0)), 0)
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <StatCard
        title="Total"
        value={stats.total}
        icon={<Package className="w-4 h-4" />}
        color="from-blue-500 to-blue-600"
      />
      <StatCard
        title="Pending"
        value={stats.pending}
        icon={<Clock className="w-4 h-4" />}
        color="from-yellow-500 to-yellow-600"
      />
      <StatCard
        title="In Production"
        value={stats.inProduction}
        icon={<AlertCircle className="w-4 h-4" />}
        color="from-orange-500 to-orange-600"
      />
      <StatCard
        title="Delivered"
        value={stats.delivered}
        icon={<Truck className="w-4 h-4" />}
        color="from-purple-500 to-purple-600"
      />
      <StatCard
        title="Completed"
        value={stats.completed}
        icon={<CheckCircle className="w-4 h-4" />}
        color="from-green-500 to-green-600"
      />
      <StatCard
        title="Revenue"
        value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
        icon={<DollarSign className="w-4 h-4" />}
        color="from-emerald-500 to-emerald-600"
      />
    </div>
  );
};
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-600">{title}</p>
        <p className="text-lg font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`w-8 h-8 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

export default OrderManagement;