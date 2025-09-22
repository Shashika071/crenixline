import Employee from "../models/Employee.js";
import Expense from "../models/Expense.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Production from "../models/Production.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalEmployees,
      activeEmployees,
      lowStockMaterials,
      recentPayments,
      monthlyRevenue
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Completed' }),
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'Active' }),
      // Add low stock query when Material model is available
      Payment.find().sort({ date: -1 }).limit(5).populate('orderId'),
      Payment.aggregate([
        { $match: { type: 'Inflow' } },
        { 
          $group: { 
            _id: { 
              year: { $year: '$date' }, 
              month: { $month: '$date' } 
            },
            total: { $sum: '$amount' }
          } 
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalEmployees,
        activeEmployees,
        lowStockCount: 0, // Placeholder
        recentPayments,
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(matchStage)
      .populate('agentId')
      .sort({ createdAt: -1 });

    const summary = await Order.aggregate([
      { $match: matchStage },
      { $group: { 
        _id: '$status', 
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }}
    ]);

    res.json({
      success: true,
      data: {
        orders,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};