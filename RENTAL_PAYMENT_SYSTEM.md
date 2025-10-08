# Rental Payment Tracking System

## Overview
Implemented a payment tracking system for machine rentals, similar to salary payments. Rentals are now tracked as either **PAID** or **PENDING**, and only PAID rentals are deducted from Total Income.

## Problem Solved
**Before**: All machine rentals were automatically deducted from Total Income, even if they hadn't been paid yet. This made it confusing for admins to know which rentals were actually paid.

**After**: 
- Rentals have payment status (`pending` or `paid`)
- Only PAID rentals are deducted from Total Income
- Admins can see pending rentals separately
- "Mark as Paid" button to record rental payments

## New Database Model: RentalPayment

Created `backend/models/RentalPayment.js`:

```javascript
{
  machineId: ObjectId,          // Reference to Machine
  amount: Number,               // Monthly rental amount
  month: String,                // Format: "2025-10" for October 2025
  dueDate: Date,                // When the rent is due
  paidDate: Date,               // When it was actually paid
  status: 'pending' | 'paid',   // Payment status
  paymentMode: String,          // Cash, Bank Transfer, Cheque, Card
  remarks: String,              // Payment notes
  paymentId: ObjectId           // Reference to Payment (Outflow) record
}
```

**Key Features:**
- Unique index on `(machineId, month)` - one payment record per machine per month
- Tracks when payment is due vs. when it's actually paid
- Links to Payment model when marked as paid

## Backend Changes

### 1. Updated `getFinancialSummary` (financeController.js)

**BEFORE** - All machine rentals counted:
```javascript
// Old code - counted all rentals
rentalMachines.forEach(machine => {
  machineRentalCosts += machine.monthlyRent || 0;
});
```

**AFTER** - Only PAID rentals counted:
```javascript
// New code - only count PAID rentals
const paidRentals = await RentalPayment.aggregate([
  { $match: { status: 'paid', paidDate: { $gte: startDate, $lte: endDate } } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
]);

const machineRentalCosts = paidRentals[0]?.total || 0;
```

**Result**: Only paid rental amounts reduce Total Income

### 2. Updated `getMachineRentalExpenses`

**Returns:**
```json
{
  "success": true,
  "data": [...],              // PAID rentals (for expenses tab)
  "paidRentals": [...],       // Array of paid rental objects
  "pendingRentals": [...],    // Array of pending rental objects
  "totalPaidRental": 5000,    // Total of paid rentals
  "totalPendingRental": 3000, // Total of pending rentals
  "totalRental": 5000         // For backward compatibility
}
```

**Each rental object includes:**
```javascript
{
  _id: "...",
  machineId: "...",
  machine: {
    _id: "...",
    name: "ddvs",
    model: "vsdv",
    serialNumber: "24234"
  },
  amount: 5000,
  month: "2025-10",
  dueDate: "2025-10-10",
  status: "pending" | "paid",
  paymentMode: "Cash",          // If paid
  remarks: "...",               // If paid
  description: "Monthly rental for ddvs",
  category: "Machine Rental",
  type: "Machine Rental"
}
```

### 3. New Endpoint: `markRentalAsPaid`

**Endpoint:** `PATCH /api/finance/rentals/:machineId/:month/paid`

**Request Body:**
```json
{
  "paymentMode": "Bank Transfer",
  "remarks": "Paid via bank transfer on Oct 8"
}
```

**What it does:**
1. Finds or creates RentalPayment record for the machine and month
2. Marks status as `paid`, records `paidDate`
3. Creates a Payment record (Outflow) to deduct from Total Income
4. Links Payment to RentalPayment via `paymentId`

**Response:**
```json
{
  "success": true,
  "data": {
    "rentalPayment": { ... },
    "payment": { ... },
    "message": "Rental marked as paid successfully"
  }
}
```

### 4. New Endpoint: `markRentalsBulkPaid`

**Endpoint:** `POST /api/finance/rentals/bulk-paid`

**Request Body:**
```json
{
  "rentals": [
    { "machineId": "...", "month": "2025-10" },
    { "machineId": "...", "month": "2025-10" }
  ],
  "paymentMode": "Bank Transfer",
  "remarks": "Bulk payment for October rentals"
}
```

**What it does:**
1. Marks multiple rentals as paid
2. Creates ONE Payment (Outflow) record for the total amount
3. All rental payments link to the same Payment record

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 2,
    "totalAmount": 10000,
    "payment": { ... },
    "message": "2 rental payments marked as paid successfully"
  }
}
```

## Frontend Changes

### 1. Updated State Management

**New state variables:**
```javascript
const [pendingRentals, setPendingRentals] = useState([]);
const [selectedRentals, setSelectedRentals] = useState([]);
```

### 2. Updated Data Fetching

**BEFORE:**
```javascript
// All rentals combined
setExpenses([...expensesData, ...machineRentalsData]);
```

**AFTER:**
```javascript
// Only PAID rentals in expenses
const paidRentalsData = machineRentalsRes.data.paidRentals || [];
const pendingRentalsData = machineRentalsRes.data.pendingRentals || [];

setExpenses([...expensesData, ...paidRentalsData]);  // Only paid
setPendingRentals(pendingRentalsData);                 // Separate pending
```

### 3. New API Functions

Added to `frontend/src/services/api.js`:

```javascript
export const financeAPI = {
  // ... existing functions
  
  // Mark rental as paid
  markRentalAsPaid: (machineId, month, data) => 
    api.patch(`/finance/rentals/${machineId}/${month}/paid`, data),
  
  // Mark multiple rentals as paid in bulk
  markRentalsBulkPaid: (data) => 
    api.post('/finance/rentals/bulk-paid', data),
};
```

### 4. New UI Tab: "Pending Rentals" (To be implemented)

**Will show:**
- List of unpaid machine rentals
- Due date for each rental
- Amount due
- Machine details
- "Mark as Paid" button (single)
- Checkbox selection for bulk payment
- "Mark Selected as Paid" button (bulk)

**Similar to Pending Salaries tab**

## Data Flow

### Scenario: Monthly Rental of Rs. 5,000

#### Initial State (Not Paid):
1. **API Response:**
   ```json
   {
     "paidRentals": [],
     "pendingRentals": [
       {
         "machineId": "...",
         "amount": 5000,
         "month": "2025-10",
         "status": "pending"
       }
     ],
     "totalPaidRental": 0,
     "totalPendingRental": 5000
   }
   ```

2. **Financial Summary:**
   - Total Income: Rs. 100,000
   - Machine Rental Costs (paid): Rs. 0  ← Not deducted yet!
   - Total Outflow: Rs. 0
   - Net Profit: Rs. 100,000

3. **UI Display:**
   - Expenses Tab: No machine rental shown
   - Pending Rentals Tab: Shows Rs. 5,000 rental with "Mark as Paid" button

#### After Marking as Paid:

1. **Backend Actions:**
   - Creates RentalPayment: `{ machineId, month: "2025-10", status: "paid", paidDate: "2025-10-08", amount: 5000 }`
   - Creates Payment (Outflow): `{ amount: 5000, type: "Outflow", date: "2025-10-08" }`
   - Links: `rentalPayment.paymentId = payment._id`

2. **API Response (next fetch):**
   ```json
   {
     "paidRentals": [
       {
         "machineId": "...",
         "amount": 5000,
         "month": "2025-10",
         "status": "paid",
         "paidDate": "2025-10-08"
       }
     ],
     "pendingRentals": [],
     "totalPaidRental": 5000,
     "totalPendingRental": 0
   }
   ```

3. **Financial Summary:**
   - Total Income: Rs. 100,000
   - Machine Rental Costs (paid): Rs. 5,000  ← NOW deducted!
   - Total Outflow: Rs. 5,000
   - Net Profit: Rs. 95,000

4. **UI Display:**
   - Expenses Tab: Shows Rs. 5,000 rental with blue background, marked as "Paid"
   - Pending Rentals Tab: Empty (no pending rentals)

## Key Benefits

### 1. Accurate Financial Tracking
- Only actual paid expenses reduce Total Income
- Clear separation between what's due vs. what's paid
- Better cash flow visibility

### 2. Payment Status Visibility
- Admin knows exactly which rentals are paid/unpaid
- Can track overdue payments
- Won't confuse pending with paid

### 3. Payment History
- Full audit trail of when rentals were marked as paid
- Links to Payment records (Outflow)
- Payment mode and remarks captured

### 4. Bulk Payment Support
- Pay multiple rentals at once
- Single Payment (Outflow) for bulk operations
- Saves time for multiple machines

## Database Collections Involved

1. **Machine**: Stores rental machine details and monthly rent amount
2. **RentalPayment** (NEW): Tracks payment status per machine per month
3. **Payment**: Outflow records created when marked as paid
4. **Financial Summary**: Aggregates only PAID rental amounts

## Console Logs

**When rental marked as paid:**
```
✓ Rental Payment Created: Rs. 5000 for ddvs - This amount is deducted from Total Income
```

**When bulk rental payment:**
```
✓ Bulk Rental Payment Created: Rs. 10000 for 2 machines - This amount is deducted from Total Income
  Machines paid: ddvs, Machine2
```

## Files Changed

### Backend:
1. `backend/models/RentalPayment.js` - NEW model
2. `backend/controllers/financeController.js` - Updated rental calculation, added payment functions
3. `backend/routers/financeRoutes.js` - Added rental payment routes

### Frontend:
1. `frontend/src/services/api.js` - Added rental payment API functions
2. `frontend/src/Components/FinanceManagement/FinanceManagement.jsx` - Updated state and data handling

## Next Steps (To Complete)

1. **Add "Pending Rentals" Tab UI Component** (similar to Pending Salaries)
2. **Add payment modal** for entering payment details
3. **Add bulk payment UI** with checkboxes
4. **Add status badges** on expenses for paid rentals
5. **Add due date warnings** for overdue rentals
