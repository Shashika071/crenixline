import Allowance from '../models/Allowance.js';
import EmployeeAllowance from '../models/EmployeeAllowance.js';

export const createAllowance = async (req, res) => {
  try {
    const allowance = new Allowance(req.body);
    await allowance.save();
    res.status(201).json({ success: true, data: allowance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllowances = async (req, res) => {
  try {
    const allowances = await Allowance.find({ isActive: true });
    res.json({ success: true, data: allowances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAllowance = async (req, res) => {
  try {
    const allowance = await Allowance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!allowance) {
      return res.status(404).json({ success: false, message: 'Allowance not found' });
    }
    res.json({ success: true, data: allowance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAllowance = async (req, res) => {
  try {
    const allowance = await Allowance.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!allowance) {
      return res.status(404).json({ success: false, message: 'Allowance not found' });
    }
    res.json({ success: true, message: 'Allowance deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assignAllowanceToEmployee = async (req, res) => {
  try {
    const { employeeId, allowanceId, amount } = req.body;
    
    const employeeAllowance = await EmployeeAllowance.findOneAndUpdate(
      { employeeId, allowanceId },
      { amount, isActive: true },
      { upsert: true, new: true }
    ).populate('allowanceId');
    
    res.json({ success: true, data: employeeAllowance });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getEmployeeAllowances = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employeeAllowances = await EmployeeAllowance.find({
      employeeId,
      isActive: true
    }).populate('allowanceId');
    
    res.json({ success: true, data: employeeAllowances });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeEmployeeAllowance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employeeAllowance = await EmployeeAllowance.findByIdAndUpdate(
      id,
      { isActive: false }
    );
    
    if (!employeeAllowance) {
      return res.status(404).json({ success: false, message: 'Employee allowance not found' });
    }
    
    res.json({ success: true, message: 'Allowance removed from employee' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};