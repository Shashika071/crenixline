import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle,
  CheckSquare,
  CreditCard,
  Download,
  Edit2,
  FileText,
  Filter,
  PieChart,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { expenseAPI, financeAPI, paymentAPI } from '../../services/api';

const FinanceManagement = () => {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({});
  const [salaryData, setSalaryData] = useState({ payslips: [], totals: {} });
  const [pendingRentals, setPendingRentals] = useState([]);
  const [selectedRentals, setSelectedRentals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPayslips, setSelectedPayslips] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchFinancialData = useCallback(async () => {
    try {
      const [paymentsRes, expensesRes, financialSummaryRes, machineRentalsRes, statutoryRes, salaryRes] = await Promise.all([
        paymentAPI.getAll({ 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate 
        }),
        expenseAPI.getAll({ 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate 
        }),
        financeAPI.getSummary({ 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate 
        }),
        financeAPI.getMachineRentals({
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate
        }),
        financeAPI.getStatutoryContributions({
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate
        }),
        financeAPI.getSalaryExpenses({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        })
      ]);
      
      // Ensure we have valid arrays before spreading
      const paymentsData = Array.isArray(paymentsRes.data.data) ? paymentsRes.data.data : [];
      const expensesData = Array.isArray(expensesRes.data.data) ? expensesRes.data.data : [];
      
      // Handle machine rental data - separate PAID and PENDING
      let paidRentalsData = [];
      let pendingRentalsData = [];
      
      if (machineRentalsRes.data) {
        // Paid rentals (included in expenses)
        paidRentalsData = Array.isArray(machineRentalsRes.data.paidRentals) ? 
          machineRentalsRes.data.paidRentals : 
          (Array.isArray(machineRentalsRes.data.data) ? machineRentalsRes.data.data : []);
        
        // Pending rentals (NOT included in expenses)
        pendingRentalsData = Array.isArray(machineRentalsRes.data.pendingRentals) ? 
          machineRentalsRes.data.pendingRentals : [];
      }
      
      // Log the statutory data to debug
      console.log('Statutory data:', statutoryRes.data.data);
      console.log('Financial summary:', financialSummaryRes.data.data);
      console.log('Machine rentals RAW response:', machineRentalsRes);
      console.log('Paid rentals data:', paidRentalsData);
      console.log('Pending rentals data:', pendingRentalsData);
      console.log('Expenses data:', expensesData);
      console.log('Combined expenses (with paid rentals):', [...expensesData, ...paidRentalsData]);
      
      // Get the statutory totals with proper EPF breakdown
      const statutoryTotals = statutoryRes.data.data.totals || { 
        epfEmployee: 0,
        epfEmployer: 0,
        epfTotal: 0,
        etf: 0, 
        total: 0 
      };
      
      // Get machine rental total - check both possible locations
      const machineRentalTotal = machineRentalsRes.data?.data?.totalRental || 
                                  machineRentalsRes.data?.totalRental || 
                                  0;
      
      console.log('Machine rental total extracted:', machineRentalTotal);
      
      // Update the financial summary to include statutory contributions
      const updatedSummary = {
        ...financialSummaryRes.data.data,
        statutoryContributions: statutoryRes.data.data,
        machineRentalTotal: machineRentalTotal
      };
      
      console.log('Financial summary from API:', financialSummaryRes.data.data);
      console.log('Statutory data from API:', statutoryRes.data.data);
      console.log('Machine rental total:', machineRentalTotal);
      
      // Always ensure the breakdown.statutoryContributions has the latest data
      // This ensures data consistency across components
      if (updatedSummary.breakdown) {
        updatedSummary.breakdown.statutoryContributions = {
          epfEmployee: statutoryTotals.epfEmployee,
          epfEmployer: statutoryTotals.epfEmployer,
          epfTotal: statutoryTotals.epfTotal,
          etf: statutoryTotals.etf,
          total: statutoryTotals.total
        };
      }
      
      // Check if the backend already included EPF in the expense summary
      const hasEPFInExpenseSummary = 
        updatedSummary.breakdown?.expenseSummary?.some(e => e._id === 'EPF' || e._id === 'Statutory');
        
      // If EPF is not in expense summary but we have EPF data, add it
      // IMPORTANT: Only deduct EPF (20%), NOT ETF (3%)
      if (!hasEPFInExpenseSummary && statutoryTotals.epfTotal > 0 && updatedSummary.breakdown) {
        if (!updatedSummary.breakdown.expenseSummary) {
          updatedSummary.breakdown.expenseSummary = [];
        }
        
        updatedSummary.breakdown.expenseSummary.push({
          _id: 'EPF',
          amount: statutoryTotals.epfTotal, // Only EPF 20%, not ETF
          count: 1
        });
      }
      
      // Check if the backend already included machine rentals in the expense summary
      const hasMachineRentalInExpenseSummary = 
        updatedSummary.breakdown?.expenseSummary?.some(e => e._id === 'Machine Rental');
        
      // If machine rental is not in expense summary but we have rental data, add it
      if (!hasMachineRentalInExpenseSummary && machineRentalTotal > 0 && updatedSummary.breakdown) {
        if (!updatedSummary.breakdown.expenseSummary) {
          updatedSummary.breakdown.expenseSummary = [];
        }
        
        updatedSummary.breakdown.expenseSummary.push({
          _id: 'Machine Rental',
          amount: machineRentalTotal,
          count: paidRentalsData.length
        });
      }
      
      // IMPORTANT: The backend already includes machine rentals and EPF in totalOutflow
      // We should NOT recalculate it here to avoid double-counting
      // Just use the backend's calculated values directly
      
      console.log('=== Frontend Financial Summary ===');
      console.log('Total Inflow (from backend):', updatedSummary.totalInflow);
      console.log('Total Outflow (from backend - already includes rentals & EPF):', updatedSummary.totalOutflow);
      console.log('EPF total (20%):', statutoryTotals.epfTotal);
      console.log('ETF (3% - NOT deducted):', statutoryTotals.etf);
      console.log('Machine rental total:', machineRentalTotal);
      console.log('Net Profit:', updatedSummary.netProfit);
      console.log('================================');
      
      // Process salary data
      const salaryData = salaryRes.data && salaryRes.data.data ? salaryRes.data.data : { payslips: [], totals: {} };
      console.log('Salary data:', salaryData);
      
      setPayments(paymentsData);
      setExpenses([...expensesData, ...paidRentalsData]); // Only PAID rentals in expenses
      setPendingRentals(pendingRentalsData); // Pending rentals separate
      setFinancialSummary(updatedSummary);
      setSalaryData(salaryData);
      setSelectedPayslips([]);
      setSelectedRentals([]);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);
  
  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance Management</h1>
          <p className="text-slate-600 mt-1">Track revenue, expenses, and financial performance</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            <Download size={16} />
            <span>Export</span>
          </button>
          <button 
            onClick={() => {
              setModalType('expense');
              setSelectedItem(null);
              setModalOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={16} />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Date Range:</span>
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
      </div>

      {/* Loading State or Financial Overview */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-6 flex items-center justify-center h-32">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-2 text-slate-500">Loading financial data...</p>
          </div>
        </div>
      ) : (
        <FinancialOverview summary={financialSummary} />
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: PieChart },
              { id: 'income', label: 'Income', icon: TrendingUp },
              { id: 'expenses', label: 'Expenses', icon: TrendingDown },
              { id: 'statutory', label: 'Statutory', icon: FileText },
              { id: 'pendingSalaries', label: 'Pending Salaries', icon: CreditCard },
              { id: 'pendingRentals', label: 'Pending Rentals', icon: CreditCard },
              { id: 'transactions', label: 'All Transactions', icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab summary={financialSummary} payments={payments} expenses={expenses} />}
          {activeTab === 'income' && <IncomeTab payments={payments} onAddIncome={() => {
            setModalType('income');
            setSelectedItem(null);
            setModalOpen(true);
          }} onEditIncome={(item) => {
            setModalType('income');
            setSelectedItem(item);
            setModalOpen(true);
          }} onDeleteIncome={(id) => {
            // Handle delete
            if (confirm('Are you sure you want to delete this income entry?')) {
              financeAPI.deleteIncome(id)
                .then(() => {
                  fetchFinancialData();
                })
                .catch(err => console.error('Error deleting income:', err));
            }
          }} />}
          {activeTab === 'expenses' && <ExpensesTab expenses={expenses} onAddExpense={() => {
            setModalType('expense');
            setSelectedItem(null);
            setModalOpen(true);
          }} onEditExpense={(item) => {
            setModalType('expense');
            setSelectedItem(item);
            setModalOpen(true);
          }} onDeleteExpense={(id) => {
            // Handle delete
            if (confirm('Are you sure you want to delete this expense?')) {
              financeAPI.deleteExpense(id)
                .then(() => {
                  fetchFinancialData();
                })
                .catch(err => console.error('Error deleting expense:', err));
            }
          }} />}
          {activeTab === 'statutory' && <StatutoryTab summary={financialSummary} />}
          {activeTab === 'pendingSalaries' && <PendingSalariesTab 
            salaryData={salaryData} 
            selectedPayslips={selectedPayslips}
            setSelectedPayslips={setSelectedPayslips}
            onMarkAsPaid={async (id, data) => {
              try {
                await financeAPI.markSalaryAsPaid(id, data);
                fetchFinancialData();
                setSelectedPayslips([]);
                alert('Salary marked as paid successfully!');
              } catch (error) {
                console.error('Error marking salary as paid:', error);
                alert('Error marking salary as paid. Please try again.');
              }
            }}
            onBulkPay={async (data) => {
              if (!selectedPayslips.length) {
                alert('Please select payslips to mark as paid');
                return;
              }
              
              try {
                await financeAPI.markSalariesBulkPaid({
                  ids: selectedPayslips,
                  ...data
                });
                fetchFinancialData();
                setSelectedPayslips([]);
                alert('Selected salaries marked as paid successfully!');
              } catch (error) {
                console.error('Error marking salaries as paid in bulk:', error);
                alert('Error marking salaries as paid. Please try again.');
              }
            }}
          />}
          {activeTab === 'pendingRentals' && <PendingRentalsTab 
            pendingRentals={pendingRentals}
            selectedRentals={selectedRentals}
            setSelectedRentals={setSelectedRentals}
            onMarkAsPaid={async (rental, data) => {
              try {
                await financeAPI.markRentalAsPaid(rental.machineId, rental.month, data);
                fetchFinancialData();
                setSelectedRentals([]);
                alert('Rental marked as paid successfully!');
              } catch (error) {
                console.error('Error marking rental as paid:', error);
                alert('Error marking rental as paid. Please try again.');
              }
            }}
            onBulkPay={async (data) => {
              if (!selectedRentals.length) {
                alert('Please select rentals to mark as paid');
                return;
              }
              
              try {
                const rentals = selectedRentals.map(id => {
                  const rental = pendingRentals.find(r => r._id === id);
                  return { machineId: rental.machineId, month: rental.month };
                });
                
                await financeAPI.markRentalsBulkPaid({
                  rentals,
                  ...data
                });
                fetchFinancialData();
                setSelectedRentals([]);
                alert('Selected rentals marked as paid successfully!');
              } catch (error) {
                console.error('Error marking rentals as paid in bulk:', error);
                alert('Error marking rentals as paid. Please try again.');
              }
            }}
          />}
          {activeTab === 'transactions' && <TransactionsTab payments={payments} expenses={expenses} />}
        </div>
      </div>
      
      {/* Finance Entry Modal */}
      {modalOpen && (
        <FinanceEntryModal 
          isOpen={modalOpen}
          type={modalType}
          item={selectedItem}
          onClose={() => setModalOpen(false)}
          onSave={(data) => {
            if (modalType === 'expense') {
              if (selectedItem) {
                financeAPI.updateExpense(selectedItem._id, data)
                  .then(() => {
                    setModalOpen(false);
                    fetchFinancialData();
                  })
                  .catch(err => console.error('Error updating expense:', err));
              } else {
                financeAPI.createExpense(data)
                  .then(() => {
                    setModalOpen(false);
                    fetchFinancialData();
                  })
                  .catch(err => console.error('Error creating expense:', err));
              }
            } else if (modalType === 'income') {
              if (selectedItem) {
                financeAPI.updateIncome(selectedItem._id, data)
                  .then(() => {
                    setModalOpen(false);
                    fetchFinancialData();
                  })
                  .catch(err => console.error('Error updating income:', err));
              } else {
                financeAPI.createIncome(data)
                  .then(() => {
                    setModalOpen(false);
                    fetchFinancialData();
                  })
                  .catch(err => console.error('Error creating income:', err));
              }
            }
          }}
        />
      )}
    </div>
  );
};

const FinancialOverview = ({ summary }) => {
  console.log('Financial Overview - summary data:', summary);
    
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100">Total Income</p>
            <p className="text-2xl font-bold mt-1">Rs. {summary.totalInflow?.toLocaleString() || '0'}</p>
            <p className="text-xs text-green-100 mt-1">From orders and other sources</p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-200" />
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100">Total Expenses</p>
            <p className="text-2xl font-bold mt-1">Rs. {summary.totalOutflow?.toLocaleString() || '0'}</p>
            <p className="text-xs text-red-100 mt-1">All expenses including EPF, materials & rentals</p>
          </div>
          <TrendingDown className="w-8 h-8 text-red-200" />
        </div>
      </div>
    
    <div className={`bg-gradient-to-r ${
      (summary.netProfit || 0) >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'
    } text-white p-6 rounded-xl`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${(summary.netProfit || 0) >= 0 ? 'text-blue-100' : 'text-orange-100'}`}>Net Profit</p>
          <p className="text-2xl font-bold mt-1">Rs. {Math.abs(summary.netProfit || 0).toLocaleString()}</p>
          <p className={`text-xs ${(summary.netProfit || 0) >= 0 ? 'text-blue-100' : 'text-orange-100'} mt-1`}>
            {(summary.netProfit || 0) >= 0 ? 'Profitable period' : 'Loss period'}
          </p>
        </div>
        <BarChart3 className={`w-8 h-8 ${(summary.netProfit || 0) >= 0 ? 'text-blue-200' : 'text-orange-200'}`} />
      </div>
    </div>
  </div>
  );
};

const OverviewTab = ({ summary, payments, expenses }) => {
  const recentTransactions = [...payments, ...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-4">Finance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600">Total Income</div>
            <div className="text-xl font-bold text-green-600">Rs. {summary.totalInflow?.toLocaleString() || '0'}</div>
            {summary.breakdown?.incomeSummary?.length > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                {summary.breakdown.incomeSummary.map(item => (
                  <div key={item._id} className="flex justify-between mt-1">
                    <span>{item._id}</span>
                    <span>Rs. {item.total?.toLocaleString() || '0'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600">Total Expenses</div>
            <div className="text-xl font-bold text-red-600">Rs. {summary.totalOutflow?.toLocaleString() || '0'}</div>
            <div className="mt-2 text-xs text-slate-500">
              {/* Display expense categories from expense summary */}
              {summary.breakdown?.expenseSummary?.map(expense => (
                <div key={expense._id} className="flex justify-between mt-1">
                  <span>{expense._id}</span>
                  <span>Rs. {expense.total?.toLocaleString() || expense.amount?.toLocaleString() || '0'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600">Net Profit</div>
            <div className={`text-xl font-bold ${(summary.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              Rs. {Math.abs(summary.netProfit || 0).toLocaleString()}
              {(summary.netProfit || 0) < 0 ? ' (Loss)' : ''}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <TransactionItem key={transaction._id} transaction={transaction} />
          ))}
          {recentTransactions.length === 0 && (
            <p className="text-sm text-slate-500 italic">No recent transactions</p>
          )}
        </div>
      </div>
    </div>
  );
};

const IncomeTab = ({ payments, onAddIncome, onEditIncome, onDeleteIncome }) => {
  const incomePayments = payments.filter(p => p.type === 'Inflow');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-900">Income Transactions</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600">{incomePayments.length} transactions</span>
          <button 
            onClick={onAddIncome}
            className="ml-4 flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Plus size={16} />
            <span>Add Income</span>
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        {incomePayments.map((payment) => (
          <div key={payment._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                <ArrowUpRight size={16} />
              </div>
              <div>
                <p className="font-medium text-slate-900">{payment.remarks || payment.description}</p>
                <p className="text-sm text-slate-500">
                  {new Date(payment.date).toLocaleDateString()} • 
                  {payment.paymentMode && ` ${payment.paymentMode}`}
                  {payment.source && ` • ${payment.source}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <p className="font-semibold text-green-600 mr-6">
                +Rs. {payment.amount?.toLocaleString()}
              </p>
              <div className="flex space-x-2">
                <button onClick={() => onEditIncome(payment)} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => onDeleteIncome(payment._id)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {incomePayments.length === 0 && (
          <p className="text-sm text-slate-500 italic text-center py-6">No income transactions found</p>
        )}
      </div>
    </div>
  );
};

const ExpensesTab = ({ expenses, onAddExpense, onEditExpense, onDeleteExpense }) => {
  const [expenseFilter, setExpenseFilter] = useState('all');
  
  // Group expenses by category
  const expenseCategories = [...new Set(expenses.map(e => e.category || 'Other'))];
  
  // Filter expenses based on selected filter
  const filteredExpenses = expenseFilter === 'all'
    ? expenses
    : expenses.filter(e => e.category === expenseFilter);
  
  // Group by category and calculate totals
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    acc[category] = (acc[category] || 0) + (expense.amount || 0);
    return acc;
  }, {});
  
  // Calculate machine rental total separately
  const machineRentalTotal = expenses
    .filter(e => e.category === 'Machine Rental' || e.type === 'Machine Rental')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-900">Expense Transactions</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600">{filteredExpenses.length} transactions</span>
          <button 
            onClick={onAddExpense}
            className="ml-4 flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Category Summary */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Expenses by Category</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(expensesByCategory).map(([category, amount]) => (
            <div key={category} className="bg-white rounded p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">{category}</div>
              <div className="font-semibold text-red-600">Rs. {amount.toLocaleString()}</div>
              {category === 'Machine Rental' && (
                <div className="text-xs text-blue-600 mt-1">
                  Deducted from Total Income
                </div>
              )}
            </div>
          ))}
        </div>
        {machineRentalTotal > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Machine Rental Total: Rs. {machineRentalTotal.toLocaleString()}</span>
              <span className="ml-2">• This amount is deducted from Total Income in Financial Overview</span>
            </p>
          </div>
        )}
      </div>
      
      {/* Filter Controls */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <span className="flex items-center text-slate-500">
          <Filter size={14} className="mr-1" />
          <span className="text-sm">Filter:</span>
        </span>
        <button 
          className={`px-3 py-1 text-sm rounded-full ${
            expenseFilter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          onClick={() => setExpenseFilter('all')}
        >
          All
        </button>
        {expenseCategories.map(category => (
          <button 
            key={category}
            className={`px-3 py-1 text-sm rounded-full ${
              expenseFilter === category 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setExpenseFilter(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      <div className="space-y-3">
        {filteredExpenses.map((expense) => {
          const isMachineRental = expense.category === 'Machine Rental' || expense.type === 'Machine Rental';
          
          return (
            <div key={expense._id} className={`flex items-center justify-between p-4 rounded-lg hover:bg-slate-100 transition-colors ${
              isMachineRental ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isMachineRental ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                }`}>
                  <ArrowDownLeft size={16} />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{expense.description}</p>
                  <p className="text-sm text-slate-500">
                    {new Date(expense.date).toLocaleDateString()} • 
                    {` ${expense.category || 'Other'}`}
                    {isMachineRental && ' • Machine Rental'}
                  </p>
                  {isMachineRental && expense.machine && (
                    <p className="text-xs text-blue-600 mt-1">
                      Machine: {expense.machine.name} ({expense.machine.serialNumber})
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="mr-6">
                  <p className={`font-semibold ${isMachineRental ? 'text-blue-600' : 'text-red-600'}`}>
                    -Rs. {expense.amount?.toLocaleString()}
                  </p>
                  {isMachineRental && (
                    <p className="text-xs text-blue-500">Rental Cost</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!isMachineRental && (
                    <>
                      <button onClick={() => onEditExpense(expense)} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => onDeleteExpense(expense._id)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  {isMachineRental && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Auto-generated
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filteredExpenses.length === 0 && (
          <p className="text-sm text-slate-500 italic text-center py-6">No expense transactions found</p>
        )}
      </div>
    </div>
  );
};

const TransactionsTab = ({ payments, expenses }) => {
  const allTransactions = [...payments, ...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-900">All Transactions</h3>
        <span className="text-sm text-slate-600">{allTransactions.length} transactions</span>
      </div>
      
      <div className="space-y-3">
        {allTransactions.map((transaction) => (
          <TransactionItem key={transaction._id} transaction={transaction} />
        ))}
      </div>
    </div>
  );
};

const TransactionItem = ({ transaction }) => {
  // Properly determine if this is an income transaction
  // Payment with type 'Inflow' is income, anything else is an expense
  const isIncome = transaction.type === 'Inflow';
  // A payment is determined by having a type field
  const isPayment = 'type' in transaction; 
  
  // Format the date properly with fallback
  const formattedDate = transaction.date ? 
    new Date(transaction.date).toLocaleDateString() : 
    'N/A';
  
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {isIncome ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
        </div>
        <div>
          <p className="font-medium text-slate-900">
            {isPayment ? transaction.remarks || transaction.description : transaction.description}
          </p>
          <p className="text-sm text-slate-500">
            {formattedDate} • 
            {isPayment ? ` ${transaction.paymentMode || 'Cash'}` : ` ${transaction.category || 'Other'}`}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
          {isIncome ? '+' : '-'}Rs. {Math.abs(transaction.amount || 0).toLocaleString()}
        </p>
        <p className="text-xs text-slate-500">
          {isPayment ? (isIncome ? 'Income' : 'Payment') : 'Expense'}
        </p>
      </div>
    </div>
  );
};

// Statutory Tab Component
const StatutoryTab = ({ summary }) => {
  // Extract statutory data from summary with fallbacks
  const statutoryData = summary.statutoryContributions || {};
  
  // Extract totals from the data structure
  // Check both possible locations where this data could be stored
  let totals = statutoryData.totals || 
                (summary.breakdown?.statutoryContributions) || 
                {
                  epfEmployee: 0,
                  epfEmployer: 0,
                  epfTotal: 0,
                  etf: 0,
                  total: 0
                };
  
  // Ensure we have a complete totals object with all required fields
  totals = {
    epfEmployee: totals.epfEmployee || 0,      // 8% from employee
    epfEmployer: totals.epfEmployer || 0,      // 12% from employer
    epfTotal: totals.epfTotal || 0,            // 20% total EPF
    etf: totals.etf || 0,                      // 3% ETF
    total: totals.total || 0                   // Total statutory (EPF 20% + ETF 3% = 23%)
  };
  
  console.log('Statutory tab - statutoryData:', statutoryData);
  console.log('Statutory tab - summary breakdown:', summary.breakdown);
  console.log('Statutory tab - totals:', totals);
  
  // Extract payslips with employee contribution details
  const payslips = statutoryData.payslips || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-900">Statutory Contributions (EPF & ETF)</h3>
        <button className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
          <Download size={16} />
          <span>Export Report</span>
        </button>
      </div>
      
      {/* EPF Breakdown */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h4 className="font-semibold text-slate-900 mb-4">EPF Contributions (Total 20%)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-slate-800">Employee Contribution</h5>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">8%</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">Rs. {totals.epfEmployee?.toLocaleString() || '0'}</p>
            <p className="text-xs text-slate-500 mt-1">Deducted from employee salary</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-slate-800">Employer Contribution</h5>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">12%</span>
            </div>
            <p className="text-2xl font-bold text-green-600">Rs. {totals.epfEmployer?.toLocaleString() || '0'}</p>
            <p className="text-xs text-slate-500 mt-1">Paid by employer</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-300">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-slate-800">Total EPF</h5>
              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">20%</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">Rs. {totals.epfTotal?.toLocaleString() || '0'}</p>
            <p className="text-xs text-slate-500 mt-1">Total EPF contributions</p>
            <div className="mt-2 pt-2 border-t border-purple-200">
              <p className="text-xs text-purple-700 font-medium flex items-center">
                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                Deducted from Total Income
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ETF and Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-900">ETF Contributions</h4>
            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">3%</span>
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-2">Rs. {totals.etf?.toLocaleString() || '0'}</p>
          <p className="text-sm text-slate-500">Employer contribution for training & development</p>
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs text-slate-600 flex items-center">
              <span className="inline-block w-2 h-2 bg-slate-400 rounded-full mr-1"></span>
              NOT deducted from Total Income
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Summary</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-white border-opacity-30">
              <span className="text-sm">Total EPF (20%)</span>
              <span className="font-bold">Rs. {totals.epfTotal?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white border-opacity-30">
              <span className="text-sm">Total ETF (3%)</span>
              <span className="font-bold">Rs. {totals.etf?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-semibold">Total Statutory (23%)</span>
              <span className="text-xl font-bold">Rs. {totals.total?.toLocaleString() || '0'}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white border-opacity-30 text-sm">
            <p className="flex items-center bg-white bg-opacity-20 rounded px-3 py-2">
              <span className="inline-block w-3 h-3 bg-purple-300 rounded-full mr-2"></span>
              <span className="font-medium">Only EPF (20%) deducted from Total Income</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Employee-wise Breakdown */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h4 className="font-medium text-slate-800">Employee-wise Statutory Contributions</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Basic Salary</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">EPF Employee (8%)</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">EPF Employer (12%)</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Total EPF (20%)</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">ETF (3%)</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payslips.map((payslip) => {
                const epfEmployee = payslip.epfDeduction || 0;
                // Only calculate employer EPF if employee has EPF deduction
                // If employee EPF is 0, employer EPF is also 0
                const epfEmployer = epfEmployee > 0 ? (payslip.basicSalary || 0) * 0.12 : 0;
                const totalEpf = epfEmployee + epfEmployer;
                const etf = payslip.etfContribution || 0;
                const totalStatutory = totalEpf + etf;
                
                return (
                  <tr key={payslip._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-medium text-slate-900">
                          {payslip.employeeId?.name || 'Unknown Employee'}
                          <div className="text-xs text-slate-500">{payslip.realId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                      Rs. {payslip.basicSalary?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                      Rs. {epfEmployee.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-green-600">
                      Rs. {epfEmployer.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-purple-600 font-medium">
                      Rs. {totalEpf.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-orange-600">
                      Rs. {etf.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                      Rs. {totalStatutory.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              
              {(!payslips || payslips.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-slate-500 italic">
                    No employee data available for this period
                  </td>
                </tr>
              )}
            </tbody>
            
            {/* Totals Row */}
            {payslips && payslips.length > 0 && (
              <tfoot className="bg-slate-100 font-bold">
                <tr>
                  <td className="px-6 py-4 text-slate-900" colSpan={2}>TOTAL</td>
                  <td className="px-6 py-4 text-blue-600">Rs. {totals.epfEmployee?.toLocaleString() || '0'}</td>
                  <td className="px-6 py-4 text-green-600">Rs. {totals.epfEmployer?.toLocaleString() || '0'}</td>
                  <td className="px-6 py-4 text-purple-600">Rs. {totals.epfTotal?.toLocaleString() || '0'}</td>
                  <td className="px-6 py-4 text-orange-600">Rs. {totals.etf?.toLocaleString() || '0'}</td>
                  <td className="px-6 py-4 text-slate-900">Rs. {totals.total?.toLocaleString() || '0'}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

// Finance Entry Modal Component
const FinanceEntryModal = ({ isOpen, type, item, onClose, onSave }) => {
  // Normalize the item if it exists
  const normalizedItem = item ? {
    ...item,
    // Make sure we use consistent field names
    paymentMethod: item.paymentMethod || item.paymentMode || 'Cash',
    paymentMode: item.paymentMode || item.paymentMethod || 'Cash',
    remarks: item.remarks || item.description || ''
  } : null;
  
  const initialState = normalizedItem || {
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: type === 'expense' ? 'Material' : 'Sales',
    paymentMethod: 'Cash',
    paymentMode: 'Cash', // For income payments
    remarks: '',
    // For income entries, we need to set type to Inflow
    ...(type === 'income' ? { type: 'Inflow' } : {})
  };

  const [formData, setFormData] = useState(initialState);

  // Define category options based on type
  const categoryOptions = type === 'expense' 
    ? ['Material', 'Transport', 'Machine Maintenance', 'Labor', 
       'Electricity', 'Rent', 'Overtime', 'Miscellaneous']
    : ['Sales', 'Service', 'Rental', 'Other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'amount' ? parseFloat(value) || '' : value });
    
    // If changing paymentMethod or paymentMode, update both for consistency
    if (name === 'paymentMethod') {
      setFormData(prev => ({...prev, paymentMode: value}));
    } else if (name === 'paymentMode') {
      setFormData(prev => ({...prev, paymentMethod: value}));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare data based on the type
    const submissionData = {...formData};
    
    // For income transactions, ensure we have the required fields
    if (type === 'income') {
      submissionData.type = 'Inflow';
      // If we have a description but no remarks, use description for remarks
      if (!submissionData.remarks && submissionData.description) {
        submissionData.remarks = submissionData.description;
      }
      
      // Make sure paymentMode is set
      submissionData.paymentMode = submissionData.paymentMode || submissionData.paymentMethod || 'Cash';
    }
    
    onSave(submissionData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-900">
            {item ? 'Edit' : 'Add'} {type === 'expense' ? 'Expense' : 'Income'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
                Amount (Rs.)
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                name={type === 'income' ? 'paymentMode' : 'paymentMethod'}
                value={formData.paymentMethod || formData.paymentMode || 'Cash'}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-slate-700 mb-1">
                Additional Remarks
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-white ${
                type === 'expense' 
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {item ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// PendingSalariesTab Component
const PendingSalariesTab = ({ 
  salaryData, 
  selectedPayslips, 
  setSelectedPayslips, 
  onMarkAsPaid, 
  onBulkPay 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  // Filter out only pending (finalized) payslips
  const pendingPayslips = salaryData?.payslips?.filter(payslip => payslip.status === 'finalized') || [];
  const pendingTotal = salaryData?.totals?.pendingAmount || 0;

  // Handle single payslip selection for payment
  const handleMarkAsPaid = (payslip) => {
    setSelectedPayslip(payslip);
    setModalOpen(true);
  };

  // Handle checkbox selection for bulk payments
  const handleSelectPayslip = (e, payslipId) => {
    if (e.target.checked) {
      setSelectedPayslips([...selectedPayslips, payslipId]);
    } else {
      setSelectedPayslips(selectedPayslips.filter(id => id !== payslipId));
    }
  };

  // Handle select all checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPayslips(pendingPayslips.map(p => p._id));
    } else {
      setSelectedPayslips([]);
    }
  };

  // Format date from YYYY-MM format to readable month name and year
  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    return new Date(year, parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Calculate if select all is checked
  const isAllSelected = pendingPayslips.length > 0 && selectedPayslips.length === pendingPayslips.length;

  // Handle confirming single payment
  const handleConfirmPayment = () => {
    if (selectedPayslip) {
      onMarkAsPaid(selectedPayslip._id, { 
        paymentMethod, 
        notes 
      });
      setModalOpen(false);
      setSelectedPayslip(null);
      setPaymentMethod('Bank Transfer');
      setNotes('');
    }
  };

  // Handle confirming bulk payment
  const handleBulkPayment = () => {
    if (selectedPayslips.length > 0) {
      onBulkPay({
        paymentMethod,
        notes: notes || `Bulk salary payment for ${selectedPayslips.length} employees`
      });
      setPaymentMethod('Bank Transfer');
      setNotes('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-700">Pending Salaries</h3>
            <div className="p-2 bg-amber-50 rounded-full">
              <CreditCard size={20} className="text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">Rs. {pendingTotal.toLocaleString()}</p>
          <p className="text-sm text-slate-500 mt-1">{pendingPayslips.length} pending payslips</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-700">Selected for Payment</h3>
            <div className="p-2 bg-blue-50 rounded-full">
              <CheckSquare size={20} className="text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {selectedPayslips.length > 0 
              ? `Rs. ${pendingPayslips
                  .filter(p => selectedPayslips.includes(p._id))
                  .reduce((sum, p) => sum + p.netSalary, 0)
                  .toLocaleString()}`
              : 'Rs. 0'}
          </p>
          <p className="text-sm text-slate-500 mt-1">{selectedPayslips.length} selected</p>
        </div>

        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm h-full">
            <h3 className="text-lg font-medium text-slate-700 mb-4">Bulk Payment</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online Payment">Online Payment</option>
                </select>
              </div>
              <button
                onClick={handleBulkPayment}
                disabled={selectedPayslips.length === 0}
                className={`w-full py-2 rounded-md text-white ${
                  selectedPayslips.length > 0 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                Mark Selected as Paid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Salaries Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-lg font-medium text-slate-800">Pending Salaries</h3>
          <div className="flex items-center">
            <label className="inline-flex items-center mr-4">
              <input 
                type="checkbox" 
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-700">Select All</span>
            </label>
          </div>
        </div>

        {pendingPayslips.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <div className="mb-2">
              <CheckCircle size={40} className="inline-block text-green-500" />
            </div>
            <p>No pending salaries for the selected period!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Select</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Basic Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gross Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Net Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {pendingPayslips.map((payslip) => (
                  <tr key={payslip._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={selectedPayslips.includes(payslip._id)}
                        onChange={(e) => handleSelectPayslip(e, payslip._id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {payslip.employeeId?.name || 'Unknown Employee'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {payslip.employeeId?.role || 'No role'} • ID: {payslip.employeeId?.realId || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {formatMonth(payslip.month)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      Rs. {payslip.basicSalary?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      Rs. {payslip.grossSalary?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">
                        Rs. {payslip.netSalary?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleMarkAsPaid(payslip)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Mark as Paid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Confirmation Modal */}
      {modalOpen && selectedPayslip && (
        <div className="fixed inset-0 bg-slate-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-800">Confirm Salary Payment</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">You're about to mark the following salary as paid:</p>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="font-medium">{selectedPayslip.employeeId?.name || 'Employee'}</p>
                  <p className="text-sm text-slate-500">
                    {formatMonth(selectedPayslip.month)} • Rs. {selectedPayslip.netSalary?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
              
              <div>
                <label htmlFor="modalPaymentMethod" className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  id="modalPaymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online Payment">Online Payment</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any payment notes here..."
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-5 border-t border-slate-200">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Pending Rentals Tab Component
const PendingRentalsTab = ({ pendingRentals, selectedRentals, setSelectedRentals, onMarkAsPaid, onBulkPay }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [remarks, setRemarks] = useState('');

  const toggleRentalSelection = (rentalId) => {
    setSelectedRentals(prev => 
      prev.includes(rentalId) 
        ? prev.filter(id => id !== rentalId)
        : [...prev, rentalId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRentals.length === pendingRentals.length) {
      setSelectedRentals([]);
    } else {
      setSelectedRentals(pendingRentals.map(r => r._id));
    }
  };

  const handleMarkAsPaid = (rental) => {
    setSelectedRental(rental);
    setPaymentMethod('Bank Transfer');
    setRemarks('');
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = () => {
    if (selectedRental) {
      onMarkAsPaid(selectedRental, {
        paymentMode: paymentMethod,
        remarks: remarks || `Rental payment for ${selectedRental.machine.name} (${selectedRental.month})`
      });
      setShowPaymentModal(false);
      setSelectedRental(null);
    }
  };

  const handleBulkPayment = () => {
    if (selectedRentals.length === 0) {
      alert('Please select rentals to mark as paid');
      return;
    }

    const totalAmount = pendingRentals
      .filter(r => selectedRentals.includes(r._id))
      .reduce((sum, r) => sum + r.amount, 0);

    if (window.confirm(`Mark ${selectedRentals.length} rental(s) as paid for Rs. ${totalAmount.toLocaleString()}?`)) {
      onBulkPay({
        paymentMode: 'Bank Transfer',
        remarks: `Bulk rental payment for ${selectedRentals.length} machines`
      });
    }
  };

  const formatMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-slate-900">Pending Rental Payments</h3>
          <p className="text-sm text-slate-500 mt-1">
            {pendingRentals.length} pending rental payment(s)
          </p>
        </div>
        {selectedRentals.length > 0 && (
          <button
            onClick={handleBulkPayment}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <CheckCircle size={16} />
            <span>Mark Selected as Paid ({selectedRentals.length})</span>
          </button>
        )}
      </div>

      {pendingRentals.length > 0 && (
        <div className="flex items-center space-x-2 pb-2 border-b">
          <input
            type="checkbox"
            checked={selectedRentals.length === pendingRentals.length && pendingRentals.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600">Select All</span>
        </div>
      )}

      <div className="space-y-3">
        {pendingRentals.map((rental) => (
          <div
            key={rental._id}
            className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedRentals.includes(rental._id)}
                onChange={() => toggleRentalSelection(rental._id)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <CreditCard size={16} />
              </div>
              <div>
                <p className="font-medium text-slate-900">{rental.machine.name}</p>
                <p className="text-sm text-slate-500">
                  {rental.machine.model} • Serial: {rental.machine.serialNumber}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatMonth(rental.month)} • Due: {new Date(rental.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-orange-600">Rs. {rental.amount?.toLocaleString()}</p>
                <p className="text-xs text-orange-500">Pending</p>
              </div>
              <button
                onClick={() => handleMarkAsPaid(rental)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center space-x-1"
              >
                <CheckCircle size={14} />
                <span>Mark as Paid</span>
              </button>
            </div>
          </div>
        ))}

        {pendingRentals.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
            <p className="text-lg font-medium text-slate-900">All Rentals Paid!</p>
            <p className="text-sm text-slate-500 mt-1">No pending rental payments</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedRental && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Mark Rental as Paid</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">You're about to mark the following rental as paid:</p>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="font-medium">{selectedRental.machine.name}</p>
                  <p className="text-sm text-slate-500">
                    {formatMonth(selectedRental.month)} • Rs. {selectedRental.amount?.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <label htmlFor="rentalPaymentMethod" className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  id="rentalPaymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label htmlFor="rentalRemarks" className="block text-sm font-medium text-slate-700 mb-1">
                  Remarks (Optional)
                </label>
                <textarea
                  id="rentalRemarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any payment notes..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 p-4 bg-slate-50 rounded-b-lg">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManagement;