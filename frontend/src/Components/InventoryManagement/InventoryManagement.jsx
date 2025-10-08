import React, { useEffect, useState } from 'react';
import { equipmentAPI, machineAPI, materialAPI, supplierAPI } from '../../services/api';
import {
  exportEquipmentToExcel,
  exportLowStockToExcel,
  exportMachinesToExcel,
  exportMaintenanceAlertsToExcel,
  exportMaterialsToExcel
} from '../../utils/excelExporter';

import AlertBanner from './AlertBanner';
import EquipmentDetailModal from './EquipmentDetailModal';
import EquipmentForm from './EquipmentForm';
import EquipmentQuantityModal from './EquipmentQuantityModal';
import EquipmentTable from './EquipmentTable';
import InventoryStats from './InventoryStats';
import InventoryTabs from './InventoryTabs';
import MachineDetailModal from '../modals/MachineDetailModal';
import MachineModal from '../modals/MachineModal';
import MachinesTable from './MachinesTable';
import MaintenanceModal from '../modals/MaintenanceModal';
import MaterialDetailModal from '../modals/MaterialDetailModal';
import MaterialModal from '../modals/MaterialModal';
import MaterialsTable from './MaterialsTable';
import StockModal from '../modals/StockModal';

const InventoryManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [machines, setMachines] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('materials');
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailViewType, setDetailViewType] = useState(null); // 'material', 'machine', or 'equipment'
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [materialsRes, machinesRes, equipmentRes, suppliersRes] = await Promise.all([
        materialAPI.getAll(),
        machineAPI.getAll(),
        equipmentAPI.getAll(),
        supplierAPI.getAll({ type: 'Supplier' })
      ]);
      setMaterials(materialsRes.data.data || []);
      setMachines(machinesRes.data.data || []);
      setEquipment(equipmentRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (itemId, operation, quantity, costPerUnit = null) => {
    try {
      const updateData = { operation, quantity };
      if (costPerUnit) {
        updateData.costPerUnit = costPerUnit;
      }
      await materialAPI.updateStock(itemId, updateData);
      fetchData();
      setShowStockModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleMaintenanceUpdate = async (machineId, maintenanceData) => {
    try {
      await machineAPI.updateMaintenance(machineId, maintenanceData);
      fetchData();
      setShowMaintenanceModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating maintenance:', error);
      alert('Error updating maintenance: ' + (error.response?.data?.message || error.message));
    }
  };
  
  const handleQuantityUpdate = async (itemId, operation, quantity) => {
    try {
      await equipmentAPI.updateQuantity(itemId, { operation, quantity });
      fetchData();
      setShowQuantityModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating equipment quantity:', error);
      return Promise.reject(error);
    }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        if (type === 'material') {
          await materialAPI.delete(id);
        } else if (type === 'equipment') {
          await equipmentAPI.delete(id);
        } else {
          await machineAPI.delete(id);
        }
        fetchData();
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        alert(`Error deleting ${type}: ` + (error.response?.data?.message || error.message));
      }
    }
  };
const handleView = (item, type) => {
  setSelectedItem(item);
  setDetailViewType(type);
  setShowDetailModal(true);
};
  const handleExport = (type = 'current') => {
    try {
      switch (type) {
        case 'current':
          if (activeTab === 'materials') {
            exportMaterialsToExcel(filteredMaterials);
          } else if (activeTab === 'equipment') {
            exportEquipmentToExcel(filteredEquipment);
          } else {
            exportMachinesToExcel(filteredMachines);
          }
          break;
        
        case 'all':
          if (activeTab === 'materials') {
            exportMaterialsToExcel(materials);
          } else if (activeTab === 'equipment') {
            exportEquipmentToExcel(equipment);
          } else {
            exportMachinesToExcel(machines);
          }
          break;
        
        case 'low-stock':
          if (activeTab === 'equipment') {
            const lowStockEquipment = equipment.filter(e => e.quantity <= e.reorderLevel);
            exportEquipmentToExcel(lowStockEquipment);
          } else {
            exportLowStockToExcel(materials);
          }
          break;
        
        case 'maintenance':
          exportMaintenanceAlertsToExcel(machines);
          break;
        
        default:
          if (activeTab === 'materials') {
            exportMaterialsToExcel(filteredMaterials);
          } else if (activeTab === 'equipment') {
            exportEquipmentToExcel(filteredEquipment);
          } else {
            exportMachinesToExcel(filteredMachines);
          }
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting data: ' + error.message);
    }
  };
  // Get unique types for filter dropdown
  const materialTypes = [...new Set(materials.map(m => m.type).filter(Boolean))];
  const machineTypes = [...new Set(machines.map(m => m.type).filter(Boolean))];
  const equipmentCategories = [...new Set(equipment.map(e => e.category).filter(Boolean))];

  const filteredMaterials = materials.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredMachines = machines.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });
  
  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.category === filterType;
    return matchesSearch && matchesType;
  });

  const lowStockMaterials = materials.filter(m => m.availableQty <= m.reorderLevel);
  const lowStockEquipment = equipment.filter(e => e.quantity <= e.reorderLevel);
  const needsMaintenanceMachines = machines.filter(m => 
    m.status === 'Maintenance' || m.status === 'Broken' ||
    (m.nextMaintenance && new Date(m.nextMaintenance) <= new Date())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory & Assets Management</h1>
          <p className="text-slate-600 mt-1">Manage raw materials, machines, and production assets</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <span>+ Add {activeTab === 'materials' ? 'Material' : activeTab === 'equipment' ? 'Equipment' : 'Machine'}</span>
        </button>
      </div>

      {/* Statistics */}
      <InventoryStats 
        materials={materials} 
        machines={machines}
        equipment={equipment}
        lowStockCount={lowStockMaterials.length + lowStockEquipment.length}
        maintenanceCount={needsMaintenanceMachines.length}
      />

     <AlertBanner 
  type="material" 
  items={lowStockMaterials} 
  activeTab={activeTab}
  onViewAll={() => setFilterType('all')}
  onExport={() => handleExport('low-stock')}
/>

<AlertBanner 
  type="machine" 
  items={needsMaintenanceMachines} 
  activeTab={activeTab}
  onViewAll={() => setFilterType('all')}
  onExport={() => handleExport('maintenance')}
/>

<AlertBanner 
  type="equipment" 
  items={lowStockEquipment} 
  activeTab={activeTab}
  onViewAll={() => setFilterType('all')}
  onExport={() => handleExport('low-stock')}
/>
      {/* Main Content */}
      <InventoryTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        materialsCount={materials.length}
        machinesCount={machines.length}
        equipmentCount={equipment.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        materialTypes={materialTypes}
        machineTypes={machineTypes}
        equipmentCategories={equipmentCategories}
        onRefresh={fetchData}
        onExport={handleExport}
        filteredCount={
          activeTab === 'materials' ? filteredMaterials.length : 
          activeTab === 'equipment' ? filteredEquipment.length : 
          filteredMachines.length
        }
        totalCount={
          activeTab === 'materials' ? materials.length : 
          activeTab === 'equipment' ? equipment.length : 
          machines.length
        }
      >
        {activeTab === 'materials' ? (
          <MaterialsTable 
            materials={filteredMaterials}
            onStockUpdate={(material) => {
              setSelectedItem(material);
              setShowStockModal(true);
            }}
            onDelete={(id) => handleDelete(id, 'material')}
            onView={(material) => handleView(material, 'material')}
          />
        ) : activeTab === 'equipment' ? (
          <EquipmentTable 
            equipment={filteredEquipment}
            onQuantityUpdate={(item) => {
              setSelectedItem(item);
              setShowQuantityModal(true);
            }}
            onDelete={(id) => handleDelete(id, 'equipment')}
            onView={(item) => handleView(item, 'equipment')}
          />
        ) : (
          <MachinesTable 
            machines={filteredMachines}
            onMaintenanceUpdate={(machine) => {
              setSelectedItem(machine);
              setShowMaintenanceModal(true);
            }}
            onDelete={(id) => handleDelete(id, 'machine')}
            onView={(machine) => handleView(machine, 'machine')}
          />
        )}
      </InventoryTabs>

      {/* Modals */}
      {showModal && (
        activeTab === 'materials' ? (
          <MaterialModal 
            suppliers={suppliers}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              fetchData();
              setShowModal(false);
            }}
          />
        ) : activeTab === 'equipment' ? (
          <EquipmentForm 
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              fetchData();
              setShowModal(false);
            }}
          />
        ) : (
          <MachineModal 
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              fetchData();
              setShowModal(false);
            }}
          />
        )
      )}

      {showStockModal && selectedItem && (
        <StockModal 
          material={selectedItem}
          onClose={() => {
            setShowStockModal(false);
            setSelectedItem(null);
          }}
          onUpdate={handleStockUpdate}
        />
      )}

      {showMaintenanceModal && selectedItem && (
        <MaintenanceModal 
          machine={selectedItem}
          onClose={() => {
            setShowMaintenanceModal(false);
            setSelectedItem(null);
          }}
          onUpdate={handleMaintenanceUpdate}
        />
      )}
      
      {showQuantityModal && selectedItem && (
        <EquipmentQuantityModal 
          equipment={selectedItem}
          onClose={() => {
            setShowQuantityModal(false);
            setSelectedItem(null);
          }}
          onUpdate={handleQuantityUpdate}
        />
      )}

      {showDetailModal && selectedItem && (
        detailViewType === 'material' ? (
          <MaterialDetailModal 
            material={selectedItem}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedItem(null);
              setDetailViewType(null);
            }}
          />
        ) : detailViewType === 'equipment' ? (
          <EquipmentDetailModal 
            equipment={selectedItem}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedItem(null);
              setDetailViewType(null);
            }}
          />
        ) : (
          <MachineDetailModal 
            machine={selectedItem}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedItem(null);
              setDetailViewType(null);
            }}
          />
        )
      )}
    </div>
  );
};

export default InventoryManagement;