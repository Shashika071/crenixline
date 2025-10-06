import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
  XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { employeeAPI, materialAPI, orderAPI, reportAPI } from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeEmployees: 0,
    totalRevenue: 0,
    completedOrders: 0,
    inProductionOrders: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
 
      
 

      // Test each API call individually to see which one fails
      let dashboardStats, orders, lowStock;

      try {
        dashboardStats = await reportAPI.getDashboardStats();
        console.log('Dashboard stats response:', dashboardStats.data);
 
      } catch (err) {
        console.error('Dashboard stats error:', err);
        dashboardStats = { data: { data: {} } };
 
      }

      try {
        orders = await orderAPI.getAll({ _limit: 5, _sort: 'createdAt', _order: 'desc' });
        console.log('Orders response:', orders.data);
 
      } catch (err) {
        console.error('Orders error:', err);
        orders = { data: { data: [] } };
     
      }

      try {
        lowStock = await materialAPI.getLowStock();
        console.log('Low stock response:', lowStock.data);
  
      } catch (err) {
        console.error('Low stock error:', err);
        lowStock = { data: { data: [] } };
       
      }

      // Set the data
      const statsData = dashboardStats.data.data || {};
  
      
      setStats(statsData);
      setRecentOrders(orders.data.data || []);
      setLowStockItems(lowStock.data.data || []);

   

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
  
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'In Production': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600">Loading dashboard data...</p>
        {debugInfo && <p className="text-sm text-slate-500 mt-2">Status: {debugInfo}</p>}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">{error}</p>
         
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
 
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-600">Welcome back! Here's what's happening today.</p>
      
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders || 0}
          change="+12%"
          icon={<ShoppingCart className="w-6 h-6" />}
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Active Employees"
          value={stats.activeEmployees || 0}
          change="+5%"
          icon={<Users className="w-6 h-6" />}
          color="from-green-500 to-green-600"
        />
        <StatCard
          title="Total Revenue"
          value={`RS.${(stats.totalRevenue || 0).toLocaleString()}`}
          change="+8%"
          icon={<DollarSign className="w-6 h-6" />}
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockItems.length || 0}
          change="Attention needed"
          icon={<AlertTriangle className="w-6 h-6" />}
          color="from-orange-500 to-orange-600"
        />
      </div>
 

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{order.designName}</p>
                    <p className="text-sm text-slate-500">Qty: {order.quantity} • Due: {new Date(order.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'In Production' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-4">No recent orders found</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Low Stock Alert</h2>
            <Package className="w-5 h-5 text-slate-400" />
          </div>
          <div className="space-y-3">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 5).map((item) => (
                <div key={item._id} className="flex items-center justify-between p-3 hover:bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">Available: {item.availableQty} {item.unit}</p>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-4">All items are well stocked!</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Completed Orders</p>
              <p className="text-2xl font-bold">{stats.completedOrders || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">In Production</p>
              <p className="text-2xl font-bold">{stats.inProductionOrders || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Pending Orders</p>
              <p className="text-2xl font-bold">{stats.pendingOrders || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-200" />
          </div>
        </div>
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
        {/* Remove this line: <p className={`text-sm mt-1 ...`}>{change}</p> */}
      </div>
      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

export default Dashboard; 