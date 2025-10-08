import React, { useState } from 'react';

import { MdClose } from 'react-icons/md';

const QuantityModal = ({ equipment, onClose, onUpdate }) => {
  const [quantity, setQuantity] = useState(1);
  const [operation, setOperation] = useState('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    
    if (operation === 'remove' && quantity > equipment.quantity) {
      setError(`Cannot remove more than the available quantity (${equipment.quantity})`);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await onUpdate(equipment._id, operation, quantity);
      onClose();
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError(error.response?.data?.message || 'Failed to update quantity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Update Quantity - {equipment.name}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
            <div className="text-lg font-medium">{equipment.quantity}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operation</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="operation"
                  value="add"
                  checked={operation === 'add'}
                  onChange={() => setOperation('add')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Add</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="operation"
                  value="remove"
                  checked={operation === 'remove'}
                  onChange={() => setOperation('remove')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Remove</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="operation"
                  value="set"
                  checked={operation === 'set'}
                  onChange={() => setOperation('set')}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Set Value</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="text-sm text-gray-500">
            {operation === 'add' && `Will add ${quantity} to the current quantity (${equipment.quantity}).`}
            {operation === 'remove' && `Will remove ${quantity} from the current quantity (${equipment.quantity}).`}
            {operation === 'set' && `Will set the quantity to exactly ${quantity}.`}
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Updating...' : 'Update Quantity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuantityModal;