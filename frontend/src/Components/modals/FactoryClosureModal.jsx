// components/modals/FactoryClosureModal.jsx

import { AlertTriangle, Ban, Building, Calendar, DollarSign, X } from 'lucide-react';
import React, { useState } from 'react';

import { employeeAPI } from '../../services/api';

const FactoryClosureModal = ({ employees, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: 'Holiday',
    description: '',
    affectedEmployees: [],
    isForAllEmployees: true,
    // NEW: Default values based on reason
    isActualClosure: false,
    allowWorkWithDoublePay: true
  });

  const [loading, setLoading] = useState(false);

  const reasons = [
    'Holiday',
    'Maintenance',
    'Power Outage',
    'Weather',
    'Inventory',
    'Other'
  ];

  // NEW: Handle reason change to set appropriate flags
  const handleReasonChange = (reason) => {
    const isActualClosure = reason !== 'Holiday';
    setFormData({
      ...formData,
      reason,
      isActualClosure,
      allowWorkWithDoublePay: !isActualClosure
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await employeeAPI.createFactoryClosure(formData);
      onSuccess();
      onClose();
      alert('Factory closure recorded successfully!');
    } catch (error) {
      console.error('Error creating factory closure:', error);
      alert('Error: ' + error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Get closure type description
  const getClosureTypeDescription = () => {
    return formData.isActualClosure 
      ? "Factory is CLOSED. No work allowed."
      : "Factory is OPEN for work with DOUBLE PAY.";
  };

  // NEW: Get closure type color and icon
  const getClosureTypeStyle = () => {
    return formData.isActualClosure 
      ? { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', icon: <Ban size={16} /> }
      : { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', icon: <DollarSign size={16} /> };
  };

  const closureStyle = getClosureTypeStyle();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Building className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-slate-900">Record Factory Day Status</h2>
          </div>
          <p className="text-slate-600 mt-1">Mark factory status for a specific day</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* NEW: Closure Type Indicator */}
          <div className={`p-3 rounded-lg border ${closureStyle.bg} ${closureStyle.border}`}>
            <div className="flex items-center space-x-2">
              {closureStyle.icon}
              <div>
                <div className={`font-semibold ${closureStyle.text}`}>
                  {formData.isActualClosure ? 'Factory Closure' : 'Holiday'}
                </div>
                <div className={`text-sm ${closureStyle.text} opacity-80`}>
                  {getClosureTypeDescription()}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-2" />
                Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <AlertTriangle className="inline w-4 h-4 mr-2" />
                Reason
              </label>
              <select
                value={formData.reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                {reasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              rows="3"
              placeholder="Describe the reason..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allEmployees"
              checked={formData.isForAllEmployees}
              onChange={(e) => setFormData({ ...formData, isForAllEmployees: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="allEmployees" className="text-sm text-slate-700">
              Affects all employees
            </label>
          </div>

          {!formData.isForAllEmployees && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Affected Employees
              </label>
              <div className="max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-2">
                {employees.map(employee => (
                  <label key={employee._id} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded">
                    <input
                      type="checkbox"
                      value={employee._id}
                      checked={formData.affectedEmployees.includes(employee._id)}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          affectedEmployees: e.target.checked
                            ? [...prev.affectedEmployees, value]
                            : prev.affectedEmployees.filter(id => id !== value)
                        }));
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{employee.name} - {employee.role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center space-x-2 ${
                formData.isActualClosure ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Building size={16} />
              )}
              <span>{formData.isActualClosure ? 'Record Closure' : 'Record Holiday'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FactoryClosureModal;