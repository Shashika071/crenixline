import Employee from '../models/Employee.js';
import Material from '../models/Material.js';
import Order from '../models/Order.js';

export const getDashboardStats = async (req, res) => {
  try {
    console.log('Fetching dashboard stats...');
    
    // Get total orders count
    const totalOrders = await Order.countDocuments();
    
    // Get orders by status
    const completedOrders = await Order.countDocuments({ status: 'Completed' });
    const inProductionOrders = await Order.countDocuments({ status: 'In Production' });
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    
    // Get active employees count - FIXED: Count by status field
    const activeEmployees = await Employee.countDocuments({ 
      status: 'Active'  // Using the status field from your API response
    });
    
 
    
    // Calculate total revenue - FIXED: Multiply sellingPrice by quantity
    const revenueResult = await Order.aggregate([
      { 
        $match: { status: 'Completed' } 
      },
      {
        $group: {
          _id: null,
          total: { 
            $sum: { 
              $multiply: ['$sellingPrice', '$quantity'] 
            } 
          }
        }
      }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
 
    
    // Get low stock items count
    const lowStockItems = await Material.find({
      $expr: { $lte: ['$availableQty', '$reorderLevel'] },
      isActive: true
    });
    
    const stats = {
      totalOrders,
      completedOrders,
      inProductionOrders,
      pendingOrders,
      activeEmployees,
      totalRevenue,
      lowStockCount: lowStockItems.length
    };
    
  
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};