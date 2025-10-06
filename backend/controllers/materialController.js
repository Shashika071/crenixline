import Material from "../models/Material.js";

export const createMaterial = async (req, res) => {
  try {
    const material = new Material(req.body);
    await material.save();
    await material.populate('supplierId');
    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMaterials = async (req, res) => {
  try {
    const { type, needsReorder } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (needsReorder === 'true') {
      filter.availableQty = { $lte: { $expr: '$reorderLevel' } };
    }

    const materials = await Material.find(filter).populate('supplierId').sort({ name: 1 });
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id).populate('supplierId');
    
    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }
    
    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplierId');

    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }
    
    res.json({ success: true, data: material });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndDelete(req.params.id);
    
    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }
    
    res.json({ success: true, message: "Material deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMaterialStock = async (req, res) => {
  try {
    const { operation, quantity } = req.body; // operation: 'add' or 'subtract'
    
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: "Material not found" });
    }

    if (operation === 'add') {
      material.availableQty += quantity;
      material.lastRestocked = new Date();
    } else if (operation === 'subtract') {
      if (material.availableQty < quantity) {
        return res.status(400).json({ success: false, message: "Insufficient stock" });
      }
      material.availableQty -= quantity;
    }

    await material.save();
    await material.populate('supplierId');
    res.json({ success: true, data: material });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getLowStockMaterials = async (req, res) => {
  try {
    console.log('Fetching low stock materials with simple query...');
    
    // Get all active materials
    const allMaterials = await Material.find({ isActive: true }).populate('supplierId');
    
    // Filter for low stock manually (most reliable method)
    const lowStockMaterials = allMaterials.filter(material => {
      const isLowStock = material.availableQty <= material.reorderLevel;
      if (isLowStock) {
        console.log(`Low Stock: ${material.name} - ${material.availableQty}/${material.reorderLevel}`);
      }
      return isLowStock;
    });

    console.log(`Found ${lowStockMaterials.length} low stock items`);

    res.json({ 
      success: true, 
      data: lowStockMaterials,
      count: lowStockMaterials.length,
      message: `Found ${lowStockMaterials.length} low stock items`
    });
  } catch (error) {
    console.error('Error in getLowStockMaterials:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch low stock materials',
      error: error.message
    });
  }
};