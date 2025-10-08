import Payment from "../models/Payment.js";

export const createPayment = async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('orderId')
      .populate('supplierId')
      .populate('employeeId')
      .sort({ date: -1 });

    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update payment by ID
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    // Populate references for the response
    await payment.populate([
      { path: 'orderId' },
      { path: 'supplierId' },
      { path: 'employeeId' }
    ]);
    
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete payment by ID
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByIdAndDelete(id);
    
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const inflow = await Payment.aggregate([
      { $match: { ...matchStage, type: 'Inflow' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const outflow = await Payment.aggregate([
      { $match: { ...matchStage, type: 'Outflow' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalInflow: inflow[0]?.total || 0,
        totalOutflow: outflow[0]?.total || 0,
        netProfit: (inflow[0]?.total || 0) - (outflow[0]?.total || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};