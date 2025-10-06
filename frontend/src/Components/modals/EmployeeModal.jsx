import { Building, CreditCard, FileText, MapPin, Phone, Plus, Shield, Trash2, User, Users, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

const EmployeeModal = ({ employee, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    nic: employee?.nic || '',
    address: employee?.address || '',
    contactNo: employee?.contactNo || '',
    role: employee?.role || 'Tailor',
    salary: employee?.salary || '',
    status: employee?.status || 'Active',
    joinDate: employee?.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    employmentStatus: employee?.employmentStatus || 'Probation', // Keep 'Probation' as default
    
    // NEW: Gender field for maternity leave
    gender: employee?.gender || 'Male',
    
    // EPF Fields
    epfNumber: employee?.epfNumber || '',
    hasEPF: employee?.hasEPF !== undefined ? employee.hasEPF : true,
    
    // Bank Details
    bankDetails: {
      accountNumber: employee?.bankDetails?.accountNumber || '',
      bankName: employee?.bankDetails?.bankName || '',
      branch: employee?.bankDetails?.branch || '',
      accountType: employee?.bankDetails?.accountType || 'Savings',
      ifscCode: employee?.bankDetails?.ifscCode || ''
    },
    
    // Emergency Contact
    emergencyContact: {
      name: employee?.emergencyContact?.name || '',
      relationship: employee?.emergencyContact?.relationship || '',
      phone: employee?.emergencyContact?.phone || ''
    }
  });

  // State for profile image
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(employee?.profileImage || '');
  const fileInputRef = useRef(null);

  // State for custom roles management
  const [showCustomRoleInput, setShowCustomRoleInput] = useState(false);
  const [customRole, setCustomRole] = useState('');
  const [availableRoles, setAvailableRoles] = useState([
    'Tailor', 'Cutter', 'Supervisor', 'Quality Checker', 'Packer', 'Manager'
  ]);

  // Load custom roles from localStorage on component mount
  useEffect(() => {
    const savedCustomRoles = localStorage.getItem('employeeCustomRoles');
    if (savedCustomRoles) {
      try {
        const customRoles = JSON.parse(savedCustomRoles);
        setAvailableRoles(prev => {
          const combined = [...prev, ...customRoles];
          return [...new Set(combined)];
        });
      } catch (error) {
        console.error('Error loading custom roles:', error);
      }
    }
  }, []);

  // Save custom roles to localStorage whenever availableRoles changes
  useEffect(() => {
    const defaultRoles = ['Tailor', 'Cutter', 'Supervisor', 'Quality Checker', 'Packer', 'Manager'];
    const customRoles = availableRoles.filter(role => !defaultRoles.includes(role));
    
    if (customRoles.length > 0) {
      localStorage.setItem('employeeCustomRoles', JSON.stringify(customRoles));
    } else {
      localStorage.removeItem('employeeCustomRoles');
    }
  }, [availableRoles]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // If using a custom role that's not in availableRoles, add it
    if (showCustomRoleInput && customRole && !availableRoles.includes(customRole)) {
      setAvailableRoles(prev => [...prev, customRole]);
    }
    
    // Create FormData to handle file upload
    const submitData = new FormData();
    
    // Append all form data - FIXED: Proper FormData handling with correct boolean conversion
    Object.keys(formData).forEach(key => {
      if (key === 'bankDetails' || key === 'emergencyContact') {
        // For nested objects, append each field individually with proper naming
        const nestedObject = formData[key];
        Object.keys(nestedObject).forEach(nestedKey => {
          submitData.append(`${key}[${nestedKey}]`, nestedObject[nestedKey]);
        });
      } else if (key === 'hasEPF') {
        // FIX: Convert boolean to proper format for backend
        submitData.append(key, formData[key].toString());
      } else if (key === 'salary') {
        // Ensure salary is sent as number
        submitData.append(key, parseFloat(formData[key]) || 0);
      } else if (key === 'gender') {
        // Ensure gender is sent
        submitData.append(key, formData[key]);
      } else {
        submitData.append(key, formData[key]);
      }
    });
    
    // FIX: Append profile image if selected
    if (profileImage) {
      submitData.append('profileImage', profileImage);
      console.log('Profile image appended:', profileImage.name);
    }
    
    // Debug: Log FormData contents
    console.log('Submitting employee data:');
    for (let [key, value] of submitData.entries()) {
      console.log(`${key}:`, value, typeof value);
    }
    
    onSubmit(submitData);
  };

  const handleBankDetailChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value
      }
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    
    if (value === 'custom') {
      setShowCustomRoleInput(true);
      setCustomRole('');
      setFormData(prev => ({ ...prev, role: '' }));
    } else {
      setShowCustomRoleInput(false);
      setFormData(prev => ({ ...prev, role: value }));
    }
  };

  const handleCustomRoleChange = (e) => {
    const value = e.target.value;
    setCustomRole(value);
    setFormData(prev => ({ ...prev, role: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please select an image under 5MB.');
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG, or WebP).');
        return;
      }
      
      setProfileImage(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfileImagePreview(previewUrl);
      console.log('Image selected:', file.name, file.size, file.type);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfileImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addCustomRole = () => {
    if (customRole.trim() && !availableRoles.includes(customRole.trim())) {
      const newRole = customRole.trim();
      setAvailableRoles(prev => [...prev, newRole]);
      setFormData(prev => ({ ...prev, role: newRole }));
      setShowCustomRoleInput(false);
      setCustomRole('');
    }
  };

  const removeCustomRole = (roleToRemove) => {
    if (!['Tailor', 'Cutter', 'Supervisor', 'Quality Checker', 'Packer', 'Manager'].includes(roleToRemove)) {
      setAvailableRoles(prev => prev.filter(role => role !== roleToRemove));
      
      if (formData.role === roleToRemove) {
        setFormData(prev => ({ ...prev, role: 'Tailor' }));
      }
    }
  };

  const cancelCustomRole = () => {
    setShowCustomRoleInput(false);
    setCustomRole('');
    setFormData(prev => ({ ...prev, role: 'Tailor' }));
  };

  const SectionHeader = ({ icon, title }) => (
    <div className="flex items-center space-x-2 mb-4">
      {icon}
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-8" encType="multipart/form-data">
          {/* Personal Information */}
          <div>
            <SectionHeader icon={<User size={20} className="text-blue-600" />} title="Personal Information" />
            
            {/* Profile Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Profile Image</label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {profileImagePreview ? (
                    <div className="relative">
                      <img 
                        src={profileImagePreview} 
                        alt="Profile preview" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center border-2 border-dashed border-slate-300">
                      <User size={24} className="text-slate-400" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg, image/jpg, image/png, image/webp"
                    className="hidden"
                    id="profileImage"
                  />
                  <label
                    htmlFor="profileImage"
                    className="inline-block px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer transition-colors"
                  >
                    Choose Image
                  </label>
                  <p className="text-sm text-slate-500 mt-1">JPG, PNG or WebP</p>
                  {profileImage && (
                    <p className="text-sm text-green-600 mt-1">
                      Selected: {profileImage.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIC Number *</label>
                <input
                  type="text"
                  required
                  value={formData.nic}
                  onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* NEW: Gender Field */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.contactNo}
                  onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* FIXED: Employment Status - Keep 'Probation' as default and option */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employment Status</label>
                <select
                  value={formData.employmentStatus}
                  onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Probation">Probation</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Contract">Contract</option>
                  <option value="Permanent">Permanent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Join Date *</label>
                <input
                  type="date"
                  required
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* EPF Information */}
          <div>
            <SectionHeader icon={<Shield size={20} className="text-orange-600" />} title="EPF Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.hasEPF}
                    onChange={(e) => {
                      console.log('EPF checkbox changed:', e.target.checked);
                      setFormData({ ...formData, hasEPF: e.target.checked });
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Enable EPF Deduction</span>
                </label>
                <p className="text-sm text-slate-500 mt-1 ml-6">
                  {formData.hasEPF ? '8% EPF deduction will be applied to basic salary' : 'No EPF deduction will be applied'}
                </p>
              </div>
              
              {formData.hasEPF && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">EPF Number</label>
                  <input
                    type="text"
                    value={formData.epfNumber}
                    onChange={(e) => setFormData({ ...formData, epfNumber: e.target.value })}
                    placeholder="Enter EPF number (optional)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-slate-500 mt-1">EPF number is optional but recommended for record keeping</p>
                </div>
              )}
            </div>
          </div>
 
          <div>
            <SectionHeader icon={<Building size={20} className="text-green-600" />} title="Employment Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role Field with Custom Input */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
                
                {!showCustomRoleInput ? (
                  <div className="flex space-x-2">
                    <select
                      value={formData.role}
                      onChange={handleRoleChange}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a role</option>
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                      <option value="custom">+ Add Custom Role</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={customRole}
                        onChange={handleCustomRoleChange}
                        placeholder="Enter custom role name"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={addCustomRole}
                        disabled={!customRole.trim()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center space-x-1 transition-colors"
                      >
                        <Plus size={16} />
                        <span>Add</span>
                      </button>
                      <button
                        type="button"
                        onClick={cancelCustomRole}
                        className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-sm text-slate-500">This role will be saved for future use</p>
                  </div>
                )}
                
                {/* Custom Roles Management */}
                {availableRoles.filter(role => !['Tailor', 'Cutter', 'Supervisor', 'Quality Checker', 'Packer', 'Manager'].includes(role)).length > 0 && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Custom Roles:</label>
                    <div className="flex flex-wrap gap-2">
                      {availableRoles
                        .filter(role => !['Tailor', 'Cutter', 'Supervisor', 'Quality Checker', 'Packer', 'Manager'].includes(role))
                        .map((role) => (
                          <div key={role} className="flex items-center bg-slate-100 px-3 py-1 rounded-full">
                            <span className="text-sm">{role}</span>
                            <button
                              type="button"
                              onClick={() => removeCustomRole(role)}
                              className="ml-2 text-slate-500 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Basic Salary (Rs.) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-slate-500 mt-1">
                  Salary will be calculated based on 26 working days per month
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <SectionHeader icon={<CreditCard size={20} className="text-purple-600" />} title="Bank Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  required
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) => handleBankDetailChange('accountNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  value={formData.bankDetails.bankName}
                  onChange={(e) => handleBankDetailChange('bankName', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Branch *</label>
                <input
                  type="text"
                  required
                  value={formData.bankDetails.branch}
                  onChange={(e) => handleBankDetailChange('branch', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                <select
                  value={formData.bankDetails.accountType}
                  onChange={(e) => handleBankDetailChange('accountType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Savings">Savings</option>
                  <option value="Current">Current</option>
                  <option value="Salary">Salary</option>
                </select>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <SectionHeader icon={<Users size={20} className="text-red-600" />} title="Emergency Contact" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                <input
                  type="text"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              {employee ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;