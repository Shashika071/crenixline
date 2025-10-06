import { Building, Calendar, DollarSign, Heart, Landmark, MapPin, Percent, Phone, Shield, User, X } from 'lucide-react';

import { FILE_BASE_URL } from '../../services/api';
import React from 'react';

const EmployeeDetailsModal = ({ employee, onClose }) => {
  
  // Calculate employment duration
  const calculateEmploymentDuration = () => {
    const joinDate = new Date(employee.joinDate);
    const currentDate = new Date();
    
    let years = currentDate.getFullYear() - joinDate.getFullYear();
    let months = currentDate.getMonth() - joinDate.getMonth();
    
    // Adjust if current month is before join month
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // Adjust if current day is before join day in the same month
    if (months === 0 && currentDate.getDate() < joinDate.getDate()) {
      years--;
      months = 11;
    }
    
    return { years, months };
  };

  // Calculate pro-rated annual leave entitlement
  const calculateAnnualEntitlement = () => {
    if (!employee?.joinDate) return '14 days';
    
    const joinDate = new Date(employee.joinDate);
    const currentYear = new Date().getFullYear();
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth();
    
    // If not first year, full entitlement
    if (joinYear < currentYear) return '14 days';
    
    // First year: pro-rated based on joining month
    if (joinMonth <= 2) return '14 days'; // Jan-Mar
    else if (joinMonth <= 5) return '10 days'; // Apr-Jun
    else if (joinMonth <= 8) return '7 days'; // Jul-Sep
    else return '4 days'; // Oct-Dec
  };

  // Generate initials from name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const duration = calculateEmploymentDuration();
  const employmentDuration = `${duration.years} years ${duration.months} months`;
  const annualEntitlement = calculateAnnualEntitlement();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Employee Details</h2>
              <p className="text-slate-500 text-sm">{employee.role} • {employee.employmentStatus}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Profile Header */}
          <div className="flex items-center space-x-6 mb-6 pb-6 border-b">
            {employee.profileImage ? (
              <img 
                src={`${FILE_BASE_URL}${employee.profileImage}`}
                alt={employee.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                {getInitials(employee.name)}
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{employee.name}</h3>
              <p className="text-slate-600">{employee.role} • {employee.employmentStatus} • {employee.employeeId}</p>
              <p className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                employee.status === 'Active' 
                  ? 'bg-green-100 text-green-800' 
                  : employee.status === 'On Leave'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {employee.status}
              </p>
            </div>
          </div>

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

            {/* NEW: Gender Field */}
            <div className="flex items-center space-x-3">
              <User className="text-slate-400" size={20} />
              <div>
                <div className="text-sm text-slate-500">Gender</div>
                <div className="font-medium">{employee.gender || 'Not specified'}</div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {employee.emergencyContact && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Heart className="text-red-500 mr-2" size={20} />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-red-50 p-4 rounded-lg">
                <div>
                  <div className="text-sm text-slate-600">Name</div>
                  <div className="font-medium text-red-700">{employee.emergencyContact.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Relationship</div>
                  <div className="font-medium text-red-700 capitalize">{employee.emergencyContact.relationship}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600">Phone</div>
                  <div className="font-medium text-red-700">{employee.emergencyContact.phone}</div>
                </div>
              </div>
            </div>
          )}

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
                <div className="font-medium">{employmentDuration}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500">EPF Enrollment</div>
                <div className={`font-medium ${employee.hasEPF ? 'text-green-600' : 'text-red-600'}`}>
                  {employee.hasEPF ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          </div>

          {/* NEW: Leave Entitlements Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Leave Entitlements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg">
              <div>
                <div className="text-sm text-slate-600">Annual Leave</div>
                <div className="font-medium text-green-700">{annualEntitlement}</div>
                {annualEntitlement !== '14 days' && (
                  <div className="text-xs text-orange-600 mt-1">Pro-rated (first year)</div>
                )}
              </div>
              <div>
                <div className="text-sm text-slate-600">Medical Leave</div>
                <div className="font-medium text-green-700">7 days</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Casual Leave</div>
                <div className="font-medium text-green-700">7 days</div>
              </div>
              {employee.gender === 'Female' && (
                <div>
                  <div className="text-sm text-slate-600">Maternity Leave</div>
                  <div className="font-medium text-green-700">42-84 days</div>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              • All employees receive same leave entitlements • Half days deduct 0.5 from annual leave
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
                <div className="flex items-center space-x-3">
                  <Percent className="text-blue-400" size={18} />
                  <div>
                    <div className="text-sm text-slate-600">Employee Contribution</div>
                    <div className="font-medium text-blue-700">8%</div>
                  </div>
                </div>
                
                {/* Employer Contribution */}
                <div className="flex items-center space-x-3">
                  <Building className="text-blue-400" size={18} />
                  <div>
                    <div className="text-sm text-slate-600">ETF Contribution</div>
                    <div className="font-medium text-blue-700">3% (Company paid)</div>
                  </div>
                </div>
                
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="text-slate-400" size={20} />
                <div>
                  <div className="text-sm text-slate-500">Basic Salary</div>
                  <div className="font-medium">Rs. {employee.salary?.toLocaleString()}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">Calculation Basis</div>
                <div className="font-medium">26 working days/month</div>
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