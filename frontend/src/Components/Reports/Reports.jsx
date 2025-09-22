import {
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Eye,
  Factory,
  FileText,
  Filter,
  Package,
  PieChart,
  Printer,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { employeeAPI, materialAPI, orderAPI, reportAPI } from '../../services/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [activeReport, setActiveReport] = useState('dashboard');

  useEffect(() => {
    fetchReportsData();
  }, [dateRange, activeReport]);

  const fetchReportsData = async () => {
    try {
      if (activeReport === 'dashboard') {
        const response = await reportAPI.getDashboardStats();
        setDashboardStats(response.data.data);
      }
      // Add other report type fetches here
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'from-blue-500 to-blue-600' },
    { id: 'orders', label: 'Order Reports', icon: Package, color: 'from-green-500 to-green-600' },
    { id: 'employees', label: 'Employee Reports', icon: Users, color: 'from-purple-500 to-purple-600' },
    { id: 'financial', label: 'Financial Reports', icon: DollarSign, color: 'from-orange-500 to-orange-600' },
    { id: 'production', label: 'Production Reports', icon: Factory, color: 'from-red-500 to-red-600' },
    { id: 'inventory', label: 'Inventory Reports', icon: TrendingUp, color: 'from-teal-500 to-teal-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-600 mt-1">Comprehensive reports and business insights</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            <Printer size={16} />
            <span>Print</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
            <Download size={16} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Report Period:</span>
            </div>
            <div className="flex space-x-4">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <span className="flex items-center text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
              <option>Monthly Report</option>
              <option>Weekly Report</option>
              <option>Daily Report</option>
              <option>Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                activeReport === report.id
                  ? 'border-transparent bg-gradient-to-r text-white shadow-lg'
                  : 'border-slate-200 bg-white text-slate-700 hover:shadow-md'
              } ${activeReport === report.id ? report.color : ''}`}
            >
              <div className="flex flex-col items-center space-y-2">
                <Icon size={24} />
                <span className="text-sm font-medium">{report.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {activeReport === 'dashboard' && <DashboardReport stats={dashboardStats} />}
        {activeReport === 'orders' && <OrderReport />}
        {activeReport === 'employees' && <EmployeeReport />}
        {activeReport === 'financial' && <FinancialReport />}
        {activeReport === 'production' && <ProductionReport />}
        {activeReport === 'inventory' && <InventoryReport />}
      </div>
    </div>
  );
};

const DashboardReport = ({ stats }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-semibold text-slate-900">Executive Dashboard</h2>
      <span className="text-sm text-slate-500">Real-time Overview</span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Revenue"
        value={`Rs. ${stats.totalRevenue?.toLocaleString() || '0'}`}
        change="+12.5%"
        trend="up"
        icon={<DollarSign className="w-6 h-6" />}
      />
      <MetricCard
        title="Completed Orders"
        value={stats.completedOrders || '0'}
        change="+8.2%"
        trend="up"
        icon={<Package className="w-6 h-6" />}
      />
      <MetricCard
        title="Active Employees"
        value={stats.activeEmployees || '0'}
        change="+3.1%"
        trend="up"
        icon={<Users className="w-6 h-6" />}
      />
      <MetricCard
        title="Production Efficiency"
        value="87%"
        change="+2.4%"
        trend="up"
        icon={<TrendingUp className="w-6 h-6" />}
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Order Status Distribution</h3>
        <div className="space-y-3">
          {[
            { status: 'Completed', count: stats.completedOrders, color: 'bg-green-500', percentage: 45 },
            { status: 'In Production', count: stats.inProductionOrders, color: 'bg-blue-500', percentage: 30 },
            { status: 'Pending', count: stats.pendingOrders, color: 'bg-yellow-500', percentage: 20 },
            { status: 'Cancelled', count: 5, color: 'bg-red-500', percentage: 5 }
          ].map((item) => (
            <div key={item.status} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <span className="text-sm font-medium text-slate-700">{item.status}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-24 bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-slate-500">{item.count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          {[
            { label: 'Generate Financial Report', action: () => console.log('Financial Report') },
            { label: 'Export Employee Data', action: () => console.log('Employee Export') },
            { label: 'Inventory Summary', action: () => console.log('Inventory Summary') },
            { label: 'Production Analysis', action: () => console.log('Production Analysis') }
          ].map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-500 transition-colors"
            >
              <span className="text-sm text-slate-700">{item.label}</span>
              <Eye size={16} className="text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const OrderReport = () => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-slate-900">Order Analysis Report</h2>
    <div className="text-center py-12 text-slate-500">
      <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
      <p>Order reports will be generated based on selected criteria</p>
    </div>
  </div>
);

const EmployeeReport = () => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-slate-900">Employee Performance Report</h2>
    <div className="text-center py-12 text-slate-500">
      <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
      <p>Employee reports will be generated based on selected criteria</p>
    </div>
  </div>
);

const FinancialReport = () => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-slate-900">Financial Analysis Report</h2>
    <div className="text-center py-12 text-slate-500">
      <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-300" />
      <p>Financial reports will be generated based on selected criteria</p>
    </div>
  </div>
);

const ProductionReport = () => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-slate-900">Production Efficiency Report</h2>
    <div className="text-center py-12 text-slate-500">
      <Factory className="w-16 h-16 mx-auto mb-4 text-slate-300" />
      <p>Production reports will be generated based on selected criteria</p>
    </div>
  </div>
);

const InventoryReport = () => (
  <div className="space-y-6">
    <h2 className="text-lg font-semibold text-slate-900">Inventory Analysis Report</h2>
    <div className="text-center py-12 text-slate-500">
      <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
      <p>Inventory reports will be generated based on selected criteria</p>
    </div>
  </div>
);

const MetricCard = ({ title, value, change, trend, icon }) => (
  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        <p className={`text-sm mt-1 flex items-center ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          <TrendingUp size={14} className="mr-1" />
          {change}
        </p>
      </div>
      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-slate-600 shadow-sm">
        {icon}
      </div>
    </div>
  </div>
);

export default Reports;