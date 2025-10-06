import { CheckCircle, DollarSign, Download, FileText, Search, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { employeeAPI, salaryAPI } from '../../services/api';

import { generateSalaryPdf } from './PdfSalarySheet';

const SalaryFinalization = () => {
  const [payslips, setPayslips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPayslips();
    fetchEmployees();
  }, [selectedMonth]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const response = await salaryAPI.getPayslips({ month: selectedMonth });
      setPayslips(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching payslips:', error);
    } finally {
      setLoading(false);
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

  const calculatePayslip = async (employeeId) => {
    try {
      setLoading(true);
      await salaryAPI.calculatePayslip({
        employeeId,
        month: selectedMonth,
        additionalDeductions: []
      });
      await fetchPayslips(); // Refresh the list
    } catch (error) {
      console.error('Error calculating payslip:', error);
      alert('Error calculating payslip: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const finalizePayslip = async (payslipId) => {
    try {
      setFinalizing(payslipId);

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const finalizedBy = currentUser._id;

      const payload = finalizedBy && finalizedBy.length === 24
        ? { finalizedBy }
        : {};

      const response = await salaryAPI.finalizePayslip(payslipId, payload);

      await fetchPayslips(); // Refresh the list
      alert('Payslip finalized successfully!');
    } catch (error) {
      console.error('Error finalizing payslip:', error);
      alert('Error finalizing payslip: ' + (error.response?.data?.message || error.message));
    } finally {
      setFinalizing(false);
    }
  };

  const removePayslip = async (payslipId) => {
    if (!window.confirm('Are you sure you want to remove this draft payslip? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(payslipId);
      await salaryAPI.deletePayslip(payslipId);
      await fetchPayslips(); // Refresh the list
      alert('Draft payslip removed successfully!');
    } catch (error) {
      console.error('Error removing payslip:', error);
      alert('Error removing payslip: ' + (error.response?.data?.message || error.message));
    } finally {
      setDeleting(false);
    }
  };

  const downloadPayslip = async (payslip) => {
    try {
      const employee = payslip.employeeId;

      if (!employee) {
        throw new Error('Employee details not found in payslip.');
      }

      await generateSalaryPdf(employee, payslip, selectedMonth);
    } catch (error) {
      console.error('Error downloading payslip:', error);
      alert('Error downloading payslip: ' + error.message);
    }
  };

  const markAsPaid = async (payslipId) => {
    try {
      setFinalizing(payslipId);
      await salaryAPI.markAsPaid(payslipId);
      await fetchPayslips(); // Refresh the list
      alert('Payslip marked as paid successfully!');
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Error marking as paid: ' + (error.response?.data?.message || error.message));
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Salary Finalization</h2>
        <div className="flex items-center space-x-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <button 
            onClick={fetchPayslips}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          Loading payslips...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-blue-600">
            {payslips.filter(p => p.status === 'draft').length}
          </div>
          <div className="text-slate-600">Draft Payslips</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-orange-600">
            {payslips.filter(p => p.status === 'finalized').length}
          </div>
          <div className="text-slate-600">Finalized</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-green-600">
            {payslips.filter(p => p.status === 'paid').length}
          </div>
          <div className="text-slate-600">Paid</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-2xl font-bold text-slate-600">
            {employees.length - payslips.length}
          </div>
          <div className="text-slate-600">Pending Calculation</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Payslips for {selectedMonth}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left p-4">Employee</th>
                <th className="text-left p-4">Basic Salary</th>
                <th className="text-left p-4">Allowances</th>
                <th className="text-left p-4">OT Pay</th>
                <th className="text-left p-4">Sunday Pay</th>
                <th className="text-left p-4">Holiday Pay</th>
                <th className="text-left p-4">ETF (3%)</th>
                <th className="text-left p-4">EPF (8%)</th>
                <th className="text-left p-4">Advances</th>
                <th className="text-left p-4">Net Salary</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map((payslip) => (
                <tr key={payslip._id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{payslip.employeeId?.name}</div>
                      <div className="text-sm text-slate-600">{payslip.employeeId?.role}</div>
                      <div className="text-xs text-slate-500">{payslip.realId || payslip.employeeId?.employeeId}</div>
                    </div>
                  </td>
                  <td className="p-4">Rs. {payslip.basicSalary?.toLocaleString()}</td>
                  <td className="p-4">Rs. {payslip.totalAllowances?.toLocaleString()}</td>
                  <td className="p-4">Rs. {payslip.overtimePay?.toLocaleString()}</td>
                  <td className="p-4 text-blue-600 font-medium">
                    Rs. {payslip.sundayWorkPay?.toLocaleString()}
                  </td>
                  <td className="p-4 text-purple-600 font-medium">
                    Rs. {payslip.holidayWorkPay?.toLocaleString()}
                  </td>
                  <td className="p-4 text-green-600 font-medium">
                    + Rs. {payslip.etfContribution?.toLocaleString()}
                  </td>
                  <td className="p-4 text-red-600">
                    - Rs. {payslip.epfDeduction?.toLocaleString()}
                  </td>
                  <td className="p-4">Rs. {payslip.totalAdvances?.toLocaleString()}</td>
                  <td className="p-4 font-semibold text-green-700">
                    Rs. {payslip.netSalary?.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      payslip.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      payslip.status === 'finalized' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {payslip.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      {payslip.status === 'draft' && (
                        <>
                          <button
                            onClick={() => finalizePayslip(payslip._id)}
                            disabled={finalizing === payslip._id}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Finalize"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => removePayslip(payslip._id)}
                            disabled={deleting === payslip._id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Remove Draft"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      {payslip.status === 'finalized' && (
                        <button
                          onClick={() => markAsPaid(payslip._id)}
                          disabled={finalizing === payslip._id}
                          className="text-teal-600 hover:text-teal-800 disabled:opacity-50"
                          title="Mark as Paid"
                        >
                          <DollarSign size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => downloadPayslip(payslip)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                    {(finalizing === payslip._id || deleting === payslip._id) && (
                      <div className="text-xs text-blue-600 mt-1">
                        {finalizing === payslip._id ? 'Finalizing...' : 'Removing...'}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employees without payslips */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            Employees Needing Payslip Calculation ({employees.length - payslips.length})
          </h3>
        </div>
        <div className="p-6">
          {employees
            .filter(emp => !payslips.find(p => p.employeeId?._id === emp._id))
            .map(employee => (
              <div key={employee._id} className="flex justify-between items-center py-3 border-b">
                <div>
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-sm text-slate-600">
                    {employee.role} - Rs. {employee.salary?.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => calculatePayslip(employee._id)}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Calculating...' : 'Calculate Payslip'}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default SalaryFinalization;