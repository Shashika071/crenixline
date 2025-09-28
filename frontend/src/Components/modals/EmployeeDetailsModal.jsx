// EmployeeDetailsModal.jsx

import { Building, Calendar, DollarSign, Landmark, MapPin, Percent, Phone, Shield, User, X } from 'lucide-react';

import React from 'react';

const EmployeeDetailsModal = ({ employee, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">Employee Details</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <User className="text-slate-400" size={20} />
              <div>
                <div className="text-sm text-slate-500">Name</div>
                <div className="font-medium">{employee.name}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-slate-400">NIC</div>
              <div>
                <div className="text-sm text-slate-500">NIC Number</div>
                <div className="font-medium">{employee.nic}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Phone className="text-slate-400" size={20} />
              <div>
                <div className="text-sm text-slate-500">Contact</div>
                <div className="font-medium">{employee.contactNo}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <MapPin className="text-slate-400" size={20} />
              <div>
                <div className="text-sm text-slate-500">Address</div>
                <div className="font-medium">{employee.address}</div>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-500">Role</div>
                <div className="font-medium">{employee.role}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Status</div>
                <div className="font-medium">{employee.status}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Employment Type</div>
                <div className="font-medium">{employee.employmentStatus}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Join Date</div>
                <div className="font-medium">{new Date(employee.joinDate).toLocaleDateString()}</div>
              </div>
               <div>
                <div className="text-sm text-slate-500">Employment Duration</div>
                <div className="font-medium">{ employee.employmentDuration}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">EPF Enrollment</div>
                <div className={`font-medium ${employee.hasEPF ? 'text-green-600' : 'text-red-600'}`}>
                  {employee.hasEPF ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>

          {/* EPF Details - Show only if hasEPF is true */}
          {employee.hasEPF && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Shield className="text-blue-500 mr-2" size={20} />
                EPF Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
                {/* EPF Number */}
                {employee?.epfNumber && (
                  <div className="flex items-center space-x-3">
                    <Shield className="text-blue-400" size={18} />
                    <div>
                      <div className="text-sm text-slate-600">EPF Number</div>
                      <div className="font-medium text-blue-700">{employee.epfNumber}</div>
                    </div>
                  </div>
                )}
                
                {/* EPF Percentage */}
                {employee.epfDetails?.employeeContribution && (
                  <div className="flex items-center space-x-3">
                    <Percent className="text-blue-400" size={18} />
                    <div>
                      <div className="text-sm text-slate-600">Employee Contribution</div>
                      <div className="font-medium text-blue-700">{employee.epfDetails.employeeContribution}%</div>
                    </div>
                  </div>
                )}
                
                {/* Employer Contribution */}
                {employee.epfDetails?.employerContribution && (
                  <div className="flex items-center space-x-3">
                    <Building className="text-blue-400" size={18} />
                    <div>
                      <div className="text-sm text-slate-600">Employer Contribution</div>
                      <div className="font-medium text-blue-700">{employee.epfDetails.employerContribution}%</div>
                    </div>
                  </div>
                )}
                
                {/* EPF Start Date */}
                {employee.epfDetails?.startDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="text-blue-400" size={18} />
                    <div>
                      <div className="text-sm text-slate-600">EPF Start Date</div>
                      <div className="font-medium text-blue-700">
                        {new Date(employee.epfDetails.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* EPF Account Balance */}
                {employee.epfDetails?.currentBalance && (
                  <div className="flex items-center space-x-3">
                    <DollarSign className="text-blue-400" size={18} />
                    <div>
                      <div className="text-sm text-slate-600">Current Balance</div>
                      <div className="font-medium text-blue-700">
                        Rs. {employee.epfDetails.currentBalance.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* If no specific EPF details are available, show a default message */}
                {!employee.epfDetails && (
                  <div className="col-span-2 text-center py-4">
                    <Shield className="text-blue-400 mx-auto mb-2" size={24} />
                    <div className="text-blue-600 font-medium">EPF Enrolled</div>
                    <div className="text-sm text-slate-500">Employee is enrolled in EPF scheme</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Salary Details */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Salary Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="text-slate-400" size={20} />
                <div>
                  <div className="text-sm text-slate-500">Basic Salary</div>
                  <div className="font-medium">Rs. {employee.salary?.toLocaleString()}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Hourly Rate</div>
                <div className="font-medium">Rs. {employee.hourlyRate?.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Overtime Rate</div>
                <div className="font-medium">Rs. {employee.overtimeRate?.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          {employee.bankDetails && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Landmark className="text-slate-400" size={20} />
                  <div>
                    <div className="text-sm text-slate-500">Bank Name</div>
                    <div className="font-medium">{employee.bankDetails.bankName}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Account Number</div>
                  <div className="font-medium">{employee.bankDetails.accountNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Branch</div>
                  <div className="font-medium">{employee.bankDetails.branch}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Account Type</div>
                  <div className="font-medium">{employee.bankDetails.accountType}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;