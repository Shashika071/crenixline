# Salary Payment Flow - How It Works

## Overview
When salaries are marked as paid, the system automatically creates Payment records that reduce the Total Income in financial calculations.

## How It Works

### 1. **When Marking Single Salary as Paid**

When you click "Mark as Paid" for a single employee:

```javascript
// Backend creates a Payment record
Payment {
  amount: payslip.netSalary,        // e.g., Rs. 45,000
  type: 'Outflow',                  // This reduces Total Income
  date: new Date(),                 // Payment date (today)
  paymentMode: 'Bank Transfer',     // Payment method
  remarks: 'Salary payment for [Employee Name] (2025-10)',
  employeeId: [employee reference],
  status: 'Completed'
}
```

**Result:**
- ✅ Payslip status changes from 'finalized' to 'paid'
- ✅ Payment record created with type 'Outflow'
- ✅ **Net Salary amount (e.g., Rs. 45,000) is automatically deducted from Total Income**

### 2. **When Marking Multiple Salaries as Paid (Bulk)**

When you select multiple employees and click "Mark Selected as Paid":

```javascript
// Backend creates ONE bulk Payment record
Payment {
  amount: totalOfAllSelectedSalaries,  // e.g., Rs. 150,000
  type: 'Outflow',                     // This reduces Total Income
  date: new Date(),
  paymentMode: 'Bank Transfer',
  remarks: 'Bulk salary payment for 3 employees',
  status: 'Completed'
}
```

**Result:**
- ✅ All selected payslips change status to 'paid'
- ✅ ONE Payment record created for the total amount
- ✅ **Total of all selected salaries (e.g., Rs. 150,000) is deducted from Total Income**

## Financial Calculation Flow

### Total Income Calculation:
```
Total Income = Inflow Payments + Order Revenue
```

### Total Outflow Calculation:
```
Total Outflow = Outflow Payments + Regular Expenses + Machine Rentals + EPF (20%)
                     ↑
                     └── This includes PAID SALARIES!
```

### Net Profit Calculation:
```
Net Profit = Total Income - Total Outflow
```

## Important Points

1. **Salary Payments are Outflows**: When you mark a salary as paid, it creates a Payment record with `type: 'Outflow'`

2. **Automatic Deduction**: The system automatically includes these Outflow payments in the Total Outflow calculation, which reduces Net Profit

3. **Date-Based Filtering**: Only salary payments within the selected date range are included in the financial summary

4. **One-by-One or Bulk**: Whether you pay salaries one by one or in bulk, they all reduce the Total Income correctly:
   - **One by one**: Creates individual Payment records for each salary
   - **Bulk**: Creates ONE Payment record for the total amount

5. **EPF is separate**: EPF contributions (20%) are calculated separately and also deducted from Total Income

## Example Scenario

### Initial State:
- Total Income: Rs. 500,000
- Total Outflow: Rs. 200,000 (expenses + rentals + EPF)
- Net Profit: Rs. 300,000

### After Marking 1 Salary as Paid (Rs. 45,000):
- Total Income: Rs. 500,000 (unchanged)
- Total Outflow: Rs. 245,000 (Rs. 200,000 + Rs. 45,000 salary payment)
- Net Profit: Rs. 255,000 (decreased by Rs. 45,000)

### After Marking 2 More Salaries as Paid in Bulk (Rs. 90,000 total):
- Total Income: Rs. 500,000 (unchanged)
- Total Outflow: Rs. 335,000 (Rs. 245,000 + Rs. 90,000 bulk payment)
- Net Profit: Rs. 165,000 (decreased by Rs. 90,000)

## Console Logs

When you mark salaries as paid, you'll see these logs in the backend console:

### Single Payment:
```
✓ Salary Payment Created: Rs. 45000 for John Doe - This amount is deducted from Total Income
```

### Bulk Payment:
```
✓ Bulk Salary Payment Created: Rs. 150000 for 3 employees - This amount is deducted from Total Income
  Employees paid: John Doe, Jane Smith, Bob Johnson
```

## Verification

To verify that salary payments are reducing Total Income:

1. Note your current Net Profit before marking any salaries as paid
2. Mark one or more salaries as paid
3. Refresh the Financial Overview
4. Check that Net Profit has decreased by exactly the amount of salaries paid

## Database Collections Involved

1. **Payslip Collection**: Status changes from 'finalized' to 'paid'
2. **Payment Collection**: New records created with type 'Outflow'
3. **Financial Summary**: Automatically recalculated to include the new Outflow payments

## API Endpoints

- `PATCH /api/finance/salaries/:id/paid` - Mark single salary as paid
- `POST /api/finance/salaries/bulk-paid` - Mark multiple salaries as paid

Both endpoints create Payment records that automatically reduce Total Income.
