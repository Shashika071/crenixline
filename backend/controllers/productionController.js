import Production from "../models/Production.js";

export const createProductionJob = async (req, res) => {
  try {
    const jobCount = await Production.countDocuments();
    const jobId = `JOB${String(jobCount + 1).padStart(4, '0')}`;
    
    const jobData = { ...req.body, jobId };
    const job = new Production(jobData);
    await job.save();
    
    await job.populate('orderId');
    await job.populate('assignedEmployeeId');

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateProductionStatus = async (req, res) => {
  try {
    const { status, actualHours, qualityRating, notes } = req.body;
    const updateData = { status };
    
    if (status === 'Completed') {
      updateData.endDate = new Date();
    }
    if (actualHours !== undefined) updateData.actualHours = actualHours;
    if (qualityRating !== undefined) updateData.qualityRating = qualityRating;
    if (notes !== undefined) updateData.notes = notes;

    const job = await Production.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('orderId').populate('assignedEmployeeId');

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getProductionJobs = async (req, res) => {
  try {
    const { status, jobType, orderId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (jobType) filter.jobType = jobType;
    if (orderId) filter.orderId = orderId;

    const jobs = await Production.find(filter)
      .populate('orderId')
      .populate('assignedEmployeeId')
      .sort({ startDate: -1 });

    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};