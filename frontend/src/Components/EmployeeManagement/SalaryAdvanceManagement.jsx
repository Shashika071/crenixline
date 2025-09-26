import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
  Trash2,
  User,
  XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { employeeAPI, salaryAPI } from '../../services/api';

const SalaryAdvanceManagement = () => {
  const [advances, setAdvances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    employeeId: 'all',
    month: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    amount: '',
    deductionMonth: '',
    reason: ''
  });

  useEffect(() => {
    fetchAdvances();
    fetchEmployees();
  }, [filters]);

  const fetchAdvances = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.employeeId !== 'all') params.employeeId = filters.employeeId;
      if (filters.month) params.month = filters.month;

      const response = await salaryAPI.getAdvances(params);
      setAdvances(response.data.data);
    } catch (error) {
      console.error('Error fetching advances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };
const handleDeleteAdvance = async (advanceId) => {
  if (window.confirm('Are you sure you want to delete this salary advance request? This action cannot be undone.')) {
    try {
      await salaryAPI.deleteAdvance(advanceId);
      fetchAdvances();
      alert('Salary advance deleted successfully!');
    } catch (error) {
      console.error('Error deleting advance:', error);
      alert('Error deleting advance: ' + error.response?.data?.message);
    }
  }
};
  const handleRequestAdvance = async (e) => {
    e.preventDefault();
    try {
      await salaryAPI.requestAdvance(formData);
      setShowRequestModal(false);
      setFormData({ employeeId: '', amount: '', deductionMonth: '', reason: '' });
      fetchAdvances();
    } catch (error) {
      console.error('Error requesting advance:', error);
      alert('Error requesting advance: ' + error.response?.data?.message);
    }
  };

 const handleStatusUpdate = async (advanceId, status) => {
  try {
    await salaryAPI.updateAdvanceStatus(advanceId, {
      status,
  
    });
    fetchAdvances();
  } catch (error) {
    console.error('Error updating advance status:', error);
    alert('Error updating status: ' + error.response?.data?.message);
  }
};

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'deducted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'deducted': return <CheckCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const exportToExcel = () => {
    // Implementation for Excel export
    console.log('Exporting advances to Excel');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Salary Advance Management</h2>
          <p className="text-slate-600">Manage employee salary advance requests</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Request Advance</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="deducted">Deducted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Employee</label>
            <select
              value={filters.employeeId}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deduction Month</label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: 'all', employeeId: 'all', month: '' })}
              className="w-full bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{advances.length}</div>
              <div className="text-slate-600">Total Advances</div>
            </div>
            <DollarSign className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {advances.filter(a => a.status === 'pending').length}
              </div>
              <div className="text-slate-600">Pending</div>
            </div>
            <Clock className="text-yellow-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {advances.filter(a => a.status === 'approved').length}
              </div>
              <div className="text-slate-600">Approved</div>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {advances.filter(a => a.status === 'rejected').length}
              </div>
              <div className="text-slate-600">Rejected</div>
            </div>
            <XCircle className="text-red-500" size={24} />
          </div>
        </div>
      </div>

      {/* Advances Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Salary Advances</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 mt-2">Loading advances...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-4">Employee</th>
                  <th className="text-left p-4">Amount</th>
                  <th className="text-left p-4">Request Date</th>
                  <th className="text-left p-4">Deduction Month</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {advances.map((advance) => (
                  <tr key={advance._id} className="border-b hover:bg-slate-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{advance.employeeId?.name}</div>
                        <div className="text-sm text-slate-600">{advance.employeeId?.role}</div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold">
                      Rs. {advance.amount?.toLocaleString()}
                    </td>
                    <td className="p-4">
                      {new Date(advance.requestDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {advance.deductionMonth}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(advance.status)}`}>
                        {getStatusIcon(advance.status)}
                        <span className="ml-1 capitalize">{advance.status}</span>
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAdvance(advance);
                            setShowViewModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                          <button
      onClick={() => handleDeleteAdvance(advance._id)}
      className="text-red-600 hover:text-red-800 p-1"
      title="Delete Advance"
    >
      <Trash2 size={16} />
    </button>
                        {advance.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(advance._id, 'approved')}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Approve"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(advance._id, 'rejected')}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Reject"
                            >
                              <XCircle size={16} />
                            </button>
                            
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {advances.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                <p>No salary advances found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Advance Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Request Salary Advance</h3>
            <form onSubmit={handleRequestAdvance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Employee *</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} - {emp.role} (Rs. {emp.salary?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Amount (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Deduction Month *</label>
                <input
                  type="month"
                  required
                  value={formData.deductionMonth}
                  onChange={(e) => setFormData({ ...formData, deductionMonth: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  min={new Date().toISOString().slice(0, 7)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Reason *</label>
                <textarea
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Reason for salary advance request"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Advance Modal */}
      {showViewModal && selectedAdvance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Advance Request Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Employee</label>
                  <p className="font-medium">{selectedAdvance.employeeId?.name}</p>
                  <p className="text-sm text-slate-600">{selectedAdvance.employeeId?.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Amount</label>
                  <p className="font-semibold text-lg">Rs. {selectedAdvance.amount?.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Request Date</label>
                  <p>{new Date(selectedAdvance.requestDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Deduction Month</label>
                  <p>{selectedAdvance.deductionMonth}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAdvance.status)}`}>
                  {getStatusIcon(selectedAdvance.status)}
                  <span className="ml-1 capitalize">{selectedAdvance.status}</span>
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600">Reason</label>
                <p className="bg-slate-50 p-3 rounded-lg">{selectedAdvance.reason}</p>
              </div>
              
              {selectedAdvance.adminNotes && (
                <div>
                  <label className="block text-sm font-medium text-slate-600">Admin Notes</label>
                  <p className="bg-yellow-50 p-3 rounded-lg">{selectedAdvance.adminNotes}</p>
                </div>
              )}
              
              {selectedAdvance.approvedBy && (
                <div>
                  <label className="block text-sm font-medium text-slate-600">Approved By</label>
                  <p>{selectedAdvance.approvedBy?.name} on {new Date(selectedAdvance.approvedDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Close
              </button>
              
              {selectedAdvance.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedAdvance._id, 'approved');
                      setShowViewModal(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedAdvance._id, 'rejected');
                      setShowViewModal(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg"
                  >
                    Reject
                  </button>
                  
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryAdvanceManagement;