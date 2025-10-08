import { FaEdit, FaEye, FaTrashAlt } from 'react-icons/fa';
import { MdAddCircle, MdRemoveCircle } from 'react-icons/md';

import React from 'react';

const EquipmentTable = ({ equipment, onQuantityUpdate, onDelete, onView }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reorder Level</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Location</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Updated</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {equipment.length > 0 ? (
            equipment.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.category}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <span className={`inline-block w-20 text-sm font-medium ${
                      item.quantity <= item.reorderLevel ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {item.quantity}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.reorderLevel}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{item.location || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(item.lastUpdated).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => onQuantityUpdate(item, 'add')}
                    className="text-green-600 hover:text-green-900"
                    title="Add quantity"
                  >
                    <MdAddCircle size={20} />
                  </button>
                  <button
                    onClick={() => onQuantityUpdate(item, 'remove')}
                    className="text-orange-600 hover:text-orange-900"
                    title="Remove quantity"
                  >
                    <MdRemoveCircle size={20} />
                  </button>
                  <button
                    onClick={() => onView(item)}
                    className="text-blue-600 hover:text-blue-900"
                    title="View details"
                  >
                    <FaEye size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(item._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <FaTrashAlt size={16} />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                No equipment found. Add some equipment to get started.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EquipmentTable;