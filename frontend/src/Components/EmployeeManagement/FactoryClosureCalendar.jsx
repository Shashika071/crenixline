// components/FactoryClosureCalendar.jsx

import { AlertTriangle, Calendar as CalendarIcon, Factory, Sun, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { employeeAPI } from '../../services/api';

const FactoryClosureCalendar = ({ onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(false);    
  const [selectedDay, setSelectedDay] = useState(null);

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Fetch closures for the current month
  useEffect(() => {
    fetchClosuresForMonth();
  }, [currentMonth, currentYear]);

  const fetchClosuresForMonth = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      
      const response = await employeeAPI.getFactoryClosures({
        startDate,
        endDate
      });
      
      setClosures(response.data.data || []);
    } catch (error) {
      console.error('Error fetching factory closures:', error);
      alert('Error fetching factory closures: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if a day is Sunday (weekend closure)
  const isSunday = (date) => {
    return date.getDay() === 0; // 0 = Sunday
  };
  
  const formatDate = (d) => d.toLocaleDateString('en-CA'); 
  
  // Get closure type for a day - UPDATED for holiday vs factory closure
  const getClosureType = (date) => {
    const dateString = formatDate(date);

    const apiClosures = closures.filter(
      (closure) => formatDate(new Date(closure.date)) === dateString
    );

    if (apiClosures.length > 0) {
      // NEW: Distinguish between holiday and factory closure
      const holidayClosures = apiClosures.filter(closure => !closure.isActualClosure);
      const factoryClosures = apiClosures.filter(closure => closure.isActualClosure);
      
      if (holidayClosures.length > 0) {
        return {
          type: 'holiday',
          closures: holidayClosures,
          label: 'Holiday (Work with Double Pay)',
          allowWork: true
        };
      } else if (factoryClosures.length > 0) {
        return {
          type: 'factory_closure',
          closures: factoryClosures,
          label: 'Factory Closure (No Work)',
          allowWork: false
        };
      }
    } else if (isSunday(date)) {
      return {
        type: 'sunday',
        closures: [],
        label: 'Sunday (Work with Double Pay)',
        allowWork: true
      };
    } else {
      return {
        type: 'open',
        closures: [],
        label: 'Open Day',
        allowWork: true
      };
    }
  };

  // Get days in month
  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get day of week for first day (0 = Sunday, 6 = Saturday)
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const closureInfo = getClosureType(date);
      
      days.push({
        date: i,
        fullDate: date,
        dateString: date.toISOString().split('T')[0],
        ...closureInfo,
        isToday: date.toDateString() === new Date().toDateString(),
        isSunday: isSunday(date)
      });
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth();

  // Get background color based on closure type - UPDATED
  const getDayBackgroundColor = (day) => {
    if (!day) return 'bg-gray-50';
    
    switch (day.type) {
      case 'factory_closure':
        return 'bg-red-100 border-red-300';
      case 'holiday':
        return 'bg-purple-100 border-purple-300'; // NEW: Purple for holidays
      case 'sunday':
        return 'bg-orange-100 border-orange-300';
      default:
        return day.isToday ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200';
    }
  };

  // Get text color based on closure type - UPDATED
  const getDayTextColor = (day) => {
    if (!day) return 'text-gray-400';
    
    switch (day.type) {
      case 'factory_closure':
        return 'text-red-800';
      case 'holiday':
        return 'text-purple-800'; // NEW: Purple for holidays
      case 'sunday':
        return 'text-orange-800';
      default:
        return day.isToday ? 'text-blue-800' : 'text-gray-900';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Factory className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold">Factory Working Days Calendar</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex justify-between items-center p-3 bg-gray-50 flex-shrink-0">
          <button
            onClick={goToPreviousMonth}
            className="px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            ← Previous
          </button>
          <h3 className="text-lg font-semibold">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={goToNextMonth}
            className="px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Next →
          </button>
        </div>

        {/* Calendar Content - Scrollable area */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="text-gray-500">Loading closures...</div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day, index) => (
                  <div 
                    key={day} 
                    className={`text-center font-medium py-2 text-xs sm:text-sm ${
                      index === 0 ? 'text-red-600 bg-red-50 rounded' : 'text-gray-600'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days - Reduced min-height and padding */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[70px] border rounded p-1.5 cursor-pointer transition-all hover:scale-105 ${
                      getDayBackgroundColor(day)
                    } ${!day ? 'bg-gray-50' : ''}`}
                    onClick={() => day && setSelectedDay(day)}
                  >
                    {day && (
                      <>
                        <div className={`text-xs font-medium ${getDayTextColor(day)}`}>
                          {day.date}
                        </div>
                        
                        {/* Closure indicators - Smaller and more compact */}
                        <div className="mt-0.5 space-y-0.5">
                          {day.type === 'factory_closure' && (
                            <div className="text-[10px] bg-red-200 text-red-800 rounded px-1 py-0.5 truncate leading-tight">
                              <Factory size={8} className="inline mr-0.5" />
                              Closed
                              {day.closures.length > 1 && ` +${day.closures.length - 1}`}
                            </div>
                          )}
                          
                          {/* NEW: Holiday indicator */}
                          {day.type === 'holiday' && (
                            <div className="text-[10px] bg-purple-200 text-purple-800 rounded px-1 py-0.5 truncate leading-tight">
                              <AlertTriangle size={8} className="inline mr-0.5" />
                              Holiday
                              {day.closures.length > 1 && ` +${day.closures.length - 1}`}
                            </div>
                          )}
                          
                          {day.type === 'sunday' && (
                            <div className="text-[10px] bg-orange-200 text-orange-800 rounded px-1 py-0.5 truncate leading-tight">
                              <Sun size={8} className="inline mr-0.5" />
                              Sunday
                            </div>
                          )}
                          
                          {day.type === 'open' && day.isToday && (
                            <div className="text-[10px] bg-blue-200 text-blue-800 rounded px-1 py-0.5 leading-tight">
                              Today
                            </div>
                          )}
                          
                          {day.type === 'open' && !day.isToday && (
                            <div className="text-[10px] bg-green-200 text-green-800 rounded px-1 py-0.5 leading-tight">
                              Open
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend - Updated with holiday */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
                  <span>Open Day</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-purple-200 border border-purple-300 rounded"></div>
                  <span>Holiday (Work with Double Pay)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-200 border border-orange-300 rounded"></div>
                  <span>Sunday (Work with Double Pay)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
                  <span>Factory Closure (No Work)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-200 border border-blue-300 rounded"></div>
                  <span>Today</span>
                </div>
              </div>

              {/* Statistics - Updated with holiday count */}
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                <div className="text-center p-1.5 bg-green-50 rounded">
                  <div className="font-semibold text-green-800">
                    {days.filter(day => day && day.type === 'open').length}
                  </div>
                  <div className="text-green-600">Open Days</div>
                </div>
                <div className="text-center p-1.5 bg-purple-50 rounded">
                  <div className="font-semibold text-purple-800">
                    {days.filter(day => day && day.type === 'holiday').length}
                  </div>
                  <div className="text-purple-600">Holidays</div>
                </div>
                <div className="text-center p-1.5 bg-orange-50 rounded">
                  <div className="font-semibold text-orange-800">
                    {days.filter(day => day && day.type === 'sunday').length}
                  </div>
                  <div className="text-orange-600">Sundays</div>
                </div>
                <div className="text-center p-1.5 bg-red-50 rounded">
                  <div className="font-semibold text-red-800">
                    {days.filter(day => day && day.type === 'factory_closure').length}
                  </div>
                  <div className="text-red-600">Factory Closures</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Day Details Modal */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg p-4 max-w-md w-full mx-auto max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Day Details</h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold text-gray-900">{selectedDay.date}</div>
                  <div className="text-sm text-gray-600">
                    {selectedDay.fullDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                <div className={`p-2 rounded-lg text-sm ${
                  selectedDay.type === 'open' ? 'bg-green-100 text-green-800' :
                  selectedDay.type === 'holiday' ? 'bg-purple-100 text-purple-800' :
                  selectedDay.type === 'sunday' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <div className="font-semibold flex items-center">
                    {selectedDay.type === 'sunday' && <Sun size={14} className="mr-1" />}
                    {selectedDay.type === 'holiday' && <AlertTriangle size={14} className="mr-1" />}
                    {selectedDay.type === 'factory_closure' && <Factory size={14} className="mr-1" />}
                    Status: {selectedDay.label}
                  </div>
                </div>

                {/* Work Allowed Info */}
                {(selectedDay.type === 'holiday' || selectedDay.type === 'sunday') && (
                  <div className="bg-yellow-50 border border-yellow-200 p-2 rounded-lg text-sm">
                    <div className="font-semibold text-yellow-800">⚠️ Work Information:</div>
                    <p className="text-yellow-700 mt-1">
                      Factory is open for work with <strong>double pay</strong>. 
                      This day does not count toward regular working days.
                    </p>
                  </div>
                )}

                {selectedDay.type === 'factory_closure' && (
                  <div className="bg-red-50 border border-red-200 p-2 rounded-lg text-sm">
                    <div className="font-semibold text-red-800">🚫 Work Information:</div>
                    <p className="text-red-700 mt-1">
                      Factory is <strong>closed</strong>. No work allowed.
                    </p>
                  </div>
                )}

                {(selectedDay.type === 'factory_closure' || selectedDay.type === 'holiday') && selectedDay.closures.length > 0 && (
                  <div className="border-t pt-2">
                    <h4 className="font-semibold mb-1 text-sm">Closure Details:</h4>
                    {selectedDay.closures.map((closure, index) => (
                      <div key={index} className={`mb-2 p-2 rounded text-xs ${
                        closure.isActualClosure ? 'bg-red-50' : 'bg-purple-50'
                      }`}>
                        <div><strong>Reason:</strong> {closure.reason}</div>
                        {closure.description && (
                          <div className="mt-1"><strong>Description:</strong> {closure.description}</div>
                        )}
                        <div className="mt-1"><strong>Type:</strong> {closure.isActualClosure ? 'Factory Closure (No Work)' : 'Holiday (Work with Double Pay)'}</div>
                        <div className="mt-1"><strong>Scope:</strong> {closure.isForAllEmployees ? 'All Employees' : 'Selected Employees'}</div>
                        <div className="mt-1"><strong>Status:</strong> {closure.status}</div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDay.type === 'sunday' && (
                  <div className="bg-orange-50 p-2 rounded-lg text-sm">
                    <p className="text-orange-800">
                      <Sun className="inline mr-1" size={14} />
                      Regular Sunday. Work allowed with double pay.
                    </p>
                  </div>
                )}

                {selectedDay.type === 'open' && (
                  <div className="bg-green-50 p-2 rounded-lg text-sm">
                    <p className="text-green-800">
                      Factory is open for regular operations with normal pay rates.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedDay(null)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactoryClosureCalendar;