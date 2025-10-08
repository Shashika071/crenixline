import Equipment from "../models/Equipment.js";

// Get all equipment with pagination
export const getAllEquipment = async (req, res) => {
  try {
    const { page = 1, limit = 50, category } = req.query;
    
    const query = {};
    if (category) {
      query.category = category;
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };
    
    const equipment = await Equipment.find(query)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .sort(options.sort);
    
    const total = await Equipment.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      data: equipment,
      pagination: {
        total,
        page: options.page,
        pages: Math.ceil(total / options.limit),
        limit: options.limit,
      },
    });
  } catch (error) {
    console.error("Error getting equipment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get equipment",
      error: error.message,
    });
  }
};

// Get equipment by ID
export const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const equipment = await Equipment.findById(id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }
    
    return res.status(200).json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    console.error("Error getting equipment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get equipment",
      error: error.message,
    });
  }
};

// Create new equipment
export const createEquipment = async (req, res) => {
  try {
    const equipmentData = req.body;
    const newEquipment = new Equipment(equipmentData);
    await newEquipment.save();
    
    return res.status(201).json({
      success: true,
      message: "Equipment created successfully",
      data: newEquipment,
    });
  } catch (error) {
    console.error("Error creating equipment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create equipment",
      error: error.message,
    });
  }
};

// Update equipment
export const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const equipment = await Equipment.findByIdAndUpdate(
      id, 
      { ...updateData, lastUpdated: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Equipment updated successfully",
      data: equipment,
    });
  } catch (error) {
    console.error("Error updating equipment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update equipment",
      error: error.message,
    });
  }
};

// Delete equipment
export const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const equipment = await Equipment.findByIdAndDelete(id);
    
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Equipment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete equipment",
      error: error.message,
    });
  }
};

// Update equipment quantity
export const updateEquipmentQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { operation, quantity } = req.body;
    
    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found",
      });
    }
    
    let newQuantity = equipment.quantity;
    
    // Update quantity based on operation
    if (operation === "add") {
      newQuantity += parseInt(quantity);
    } else if (operation === "remove") {
      newQuantity -= parseInt(quantity);
      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot remove more than available quantity",
        });
      }
    } else if (operation === "set") {
      newQuantity = parseInt(quantity);
      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot set negative quantity",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid operation. Use 'add', 'remove', or 'set'",
      });
    }
    
    equipment.quantity = newQuantity;
    equipment.lastUpdated = Date.now();
    await equipment.save();
    
    return res.status(200).json({
      success: true,
      message: "Equipment quantity updated successfully",
      data: equipment,
    });
  } catch (error) {
    console.error("Error updating equipment quantity:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update equipment quantity",
      error: error.message,
    });
  }
};

// Get low stock equipment
export const getLowStockEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.find({
      $expr: {
        $lte: ["$quantity", "$reorderLevel"]
      }
    });
    
    return res.status(200).json({
      success: true,
      data: equipment,
      count: equipment.length
    });
  } catch (error) {
    console.error("Error getting low stock equipment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get low stock equipment",
      error: error.message,
    });
  }
};
