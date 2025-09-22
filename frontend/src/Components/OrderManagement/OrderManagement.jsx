import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Filter,
  Package,
  Plus,
  Search,
  Trash2,
  Truck,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { employeeAPI, orderAPI, supplierAPI } from '../../services/api';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, suppliersRes, employeesRes] = await Promise.all([
        orderAPI.getAll(),
        supplierAPI.getAll({ type: 'Agent' }),
        employeeAPI.getAll()
      ]);
      setOrders(ordersRes.data.data);
      setSuppliers(suppliersRes.data.data);
      setEmployees(employeesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'In Production': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Delivered': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={16} />;
      case 'In Production': return <Clock size={16} />;
      case 'Pending': return <AlertCircle size={16} />;
      case 'Delivered': return <Truck size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order Management</h1>
          <p className="text-slate-600 mt-1">Manage production orders and track progress</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Create Order</span>
        </button>
      </div>

      {/* Order Statistics */}
      <OrderStats orders={orders} />

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => (
          <OrderCard 
            key={order._id} 
            order={order} 
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        ))}
      </div>

      {showAddModal && (
        <OrderModal 
          suppliers={suppliers}
          employees={employees}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

const OrderStats = ({ orders }) => {
  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === 'Completed').length,
    inProduction: orders.filter(o => o.status === 'In Production').length,
    pending: orders.filter(o => o.status === 'Pending').length,
    totalRevenue: orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + (o.sellingPrice || 0), 0)
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard
        title="Total Orders"
        value={stats.total}
        icon={<Package className="w-6 h-6" />}
        color="from-blue-500 to-blue-600"
      />
      <StatCard
        title="In Production"
        value={stats.inProduction}
        icon={<Clock className="w-6 h-6" />}
        color="from-yellow-500 to-yellow-600"
      />
      <StatCard
        title="Completed"
        value={stats.completed}
        icon={<CheckCircle className="w-6 h-6" />}
        color="from-green-500 to-green-600"
      />
      <StatCard
        title="Total Revenue"
        value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
        icon={<DollarSign className="w-6 h-6" />}
        color="from-purple-500 to-purple-600"
      />
    </div>
  );
};

const OrderCard = ({ order, getStatusColor, getStatusIcon }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-semibold text-slate-900">{order.designName}</h3>
        <p className="text-sm text-slate-500">Order #: {order.orderId}</p>
      </div>
      <span className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
        {getStatusIcon(order.status)}
        <span>{order.status}</span>
      </span>
    </div>
    
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Quantity:</span>
        <span className="font-medium">{order.quantity} units</span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Due Date:</span>
        <span className="font-medium">{new Date(order.dueDate).toLocaleDateString()}</span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Price:</span>
        <span className="font-medium">Rs. {order.sellingPrice?.toLocaleString()}</span>
      </div>
      
      <div className="pt-3 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Progress</span>
          <span className="text-xs font-medium">{order.progress || 0}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
          <div 
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${order.progress || 0}%` }}
          ></div>
        </div>
      </div>
    </div>
    
    <div className="flex space-x-2 mt-4">
      <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors">
        View Details
      </button>
      <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors">
        <Edit size={16} />
      </button>
    </div>
  </div>
);

// Order Modal Component
const OrderModal = ({ suppliers, employees, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    agentId: '',
    designName: '',
    quantity: '',
    sellingPrice: '',
    dueDate: '',
    priority: 'Medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await orderAPI.create(formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Create New Order</h2>
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
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

export default OrderManagement;