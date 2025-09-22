import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Filter,
  Package,
  Pause,
  Play,
  Plus,
  Search,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { employeeAPI, orderAPI, productionAPI } from '../../services/api';

const ProductionTracking = () => {
  const [productionJobs, setProductionJobs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJobType, setFilterJobType] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, ordersRes, employeesRes] = await Promise.all([
        productionAPI.getAll(),
        orderAPI.getAll(),
        employeeAPI.getAll()
      ]);
      setProductionJobs(jobsRes.data.data);
      setOrders(ordersRes.data.data);
      setEmployees(employeesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId, status) => {
    try {
      await productionAPI.updateStatus(jobId, { status });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const filteredJobs = productionJobs.filter(job => {
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    const matchesJobType = filterJobType === 'all' || job.jobType === filterJobType;
    return matchesStatus && matchesJobType;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'On Hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={16} />;
      case 'In Progress': return <Play size={16} />;
      case 'On Hold': return <Pause size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Production Tracking</h1>
          <p className="text-slate-600 mt-1">Monitor and manage production workflow</p>
        </div>
        <button className="mt-4 sm:mt-0 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2">
          <Plus size={16} />
          <span>Create Job</span>
        </button>
      </div>

      {/* Statistics */}
      <ProductionStats jobs={productionJobs} />

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search production jobs..."
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full"
            />
          </div>
          
          <div className="flex space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
            
            <select
              value={filterJobType}
              onChange={(e) => setFilterJobType(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Job Types</option>
              <option value="Cutting">Cutting</option>
              <option value="Stitching">Stitching</option>
              <option value="Finishing">Finishing</option>
              <option value="Quality Control">Quality Control</option>
              <option value="Packing">Packing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Production Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <ProductionJobCard 
            key={job._id}
            job={job}
            orders={orders}
            employees={employees}
            onStatusUpdate={updateJobStatus}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
          />
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No production jobs found</h3>
          <p className="text-slate-500">Try adjusting your filters or create new jobs.</p>
        </div>
      )}
    </div>
  );
};

const ProductionStats = ({ jobs }) => {
  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'Completed').length,
    inProgress: jobs.filter(j => j.status === 'In Progress').length,
    onHold: jobs.filter(j => j.status === 'On Hold').length,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard
        title="Total Jobs"
        value={stats.total}
        icon={<Package className="w-6 h-6" />}
        color="from-blue-500 to-blue-600"
      />
      <StatCard
        title="In Progress"
        value={stats.inProgress}
        percentage={(stats.inProgress / stats.total * 100).toFixed(1)}
        icon={<Play className="w-6 h-6" />}
        color="from-yellow-500 to-yellow-600"
      />
      <StatCard
        title="Completed"
        value={stats.completed}
        percentage={(stats.completed / stats.total * 100).toFixed(1)}
        icon={<CheckCircle className="w-6 h-6" />}
        color="from-green-500 to-green-600"
      />
      <StatCard
        title="On Hold"
        value={stats.onHold}
        icon={<Pause className="w-6 h-6" />}
        color="from-red-500 to-red-600"
      />
    </div>
  );
};

const ProductionJobCard = ({ job, orders, employees, onStatusUpdate, getStatusColor, getStatusIcon }) => {
  const order = orders.find(o => o._id === job.orderId);
  const employee = employees.find(e => e._id === job.assignedEmployeeId);

  const getJobTypeColor = (type) => {
    const colors = {
      'Cutting': 'from-red-400 to-orange-400',
      'Stitching': 'from-blue-400 to-purple-400',
      'Finishing': 'from-green-400 to-teal-400',
      'Quality Control': 'from-yellow-400 to-orange-400',
      'Packing': 'from-indigo-400 to-purple-400'
    };
    return colors[type] || 'from-slate-400 to-slate-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">{job.jobType}</h3>
          <p className="text-sm text-slate-500">Job #: {job.jobId}</p>
        </div>
        <span className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
          {getStatusIcon(job.status)}
          <span>{job.status}</span>
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Order:</span>
          <span className="font-medium">{order?.designName || 'N/A'}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Assigned To:</span>
          <span className="font-medium">{employee?.name || 'Unassigned'}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Start Date:</span>
          <span className="font-medium">{new Date(job.startDate).toLocaleDateString()}</span>
        </div>
        
        {job.estimatedHours && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Estimated Hours:</span>
            <span className="font-medium">{job.estimatedHours}h</span>
          </div>
        )}
        
        {job.actualHours && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Actual Hours:</span>
            <span className="font-medium">{job.actualHours}h</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-500">Progress</span>
          <span className="text-xs font-medium">
            {job.status === 'Completed' ? '100%' : job.status === 'Not Started' ? '0%' : '50%'}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className={`bg-gradient-to-r ${getJobTypeColor(job.jobType)} h-2 rounded-full transition-all duration-300`}
            style={{ 
              width: job.status === 'Completed' ? '100%' : job.status === 'Not Started' ? '0%' : '50%' 
            }}
          ></div>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-4">
        {job.status !== 'Completed' && (
          <button
            onClick={() => onStatusUpdate(job._id, 'Completed')}
            className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <CheckCircle size={14} />
            <span>Complete</span>
          </button>
        )}
        
        {job.status === 'Not Started' && (
          <button
            onClick={() => onStatusUpdate(job._id, 'In Progress')}
            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <Play size={14} />
            <span>Start</span>
          </button>
        )}
        
        {job.status === 'In Progress' && (
          <button
            onClick={() => onStatusUpdate(job._id, 'On Hold')}
            className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <Pause size={14} />
            <span>Pause</span>
          </button>
        )}
        
        <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors">
          <Eye size={14} />
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, percentage, icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        {percentage && <p className="text-sm text-green-600 mt-1">{percentage}% of total</p>}
      </div>
      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-lg flex items-center justify-center text-white`}>
        {icon}
      </div>
    </div>
  </div>
);

export default ProductionTracking;