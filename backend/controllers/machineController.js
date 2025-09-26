import Machine from "../models/Machine.js";

export const createMachine = async (req, res) => {
  try {
    const machine = new Machine(req.body);
    await machine.save();
    res.status(201).json({ success: true, data: machine });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMachines = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;

    const machines = await Machine.find(filter).sort({ name: 1 });
    res.json({ success: true, data: machines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMachineById = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ success: false, message: "Machine not found" });
    }
    
    res.json({ success: true, data: machine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMachine = async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!machine) {
      return res.status(404).json({ success: false, message: "Machine not found" });
    }
    
    res.json({ success: true, data: machine });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteMachine = async (req, res) => {
  try {
    const machine = await Machine.findByIdAndDelete(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ success: false, message: "Machine not found" });
    }
    
    res.json({ success: true, message: "Machine deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMachineMaintenance = async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!machine) {
      return res.status(404).json({ success: false, message: "Machine not found" });
    }

    res.json({ success: true, data: machine });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMaintenanceSchedule = async (req, res) => {
  try {
    const machines = await Machine.find({
      nextMaintenance: { $exists: true, $ne: null }
    }).sort({ nextMaintenance: 1 });

    res.json({ success: true, data: machines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMachinesNeedingMaintenance = async (req, res) => {
  try {
    const today = new Date();
    const machines = await Machine.find({
      $or: [
        { status: 'Maintenance' },
        { status: 'Broken' },
        { 
          nextMaintenance: { 
            $lte: today,
            $exists: true,
            $ne: null
          }
        }
      ]
    }).sort({ nextMaintenance: 1 });

    res.json({ success: true, data: machines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};