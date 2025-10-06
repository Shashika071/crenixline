import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';

import React from 'react';
import { saveAs } from 'file-saver';

// Create professional styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 25,
    textAlign: 'center',
    borderBottom: '1pt solid #333',
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2c3e50',
  },
  title: {
    fontSize: 16,
    marginBottom: 8,
    color: '#34495e',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#ecf0f1',
    padding: 8,
    color: '#2c3e50',
    borderLeft: '3pt solid #3498db',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 2,
  },
  value: {
    fontSize: 10,
    color: '#34495e',
    flex: 1,
    textAlign: 'right',
  },
  amount: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
    flex: 1,
  },
  positiveAmount: {
    color: '#27ae60',
  },
  negativeAmount: {
    color: '#e74c3c',
  },
  totalSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1pt solid #bdc3c7',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 5,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  netSalary: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2980b9',
  },
  employeeInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    border: '1pt solid #dee2e6',
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
    width: 100,
  },
  infoValue: {
    fontSize: 10,
    color: '#34495e',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#95a5a6',
    borderTop: '0.5pt solid #bdc3c7',
    paddingTop: 10,
  },
 
  calculationTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#d69e2e',
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  calculationLabel: {
    fontSize: 8,
    color: '#744210',
    flex: 2,
  },
  calculationValue: {
    fontSize: 8,
    color: '#744210',
    flex: 1,
    textAlign: 'right',
  }
});

// PDF Document Component
const SalaryPdfDocument = ({ employee = {}, payslip = {}, month = '' }) => {
  const currentDate = new Date().toLocaleDateString();
  
  // Extract employee data
  const {
    name = 'N/A',
    nic = 'N/A',
    role = 'N/A',
    _id = '',
    bankDetails = {}
  } = employee;

  // Extract payslip data
  const {
    basicSalary = 0,
    allowances = [],
    totalAllowances = 0,
    overtimeHours = 0,
    overtimePay = 0,
    sundayWorkHours = 0,
    sundayWorkPay = 0,
    holidayWorkHours = 0,
    holidayWorkPay = 0,
    etfContribution = 0,
    epfDeduction = 0,
    deductions = [],
    totalDeductions = 0,
    salaryAdvances = [],
    totalAdvances = 0,
    grossSalary = 0,
    netSalary = 0,
    status = 'draft',
    finalizedDate = '',
    calculationInfo = {}
  } = payslip;

  // Calculate totals
  const totalEarnings = basicSalary + totalAllowances + overtimePay + sundayWorkPay + holidayWorkPay;
  const totalSpecialPay = sundayWorkPay + holidayWorkPay;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>CREXLINE GARMENT</Text>
          <Text style={styles.title}>SALARY PAYSLIP</Text>
          <Text style={styles.subtitle}>Pay Period: {month}</Text>
          <Text style={styles.subtitle}>Generated on: {currentDate}</Text>
          <Text style={styles.subtitle}>Employee ID: {payslip.realId || 'N/A'}</Text>
        </View>

        {/* Employee Information */}
        <View style={styles.employeeInfo}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#2c3e50' }}>
            EMPLOYEE INFORMATION
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Employee Name:</Text>
            <Text style={styles.infoValue}>{name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>NIC Number:</Text>
            <Text style={styles.infoValue}>{nic}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Designation:</Text>
            <Text style={styles.infoValue}>{role}</Text>
          </View>
          {bankDetails && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bank Account:</Text>
              <Text style={styles.infoValue}>
                {bankDetails.accountNumber} - {bankDetails.bankName} ({bankDetails.branch})
              </Text>
            </View>
          )}
        </View>

        {/* Earnings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EARNINGS & CONTRIBUTIONS</Text>
          
          {/* Basic Salary */}
          <View style={styles.row}>
            <Text style={styles.label}>Basic Salary:</Text>
            <Text style={[styles.amount, styles.positiveAmount]}>
              Rs. {basicSalary.toLocaleString()}
            </Text>
          </View>

          {/* Allowances */}
          {allowances.map((allowance, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.label}>{allowance.name}:</Text>
              <Text style={[styles.amount, styles.positiveAmount]}>
                Rs. {allowance.amount.toLocaleString()}
              </Text>
            </View>
          ))}

          {/* Overtime */}
          {overtimeHours > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Overtime ({overtimeHours} hours):</Text>
              <Text style={[styles.amount, styles.positiveAmount]}>
                Rs. {overtimePay.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Sunday Work */}
          {sundayWorkHours > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Sunday Work ({sundayWorkHours} hours):</Text>
              <Text style={[styles.amount, styles.positiveAmount]}>
                Rs. {sundayWorkPay.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Holiday Work */}
          {holidayWorkHours > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Holiday Work ({holidayWorkHours} hours):</Text>
              <Text style={[styles.amount, styles.positiveAmount]}>
                Rs. {holidayWorkPay.toLocaleString()}
              </Text>
            </View>
          )}

          {/* ETF Contribution (Employer) */}
          <View style={styles.row}>
            <Text style={styles.label}>ETF Contribution (3%):</Text>
            <Text style={[styles.amount, styles.positiveAmount]}>
              + Rs. {etfContribution.toLocaleString()}
            </Text>
          </View>

          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Gross Earnings:</Text>
              <Text style={[styles.totalValue, styles.positiveAmount]}>
                Rs. {grossSalary?.toLocaleString() || totalEarnings.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Deductions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DEDUCTIONS</Text>
          
          {/* EPF Deduction */}
          <View style={styles.row}>
            <Text style={styles.label}>EPF Contribution (8%):</Text>
            <Text style={[styles.amount, styles.negativeAmount]}>
              - Rs. {epfDeduction.toLocaleString()}
            </Text>
          </View>

          {/* Other Deductions */}
          {deductions.map((deduction, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.label}>{deduction.name || 'Deduction'}:</Text>
              <Text style={[styles.amount, styles.negativeAmount]}>
                - Rs. {deduction.amount.toLocaleString()}
              </Text>
            </View>
          ))}

          {/* Salary Advances */}
          {salaryAdvances.map((advance, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.label}>Salary Advance:</Text>
              <Text style={[styles.amount, styles.negativeAmount]}>
                - Rs. {advance.amount.toLocaleString()}
              </Text>
            </View>
          ))}

          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Deductions:</Text>
              <Text style={[styles.totalValue, styles.negativeAmount]}>
                - Rs. {totalDeductions.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Net Salary */}
        <View style={styles.section}>
          <View style={[styles.totalRow, { borderTop: '2pt solid #2980b9', paddingTop: 10 }]}>
            <Text style={[styles.totalLabel, { fontSize: 14 }]}>NET SALARY PAYABLE:</Text>
            <Text style={[styles.netSalary, styles.positiveAmount]}>
              Rs. {netSalary.toLocaleString()}
            </Text>
          </View>
        </View>

       
        {/* Footer Information */}
        <View style={styles.footer}>
          <Text>This is a computer-generated document and does not require a physical signature</Text>
          <Text>Crexline Garment | HR Department | Kamburawala, Baduraliya</Text>
          <Text>Contact: HR Department | Generated on: {currentDate}</Text>
          {status === 'finalized' && finalizedDate && (
            <Text>Finalized on: {formatDate(finalizedDate)}</Text>
          )}
          {status === 'paid' && (
            <Text>Payment processed on: {formatDate(finalizedDate)}</Text>
          )}
          <Text style={{ marginTop: 5, fontStyle: 'italic' }}>
            Note: ETF (3%) is employer contribution, EPF (8%) is employee deduction
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Function to generate and download PDF
export const generateSalaryPdf = async (employee, payslip, month) => {
  try {
    const blob = await pdf(
      <SalaryPdfDocument
        employee={employee}
        payslip={payslip}
        month={month}
      />
    ).toBlob();

    const fileName = `payslip_${(employee?.name || 'employee').replace(/\s+/g, '_')}_${month}.pdf`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

export default SalaryPdfDocument;