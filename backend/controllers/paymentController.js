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