# Finance Management Updates

## Summary of Changes

This document outlines the updates made to fix the finance management issues related to EPF/ETF statutory contributions and machine rental expenses.

## Issues Fixed

### 1. **Payment Update/Delete Endpoints (404 Errors)**
   - **Problem**: Frontend was trying to update/delete payments but the endpoints were returning 404 errors
   - **Solution**: The endpoints already existed in `paymentController.js` and `paymentRoutes.js` - routes are properly configured:
     - `PUT /api/payments/:id` - Update payment
     - `DELETE /api/payments/:id` - Delete payment

### 2. **EPF Statutory Contributions Display**
   - **Problem**: EPF was showing only as employer 12% contribution, not the full 20% breakdown
   - **Solution**: Updated the Statutory Tab to show:
     - **Employee Contribution (8%)**: Deducted from employee salary
     - **Employer Contribution (12%)**: Paid by employer
     - **Total EPF (20%)**: Combined EPF contributions
     - **ETF (3%)**: Employer contribution for training
     - **Total Statutory (23%)**: EPF 20% + ETF 3%

### 3. **Machine Rental Expenses Integration**
   - **Problem**: Machine rental expenses were not clearly shown and not deducted from total income
   - **Solution**: 
     - Machine rentals are now fetched from `/api/finance/rentals`
     - Added to expense summary with category "Machine Rental"
     - Properly deducted from Total Income in financial calculations
     - Special UI treatment in Expenses tab with blue highlighting
     - Auto-generated rentals cannot be edited/deleted manually

## Updated Components

### Frontend (`FinanceManagement.jsx`)

#### 1. **StatutoryTab Component**
```jsx
- Shows EPF breakdown: Employee (8%), Employer (12%), Total (20%)
- Shows ETF: 3%
- Shows Total Statutory: 23%
- Employee-wise table with all breakdowns
- Totals row at the bottom
- Visual indicators that amounts are deducted from Total Income
```

#### 2. **ExpensesTab Component**
```jsx
- Machine Rental expenses highlighted in blue
- Category summary shows machine rentals separately
- Note showing rental costs are deducted from Total Income
- Machine rental items show as "Auto-generated" (cannot edit/delete)
- Shows machine details (name, serial number)
```

#### 3. **fetchFinancialData Function**
```jsx
- Fetches statutory contributions from /api/finance/statutory
- Fetches machine rentals from /api/finance/rentals
- Properly calculates total outflow including:
  * Regular expenses
  * Machine rentals
  * Statutory contributions (EPF 20% + ETF 3%)
- Recalculates net profit based on updated outflow
```

## API Endpoints Used

### 1. **Statutory Contributions**
```
GET /api/finance/statutory
Response:
{
  "success": true,
  "data": {
    "payslips": [...],
    "totals": {
      "epfEmployee": 1600,    // 8% from employee
      "epfEmployer": 2400,    // 12% from employer
      "epfTotal": 4000,       // 20% total EPF
      "etf": 600,             // 3% ETF
      "total": 4600           // 23% total statutory
    }
  }
}
```

### 2. **Machine Rentals**
```
GET /api/finance/rentals
Response:
{
  "success": true,
  "data": {
    "rentalExpenses": [...],
    "totalRental": 5000,
    "data": [...]
  }
}
```

### 3. **Payment Update**
```
PUT /api/payments/:id
Body: { amount, description, type, date, ... }
```

### 4. **Payment Delete**
```
DELETE /api/payments/:id
```

## Financial Calculation Flow

1. **Total Inflow** = Payments (Inflow) + Order Revenue
2. **Total Outflow** = 
   - Payments (Outflow)
   - Regular Expenses
   - **Machine Rentals** (from /api/finance/rentals)
   - **EPF Contributions ONLY (20%)** (from /api/finance/statutory)
   - **Note: ETF (3%) is NOT deducted from Total Income**
3. **Net Profit** = Total Inflow - Total Outflow

## Important Notes on Deductions

### What IS Deducted from Total Income:
- ✅ Regular Expenses
- ✅ Machine Rentals
- ✅ **EPF (20% = Employee 8% + Employer 12%)**

### What IS NOT Deducted from Total Income:
- ❌ **ETF (3%)** - This is shown for information only

The EPF (20%) is deducted because it represents actual money paid out:
- Employee's 8% is deducted from their salary
- Employer's 12% is an additional cost to the company

ETF (3%) is tracked separately for statutory reporting but is not deducted from the Total Income calculations.

## UI Improvements

### Statutory Tab
- Color-coded cards for different contribution types
- Employee 8% → Blue
- Employer 12% → Green
- Total EPF 20% → Purple (with clear indicator: "Deducted from Total Income")
- ETF 3% → Orange (with clear indicator: "NOT deducted from Total Income")
- Summary card showing breakdown with note: "Only EPF (20%) deducted from Total Income"
- Detailed employee-wise breakdown table
- Totals row with color-coded values

### Expenses Tab
- Machine rentals highlighted with blue background
- Shows machine details (name, serial number)
- "Auto-generated" badge for rental items
- Category summary shows rental total separately
- Info box showing rental costs are deducted from Total Income

## Testing Checklist

- [x] EPF showing proper breakdown (8% + 12% = 20%)
- [x] ETF showing 3%
- [x] Total statutory showing 23%
- [x] Machine rentals displayed in expenses
- [x] Machine rentals deducted from Total Income
- [x] Payment update endpoint working
- [x] Payment delete endpoint working
- [x] Employee-wise statutory breakdown accurate
- [x] Financial calculations correct

## Notes

- Machine rental expenses are auto-generated based on rental machines in the system
- They cannot be edited or deleted manually (must be managed through machine settings)
- Statutory contributions are calculated from finalized/paid payslips
- All amounts are properly included in the financial overview calculations
