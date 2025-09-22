import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  PieChart,
  Plus,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { expenseAPI, orderAPI, paymentAPI } from '../../services/api';

const FinanceManagement = () => {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const fetchFinancialData = async () => {
    try {
      const [paymentsRes, expensesRes, summaryRes] = await Promise.all([
        paymentAPI.getAll({ 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate 
        }),
        expenseAPI.getAll({ 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate 
        }),
        paymentAPI.getFinancialSummary({ 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate 
        })
      ]);
      
      setPayments(paymentsRes.data.data);
      setExpenses(expensesRes.data.data);
      setFinancialSummary(summaryRes.data.data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all">
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

      {/* Financial Overview */}
      <FinancialOverview summary={financialSummary} />

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: PieChart },
              { id: 'income', label: 'Income', icon: TrendingUp },
              { id: 'expenses', label: 'Expenses', icon: TrendingDown },
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
          {activeTab === 'overview' && <OverviewTab payments={payments} expenses={expenses} />}
          {activeTab === 'income' && <IncomeTab payments={payments} />}
          {activeTab === 'expenses' && <ExpensesTab expenses={expenses} />}
          {activeTab === 'transactions' && <TransactionsTab payments={payments} expenses={expenses} />}
        </div>
      </div>
    </div>
  );
};

const FinancialOverview = ({ summary }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-green-100">Total Income</p>
          <p className="text-2xl font-bold mt-1">Rs. {summary.totalInflow?.toLocaleString() || '0'}</p>
        </div>
        <TrendingUp className="w-8 h-8 text-green-200" />
      </div>
    </div>
    
    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-red-100">Total Expenses</p>
          <p className="text-2xl font-bold mt-1">Rs. {summary.totalOutflow?.toLocaleString() || '0'}</p>
        </div>
        <TrendingDown className="w-8 h-8 text-red-200" />
      </div>
    </div>
    
    <div className={`bg-gradient-to-r ${
      (summary.netProfit || 0) >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'
    } text-white p-6 rounded-xl`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-100">Net Profit</p>
          <p className="text-2xl font-bold mt-1">Rs. {summary.netProfit?.toLocaleString() || '0'}</p>
        </div>
        <BarChart3 className="w-8 h-8 text-blue-200" />
      </div>
    </div>
  </div>
);

const OverviewTab = ({ payments, expenses }) => {
  const recentTransactions = [...payments, ...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-50 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Income by Category</h3>
          <div className="space-y-3">
            {['Order Payments', 'Other Income'].map((category, index) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm text-slate-600">{category}</span>
                <span className="font-medium text-green-600">Rs. {(index + 1) * 50000}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Expenses by Category</h3>
          <div className="space-y-3">
            {['Materials', 'Labor', 'Utilities', 'Other'].map((category, index) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm text-slate-600">{category}</span>
                <span className="font-medium text-red-600">Rs. {(index + 1) * 10000}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-slate-900 mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <TransactionItem key={transaction._id} transaction={transaction} />
          ))}
        </div>
      </div>
    </div>
  );
};

const IncomeTab = ({ payments }) => {
  const incomePayments = payments.filter(p => p.type === 'Inflow');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-900">Income Transactions</h3>
        <span className="text-sm text-slate-600">{incomePayments.length} transactions</span>
      </div>
      
      <div className="space-y-3">
        {incomePayments.map((payment) => (
          <TransactionItem key={payment._id} transaction={payment} />
        ))}
      </div>
    </div>
  );
};

const ExpensesTab = ({ expenses }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="font-semibold text-slate-900">Expense Transactions</h3>
      <span className="text-sm text-slate-600">{expenses.length} transactions</span>
    </div>
    
    <div className="space-y-3">
      {expenses.map((expense) => (
        <TransactionItem key={expense._id} transaction={expense} />
      ))}
    </div>
  </div>
);

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
  const isIncome = transaction.type === 'Inflow' || transaction.amount >= 0;
  const isPayment = transaction.type !== undefined;

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
            {isPayment ? transaction.remarks : transaction.description}
          </p>
          <p className="text-sm text-slate-500">
            {new Date(transaction.date).toLocaleDateString()} • 
            {isPayment ? ` ${transaction.paymentMode}` : ` ${transaction.category}`}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
          {isIncome ? '+' : '-'}Rs. {transaction.amount?.toLocaleString()}
        </p>
        <p className="text-xs text-slate-500">
          {isPayment ? 'Payment' : 'Expense'}
        </p>
      </div>
    </div>
  );
};

export default FinanceManagement;