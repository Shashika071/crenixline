import Employee from "../models/Employee.js";
import Machine from "../models/Machine.js";
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
    const { status, completedQuantity } = req.body;
    
    // Find the order first
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Prepare update data
    const updateData = {};
    
    if (status !== undefined) {
      updateData.status = status;
    }
    
    if (completedQuantity !== undefined) {
      updateData.completedQuantity = Math.min(order.quantity, Math.max(0, completedQuantity));
      
      // Auto-update status based on quantity completion
      const progressPercentage = (updateData.completedQuantity / order.quantity) * 100;
      
      if (progressPercentage >= 100) {
        updateData.status = 'Completed';
      } else if (progressPercentage >= 90) {
        updateData.status = 'Delivered';
      } else if (progressPercentage >= 50) {
        updateData.status = 'In Production';
      } else if (progressPercentage > 0) {
        updateData.status = 'Pending';
      }
    }

    // Update the order - the pre-save middleware will handle progress calculation
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('agentId').populate('assignedEmployees.employee');

    res.json({ 
      success: true, 
      data: updatedOrder,
      message: `Progress updated to ${updatedOrder.progress}% (${updatedOrder.completedQuantity}/${updatedOrder.quantity} units)`
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// New endpoint for direct quantity updates
export const updateOrderQuantity = async (req, res) => {
  try {
    const { completedQuantity } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { completedQuantity },
      { new: true, runValidators: true }
    ).populate('agentId').populate('assignedEmployees.employee');

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    res.json({ 
      success: true, 
      data: order,
      message: `Quantity updated: ${order.completedQuantity}/${order.quantity} units (${order.progress}% complete)`
    });
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
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const assignJob = async (req, res) => {
  try {
    const { stage, employees, machines, materials, estimatedHours } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if stage exists in order
    const stageExists = order.productionStages.some(s => s.stage === stage);
    if (!stageExists) {
      return res.status(400).json({ 
        success: false, 
        message: `Stage ${stage} not found in order production stages` 
      });
    }

    // Validate employees availability
    for (const emp of employees) {
      const employee = await Employee.findById(emp.employee);
      if (!employee || employee.status !== 'Active') {
        return res.status(400).json({ 
          success: false, 
          message: `Employee ${employee?.name || emp.employee} is not available` 
        });
      }
    }

    // Validate machines availability
    for (const machine of machines) {
      const machineDoc = await Machine.findById(machine.machine);
      if (!machineDoc || machineDoc.status !== 'Operational') {
        return res.status(400).json({ 
          success: false, 
          message: `Machine ${machineDoc?.name || machine.machine} is not operational` 
        });
      }
    }

    // Validate and deduct materials
    for (const materialUsage of materials) {
      const material = await Material.findById(materialUsage.material);
      if (!material) {
        return res.status(400).json({ 
          success: false, 
          message: `Material ${materialUsage.material} not found` 
        });
      }
      
      if (material.availableQty < materialUsage.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${material.name}. Available: ${material.availableQty}, Required: ${materialUsage.quantity}` 
        });
      }
      
      // Deduct material from inventory
      material.availableQty -= materialUsage.quantity;
      await material.save();
    }

    // Prepare update data
const updateData = {
  $set: {
    currentStage: stage,
    assignedDate: new Date(),
    'productionStages.$[stageElem].status': 'In Progress',
    'productionStages.$[stageElem].startDate': new Date(),
    'productionStages.$[stageElem].estimatedHours': estimatedHours,
    'productionStages.$[stageElem].assignedEmployees': employees.map(emp => ({
      employee: emp.employee,
      role: emp.role,
      assignedDate: new Date()
    })),
    'productionStages.$[stageElem].assignedMachines': machines.map(machine => ({
      machine: machine.machine,
      role: machine.role
    })),
    'productionStages.$[stageElem].materialsUsed': materials.map(material => ({
      material: material.material,
      quantity: material.quantity,
      unit: 'pcs'
    }))
  }
};

const updatedOrder = await Order.findByIdAndUpdate(
  req.params.id,
  updateData,
  { 
    new: true,
    runValidators: true,
    arrayFilters: [{ 'stageElem.stage': stage }]
  }
)
.populate('productionStages.assignedEmployees.employee')
.populate('productionStages.assignedMachines.machine')
.populate('productionStages.materialsUsed.material')
.populate('agentId');

    res.json({ 
      success: true, 
      data: updatedOrder,
      message: 'Job assigned successfully'
    });
  } catch (error) {
    console.error('Error in assignJob:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const completeStage = async (req, res) => {
  try {
    const { stage, outputQuantity, qualityRating, notes } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Determine next stage
    const stages = ['Cutting', 'Stitching', 'Finishing', 'Quality Control', 'Packing'];
    const currentIndex = stages.indexOf(stage);
    const nextStage = currentIndex < stages.length - 1 ? stages[currentIndex + 1] : 'Completed';

    const updateData = {
      currentStage: nextStage,
      'productionStages.$[elem].status': 'Completed',
      'productionStages.$[elem].endDate': new Date(),
      'productionStages.$[elem].outputQuantity': outputQuantity,
      'productionStages.$[elem].qualityRating': qualityRating,
      'productionStages.$[elem].notes': notes
    };

    // Calculate actual hours if start date exists
    const currentStageData = order.productionStages.find(s => s.stage === stage);
    if (currentStageData && currentStageData.startDate) {
      const actualHours = (new Date() - new Date(currentStageData.startDate)) / (1000 * 60 * 60);
      updateData['productionStages.$[elem].actualHours'] = Math.round(actualHours * 100) / 100;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true,
        arrayFilters: [{ 'elem.stage': stage }]
      }
    );

    // If order is completed, update order progress
    if (nextStage === 'Completed') {
      await Order.findByIdAndUpdate(req.params.id, {
        status: 'Completed',
        progress: 100,
        completedQuantity: order.quantity
      });
    }

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
// In controllers/orderController.js
export const updateJobAssignment = async (req, res) => {
  try {
    const { stage, employees, machines, materials, estimatedHours, notes } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Update the specific stage
    const updateData = {
      $set: {
        'productionStages.$[stageElem].estimatedHours': estimatedHours,
        'productionStages.$[stageElem].notes': notes,
        'productionStages.$[stageElem].assignedEmployees': employees.map(emp => ({
          employee: emp.employee,
          role: emp.role,
          assignedDate: new Date()
        })),
        'productionStages.$[stageElem].assignedMachines': machines.map(machine => ({
          machine: machine.machine,
          role: machine.role
        }))
      }
    };

    // Only update materials if provided
    if (materials && materials.length > 0) {
      updateData.$set['productionStages.$[stageElem].materialsUsed'] = materials.map(material => ({
        material: material.material,
        quantity: material.quantity,
        unit: 'pcs'
      }));
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true,
        runValidators: true,
        arrayFilters: [{ 'stageElem.stage': stage }]
      }
    )
    .populate('productionStages.assignedEmployees.employee')
    .populate('productionStages.assignedMachines.machine')
    .populate('productionStages.materialsUsed.material')
    .populate('agentId');

    res.json({ 
      success: true, 
      data: updatedOrder,
      message: 'Job assignment updated successfully'
    });
  } catch (error) {
    console.error('Error in updateJobAssignment:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};