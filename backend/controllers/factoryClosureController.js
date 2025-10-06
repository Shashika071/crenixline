// controllers/factoryClosureController.js

import FactoryClosure from "../models/FactoryClosure.js";

export const createFactoryClosure = async (req, res) => {
  try {
    const closure = new FactoryClosure(req.body);
    await closure.save();
    
    await closure.populate('affectedEmployees', 'name role');
    
    res.status(201).json({ 
      success: true, 
      data: closure,
      message: `Successfully created ${closure.isActualClosure ? 'Factory Closure' : 'Holiday'}`
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getFactoryClosures = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const filter = {};
    
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };
    
    if (type === 'holiday') {
      filter.isActualClosure = false;
    } else if (type === 'closure') {
      filter.isActualClosure = true;
    }

    const closures = await FactoryClosure.find(filter)
      .populate('affectedEmployees', 'name role')
      .sort({ date: 1 });

    res.json({ 
      success: true, 
      data: closures,
      summary: {
        total: closures.length,
        holidays: closures.filter(c => !c.isActualClosure).length,
        closures: closures.filter(c => c.isActualClosure).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClosureStats = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);

    const closures = await FactoryClosure.find({
      date: { $gte: startDate, $lte: endDate },
      status: 'Active'
    });

    const stats = {
      total: closures.length,
      holidays: closures.filter(c => !c.isActualClosure).length,
      factoryClosures: closures.filter(c => c.isActualClosure).length,
      byReason: {},
      byMonth: Array(12).fill(0).map((_, index) => ({
        month: index,
        holidays: 0,
        closures: 0
      }))
    };

    closures.forEach(closure => {
      stats.byReason[closure.reason] = (stats.byReason[closure.reason] || 0) + 1;
    });

    closures.forEach(closure => {
      const month = new Date(closure.date).getMonth();
      if (closure.isActualClosure) {
        stats.byMonth[month].closures++;
      } else {
        stats.byMonth[month].holidays++;
      }
    });

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};