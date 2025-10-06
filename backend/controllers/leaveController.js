import Employee from "../models/Employee.js";

export const getLeaveBalances = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const currentYear = new Date().getFullYear();
    
    let leaveHistory = employee.leaveHistory.find(l => l.year === currentYear);
    
    if (!leaveHistory) {
      // Calculate entitlements based on joining date
      const joinDate = new Date(employee.joinDate);
      const joinYear = joinDate.getFullYear();
      const joinMonth = joinDate.getMonth();
      
      let annualEntitlement, medicalEntitlement, casualEntitlement;
      
      if (joinYear === currentYear) {
        // First year: pro-rated
        if (joinMonth <= 2) annualEntitlement = 14;
        else if (joinMonth <= 5) annualEntitlement = 10;
        else if (joinMonth <= 8) annualEntitlement = 7;
        else annualEntitlement = 4;
        
        medicalEntitlement = 7;
        casualEntitlement = 7;
      } else {
        // From second year: full entitlement
        annualEntitlement = 14;
        medicalEntitlement = 7;
        casualEntitlement = 7;
      }

      leaveHistory = {
        year: currentYear,
        takenAnnual: 0,
        takenMedical: 0,
        takenCasual: 0,
        annualEntitlement: annualEntitlement,
        medicalEntitlement: medicalEntitlement,
        casualEntitlement: casualEntitlement,
        monthlyLeaves: Array(12).fill(0)
      };
      employee.leaveHistory.push(leaveHistory);
      await employee.save();
    }

    // FIXED: Check if leaveHistory has entitlements, if not add them
    if (!leaveHistory.annualEntitlement || !leaveHistory.medicalEntitlement || !leaveHistory.casualEntitlement) {
      const joinDate = new Date(employee.joinDate);
      const joinYear = joinDate.getFullYear();
      const joinMonth = joinDate.getMonth();
      
      let annualEntitlement, medicalEntitlement, casualEntitlement;
      
      if (joinYear === currentYear) {
        // First year: pro-rated
        if (joinMonth <= 2) annualEntitlement = 14;
        else if (joinMonth <= 5) annualEntitlement = 10;
        else if (joinMonth <= 8) annualEntitlement = 7;
        else annualEntitlement = 4;
        
        medicalEntitlement = 7;
        casualEntitlement = 7;
      } else {
        // From second year: full entitlement
        annualEntitlement = 14;
        medicalEntitlement = 7;
        casualEntitlement = 7;
      }

      // Update the existing leaveHistory with entitlements
      leaveHistory.annualEntitlement = annualEntitlement;
      leaveHistory.medicalEntitlement = medicalEntitlement;
      leaveHistory.casualEntitlement = casualEntitlement;
      
      await employee.save();
    }

    // FIXED: Calculate current balances properly
    const currentAnnual = Math.max(0, leaveHistory.annualEntitlement - leaveHistory.takenAnnual);
    const currentMedical = Math.max(0, leaveHistory.medicalEntitlement - leaveHistory.takenMedical);
    const currentCasual = Math.max(0, leaveHistory.casualEntitlement - leaveHistory.takenCasual);

    // FIXED: Return data in the proper structure
    const responseData = {
      currentBalances: {
        annual: currentAnnual,
        medical: currentMedical,
        casual: currentCasual,
        maternity: employee.leaveBalances.maternity || 42
      },
      leaveHistory: [leaveHistory],
      entitlements: {
        annual: leaveHistory.annualEntitlement,
        medical: leaveHistory.medicalEntitlement,
        casual: leaveHistory.casualEntitlement,
        maternity: 42
      },
      used: {
        annual: leaveHistory.takenAnnual,
        medical: leaveHistory.takenMedical,
        casual: leaveHistory.takenCasual
      },
      employeeInfo: {
        name: employee.name,
        role: employee.role,
        employmentStatus: employee.employmentStatus,
        joinDate: employee.joinDate,
        gender: employee.gender
      }
    };

    console.log('Processed leave balances:', responseData); // Debug log

    res.json({ 
      success: true, 
      data: responseData
    });
  } catch (error) {
    console.error('Error in getLeaveBalances:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW: Apply casual leave
export const applyCasualLeave = async (req, res) => {
  try {
    const { employeeId, startDate, endDate, reason, notes } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    const currentYear = new Date().getFullYear();
    let leaveHistory = employee.leaveHistory.find(l => l.year === currentYear);
    
    if (!leaveHistory) {
      leaveHistory = { 
        year: currentYear, 
        takenAnnual: 0, 
        takenMedical: 0, 
        takenCasual: 0,
        annualEntitlement: 14,
        medicalEntitlement: 7,
        casualEntitlement: 7
      };
      employee.leaveHistory.push(leaveHistory);
    }

    const remainingCasual = leaveHistory.casualEntitlement - leaveHistory.takenCasual;
    
    if (days > remainingCasual) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${remainingCasual} casual leaves remaining. Requested ${days} days.` 
      });
    }

    const casualLeave = {
      startDate: start,
      endDate: end,
      reason,
      days,
      notes,
      status: 'Pending',
      appliedDate: new Date(),
      leaveType: 'casual'
    };

    employee.casualLeaves = employee.casualLeaves || [];
    employee.casualLeaves.push(casualLeave);
    await employee.save();

    res.json({ 
      success: true, 
      message: 'Casual leave application submitted for approval',
      data: casualLeave 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATED: Apply medical leave with new limits
export const applyMedicalLeave = async (req, res) => {
  try {
    const { employeeId, startDate, endDate, reason, notes } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    const currentYear = new Date().getFullYear();
    let leaveHistory = employee.leaveHistory.find(l => l.year === currentYear);
    
    if (!leaveHistory) {
      leaveHistory = { 
        year: currentYear, 
        takenAnnual: 0, 
        takenMedical: 0, 
        takenCasual: 0,
        annualEntitlement: 14,
        medicalEntitlement: 7,
        casualEntitlement: 7
      };
      employee.leaveHistory.push(leaveHistory);
    }

    const remainingMedical = leaveHistory.medicalEntitlement - leaveHistory.takenMedical;
    
    if (days > remainingMedical) {
      return res.status(400).json({ 
        success: false, 
        message: `Only ${remainingMedical} medical leaves remaining. Requested ${days} days.` 
      });
    }

    const medicalLeave = {
      startDate: start,
      endDate: end,
      reason,
      days,
      notes,
      status: 'Pending',
      appliedDate: new Date()
    };

    employee.medicalLeaves.push(medicalLeave);
    await employee.save();

    res.json({ 
      success: true, 
      message: 'Medical leave application submitted for approval',
      data: medicalLeave 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATED: Update medical leave status with new limits
export const updateMedicalLeaveStatus = async (req, res) => {
  try {
    const { employeeId, leaveId, status, adminNotes } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const medicalLeave = employee.medicalLeaves.id(leaveId);
    if (!medicalLeave) {
      return res.status(404).json({ success: false, message: "Medical leave not found" });
    }

    medicalLeave.status = status;
    medicalLeave.adminNotes = adminNotes;
    medicalLeave.processedDate = new Date();

    if (status === 'Approved') {
      const currentYear = new Date().getFullYear();
      let leaveHistory = employee.leaveHistory.find(l => l.year === currentYear);
      
      if (!leaveHistory) {
        leaveHistory = { 
          year: currentYear, 
          takenAnnual: 0, 
          takenMedical: 0, 
          takenCasual: 0,
          annualEntitlement: 14,
          medicalEntitlement: 7,
          casualEntitlement: 7
        };
        employee.leaveHistory.push(leaveHistory);
      }

      leaveHistory.takenMedical += medicalLeave.days;
    }

    await employee.save();

    res.json({ 
      success: true, 
      message: `Medical leave ${status.toLowerCase()}`,
      data: medicalLeave 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// NEW: Maternity leave function
export const applyMaternityLeave = async (req, res) => {
  try {
    const { employeeId, startDate, expectedDuration = 42, medicalReason } = req.body;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    if (employee.gender !== 'Female') {
      return res.status(400).json({ 
        success: false, 
        message: "Maternity leave is only applicable for female employees" 
      });
    }

    const start = new Date(startDate);
    const duration = medicalReason ? 84 : expectedDuration; // Special cases: 84 days
    
    const maternityLeave = {
      startDate: start,
      expectedDuration: duration,
      medicalReason: medicalReason || '',
      status: 'Pending',
      appliedDate: new Date(),
      leaveType: 'maternity'
    };

    employee.maternityLeaves = employee.maternityLeaves || [];
    employee.maternityLeaves.push(maternityLeave);
    await employee.save();

    res.json({ 
      success: true, 
      message: `Maternity leave application submitted for ${duration} days`,
      data: maternityLeave 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};