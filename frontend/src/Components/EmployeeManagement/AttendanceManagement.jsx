import { AlertTriangle, Calendar, CheckCircle, CheckSquare, Clock, Download, Eye, Filter, Search, User, Users, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { employeeAPI } from '../../services/api';

const AttendanceManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeeAttendance, setEmployeeAttendance] = useState([]);
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [filters, setFilters] = useState({
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      searchTerm: '',
      status: 'all'
    });

    // Bulk attendance states
    const [bulkMode, setBulkMode] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [bulkAttendanceData, setBulkAttendanceData] = useState({
        date: new Date().toISOString().split('T')[0],
        status: 'Present',
        checkIn: '08:00',
        checkOut: '17:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        notes: ''
    });
    const [bulkLoading, setBulkLoading] = useState(false);

    // Status options with Casual Leave
    const statusOptions = [
        { value: 'Present', label: 'Present', color: 'green' },
        { value: 'Half Day', label: 'Half Day', color: 'orange' },
        { value: 'Leave', label: 'Annual Leave', color: 'blue' },
        { value: 'Medical Leave', label: 'Medical Leave', color: 'purple' },
        { value: 'Casual Leave', label: 'Casual Leave', color: 'teal' },
        { value: 'Absent', label: 'Absent', color: 'red' },
        { value: 'Factory Closure', label: 'Factory Closure', color: 'indigo' }
    ];

    useEffect(() => {
      fetchEmployees();
    }, []);

    const handleBulkStatusChange = (newStatus) => {
        setBulkAttendanceData(prev => ({
            ...prev,
            status: newStatus,
            // Set default times for Present and Half Day statuses
            checkIn: (newStatus === 'Present' || newStatus === 'Half Day') ? '08:00' : '',
            checkOut: (newStatus === 'Present' || newStatus === 'Half Day') ? '17:00' : '',
            // Only set break times for Present status
            breakStart: newStatus === 'Present' ? '12:00' : '',
            breakEnd: newStatus === 'Present' ? '13:00' : '',
        }));
    };

    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await employeeAPI.getAll();
        setEmployees(response.data.data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchEmployeeAttendance = async (employee) => {
      try {
        setAttendanceLoading(true);
        setSelectedEmployee(employee);
        
        const response = await employeeAPI.getAttendance({
          employeeId: employee._id,
          startDate: filters.startDate,
          endDate: filters.endDate
        });
        
        setEmployeeAttendance(response.data.data);
      } catch (error) {
        console.error('Error fetching employee attendance:', error);
        setEmployeeAttendance([]);
      } finally {
        setAttendanceLoading(false);
      }
    };

    // Enhanced export function with multiple tabs
    const exportAttendanceReport = async () => {
      try {
        const response = await employeeAPI.exportAttendance({
          startDate: filters.startDate,
          endDate: filters.endDate,
          format: 'excel'
        });

        // Create a more organized Excel file with multiple tabs
        await exportAttendanceWithMultipleTabs();
        
      } catch (error) {
        console.error('Error exporting attendance:', error);
        alert('Error exporting attendance report');
      }
    };

    // New function to export with multiple tabs
    const exportAttendanceWithMultipleTabs = async () => {
      try {
        // Get attendance data for all employees
        const attendanceResponse = await employeeAPI.getAttendance({
          startDate: filters.startDate,
          endDate: filters.endDate
        });
        
        const attendanceData = attendanceResponse.data.data;
        
        // Group attendance by employee
        const attendanceByEmployee = {};
        attendanceData.forEach(record => {
          if (!attendanceByEmployee[record.employeeId]) {
            attendanceByEmployee[record.employeeId] = {
              employeeName: record.employeeName,
              employeeRole: record.employeeRole,
              records: []
            };
          }
          attendanceByEmployee[record.employeeId].records.push(record);
        });

        // Create workbook
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        // Summary sheet
        const summaryData = Object.values(attendanceByEmployee).map(emp => {
          const records = emp.records;
          const present = records.filter(r => r.status === 'Present').length;
          const absent = records.filter(r => r.status === 'Absent').length;
          const leave = records.filter(r => r.status === 'Leave').length;
          const medical = records.filter(r => r.status === 'Medical Leave').length;
          const casual = records.filter(r => r.status === 'Casual Leave').length;
          const halfDay = records.filter(r => r.status === 'Half Day').length;
          const factoryClosure = records.filter(r => r.status === 'Factory Closure').length;
          
          return {
            'Employee Name': emp.employeeName,
            'Role': emp.employeeRole,
            'Total Records': records.length,
            'Present': present,
            'Absent': absent,
            'Annual Leave': leave,
            'Medical Leave': medical,
            'Casual Leave': casual,
            'Half Day': halfDay,
            'Factory Closure': factoryClosure,
            'Attendance Rate': `${((present + halfDay * 0.5) / records.length * 100).toFixed(1)}%`
          };
        });

        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

        // Individual employee sheets
        Object.values(attendanceByEmployee).forEach(emp => {
          const employeeData = emp.records.map(record => ({
            'Date': new Date(record.date).toLocaleDateString('en-CA'),
            'Day': new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' }),
            'Check In': record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A',
            'Check Out': record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A',
            'Status': record.status,
            'Total Hours': record.totalHours || 0,
            'Overtime Hours': record.overtimeHours || 0,
            'Half Day': record.isHalfDay ? 'Yes' : 'No',
            'Medical Leave': record.isMedical ? 'Yes' : 'No',
            'Casual Leave': record.isCasual ? 'Yes' : 'No',
            'Factory Closure': record.isFactoryClosure ? 'Yes' : 'No',
            'Paid Leave': record.isPaidLeave ? 'Yes' : 'No',
            'Notes': record.notes || ''
          }));

          // Clean sheet name (Excel has 31-character limit)
          const sheetName = emp.employeeName.substring(0, 31).replace(/[\\/*[\]:?]/g, '');
          const ws = XLSX.utils.json_to_sheet(employeeData);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        // Calendar view sheet
        const calendarData = createCalendarView(attendanceData);
        const calendarWs = XLSX.utils.json_to_sheet(calendarData);
        XLSX.utils.book_append_sheet(wb, calendarWs, "Calendar View");

        // Generate and download file
        const fileName = `attendance_report_${filters.startDate}_to_${filters.endDate}.xlsx`;
        XLSX.writeFile(wb, fileName);

      } catch (error) {
        console.error('Error creating multi-tab export:', error);
        alert('Error creating detailed report');
      }
    };

    // Helper function for calendar view
    const createCalendarView = (attendanceData) => {
      const uniqueDates = [...new Set(attendanceData.map(r => new Date(r.date).toISOString().split('T')[0]))].sort();
      
      const calendarData = employees.map(employee => {
        const row = { 'Employee Name': employee.name, 'Role': employee.role };
        
        uniqueDates.forEach(date => {
          const record = attendanceData.find(r => 
            r.employeeId === employee._id && 
            new Date(r.date).toISOString().split('T')[0] === date
          );
          
          row[new Date(date).toLocaleDateString('en-CA')] = record ? record.status : 'No Record';
        });
        
        return row;
      });
      
      return calendarData;
    };

    // Bulk attendance functions
    const toggleEmployeeSelection = (employeeId) => {
      setSelectedEmployees(prev => {
        if (prev.includes(employeeId)) {
          return prev.filter(id => id !== employeeId);
        } else {
          return [...prev, employeeId];
        }
      });
    };

    const selectAllEmployees = () => {
      if (selectedEmployees.length === filteredEmployees.length) {
        setSelectedEmployees([]);
      } else {
        setSelectedEmployees(filteredEmployees.map(emp => emp._id));
      }
    };

    // Complete bulk attendance implementation with Casual Leave - FIXED VERSION
    const markBulkAttendance = async () => {
        if (selectedEmployees.length === 0) {
            alert('Please select at least one employee');
            return;
        }

        try {
            setBulkLoading(true);
            
            // Prepare attendance data for each selected employee
            const attendancePromises = selectedEmployees.map(async (employeeId) => {
                const employee = employees.find(emp => emp._id === employeeId);
                if (!employee) {
                    return { employeeId, success: false, error: 'Employee not found' };
                }

                try {
                    // Create clean attendance data object
                    const attendanceData = {
                        employeeId,
                        date: bulkAttendanceData.date,
                        status: bulkAttendanceData.status,
                        notes: bulkAttendanceData.notes || '',
                        isHalfDay: bulkAttendanceData.status === 'Half Day',
                        isMedical: bulkAttendanceData.status === 'Medical Leave',
                        isCasual: bulkAttendanceData.status === 'Casual Leave'
                    };

                    // FIXED: Properly set leaveType based on status
                    if (bulkAttendanceData.status === 'Medical Leave') {
                        attendanceData.leaveType = 'medical';
                    } else if (bulkAttendanceData.status === 'Casual Leave') {
                        attendanceData.leaveType = 'casual';
                    } else if (bulkAttendanceData.status === 'Leave') {
                        attendanceData.leaveType = 'annual';
                    } else if (bulkAttendanceData.status === 'Half Day') {
                        attendanceData.leaveType = 'annual'; // Half day uses annual leave
                    }
                    // For other statuses, don't include leaveType (will use schema default)

                    // FIXED: Calculate leaveDaysDeducted
                    if (bulkAttendanceData.status === 'Half Day') {
                        attendanceData.leaveDaysDeducted = 0.5;
                    } else if (bulkAttendanceData.status === 'Leave' || 
                              bulkAttendanceData.status === 'Medical Leave' || 
                              bulkAttendanceData.status === 'Casual Leave') {
                        attendanceData.leaveDaysDeducted = 1;
                    } else {
                        attendanceData.leaveDaysDeducted = 0;
                    }

                    // FIXED: Add factory closure flag
                    attendanceData.isFactoryClosure = bulkAttendanceData.status === 'Factory Closure';

                    // Include time fields for both Present and Half Day statuses
                    if (bulkAttendanceData.status === 'Present' || bulkAttendanceData.status === 'Half Day') {
                        attendanceData.checkIn = bulkAttendanceData.checkIn ? 
                            `${bulkAttendanceData.date}T${bulkAttendanceData.checkIn}:00` : null;
                        attendanceData.checkOut = bulkAttendanceData.checkOut ? 
                            `${bulkAttendanceData.date}T${bulkAttendanceData.checkOut}:00` : null;
                        
                        // Only include break times for Present status, NOT for Half Day
                        if (bulkAttendanceData.status === 'Present') {
                            attendanceData.breakStart = bulkAttendanceData.breakStart ? 
                                `${bulkAttendanceData.date}T${bulkAttendanceData.breakStart}:00` : null;
                            attendanceData.breakEnd = bulkAttendanceData.breakEnd ? 
                                `${bulkAttendanceData.date}T${bulkAttendanceData.breakEnd}:00` : null;
                        } else {
                            // For Half Day, explicitly set break times to null
                            attendanceData.breakStart = null;
                            attendanceData.breakEnd = null;
                        }
                    } else {
                        // For non-present statuses, explicitly set all time fields to null
                        attendanceData.checkIn = null;
                        attendanceData.checkOut = null;
                        attendanceData.breakStart = null;
                        attendanceData.breakEnd = null;
                    }

                    console.log('Bulk attendance data being sent:', attendanceData);

                    const response = await employeeAPI.markAttendance(attendanceData);
                    return { 
                        employeeId, 
                        success: true, 
                        data: response.data,
                        employeeName: employee.name,
                        totalHours: response.data.data?.totalHours || 0,
                        leaveBalance: response.data.leaveBalance
                    };
                } catch (error) {
                    console.error(`Error marking attendance for ${employee.name}:`, error);
                    return { 
                        employeeId, 
                        success: false, 
                        error: error.response?.data?.message || error.message || 'Unknown error',
                        employeeName: employee.name 
                    };
                }
            });

            // Execute all promises
            const results = await Promise.all(attendancePromises);
            
            // Analyze results
            const successful = results.filter(r => r.success);
            const failed = results.filter(r => !r.success);
            
            // Show detailed results with hour information
            let resultMessage = `Bulk Attendance Completed!\n\n` +
                `✅ Successful: ${successful.length} employees\n` +
                `❌ Failed: ${failed.length} employees\n\n`;
            
            // Add details for successful records
            if (successful.length > 0) {
                resultMessage += `Successful Employees:\n`;
                successful.forEach(result => {
                    const hours = result.totalHours || result.data?.data?.totalHours || 0;
                    resultMessage += `• ${result.employeeName}: ${hours} hours\n`;
                    
                    // Show leave balance updates if available
                    if (result.leaveBalance) {
                        resultMessage += `  Leave Balance - Annual: ${result.leaveBalance.annual}, Medical: ${result.leaveBalance.medical}, Casual: ${result.leaveBalance.casual}\n`;
                    }
                });
            }

            if (failed.length > 0) {
                resultMessage += `\nFailed Employees:\n`;
                failed.forEach(result => {
                    resultMessage += `• ${result.employeeName}: ${result.error}\n`;
                });
            }

            alert(resultMessage);

            // Reset and refresh
            setSelectedEmployees([]);
            setBulkMode(false);
            await fetchEmployees(); // Refresh data

        } catch (error) {
            console.error('Error in bulk attendance:', error);
            alert('Error marking bulk attendance: ' + (error.message || 'Unknown error'));
        } finally {
            setBulkLoading(false);
        }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'Active': return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'On Leave': return <Clock className="w-4 h-4 text-yellow-500" />;
        case 'Inactive': return <XCircle className="w-4 h-4 text-red-500" />;
        default: return <User className="w-4 h-4 text-slate-500" />;
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'Active': return 'bg-green-100 text-green-800';
        case 'On Leave': return 'bg-yellow-100 text-yellow-800';
        case 'Inactive': return 'bg-red-100 text-red-800';
        default: return 'bg-slate-100 text-slate-800';
      }
    };

    const getAttendanceStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-800';
            case 'Half Day': return 'bg-orange-100 text-orange-800';
            case 'Medical Leave': return 'bg-blue-100 text-blue-800';
            case 'Casual Leave': return 'bg-teal-100 text-teal-800';
            case 'Leave': return 'bg-yellow-100 text-yellow-800';
            case 'Factory Closure': return 'bg-purple-100 text-purple-800';
            case 'Absent': return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const filteredEmployees = employees.filter(employee => {
      const matchesSearch = employee.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                          employee.role.toLowerCase().includes(filters.searchTerm.toLowerCase());
      const matchesStatus = filters.status === 'all' || employee.status === filters.status;
      return matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-6">
        {/* Bulk Attendance Modal */}
        {bulkMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Mark Bulk Attendance</h3>
                    <p className="text-slate-600">Mark attendance for multiple employees at once</p>
                  </div>
                  <button
                    onClick={() => {
                      setBulkMode(false);
                      setSelectedEmployees([]);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Attendance Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={bulkAttendanceData.date}
                      onChange={(e) => setBulkAttendanceData({...bulkAttendanceData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                    <select
                        value={bulkAttendanceData.status}
                        onChange={(e) => handleBulkStatusChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Leave">Annual Leave</option>
                        <option value="Medical Leave">Medical Leave</option>
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Factory Closure">Factory Closure</option>
                    </select>
                  </div>
                {/* Update this section in the bulk modal JSX */}
                {(bulkAttendanceData.status === 'Present' || bulkAttendanceData.status === 'Half Day') && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Check In</label>
                        <input
                        type="time"
                        value={bulkAttendanceData.checkIn}
                        onChange={(e) => setBulkAttendanceData({...bulkAttendanceData, checkIn: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Check Out</label>
                        <input
                        type="time"
                        value={bulkAttendanceData.checkOut}
                        onChange={(e) => setBulkAttendanceData({...bulkAttendanceData, checkOut: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    </div>

                    {/* Only show break times for Present status, not for Half Day */}
                    {bulkAttendanceData.status === 'Present' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Break Start</label>
                        <input
                            type="time"
                            value={bulkAttendanceData.breakStart || '12:00'}
                            onChange={(e) => setBulkAttendanceData({...bulkAttendanceData, breakStart: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Break End</label>
                        <input
                            type="time"
                            value={bulkAttendanceData.breakEnd || '13:00'}
                            onChange={(e) => setBulkAttendanceData({...bulkAttendanceData, breakEnd: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                        </div>
                    </div>
                    )}
                </>
                )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={bulkAttendanceData.notes}
                    onChange={(e) => setBulkAttendanceData({...bulkAttendanceData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    rows="3"
                    placeholder="Add notes for all attendance records..."
                  />
                </div>

                {/* Employee Selection */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-sm font-medium">
                        Selected Employees: {selectedEmployees.length} of {filteredEmployees.length}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={selectAllEmployees}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 border border-blue-300 rounded"
                      >
                        {selectedEmployees.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <button
                        onClick={() => setSelectedEmployees([])}
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 border border-red-300 rounded"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-3 py-2 text-left w-8">
                            <input
                              type="checkbox"
                              checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                              onChange={selectAllEmployees}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-3 py-2 text-left">Employee</th>
                          <th className="px-3 py-2 text-left">Role</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredEmployees.map(employee => (
                          <tr key={employee._id} className="hover:bg-slate-100">
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={selectedEmployees.includes(employee._id)}
                                onChange={() => toggleEmployeeSelection(employee._id)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-3 py-2 font-medium">{employee.name}</td>
                            <td className="px-3 py-2 text-slate-600">{employee.role}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(employee.status)}`}>
                                {getStatusIcon(employee.status)}
                                <span className="ml-1">{employee.status}</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-between items-center">
                <div className="text-sm text-slate-600">
                  {selectedEmployees.length} employees selected for {bulkAttendanceData.status} on {bulkAttendanceData.date}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setBulkMode(false);
                      setSelectedEmployees([]);
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={markBulkAttendance}
                    disabled={bulkLoading || selectedEmployees.length === 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {bulkLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare size={16} />
                        <span>Mark Attendance ({selectedEmployees.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filters Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
            
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                {/* Start Date */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                </div>

                {/* End Date */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                </div>

                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
                    <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={filters.searchTerm}
                        onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
                    />
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                    </select>
                </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4 lg:mt-0">
                <button
                onClick={exportAttendanceWithMultipleTabs}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                <Download size={16} />
                <span>Export Report</span>
                </button>

                <button
                onClick={() => setBulkMode(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                <Users size={16} />
                <span>Bulk Attendance</span>
                </button>
            </div>

            </div>
        </div>


        {/* Employees Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Employees Attendance Summary</h3>
            <span className="text-sm text-slate-600">
              Showing {filteredEmployees.length} employees
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role & Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Employment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Join Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-slate-900">{employee.name}</div>
                          <div className="text-sm text-slate-500">NIC: {employee.nic}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{employee.role}</div>
                      <div className="text-sm text-slate-500">{employee.contactNo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{employee.employmentStatus}</div>
                      <div className="text-sm text-slate-500">
                        {new Date() < new Date(employee.probationEndDate) ? 'Probation' : 'Confirmed'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                        {getStatusIcon(employee.status)}
                        <span className="ml-1">{employee.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(employee.joinDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => fetchEmployeeAttendance(employee)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Eye size={16} className="mr-2" />
                        View Attendance
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">Loading employees...</p>
            </div>
          )}

          {!loading && filteredEmployees.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No employees found</h3>
              <p className="text-slate-600">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        {/* Employee Attendance Modal */}
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold">Attendance History - {selectedEmployee.name}</h3>
                    <p className="text-slate-600">
                      {selectedEmployee.role} • {selectedEmployee.employmentStatus}
                    </p>
                    <p className="text-sm text-slate-500">
                      Period: {new Date(filters.startDate).toLocaleDateString()} to {new Date(filters.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEmployee(null);
                      setEmployeeAttendance([]);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                {attendanceLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-2">Loading attendance data...</p>
                  </div>
                ) : (
                  <>
                    {/* Attendance Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{employeeAttendance.length}</div>
                        <div className="text-sm text-blue-700">Total Records</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {employeeAttendance.filter(a => a.status === 'Present').length}
                        </div>
                        <div className="text-sm text-green-700">Present</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {employeeAttendance.filter(a => a.status === 'Half Day').length}
                        </div>
                        <div className="text-sm text-orange-700">Half Day</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {employeeAttendance.filter(a => a.status === 'Medical Leave').length}
                        </div>
                        <div className="text-sm text-purple-700">Medical</div>
                      </div>
                      <div className="bg-teal-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-teal-600">
                          {employeeAttendance.filter(a => a.status === 'Casual Leave').length}
                        </div>
                        <div className="text-sm text-teal-700">Casual</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {employeeAttendance.filter(a => a.status === 'Leave').length}
                        </div>
                        <div className="text-sm text-yellow-700">Annual Leave</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {employeeAttendance.filter(a => a.status === 'Absent').length}
                        </div>
                        <div className="text-sm text-red-700">Absent</div>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-indigo-600">
                          {employeeAttendance.filter(a => a.status === 'Factory Closure').length}
                        </div>
                        <div className="text-sm text-indigo-700">Closure</div>
                      </div>
                    </div>

                    {/* Attendance Details Table */}
                    {employeeAttendance.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Day</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Check In</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Check Out</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Hours</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Overtime</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {employeeAttendance.map((record) => (
                              <tr key={record._id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm">
                                  {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-500">
                                  {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">
                                  {record.totalHours || 0}h
                                </td>
                                <td className="px-4 py-3 text-sm text-green-600">
                                  {record.overtimeHours || 0}h
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getAttendanceStatusColor(record.status)}`}>
                                    {record.status}
                                    {record.isHalfDay && record.status !== 'Half Day' && ' (½)'}
                                    {record.isMedical && ' 💊'}
                                    {record.isCasual && ' 🕐'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                                  {record.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No attendance records found</h3>
                        <p className="text-slate-600">No attendance data for the selected period</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default AttendanceManagement;