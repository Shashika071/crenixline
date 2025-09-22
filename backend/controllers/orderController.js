import Material from "../models/Material.js";
import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
  try {
    // Generate order ID
    const orderCount = await Order.countDocuments();
    const orderId = `ORD${String(orderCount + 1).padStart(4, '0')}`;
    
    const orderData = { ...req.body, orderId };
    const order = new Order(orderData);
    await order.save();
    
    // Populate related data
    await order.populate('agentId');
    await order.populate('assignedEmployees.employee');
    await order.populate('materialRequired.material');

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { status, agentId, startDate, endDate } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (agentId) filter.agentId = agentId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('agentId')
      .populate('assignedEmployees.employee')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('agentId')
      .populate('assignedEmployees.employee')
      .populate('materialRequired.material');

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('agentId').populate('assignedEmployees.employee');

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateOrderProgress = async (req, res) => {
  try {
    const { progress, status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { progress, status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'Completed' });
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const inProductionOrders = await Order.countDocuments({ status: 'In Production' });
    
    const revenue = await Order.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$sellingPrice' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        pendingOrders,
        inProductionOrders,
        totalRevenue: revenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};