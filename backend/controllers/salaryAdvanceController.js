import Payslip from '../models/Payslip.js';
import SalaryAdvance from '../models/SalaryAdvance.js';

export const requestSalaryAdvance = async (req, res) => {
  try {
    const advance = new SalaryAdvance(req.body);
    await advance.save();
    
    await advance.populate('employeeId', 'name role');
    res.status(201).json({ success: true, data: advance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSalaryAdvances = async (req, res) => {
  try {
    const { employeeId, status, month } = req.query;
    const filter = {};
    
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    if (month) filter.deductionMonth = month;
    
    const advances = await SalaryAdvance.find(filter)
      .populate('employeeId', 'name role')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: advances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdvanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, approvedBy } = req.body;
    
    const updateData = { status };
    
    // Only include approvedBy if provided
    if (status === 'approved') {
      if (approvedBy) {
        updateData.approvedBy = approvedBy;
      }
      updateData.approvedDate = new Date();
    }
    
    if (adminNotes) updateData.adminNotes = adminNotes;
    
    const advance = await SalaryAdvance.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('employeeId', 'name role');
    
    if (!advance) {
      return res.status(404).json({ success: false, message: 'Salary advance not found' });
    }
    
    res.json({ success: true, data: advance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPendingAdvances = async (req, res) => {
  try {
    const advances = await SalaryAdvance.find({ status: 'pending' })
      .populate('employeeId', 'name role')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: advances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Add this to your backend controller
export const deleteSalaryAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const advance = await SalaryAdvance.findByIdAndDelete(id);
    
    if (!advance) {
      return res.status(404).json({ success: false, message: 'Salary advance not found' });
    }
    
    res.json({ success: true, message: 'Salary advance deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};