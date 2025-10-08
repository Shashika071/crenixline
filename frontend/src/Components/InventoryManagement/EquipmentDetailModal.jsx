import { MdClose } from 'react-icons/md';
import React from 'react';

const EquipmentDetailModal = ({ equipment, onClose }) => {
  if (!equipment) return null;

  // Format dates
  // Format dates with native JavaScript
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };
  
  const createdAt = formatDate(equipment.createdAt);
  const updatedAt = formatDate(equipment.updatedAt);
  const lastUpdated = formatDate(equipment.lastUpdated);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">Equipment Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <MdClose size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-4">Basic Information</h4>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-base">{equipment.name}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="text-base">{equipment.category || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Quantity</p>
                  <p className="text-base">{equipment.quantity}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Unit</p>
                  <p className="text-base">{equipment.unit || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-base">{equipment.location || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Inventory Information</h4>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Reorder Level</p>
                  <p className="text-base">{equipment.reorderLevel || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="text-base">{lastUpdated}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className={`text-base ${equipment.quantity <= (equipment.reorderLevel || 0) ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                    {equipment.quantity <= (equipment.reorderLevel || 0) ? 'Low Stock' : 'In Stock'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-2">Description</h4>
            <p className="text-gray-700 whitespace-pre-wrap">
              {equipment.description || 'No description provided.'}
            </p>
          </div>
          
          {/* Notes */}
          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-2">Notes</h4>
            <p className="text-gray-700 whitespace-pre-wrap">
              {equipment.notes || 'No notes available.'}
            </p>
          </div>

          {/* Record Information */}
          <div className="border-t pt-4 mt-6">
            <h4 className="text-md font-semibold mb-2 text-gray-600">Record Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Created At</p>
                <p>{createdAt}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Modified</p>
                <p>{updatedAt}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t p-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetailModal;