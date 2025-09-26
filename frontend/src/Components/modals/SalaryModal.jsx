// components/modals/SalaryModal.jsx

import { Calendar, DollarSign, Download, FileText, User, X } from 'lucide-react';
import React, { useState } from 'react';

import { employeeAPI } from '../../services/api';
import { generateSalaryPdf } from '../EmployeeManagement/PdfSalarySheet';

const SalaryModal = ({ employee, onClose }) => {
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [salaryMonth, setSalaryMonth] = useState(new Date().toISOString().slice(0, 7));

  const calculateSalary = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.calculateSalary({
        employeeId: employee._id,
        month: new Date(salaryMonth).getMonth() + 1,
        year: new Date(salaryMonth).getFullYear()
      });
      setSalaryData(response.data.data);
    } catch (error) {
      console.error('Error calculating salary:', error);
      alert('Error calculating salary: ' + error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!salaryData) return;
    
    try {
      setPdfLoading(true);
      await generateSalaryPdf(employee, salaryData, salaryMonth);
    } catch (error) {
      alert('Error generating PDF: ' + error.message);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <DollarSign size={20} />
              <span>Salary Calculation - {employee.name}</span>
            </h2>
            <p className="text-slate-600 mt-1">Employee ID: {employee._id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Month Selection */}
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Select Month
              </label>
              <input
                type="month"
                value={salaryMonth}
                onChange={(e) => setSalaryMonth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={calculateSalary}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <DollarSign size={16} />
              )}
              <span>Calculate</span>
            </button>
          </div>

          {/* Salary Results */}
          {salaryData && (
            <div className="bg-slate-50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-slate-600">Basic Salary</div>
                  <div className="text-lg font-semibold">Rs. {employee.salary?.toLocaleString()}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-slate-600">Paid Days</div>
                  <div className="text-lg font-semibold text-green-600">{salaryData.paidDays}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-slate-600">Overtime Hours</div>
                  <div className="text-lg font-semibold">{salaryData.totalOvertimeHours || 0}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-slate-600">Overtime Pay</div>
                  <div className="text-lg font-semibold">Rs. {salaryData.overtimePay?.toLocaleString()}</div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm">Net Salary Payable</div>
                    <div className="text-2xl font-bold">Rs. {salaryData.totalSalary?.toLocaleString()}</div>
                  </div>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={pdfLoading}
                    className="bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {pdfLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    ) : (
                      <FileText size={16} />
                    )}
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-sm text-slate-600 space-y-1">
                <div>Working Days: {salaryData.totalWorkingDays} | Unpaid Leaves: {salaryData.unpaidLeaveDays || 0}</div>
                {salaryData.isInProbation && (
                  <div className="text-orange-600 font-medium">⚠️ Employee is in probation period</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalaryModal;