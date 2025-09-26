import React, { useState } from 'react';

const StockModal = ({ material, onClose, onUpdate }) => {
  const [operation, setOperation] = useState('add');
  const [quantity, setQuantity] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      await onUpdate(material._id, operation, parseInt(quantity), costPerUnit ? parseFloat(costPerUnit) : null);
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const newStock = material.availableQty + (operation === 'add' ? parseInt(quantity || 0) : -parseInt(quantity || 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Update Stock</h2>
          <p className="text-slate-600 text-sm mt-1">{material.name}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Operation *</label>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="add">Add Stock</option>
                <option value="subtract">Use Stock</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder={`Enter quantity in ${material.unit}`}
              />
            </div>
          </div>

          {operation === 'add' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Cost per Unit (Rs.) - Optional
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                placeholder="Leave empty to use current cost"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}
          
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Current Stock:</span>
              <span className="font-medium">{material.availableQty} {material.unit}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>After {operation === 'add' ? 'Adding' : 'Using'}:</span>
              <span className={newStock <= material.reorderLevel ? 'text-red-600' : 'text-green-600'}>
                {newStock} {material.unit}
              </span>
            </div>
            {newStock <= material.reorderLevel && (
              <div className="text-xs text-red-500 mt-1">
                ⚠️ This will put the material below reorder level
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockModal;