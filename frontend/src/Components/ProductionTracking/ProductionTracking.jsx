import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Users,
  Wrench
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { employeeAPI, machineAPI, materialAPI, orderAPI } from '../../services/api';

const ProductionTracking = () => {
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showUpdateJobModal, setShowUpdateJobModal] = useState(false);
  const [showStageUpdateModal, setShowStageUpdateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStage, setFilterStage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, employeesRes, materialsRes, machinesRes] = await Promise.all([
        orderAPI.getAll(),
        employeeAPI.getAll(),
        materialAPI.getAll(),
        machineAPI.getAll()
      ]);
      setOrders(ordersRes.data.data);
      setEmployees(employeesRes.data.data);
      setMaterials(materialsRes.data.data);
      setMachines(machinesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = (order) => {
    setSelectedOrder(order);
    setShowJobModal(true);
  };

  const handleUpdateJob = (order) => {
    setSelectedOrder(order);
    setShowUpdateJobModal(true);
  };

  const handleUpdateStage = (order) => {
    setSelectedOrder(order);
    setShowStageUpdateModal(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStage = filterStage === 'all' || order.currentStage === filterStage;
    const hasPendingStages = order.productionStages?.some(stage => 
      filterStatus === 'all' || stage.status === filterStatus
    );
    return matchesStage && (filterStatus === 'all' || hasPendingStages);
  });

  const getStageColor = (stage) => {
    const colors = {
      'Cutting': 'from-red-500 to-orange-500',
      'Stitching': 'from-blue-500 to-purple-500',
      'Finishing': 'from-green-500 to-teal-500',
      'Quality Control': 'from-yellow-500 to-orange-500',
      'Packing': 'from-indigo-500 to-purple-500',
      'Completed': 'from-emerald-500 to-green-500'
    };
    return colors[stage] || 'from-slate-500 to-slate-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Management</h1>
          <p className="text-slate-600 mt-1">Assign and track production jobs</p>
        </div>
      </div>

      {/* Statistics */}
      <ProductionOverview orders={orders} />

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full"
            />
          </div>
          
          <div className="flex space-x-4">
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Stages</option>
              <option value="Cutting">Cutting</option>
              <option value="Stitching">Stitching</option>
              <option value="Finishing">Finishing</option>
              <option value="Quality Control">Quality Control</option>
              <option value="Packing">Packing</option>
              <option value="Completed">Completed</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <OrderJobCard 
            key={order._id}
            order={order}
            employees={employees}
            materials={materials}
            machines={machines}
            onCreateJob={handleCreateJob}
            onUpdateJob={handleUpdateJob}
            onUpdateStage={handleUpdateStage}
            getStageColor={getStageColor}
            onUpdate={fetchData}
          />
        ))}
      </div>

      {filteredOrders.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No orders found</h3>
          <p className="text-slate-500">Try adjusting your filters.</p>
        </div>
      )}

      {/* Job Assignment Modal */}
      {showJobModal && selectedOrder && (
        <JobAssignmentModal
          order={selectedOrder}
          employees={employees}
          materials={materials}
          machines={machines}
          onClose={() => {
            setShowJobModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={fetchData}
        />
      )}

      {/* Update Job Modal */}
      {showUpdateJobModal && selectedOrder && (
        <UpdateJobModal
          order={selectedOrder}
          employees={employees}
          materials={materials}
          machines={machines}
          onClose={() => {
            setShowUpdateJobModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={fetchData}
        />
      )}

      {/* Update Stage Modal */}
      {showStageUpdateModal && selectedOrder && (
        <UpdateStageModal
          order={selectedOrder}
          onClose={() => {
            setShowStageUpdateModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

const ProductionOverview = ({ orders }) => {
  const stats = {
    total: orders.length,
    cutting: orders.filter(o => o.currentStage === 'Cutting').length,
    stitching: orders.filter(o => o.currentStage === 'Stitching').length,
    finishing: orders.filter(o => o.currentStage === 'Finishing').length,
    qualityControl: orders.filter(o => o.currentStage === 'Quality Control').length,
    packing: orders.filter(o => o.currentStage === 'Packing').length,
    completed: orders.filter(o => o.currentStage === 'Completed').length,
  };

  const stages = [
    { name: 'Cutting', count: stats.cutting, color: 'from-red-500 to-orange-500' },
    { name: 'Stitching', count: stats.stitching, color: 'from-blue-500 to-purple-500' },
    { name: 'Finishing', count: stats.finishing, color: 'from-green-500 to-teal-500' },
    { name: 'Quality Control', count: stats.qualityControl, color: 'from-yellow-500 to-orange-500' },
    { name: 'Packing', count: stats.packing, color: 'from-indigo-500 to-purple-500' },
    { name: 'Completed', count: stats.completed, color: 'from-emerald-500 to-green-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stages.map((stage) => (
        <div key={stage.name} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600">{stage.name}</p>
              <p className="text-lg font-bold text-slate-900 mt-1">{stage.count}</p>
            </div>
            <div className={`w-8 h-8 bg-gradient-to-r ${stage.color} rounded-lg flex items-center justify-center text-white`}>
              <Package size={16} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const OrderJobCard = ({ order, employees, materials, machines, onCreateJob, onUpdateJob, onUpdateStage, getStageColor, onUpdate }) => {
  const currentStage = order.productionStages?.find(stage => stage.stage === order.currentStage);

  const handleStageComplete = async (stageName) => {
    try {
      await orderAPI.completeStage(order._id, { 
        stage: stageName,
        outputQuantity: order.quantity,
        qualityRating: 5,
        notes: 'Stage completed successfully'
      });
      onUpdate();
    } catch (error) {
      console.error('Error completing stage:', error);
      alert('Error completing stage: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">{order.designName}</h3>
          <p className="text-sm text-slate-500">Order #: {order.orderId}</p>
          <p className="text-sm text-slate-500">Qty: {order.quantity} units</p>
        </div>
        <span className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-full text-white bg-gradient-to-r ${getStageColor(order.currentStage)}`}>
          {order.currentStage}
        </span>
      </div>

      {/* Production Stages */}
      <div className="space-y-3 mb-4">
        {order.productionStages?.map((stage) => (
          <div key={stage.stage} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
            <span className="text-sm font-medium">{stage.stage}</span>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                stage.status === 'Completed' ? 'bg-green-100 text-green-800' :
                stage.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                'bg-slate-100 text-slate-800'
              }`}>
                {stage.status}
              </span>
              {stage.status === 'In Progress' && (
                <button
                  onClick={() => handleStageComplete(stage.stage)}
                  className="text-green-600 hover:text-green-800"
                  title="Complete Stage"
                >
                  <CheckCircle size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Current Stage Details */}
      {currentStage && (
        <div className="border-t border-slate-200 pt-4 mb-4">
          <h4 className="font-medium text-slate-900 mb-2">Current Stage: {currentStage.stage}</h4>
          
          {/* Assigned Employees */}
          {currentStage.assignedEmployees?.length > 0 && (
            <div className="mb-2">
              <span className="text-xs text-slate-600">Employees:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentStage.assignedEmployees.map((assignment, index) => {
                  const employee = employees.find(e => e._id === assignment.employee);
                  return employee ? (
                    <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {employee.name} ({assignment.role})
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Assigned Machines */}
          {currentStage.assignedMachines?.length > 0 && (
            <div className="mb-2">
              <span className="text-xs text-slate-600">Machines:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {currentStage.assignedMachines.map((assignment, index) => {
                  const machine = machines.find(m => m._id === assignment.machine);
                  return machine ? (
                    <span key={index} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {machine.name} ({assignment.role})
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex space-x-2">
        {!currentStage?.assignedEmployees?.length ? (
          <button
            onClick={() => onCreateJob(order)}
            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
          >
            Assign Job
          </button>
        ) : (
          <>
            <button
              onClick={() => onUpdateJob(order)}
              className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Update Job
            </button>
            <button
              onClick={() => onUpdateStage(order)}
              className="flex-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              Update Stage
            </button>
          </>
        )}
        <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors">
          <Eye size={16} />
        </button>
      </div>
    </div>
  );
};

// Job Assignment Modal Component (existing)
const JobAssignmentModal = ({ order, employees, materials, machines, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    stage: order.currentStage,
    primaryEmployee: '',
    secondaryEmployees: [],
    primaryMachine: '',
    secondaryMachines: [],
    materials: [],
    estimatedHours: 0,
    startDate: new Date().toISOString().split('T')[0]
  });

  const availableEmployees = employees.filter(emp => 
    emp.status === 'Active' && 
    !emp.attendance?.some(att => 
      new Date(att.date).toDateString() === new Date().toDateString() && 
      ['Absent', 'Leave', 'Medical Leave'].includes(att.status)
    )
  );

  const availableMachines = machines.filter(machine => 
    machine.status === 'Operational'
  );

 const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // Prepare the data for the backend - FIXED VERSION
    const assignmentData = {
      stage: formData.stage,
      employees: [],
      machines: [],
      materials: [],
      estimatedHours: parseFloat(formData.estimatedHours) || 0
    };

    // Add primary employee - FIXED: use 'employee' instead of 'employeeId'
    if (formData.primaryEmployee) {
      assignmentData.employees.push({
        employee: formData.primaryEmployee, // Changed from employeeId to employee
        role: 'Primary'
      });
    }

    // Add secondary employees - FIXED
    formData.secondaryEmployees.forEach(empId => {
      assignmentData.employees.push({
        employee: empId, // Changed from employeeId to employee
        role: 'Secondary'
      });
    });

    // Add primary machine - FIXED
    if (formData.primaryMachine) {
      assignmentData.machines.push({
        machine: formData.primaryMachine, // Changed from machineId to machine
        role: 'Primary'
      });
    }

    // Add secondary machines - FIXED
    formData.secondaryMachines.forEach(machineId => {
      assignmentData.machines.push({
        machine: machineId, // Changed from machineId to machine
        role: 'Secondary'
      });
    });

    // Format materials for backend - FIXED
    formData.materials
      .filter(m => m.material && m.quantity > 0)
      .forEach(material => {
        assignmentData.materials.push({
          material: material.material, // Changed from materialId to material
          quantity: parseFloat(material.quantity) || 0
        });
      });

    console.log('Sending assignment data:', assignmentData); // Debug log

    // Use the correct API method
    await orderAPI.assignJob(order._id, assignmentData);

    onSuccess();
    onClose();
  } catch (error) {
    console.error('Error assigning job:', error);
    console.error('Error details:', error.response?.data); // More detailed error log
    alert('Error assigning job: ' + (error.response?.data?.message || error.message));
  }
};
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Assign Production Job</h2>
          <p className="text-sm text-slate-600 mt-1">{order.designName} - {order.orderId}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Stage Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Production Stage</label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="Cutting">Cutting</option>
              <option value="Stitching">Stitching</option>
              <option value="Finishing">Finishing</option>
              <option value="Quality Control">Quality Control</option>
              <option value="Packing">Packing</option>
            </select>
          </div>

          {/* Employee Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Primary Employee</label>
              <select
                required
                value={formData.primaryEmployee}
                onChange={(e) => setFormData({ ...formData, primaryEmployee: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select Primary Employee</option>
                {availableEmployees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Employees</label>
              <select
                multiple
                value={formData.secondaryEmployees}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  secondaryEmployees: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                size="3"
              >
                {availableEmployees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Machine Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Primary Machine</label>
              <select
                required
                value={formData.primaryMachine}
                onChange={(e) => setFormData({ ...formData, primaryMachine: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select Primary Machine</option>
                {availableMachines.map(machine => (
                  <option key={machine._id} value={machine._id}>
                    {machine.name} - {machine.type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Machines</label>
              <select
                multiple
                value={formData.secondaryMachines}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  secondaryMachines: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                size="3"
              >
                {availableMachines.map(machine => (
                  <option key={machine._id} value={machine._id}>
                    {machine.name} - {machine.type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Materials Usage */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Materials Required</label>
            <div className="space-y-2">
              {formData.materials.map((material, index) => (
                <div key={index} className="flex space-x-2">
                  <select
                    value={material.material}
                    onChange={(e) => {
                      const newMaterials = [...formData.materials];
                      newMaterials[index].material = e.target.value;
                      setFormData({ ...formData, materials: newMaterials });
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Material</option>
                    {materials.map(mat => (
                      <option key={mat._id} value={mat._id}>
                        {mat.name} (Stock: {mat.availableQty} {mat.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={material.quantity}
                    onChange={(e) => {
                      const newMaterials = [...formData.materials];
                      newMaterials[index].quantity = e.target.value;
                      setFormData({ ...formData, materials: newMaterials });
                    }}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newMaterials = formData.materials.filter((_, i) => i !== index);
                      setFormData({ ...formData, materials: newMaterials });
                    }}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  materials: [...formData.materials, { material: '', quantity: 0 }] 
                })}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                Add Material
              </button>
            </div>
          </div>

          {/* Time Estimation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Hours</label>
            <input
              type="number"
              value={formData.estimatedHours}
              onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              min="0"
              step="0.5"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Assign Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// NEW: Update Job Modal Component
// NEW: Update Job Modal Component
const UpdateJobModal = ({ order, employees, materials, machines, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    stage: order.currentStage,
    primaryEmployee: '',
    secondaryEmployees: [],
    primaryMachine: '',
    secondaryMachines: [],
    materials: [],
    estimatedHours: 0,
    notes: ''
  });

  // Get available employees and machines
  const availableEmployees = employees.filter(emp => 
    emp.status === 'Active' && 
    !emp.attendance?.some(att => 
      new Date(att.date).toDateString() === new Date().toDateString() && 
      ['Absent', 'Leave', 'Medical Leave'].includes(att.status)
    )
  );

  const availableMachines = machines.filter(machine => 
    machine.status === 'Operational'
  );

  useEffect(() => {
    // Pre-fill form with current assignment data
    const currentStage = order.productionStages?.find(stage => stage.stage === order.currentStage);
    if (currentStage) {
      const primaryEmployee = currentStage.assignedEmployees?.find(emp => emp.role === 'Primary')?.employee;
      const secondaryEmployees = currentStage.assignedEmployees?.filter(emp => emp.role === 'Secondary').map(emp => emp.employee) || [];
      const primaryMachine = currentStage.assignedMachines?.find(mac => mac.role === 'Primary')?.machine;
      const secondaryMachines = currentStage.assignedMachines?.filter(mac => mac.role === 'Secondary').map(mac => mac.machine) || [];
      
      setFormData({
        stage: order.currentStage,
        primaryEmployee: primaryEmployee || '',
        secondaryEmployees: secondaryEmployees,
        primaryMachine: primaryMachine || '',
        secondaryMachines: secondaryMachines,
        materials: currentStage.materialsUsed?.map(mat => ({
          material: mat.material,
          quantity: mat.quantity
        })) || [{ material: '', quantity: 0 }],
        estimatedHours: currentStage.estimatedHours || 0,
        notes: currentStage.notes || ''
      });
    }
  }, [order]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        stage: formData.stage,
        employees: [],
        machines: [],
        materials: [],
        estimatedHours: parseFloat(formData.estimatedHours) || 0,
        notes: formData.notes
      };

      // Add employees
      if (formData.primaryEmployee) {
        updateData.employees.push({
          employee: formData.primaryEmployee,
          role: 'Primary'
        });
      }
      formData.secondaryEmployees.forEach(empId => {
        updateData.employees.push({
          employee: empId,
          role: 'Secondary'
        });
      });

      // Add machines
      if (formData.primaryMachine) {
        updateData.machines.push({
          machine: formData.primaryMachine,
          role: 'Primary'
        });
      }
      formData.secondaryMachines.forEach(machineId => {
        updateData.machines.push({
          machine: machineId,
          role: 'Secondary'
        });
      });

      // Add materials
      formData.materials
        .filter(m => m.material && m.quantity > 0)
        .forEach(material => {
          updateData.materials.push({
            material: material.material,
            quantity: parseFloat(material.quantity) || 0
          });
        });

      await orderAPI.updateJobAssignment(order._id, updateData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Error updating job: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Update Production Job</h2>
          <p className="text-sm text-slate-600 mt-1">{order.designName} - {order.orderId}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Stage Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Production Stage</label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="Cutting">Cutting</option>
              <option value="Stitching">Stitching</option>
              <option value="Finishing">Finishing</option>
              <option value="Quality Control">Quality Control</option>
              <option value="Packing">Packing</option>
            </select>
          </div>

          {/* Employee Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Primary Employee</label>
              <select
                value={formData.primaryEmployee}
                onChange={(e) => setFormData({ ...formData, primaryEmployee: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select Primary Employee</option>
                {availableEmployees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Employees</label>
              <select
                multiple
                value={formData.secondaryEmployees}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  secondaryEmployees: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                size="3"
              >
                {availableEmployees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Machine Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Primary Machine</label>
              <select
                value={formData.primaryMachine}
                onChange={(e) => setFormData({ ...formData, primaryMachine: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select Primary Machine</option>
                {availableMachines.map(machine => (
                  <option key={machine._id} value={machine._id}>
                    {machine.name} - {machine.type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Secondary Machines</label>
              <select
                multiple
                value={formData.secondaryMachines}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  secondaryMachines: Array.from(e.target.selectedOptions, option => option.value)
                })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                size="3"
              >
                {availableMachines.map(machine => (
                  <option key={machine._id} value={machine._id}>
                    {machine.name} - {machine.type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Materials Usage */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Materials Required</label>
            <div className="space-y-2">
              {formData.materials.map((material, index) => (
                <div key={index} className="flex space-x-2">
                  <select
                    value={material.material}
                    onChange={(e) => {
                      const newMaterials = [...formData.materials];
                      newMaterials[index].material = e.target.value;
                      setFormData({ ...formData, materials: newMaterials });
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select Material</option>
                    {materials.map(mat => (
                      <option key={mat._id} value={mat._id}>
                        {mat.name} (Stock: {mat.availableQty} {mat.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={material.quantity}
                    onChange={(e) => {
                      const newMaterials = [...formData.materials];
                      newMaterials[index].quantity = e.target.value;
                      setFormData({ ...formData, materials: newMaterials });
                    }}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newMaterials = formData.materials.filter((_, i) => i !== index);
                      setFormData({ ...formData, materials: newMaterials });
                    }}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  materials: [...formData.materials, { material: '', quantity: 0 }] 
                })}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
              >
                Add Material
              </button>
            </div>
          </div>

          {/* Time Estimation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Hours</label>
            <input
              type="number"
              value={formData.estimatedHours}
              onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              min="0"
              step="0.5"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows="3"
              placeholder="Add any notes about this job assignment..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Update Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// NEW: Update Stage Modal Component
const UpdateStageModal = ({ order, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    stage: order.currentStage,
    status: 'In Progress',
    outputQuantity: order.quantity,
    qualityRating: 5,
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await orderAPI.completeStage(order._id, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('Error updating stage: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Update Production Stage</h2>
          <p className="text-sm text-slate-600 mt-1">{order.designName} - {order.orderId}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Current Stage</label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="Cutting">Cutting</option>
              <option value="Stitching">Stitching</option>
              <option value="Finishing">Finishing</option>
              <option value="Quality Control">Quality Control</option>
              <option value="Packing">Packing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Output Quantity</label>
            <input
              type="number"
              value={formData.outputQuantity}
              onChange={(e) => setFormData({ ...formData, outputQuantity: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              min="0"
              max={order.quantity}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Quality Rating (1-5)</label>
            <input
              type="number"
              value={formData.qualityRating}
              onChange={(e) => setFormData({ ...formData, qualityRating: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              min="1"
              max="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows="3"
              placeholder="Add any notes about this stage..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              Update Stage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductionTracking;