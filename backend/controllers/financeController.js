import Expense from "../models/Expense.js";
import Machine from "../models/Machine.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Payslip from "../models/Payslip.js";
import RentalPayment from "../models/RentalPayment.js";

// Get comprehensive financial summary
export const getFinancialSummary = async (req, res) => {
  try {
    console.log('Starting financial summary calculation');
    const { startDate, endDate } = req.query;
    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }
    
    // Check if Order model is accessible
    console.log('Order model is defined:', typeof Order !== 'undefined');

    // Calculate income (inflow)
    const inflow = await Payment.aggregate([
      { $match: { ...matchStage, type: 'Inflow' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Calculate expenses from payments table (outflow)
    const outflow = await Payment.aggregate([
      { $match: { ...matchStage, type: 'Outflow' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Calculate expenses from expenses table
    const expenseTotal = await Expense.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Calculate EPF and ETF contributions for the period
    // EPF is now 20% (8% employee + 12% employer)
    // IMPORTANT: Only calculate employer EPF if employee has EPF deduction
    const statutoryContributions = await Payslip.aggregate([
      { 
        $match: { 
          ...matchStage,
          status: { $in: ['finalized', 'paid'] } 
        } 
      },
      { 
        $group: { 
          _id: null, 
          epfEmployeeTotal: { $sum: '$epfDeduction' }, // 8% from employee
          // Only sum employer contribution for employees with EPF deduction
          epfEmployerTotal: { 
            $sum: { 
              $cond: [
                { $gt: ['$epfDeduction', 0] }, // If employee has EPF deduction
                { $multiply: ['$basicSalary', 0.12] }, // Calculate 12% employer contribution
                0 // Otherwise, employer contributes 0
              ]
            }
          },
          etfTotal: { $sum: '$etfContribution' } // 3% from employer
        } 
      }
    ]);

    // Calculate machine rental costs - ONLY count PAID rentals
    // Unpaid rentals should NOT be deducted from income yet
    const matchStageForRentals = { status: 'paid' };
    
    if (startDate || endDate) {
      matchStageForRentals.paidDate = {};
      if (startDate) matchStageForRentals.paidDate.$gte = new Date(startDate);
      if (endDate) matchStageForRentals.paidDate.$lte = new Date(endDate);
    }
    
    const paidRentals = await RentalPayment.aggregate([
      { $match: matchStageForRentals },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const machineRentalCosts = paidRentals[0]?.total || 0;
    
    // Calculate total EPF (20% = 8% employee + 12% employer) and ETF (3%) contributions
    const epfEmployeeContribution = statutoryContributions[0]?.epfEmployeeTotal || 0;
    const epfEmployerContribution = statutoryContributions[0]?.epfEmployerTotal || 0;
    const epfContribution = epfEmployeeContribution + epfEmployerContribution; // Total EPF (20%)
    const etfContribution = statutoryContributions[0]?.etfTotal || 0;
    const totalStatutoryContributions = epfContribution + etfContribution;
    
    console.log('Statutory contributions calculation:');
    console.log('- EPF Employee (8%):', epfEmployeeContribution);
    console.log('- EPF Employer (12%):', epfEmployerContribution);
    console.log('- Total EPF (20%):', epfContribution);
    console.log('- ETF (3%):', etfContribution);
    console.log('- Total Statutory:', totalStatutoryContributions);

    // Calculate expense summary by category
    const expenseSummaryByCategory = await Expense.aggregate([
      { $match: matchStage },
      { 
        $group: { 
          _id: '$category', 
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        } 
      },
      { $sort: { amount: -1 } }
    ]);

    // Calculate income summary by source
    const incomeSummaryBySource = await Payment.aggregate([
      { $match: { ...matchStage, type: 'Inflow' } },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'orderDetails'
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $ifNull: ['$orderId', false] },
              'Order Payments',
              'Other Income'
            ]
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    // Calculate revenue from completed orders
    const orderDateMatch = {};
    if (startDate || endDate) {
      orderDateMatch.updatedAt = {};
      if (startDate) orderDateMatch.updatedAt.$gte = new Date(startDate);
      if (endDate) orderDateMatch.updatedAt.$lte = new Date(endDate);
    }
    
    console.log('About to query Order model');
    let orderRevenue = [];
    try {
      orderRevenue = await Order.aggregate([
      { 
        $match: { 
          ...orderDateMatch,
          status: 'Completed',
          completedQuantity: { $gt: 0 }
        } 
      },
      {
        $group: {
          _id: 'Order Revenue',
          total: { $sum: { $multiply: ['$completedQuantity', '$sellingPrice'] } },
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('Order revenue query successful:', orderRevenue);
    } catch (error) {
      console.error('Error with Order.aggregate:', error.message);
      orderRevenue = [];
    }

    // Calculate total expenses (outflow + expenses + machine rentals + EPF only)
    // Note: outflow includes salary payments when marked as paid
    const totalOutflow = (outflow[0]?.total || 0) + 
                         (expenseTotal[0]?.total || 0) + 
                         machineRentalCosts + 
                         epfContribution; // Only EPF (20%), not ETF
    
    // Log the breakdown for debugging
    console.log('=== Financial Summary Breakdown ===');
    console.log('Payment Outflows (includes paid salaries):', outflow[0]?.total || 0);
    console.log('Regular Expenses:', expenseTotal[0]?.total || 0);
    console.log('Machine rental costs:', machineRentalCosts);
    console.log('EPF contributions (20%):', epfContribution);
    console.log('ETF contributions (3% - NOT deducted):', etfContribution);
    console.log('Total calculated outflow:', totalOutflow);
    console.log('================================');
    
    // Always add statutory contributions to expense summary if it's non-zero
    if (totalStatutoryContributions > 0) {
      // Remove any existing statutory entry first to avoid duplicates
      const existingStatutoryIndex = expenseSummaryByCategory.findIndex(e => e._id === 'Statutory');
      if (existingStatutoryIndex >= 0) {
        expenseSummaryByCategory.splice(existingStatutoryIndex, 1);
      }
      
      // Add the statutory entry
      expenseSummaryByCategory.push({
        _id: 'Statutory',
        total: totalStatutoryContributions,
        count: 1
      });
    }
    
    // Add order revenue to income summary
    const orderRevenueTotal = orderRevenue[0]?.total || 0;
    console.log('Order revenue total:', orderRevenueTotal);
    if (orderRevenueTotal > 0) {
      incomeSummaryBySource.push({
        _id: 'Order Revenue',
        total: orderRevenueTotal,
        count: orderRevenue[0]?.count || 0
      });
    }
                         
    const totalInflow = (inflow[0]?.total || 0) + orderRevenueTotal;
    const netProfit = totalInflow - totalOutflow;

    // Add summary log to debug
    console.log('Sending financial summary with:', {
      totalInflow,
      totalOutflow,
      netProfit,
      epfContribution,
      etfContribution,
      totalStatutoryContributions
    });
    
    res.json({
      success: true,
      data: {
        totalInflow,
        totalOutflow,
        netProfit,
        breakdown: {
          incomeSummary: incomeSummaryBySource,
          expenseSummary: expenseSummaryByCategory,
          statutoryContributions: {
            epfEmployee: epfEmployeeContribution,
            epfEmployer: epfEmployerContribution,
            epfTotal: epfContribution,
            etf: etfContribution,
            total: totalStatutoryContributions
          },
          machineRentalCosts
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get expense summary with category breakdown
export const getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate, includeRentals = false, includeStatutory = false } = req.query;
    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    // Get expenses from expense table
    const summary = await Expense.aggregate([
      { $match: matchStage },
      { 
        $group: { 
          _id: '$category', 
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Get total expenses
    const totalExpenses = await Expense.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    let totalAmount = totalExpenses[0]?.total || 0;
    const result = {
      summaryByCategory: summary,
      totalExpenses: totalAmount,
      additionalExpenses: {}
    };
    
    // Always include statutory contributions if requested
    if (includeStatutory === 'true') {
      // Calculate EPF and ETF contributions for the period
      const statutoryContributions = await Payslip.aggregate([
        { 
          $match: { 
            status: { $in: ['finalized', 'paid'] } 
          } 
        },
        { 
          $group: { 
            _id: null, 
            epfTotal: { $sum: '$epfDeduction' },
            etfTotal: { $sum: '$etfContribution' }
          } 
        }
      ]);
      
      // Calculate total EPF (12%) and ETF (3%) contributions
      const epfContribution = statutoryContributions[0]?.epfTotal || 0;
      const etfContribution = statutoryContributions[0]?.etfTotal || 0;
      const totalStatutoryContributions = epfContribution + etfContribution;
      
      result.additionalExpenses.statutoryContributions = {
        epf: epfContribution,
        etf: etfContribution,
        total: totalStatutoryContributions
      };
      
      // Add statutory to total expense
      totalAmount += totalStatutoryContributions;
      result.totalExpenses = totalAmount;
      
      // Add to summary by category
      if (totalStatutoryContributions > 0) {
        summary.push({
          _id: 'Statutory',
          totalAmount: totalStatutoryContributions,
          count: 1
        });
      }
    }

    // Add machine rental costs if requested
    if (includeRentals === 'true') {
      const rentalMachines = await Machine.find({ isRental: true });
      
      let machineRentalCosts = 0;
      
      // Calculate pro-rated rental costs for the period
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        rentalMachines.forEach(machine => {
          // Skip if machine wasn't rented during this period
          if (machine.rentalStartDate > end || 
              (machine.rentalEndDate && machine.rentalEndDate < start)) {
            return;
          }
          
          // Calculate daily rate
          const dailyRate = machine.monthlyRent / 30;
          
          // Calculate overlapping days
          const machineStart = machine.rentalStartDate > start ? machine.rentalStartDate : start;
          const machineEnd = machine.rentalEndDate && machine.rentalEndDate < end ? 
            machine.rentalEndDate : end;
          
          const overlapDays = Math.ceil((machineEnd - machineStart) / (1000 * 60 * 60 * 24));
          
          // Add cost for this machine
          machineRentalCosts += dailyRate * overlapDays;
        });
      } else {
        // If no specific date range, calculate total monthly rent
        machineRentalCosts = rentalMachines.reduce((sum, machine) => sum + (machine.monthlyRent || 0), 0);
      }
      
      result.additionalExpenses.machineRentalCosts = machineRentalCosts;
      totalAmount += machineRentalCosts;
    }

    // Add statutory contributions if requested
    if (includeStatutory === 'true') {
      const statutoryContributions = await Payslip.aggregate([
        { 
          $match: { 
            ...matchStage,
            status: { $in: ['finalized', 'paid'] } 
          } 
        },
        { 
          $group: { 
            _id: null, 
            epfTotal: { $sum: '$epfDeduction' },
            etfTotal: { $sum: '$etfContribution' }
          } 
        }
      ]);
      
      const epf = statutoryContributions[0]?.epfTotal || 0;
      const etf = statutoryContributions[0]?.etfTotal || 0;
      const statutory = {
        epf,
        etf,
        total: epf + etf
      };
      
      result.additionalExpenses.statutoryContributions = statutory;
      totalAmount += statutory.total;
    }

    result.grandTotal = totalAmount;

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new expense
export const createExpense = async (req, res) => {
  try {
    // Add date handling if missing
    if (!req.body.date) {
      req.body.date = new Date();
    }
    
    // Add payment method if missing
    if (!req.body.paymentMethod) {
      req.body.paymentMethod = 'Cash';
    }
    
    // Map category if needed
    if (req.body.category === 'Machine Rental') {
      req.body.category = 'Rent'; // Map to a valid enum value
    } else if (req.body.category === 'Equipment') {
      req.body.category = 'Material'; // Map to a valid enum value
    } else if (req.body.category === 'Utilities') {
      req.body.category = 'Electricity'; // Map to a valid enum value
    } else if (req.body.category === 'Maintenance') {
      req.body.category = 'Machine Maintenance'; // Map to a valid enum value
    } else if (req.body.category === 'Other') {
      req.body.category = 'Miscellaneous'; // Map to a valid enum value
    }
    
    console.log('Creating expense with data:', req.body);
    
    const expense = new Expense(req.body);
    await expense.save();
    
    // Populate references for the response
    await expense.populate([
      { path: 'orderId' },
      { path: 'employeeId' },
      { path: 'supplierId' }
    ]);
    
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error('Error creating expense:', error);
    const errorMessage = error.errors ? 
      Object.values(error.errors).map(e => e.message).join(', ') : 
      error.message;
    res.status(400).json({ 
      success: false, 
      message: errorMessage,
      details: error.errors ? Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {}) : {}
    });
  }
};

// Get all expenses with filters
export const getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate, paidTo, minAmount, maxAmount, paymentMethod } = req.query;
    const filter = {};
    
    // Apply filters
    if (category) filter.category = category;
    if (paidTo) filter.paidTo = { $regex: paidTo, $options: 'i' }; // Case-insensitive search
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    
    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const expenses = await Expense.find(filter)
      .populate('orderId')
      .populate('employeeId')
      .populate('supplierId')
      .sort({ date: -1 });

    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update expense by ID
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    
    // Populate references for the response
    await expense.populate([
      { path: 'orderId' },
      { path: 'employeeId' },
      { path: 'supplierId' }
    ]);
    
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete expense by ID
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findByIdAndDelete(id);
    
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get machine rental expenses
export const getMachineRentalExpenses = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Find all rental machines
    const rentalMachines = await Machine.find({
      isRental: true,
      rentalStartDate: { $exists: true }
    }).sort({ name: 1 });
    
    const paidRentals = [];
    const pendingRentals = [];
    let totalPaidRental = 0;
    let totalPendingRental = 0;
    
    // Determine the month to check for rental payments
    const checkDate = endDate ? new Date(endDate) : new Date();
    const month = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`;
    
    for (const machine of rentalMachines) {
      // Skip if machine rental period doesn't overlap with the query period
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (machine.rentalStartDate > end || 
            (machine.rentalEndDate && machine.rentalEndDate < start)) {
          continue;
        }
      }
      
      // Check if there's a rental payment record for this machine for the current month
      const rentalPayment = await RentalPayment.findOne({
        machineId: machine._id,
        month: month
      });
      
      const rentalAmount = machine.monthlyRent || 0;
      const rentalData = {
        _id: rentalPayment?._id || machine._id,
        machineId: machine._id,
        machine: {
          _id: machine._id,
          name: machine.name,
          model: machine.model,
          serialNumber: machine.serialNumber,
          type: machine.type
        },
        monthlyRent: machine.monthlyRent,
        provider: machine.rentalProvider,
        startDate: machine.rentalStartDate,
        endDate: machine.rentalEndDate,
        amount: rentalAmount,
        month: month,
        dueDate: rentalPayment?.dueDate || new Date(checkDate.getFullYear(), checkDate.getMonth(), 10),
        description: `Monthly rental for ${machine.name}`,
        category: 'Machine Rental',
        date: rentalPayment?.paidDate || machine.rentalStartDate,
        type: 'Machine Rental',
        status: rentalPayment?.status || 'pending',
        paymentMode: rentalPayment?.paymentMode,
        remarks: rentalPayment?.remarks
      };
      
      if (rentalPayment && rentalPayment.status === 'paid') {
        // Only include in expenses if PAID
        paidRentals.push(rentalData);
        totalPaidRental += rentalAmount;
      } else {
        // Pending rental - not deducted from income yet
        pendingRentals.push(rentalData);
        totalPendingRental += rentalAmount;
      }
    }
    
    res.json({
      success: true,
      data: paidRentals,  // Only PAID rentals in 'data' (for expenses)
      paidRentals,
      pendingRentals,
      totalPaidRental,
      totalPendingRental,
      totalRental: totalPaidRental,  // For backward compatibility
      rentalExpenses: paidRentals    // For backward compatibility
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get statutory contributions summary (EPF and ETF)
export const getStatutoryContributions = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    
    // Build filter
    const filter = {};
    
    if (month && year) {
      filter.month = `${year}-${month.padStart(2, '0')}`;
    }
    
    if (employeeId) {
      filter.employeeId = employeeId;
    }
    
    // Only include finalized or paid payslips
    filter.status = { $in: ['finalized', 'paid'] };
    
    // Get payslips with statutory contributions
    const payslips = await Payslip.find(filter)
      .populate('employeeId', 'name role realId')
      .select('employeeId realId month basicSalary epfDeduction etfContribution');
      
    // Calculate totals
    // IMPORTANT: Only calculate employer EPF if employee has EPF deduction
    // If employee has no EPF (epfDeduction = 0), employer also contributes 0
    const totals = {
      epfEmployee: payslips.reduce((sum, p) => sum + (p.epfDeduction || 0), 0), // 8% from employee
      epfEmployer: payslips.reduce((sum, p) => {
        // Only add employer contribution if employee has EPF deduction
        if (p.epfDeduction && p.epfDeduction > 0) {
          return sum + ((p.basicSalary || 0) * 0.12);
        }
        return sum;
      }, 0), // 12% from employer (only if employee enrolled)
      etf: payslips.reduce((sum, p) => sum + (p.etfContribution || 0), 0)
    };
    
    // Total EPF is now 20% (8% employee + 12% employer)
    totals.epfTotal = totals.epfEmployee + totals.epfEmployer;
    totals.total = totals.epfTotal + totals.etf;
      
    res.json({
      success: true,
      data: {
        payslips,
        totals
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get salary expenses for a specific period
export const getSalaryExpenses = async (req, res) => {
  try {
    const { month, year, includeAllowances = true } = req.query;
    
    // Build filter
    const filter = {};
    
    if (month && year) {
      filter.month = `${year}-${month.padStart(2, '0')}`;
    }
    
    // Only include finalized or paid payslips
    filter.status = { $in: ['finalized', 'paid'] };
    
    // Get payslips with salary information
    const payslips = await Payslip.find(filter)
      .populate('employeeId', 'name role realId')
      .select('employeeId realId month basicSalary grossSalary netSalary allowances totalAllowances status');
      
    // Calculate totals
    const totals = {
      basicSalary: payslips.reduce((sum, p) => sum + p.basicSalary, 0),
      grossSalary: payslips.reduce((sum, p) => sum + p.grossSalary, 0),
      netSalary: payslips.reduce((sum, p) => sum + p.netSalary, 0),
      allowances: includeAllowances === 'true' ? 
        payslips.reduce((sum, p) => sum + (p.totalAllowances || 0), 0) : 0
    };
    
    // Add total and separate pending/paid amounts
    totals.total = totals.netSalary;
    totals.pendingAmount = payslips
      .filter(p => p.status === 'finalized')
      .reduce((sum, p) => sum + p.netSalary, 0);
    totals.paidAmount = payslips
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.netSalary, 0);
    
    // If requested, add summary of allowance types
    let allowanceSummary = [];
    
    if (includeAllowances === 'true') {
      // Create map to accumulate allowances by type
      const allowanceMap = new Map();
      
      payslips.forEach(payslip => {
        if (payslip.allowances && payslip.allowances.length > 0) {
          payslip.allowances.forEach(allowance => {
            const currentAmount = allowanceMap.get(allowance.name) || 0;
            allowanceMap.set(allowance.name, currentAmount + allowance.amount);
          });
        }
      });
      
      // Convert map to array
      allowanceSummary = Array.from(allowanceMap).map(([name, amount]) => ({ name, amount }));
      
      // Sort by amount descending
      allowanceSummary.sort((a, b) => b.amount - a.amount);
    }
      
    res.json({
      success: true,
      data: {
        payslips,
        totals,
        allowanceSummary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark single payslip as paid and reduce the amount from income
export const markPayslipPaid = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the payslip and make sure it's not already paid
    const payslip = await Payslip.findById(id).populate('employeeId', 'name');
    
    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }
    
    if (payslip.status === 'paid') {
      return res.status(400).json({ success: false, message: 'Payslip is already marked as paid' });
    }
    
    if (payslip.status !== 'finalized') {
      return res.status(400).json({ success: false, message: 'Payslip must be finalized before marking as paid' });
    }
    
    // Update payslip status
    payslip.status = 'paid';
    payslip.paidDate = new Date();
    
    // Create a payment record for this salary payment
    const payment = new Payment({
      amount: payslip.netSalary,
      type: 'Outflow',
      date: new Date(),
      paymentMode: req.body.paymentMethod || req.body.paymentMode || 'Bank Transfer',
      remarks: `Salary payment for ${payslip.employeeId?.name || 'employee'} (${payslip.month})${req.body.notes ? ' - ' + req.body.notes : ''}`,
      employeeId: payslip.employeeId,
      status: 'Completed'
    });
    
    // Save both payslip and payment
    await Promise.all([
      payslip.save(),
      payment.save()
    ]);
    
    console.log(`✓ Salary Payment Created: Rs. ${payslip.netSalary} for ${payslip.employeeId?.name} - This amount is deducted from Total Income`);
    
    res.json({ 
      success: true, 
      data: { 
        payslip,
        payment,
        message: 'Payslip marked as paid and payment recorded successfully' 
      } 
    });
    
  } catch (error) {
    console.error('Error in markPayslipPaid:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark multiple payslips as paid in bulk
export const markPayslipsBulkPaid = async (req, res) => {
  try {
    const { ids, paymentMethod, notes } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No payslips specified for bulk payment' });
    }
    
    // Find all the requested payslips
    const payslips = await Payslip.find({ 
      _id: { $in: ids },
      status: 'finalized'  // Only finalized payslips can be paid
    }).populate('employeeId', 'name');
    
    if (payslips.length === 0) {
      return res.status(404).json({ success: false, message: 'No eligible payslips found' });
    }
    
    // Calculate total payment amount
    const totalAmount = payslips.reduce((sum, p) => sum + p.netSalary, 0);
    
    // Update all payslips to paid status
    const updatePromises = payslips.map(payslip => {
      payslip.status = 'paid';
      payslip.paidDate = new Date();
      return payslip.save();
    });
    
    // Create a single bulk payment record
    const bulkPayment = new Payment({
      amount: totalAmount,
      type: 'Outflow',
      date: new Date(),
      paymentMode: paymentMethod || 'Bank Transfer',
      remarks: `Bulk salary payment for ${payslips.length} employees${notes ? ' - ' + notes : ''}`,
      status: 'Completed'
    });
    
    // Save all updates
    await Promise.all([...updatePromises, bulkPayment.save()]);
    
    console.log(`✓ Bulk Salary Payment Created: Rs. ${totalAmount} for ${payslips.length} employees - This amount is deducted from Total Income`);
    console.log(`  Employees paid: ${payslips.map(p => p.employeeId?.name).join(', ')}`);
    
    res.json({ 
      success: true, 
      data: {
        count: payslips.length,
        totalAmount,
        payment: bulkPayment,
        message: `${payslips.length} payslips marked as paid and payment recorded successfully`
      }
    });
    
  } catch (error) {
    console.error('Error in markPayslipsBulkPaid:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark rental payment as paid
export const markRentalAsPaid = async (req, res) => {
  try {
    const { machineId, month } = req.params;
    const { paymentMode = 'Cash', remarks } = req.body;
    
    // Find the machine
    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }
    
    if (!machine.isRental) {
      return res.status(400).json({ success: false, message: 'Machine is not a rental' });
    }
    
    const amount = machine.monthlyRent;
    
    // Create or update rental payment record
    let rentalPayment = await RentalPayment.findOne({ machineId, month });
    
    if (!rentalPayment) {
      // Create new rental payment record
      rentalPayment = new RentalPayment({
        machineId,
        amount,
        month,
        dueDate: new Date(month + '-10'), // Default to 10th of the month
        status: 'paid',
        paidDate: new Date(),
        paymentMode,
        remarks: remarks || `Rental payment for ${machine.name} (${month})`
      });
    } else {
      // Update existing record
      rentalPayment.status = 'paid';
      rentalPayment.paidDate = new Date();
      rentalPayment.paymentMode = paymentMode;
      if (remarks) rentalPayment.remarks = remarks;
    }
    
    // Save rental payment record
    // NOTE: We do NOT create a Payment (Outflow) record to avoid double-counting
    // The rental will appear in expenses through the getMachineRentalExpenses endpoint
    await rentalPayment.save();
    
    console.log(`✓ Rental Payment Marked as Paid: Rs. ${amount} for ${machine.name} - This amount is deducted from Total Income`);
    
    res.json({
      success: true,
      data: {
        rentalPayment,
        message: 'Rental marked as paid successfully'
      }
    });
    
  } catch (error) {
    console.error('Error in markRentalAsPaid:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark multiple rental payments as paid (bulk)
export const markRentalsBulkPaid = async (req, res) => {
  try {
    const { rentals, paymentMode = 'Bank Transfer', remarks } = req.body;
    
    if (!rentals || !Array.isArray(rentals) || rentals.length === 0) {
      return res.status(400).json({ success: false, message: 'No rentals provided' });
    }
    
    let totalAmount = 0;
    const updatedRentals = [];
    const machineNames = [];
    
    for (const rental of rentals) {
      const { machineId, month } = rental;
      
      const machine = await Machine.findById(machineId);
      if (!machine || !machine.isRental) continue;
      
      const amount = machine.monthlyRent;
      totalAmount += amount;
      machineNames.push(machine.name);
      
      // Create or update rental payment record
      let rentalPayment = await RentalPayment.findOne({ machineId, month });
      
      if (!rentalPayment) {
        rentalPayment = new RentalPayment({
          machineId,
          amount,
          month,
          dueDate: new Date(month + '-10'),
          status: 'paid',
          paidDate: new Date(),
          paymentMode,
          remarks: remarks || `Bulk rental payment for ${machine.name} (${month})`
        });
      } else {
        rentalPayment.status = 'paid';
        rentalPayment.paidDate = new Date();
        rentalPayment.paymentMode = paymentMode;
        if (remarks) rentalPayment.remarks = remarks;
      }
      
      await rentalPayment.save();
      updatedRentals.push(rentalPayment);
    }
    
    // NOTE: We do NOT create a Payment (Outflow) record to avoid double-counting
    // The rentals will appear in expenses through the getMachineRentalExpenses endpoint
    
    console.log(`✓ Bulk Rental Payment Marked as Paid: Rs. ${totalAmount} for ${rentals.length} machines - This amount is deducted from Total Income`);
    console.log(`  Machines paid: ${machineNames.join(', ')}`);
    
    res.json({
      success: true,
      data: {
        count: updatedRentals.length,
        totalAmount,
        rentals: updatedRentals,
        message: `${updatedRentals.length} rental payments marked as paid successfully`
      }
    });
    
  } catch (error) {
    console.error('Error in markRentalsBulkPaid:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};