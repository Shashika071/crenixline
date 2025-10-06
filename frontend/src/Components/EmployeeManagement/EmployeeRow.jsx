import { CheckCircle, DollarSign, Download, Edit, Eye, FileText, RefreshCw, Trash2, UserCheck, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { FILE_BASE_URL } from '../../services/api';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { employeeAPI } from '../../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const EmployeeRow = ({ 
  employee, 
  onEdit, 
  onDelete, 
  onMarkAttendance, 
  onViewLeaveBalances,
  onViewDetails  
}) => {
  const [rates, setRates] = useState({
    hourlyRate: 0,
    overtimeRate: 0,
    isLoading: false
  });

  const isInProbation = new Date() < new Date(employee.probationEndDate);

  // Use the actual rates from API response
  useEffect(() => {
    if (employee) {
      setRates({
        hourlyRate: employee.hourlyRate || 0,
        overtimeRate: employee.overtimeRate || 0,
        isLoading: false
      });
    }
  }, [employee]);

  // Function to refresh rates if needed
  const refreshRates = async () => {
    try {
      setRates(prev => ({ ...prev, isLoading: true }));
      
      // Fetch updated employee data
      const response = await employeeAPI.getById(employee._id);
      if (response.data.success) {
        const updatedEmployee = response.data.data;
        setRates({
          hourlyRate: updatedEmployee.hourlyRate || 0,
          overtimeRate: updatedEmployee.overtimeRate || 0,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error refreshing rates:', error);
      setRates(prev => ({ ...prev, isLoading: false }));
    }
  };

  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Generate QR Code with employee ID
  const generateQRCode = async (employeeId) => {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(employeeId, {
        width: 80,
        height: 80,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  // Generate barcode as base64 image
  const generateBarcodeImage = (employeeId) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      
      try {
        JsBarcode(canvas, employeeId, {
          format: "CODE128",
          width: 1.5,
          height: 30,
          displayValue: false,
          fontSize: 0,
          margin: 5,
          background: "#ffffff",
          lineColor: "#000000"
        });
        
        const barcodeDataURL = canvas.toDataURL('image/png');
        resolve(barcodeDataURL);
      } catch (error) {
        console.error('Error generating barcode:', error);
        resolve('');
      }
    });
  };

  // Generate Professional Employee ID Card PDF
  const generateEmployeeIDCard = async () => {
    try {
      // Generate QR code and barcode
      const qrCode = await generateQRCode(employee.employeeId);
      const barcode = await generateBarcodeImage(employee.employeeId);

      // Create a temporary div to render the ID card (Front and Back)
      const idCardContainer = document.createElement('div');
      idCardContainer.style.position = 'fixed';
      idCardContainer.style.left = '-1000px';
      idCardContainer.style.top = '0';
      idCardContainer.style.display = 'flex';
      idCardContainer.style.gap = '20px';
      idCardContainer.style.padding = '20px';
      idCardContainer.style.backgroundColor = '#f8fafc';

      // FRONT SIDE
      const frontSide = document.createElement('div');
      frontSide.style.width = '400px';
      frontSide.style.height = '250px';
      frontSide.style.padding = '10px';
      frontSide.style.backgroundColor = '#ffffff';
      frontSide.style.border = '3px solid #2563eb';
      frontSide.style.borderRadius = '15px';
      frontSide.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
      frontSide.style.fontFamily = 'Arial, sans-serif';
      frontSide.style.position = 'relative';

      frontSide.innerHTML = `
        <!-- Company Header -->
        <div style="text-align: center; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #2563eb;">
          <h1 style="margin: 0; font-size: 18px; font-weight: bold; color: #1e40af; letter-spacing: 1px;">CREXLINE GARMENT</h1>
          <p style="margin: 2px 0; font-size: 10px; color: #6b7280; font-weight: 500;">Kamburawala, Baduraliya</p>
          <p style="margin: 0; font-size: 9px; color: #9ca3af;">EMPLOYEE ID CARD</p>
        </div>

        <div style="display: flex; gap: 15px; align-items: flex-start;">
          <!-- Employee Photo -->
          <div style="flex-shrink: 0;">
            <div style="width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid #e5e7eb; background: #f8fafc;">
              ${employee.profileImage ? 
                `<img src="${FILE_BASE_URL}${employee.profileImage}" alt="${employee.name}" style="width: 100%; height: 100%; object-fit: cover;" />` : 
                `<div style="width: 100%; height: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">${getInitials(employee.name)}</div>`
              }
            </div>
          </div>

          <!-- Employee Details -->
          <div style="flex: 1;">
            <div style="margin-bottom: 8px;">
              <h2 style="margin: 0; font-size: 16px; font-weight: bold; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px;">${employee.name}</h2>
            </div>
            
            <div style="font-size: 10px; color: #374151;">
              <p style="margin: 4px 0;"><strong>Employee ID:</strong> ${employee.employeeId}</p>
              <p style="margin: 4px 0;"><strong>Join Date:</strong> ${new Date(employee.joinDate).toLocaleDateString()}</p>
              <p style="margin: 4px 0;"><strong>Contact:</strong> ${employee.contactNo}</p>
            </div>
          </div>

          <!-- QR Code -->
          <div style="flex-shrink: 0; text-align: center;">
            ${qrCode ? 
              `<img src="${qrCode}" alt="Employee QR Code" style="width: 70px; height: 70px; border: 1px solid #e5e7eb; border-radius: 4px;" />` : 
              '<div style="width: 70px; height: 70px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #9ca3af; border: 1px solid #e5e7eb; border-radius: 4px;">QR CODE</div>'
            }
          </div>
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 10px; left: 0; right: 0; text-align: center;">
          <p style="margin: 0; font-size: 8px; color: #2b2d30ff; font-style: italic;">Issued: ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="position: absolute; bottom: 10px; left: 10px; right: 0; text-align: left;">
          <p style="margin: 0; font-size: 8px; color: #2b2d30ff; font-style: italic;">Employee Signature</p>
        </div>
        <div style="position: absolute; bottom: 10px; left: 0; right: 10px; text-align: right;">
          <p style="margin: 0; font-size: 8px; color: #2b2d30ff; font-style: italic;">Registrar Signature</p>
        </div>
      `;

      // BACK SIDE
      const backSide = document.createElement('div');
      backSide.style.width = '400px';
      backSide.style.height = '250px';
      backSide.style.padding = '10px';
      backSide.style.backgroundColor = '#ffffff';
      backSide.style.border = '3px solid #2563eb';
      backSide.style.borderRadius = '15px';
      backSide.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
      backSide.style.fontFamily = 'Arial, sans-serif';
      backSide.style.position = 'relative';

      backSide.innerHTML = `
        <!-- Company Header -->
        <div style="text-align: center; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #2563eb;">
          <h1 style="margin: 0; font-size: 18px; font-weight: bold; color: #1e40af; letter-spacing: 1px;">CREXLINE GARMENT</h1>
          <p style="margin: 2px 0; font-size: 10px; color: #6b7280; font-weight: 500;">EMPLOYEE INFORMATION</p>
        </div>

        <!-- Employee Details -->
        <div style="margin-bottom: 15px;">
          <div style="font-size: 10px; color: #374151;">
            <p style="margin: 5px 0;"><strong>Full Name:</strong> ${employee.name}</p>
            <p style="margin: 5px 0;"><strong>NIC Number:</strong> ${employee.nic}</p>
            <p style="margin: 5px 0;"><strong>Hourly Rate:</strong> Rs. ${rates.hourlyRate.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>OT Rate:</strong> Rs. ${rates.overtimeRate.toFixed(2)}</p>
          </div>
          
          <!-- Full Address -->
          <div style="margin-top: 10px; padding: 8px; background: #f8fafc; border-radius: 4px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 9px; color: #374151; line-height: 1.4;">
              <strong style="display: block; margin-bottom: 2px;">Full Address:</strong>
              ${employee.address}
            </p>
          </div>
        </div>

        <!-- Barcode -->
        <div style="text-align: center; margin-bottom: 10px;">
          ${barcode ? 
            `<img src="${barcode}" alt="Employee Barcode" style="height: 35px; width: 100%; object-fit: contain;" />` : 
            '<div style="height: 35px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #9ca3af; border: 1px solid #e5e7eb; border-radius: 4px;">EMPLOYEE BARCODE</div>'
          }
        </div>

        <!-- Important Message -->
        <div style="text-align: center; border-top: 1px dashed #d1d5db; padding-top: 8px;">
          <p style="margin: 0; font-size: 7px; color: #ef4444; font-weight: bold;">
            THIS CARD IS THE PROPERTY OF CREXLINE GARMENT
          </p>
          <p style="margin: 2px 0 0 0; font-size: 6px; color: #6b7280;">
            If found, please return to Crexline Garment, Kamburawala, Baduraliya
          </p>
        </div>
      `;

      idCardContainer.appendChild(frontSide);
      idCardContainer.appendChild(backSide);
      document.body.appendChild(idCardContainer);

      // Create PDF with both sides
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [105, 148] // Standard ID card size
      });

      // Convert front side to image
      const frontCanvas = await html2canvas(frontSide, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const frontImgData = frontCanvas.toDataURL('image/png');

      // Convert back side to image
      const backCanvas = await html2canvas(backSide, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const backImgData = backCanvas.toDataURL('image/png');

      // Add front side to PDF (first page)
      pdf.addImage(frontImgData, 'PNG', 5, 5, 95, 60);
      
      // Add back side to PDF (second page)
      pdf.addPage();
      pdf.addImage(backImgData, 'PNG', 5, 5, 95, 60);

      // Add watermark
      pdf.setFontSize(6);
      pdf.setTextColor(200, 200, 200);
      pdf.text('Crexline Garment - Official Employee ID', 52, 70, { align: 'center' });
      
      pdf.save(`Crexline_Employee_ID_${employee.name.replace(/\s+/g, '_')}.pdf`);

      // Clean up
      document.body.removeChild(idCardContainer);

    } catch (error) {
      console.error('Error generating ID card:', error);
      alert('Error generating ID card. Please try again.');
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-slate-100 overflow-hidden">
            {employee.profileImage ? (
              <img 
                src={`${FILE_BASE_URL}${employee.profileImage}`}
                alt={employee.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(employee.name)}
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{employee.name}</div>
            <div className="text-sm text-slate-500">NIC: {employee.nic}</div>
            <div className="text-sm text-slate-500">ID: {employee.employeeId}</div> 
            <div className="text-xs text-slate-400">{employee.contactNo}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900">{employee.employmentStatus}</div>
        <div className="text-sm text-slate-500">
          {isInProbation ? 'Probation' : 'Confirmed'}
        </div>
        {isInProbation && (
          <div className="text-xs text-orange-600">
            Ends: {new Date(employee.probationEndDate).toLocaleDateString()}
          </div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900">{employee.role}</div>
        <div className="text-sm text-slate-500">
          <span className="font-semibold">Basic: Rs. {employee.salary?.toLocaleString()}</span>
        </div>
        
        <div className="text-xs text-slate-400 mt-1">
          <div className="flex items-center justify-between">
            <span>Hourly: Rs. {rates.hourlyRate.toFixed(2)}</span>
            <button 
              onClick={refreshRates}
              disabled={rates.isLoading}
              className="text-blue-500 hover:text-blue-700 ml-2"
              title="Refresh Rates"
            >
              <RefreshCw size={12} className={rates.isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div>OT Rate: Rs. {rates.overtimeRate.toFixed(2)}</div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {employee.bankDetails ? (
          <div>
            <div className="text-sm font-medium text-slate-900">{employee.bankDetails.bankName}</div>
            <div className="text-sm text-slate-500">A/C: ••••{employee.bankDetails.accountNumber?.slice(-4)}</div>
            <div className="text-xs text-slate-400">{employee.bankDetails.branch}</div>
          </div>
        ) : (
          <div className="text-sm text-slate-400">No bank details</div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${
          employee.status === 'Active' 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : employee.status === 'On Leave'
            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
            : 'bg-red-100 text-red-800 border-red-200'
        }`}>
          {employee.status === 'Active' ? <CheckCircle size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
          {employee.status}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-500">
          {new Date(employee.joinDate).toLocaleDateString()}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          {/* Download ID Card Button */}
          <button 
            onClick={generateEmployeeIDCard}
            className="text-teal-600 hover:text-teal-800 hover:bg-teal-50 p-2 rounded-lg transition-colors"
            title="Download Employee ID Card"
          >
            <Download size={16} />
          </button>
          
          <button 
            onClick={() => onViewDetails(employee)}  
            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
            title="View Full Details"
          >
            <FileText size={16} />
          </button>
          
          <button 
            onClick={() => onViewLeaveBalances(employee)}
            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-2 rounded-lg transition-colors"
            title="View Leave Balances"
          >
            <Eye size={16} />
          </button>
          
          <button 
            onClick={() => onMarkAttendance(employee)}
            className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors"
            title="Mark Attendance"
          >
            <UserCheck size={16} />
          </button>
          
          <button 
            onClick={() => onEdit(employee)}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          
          <button 
            onClick={() => onDelete(employee._id)}
            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default EmployeeRow;