import { DollarSign, Edit, Plus, Trash2, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { employeeAPI } from '../../services/api';
import { salaryAPI } from '../../services/api'; // Changed from employeeAPI to salaryAPI

const AllowanceManagement = () => {
  const [allowances, setAllowances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'fixed',
    amount: '',
    description: ''
  });

  useEffect(() => {
    fetchAllowances();
    fetchEmployees();
  }, []);

  const fetchAllowances = async () => {
    try {
      const response = await salaryAPI.getAllowances();  
      setAllowances(response.data.data || response.data);  
    } catch (error) {
      console.error('Error fetching allowances:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeAPI.getAll();
      setEmployees(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAllowance) {
        await salaryAPI.updateAllowance(editingAllowance._id, formData); // Use salaryAPI method
      } else {
        await salaryAPI.createAllowance(formData); // Use salaryAPI method
      }
      setShowModal(false);
      setEditingAllowance(null);
      setFormData({ name: '', type: 'fixed', amount: '', description: '' });
      fetchAllowances();
    } catch (error) {
      console.error('Error saving allowance:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this allowance?')) {
      try {
        await salaryAPI.deleteAllowance(id); // Use salaryAPI method
        fetchAllowances();
      } catch (error) {
        console.error('Error deleting allowance:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Allowance & Deduction Management </h2>
        <div className="space-x-3 space-y-3 ">
          <button
            onClick={() => setShowAssignModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Users size={16} />
            <span>Assign Allowances or Deduction</span>
          </button>
          <button
            onClick={() => {
              setEditingAllowance(null);
              setFormData({ name: '', type: 'fixed', amount: '', description: '' });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Allowance or Deduction</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allowances.map((allowance) => (
          <div key={allowance._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">{allowance.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingAllowance(allowance);
                    setFormData(allowance);
                    setShowModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(allowance._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium">{allowance.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">
                  {allowance.type === 'percentage' ? `${allowance.amount}%` : `Rs. ${allowance.amount}`}
                </span>
              </div>
              {allowance.description && (
                <div>
                  <span className="text-slate-600">{allowance.description}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Allowance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingAllowance ? 'Edit Allowance or Deduction' : 'Add Allowance or Deduction'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount {formData.type === 'percentage' ? '(%)' : '(Rs.)'}
                </label>
                <input
                  type="number"
                  required
                  step={formData.type === 'percentage' ? '0.01' : '1'}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  {editingAllowance ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Allowances Modal */}
      {showAssignModal && (
        <AssignAllowancesModal
          employees={employees}
          allowances={allowances}
          onClose={() => setShowAssignModal(false)}
          onSuccess={fetchAllowances}
        />
      )}
    </div>
  );
};

const AssignAllowancesModal = ({ employees, allowances, onClose, onSuccess }) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedAllowance, setSelectedAllowance] = useState('');
  const [amount, setAmount] = useState('');

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await salaryAPI.assignAllowance({
        employeeId: selectedEmployee,
        allowanceId: selectedAllowance,
        amount: parseFloat(amount)
      });
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error assigning allowance:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Assign Allowance or Deduction to Employee</h3>
        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Employee</label>
            <select
              required
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name} - {emp.role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Allowance or Deduction</label>
            <select
              required
              value={selectedAllowance}
              onChange={(e) => setSelectedAllowance(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select Allowance or Deduction</option>
              {allowances.map(all => (
                <option key={all._id} value={all._id}>{all.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount (Rs.)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllowanceManagement;