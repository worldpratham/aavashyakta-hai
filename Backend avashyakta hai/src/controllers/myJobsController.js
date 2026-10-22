const mongoose = require("mongoose");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Worker = require("../models/Worker");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get all jobs created by a specific employer - MyJobsPage
// @route   GET /api/jobs/employer/:id
// @access  Public / Protected
const getEmployerJobs = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid employer ID format",
    });
  }

  const jobs = await Job.find({ employer_id: id })
    .populate("employer_id", "name full_name email phone location avatar_url company_name company_type is_verified verification_status")
    .sort({ createdAt: -1 });

  res.status(200).json(jobs);
});

// @desc    Update a job - MyJobsPage
// @route   PUT /api/jobs/:id
// @access  Private (Employer/Owner only)
const updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid job ID format",
    });
  }

  const job = await Job.findById(id);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  const userId = req.user.id || req.user._id;
  if (job.employer_id.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to update this job",
    });
  }

  const {
    title,
    description,
    category,
    location,
    address,
    job: jobName,
    taskDetails,
    task_details,
    wage,
    wageType,
    wage_type,
    phone,
    status,
  } = req.body;

  if (title !== undefined) job.title = title;
  if (description !== undefined) job.description = description;
  if (category !== undefined) job.category = category;
  if (location !== undefined) job.location = location;
  if (address !== undefined) job.address = address;
  if (jobName !== undefined) job.job = jobName;
  if (taskDetails !== undefined || task_details !== undefined) {
    job.task_details = taskDetails !== undefined ? taskDetails : task_details;
  }
  if (wage !== undefined) job.wage = Number(wage);
  if (wageType !== undefined || wage_type !== undefined) {
    job.wage_type = wageType !== undefined ? wageType : wage_type;
  }
  if (phone !== undefined) job.phone = phone;
  if (status !== undefined) {
    if (!["open", "closed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value (open or closed)",
      });
    }
    job.status = status;
  }

  const updatedJob = await job.save();

  const populatedJob = await Job.findById(updatedJob._id).populate(
    "employer_id",
    "name full_name email phone location avatar_url"
  );

  res.status(200).json(populatedJob);
});

// @desc    Delete a job - MyJobsPage
// @route   DELETE /api/jobs/:id
// @access  Private (Employer/Owner only)
const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid job ID format",
    });
  }

  const job = await Job.findById(id);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  const userId = req.user.id || req.user._id;
  if (job.employer_id.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to delete this job",
    });
  }

  await job.deleteOne();

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
});

// @desc    Get all applications for a specific job - MyJobsPage
// @route   GET /api/applications/job/:id
// @access  Private (Employer/Job owner)
const getJobApplications = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid job ID format",
    });
  }

  const job = await Job.findById(id);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  const currentUserId = (req.user.id || req.user._id).toString();
  if (job.employer_id.toString() !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to view applications for this job",
    });
  }

  const applications = await Application.find({ job_id: id })
    .populate("worker_id", "name full_name email phone location bio avatar_url skills primary_skill experience_level is_verified verification_badge bank_details payment_mode upi_id")
    .populate("job_id", "title wage wage_type task_details location")
    .sort({ createdAt: -1 });

  res.status(200).json(applications);
});

// @desc    Update application status - MyJobsPage / MyApplicationsPage
// @route   PUT /api/applications/:id
// @access  Private (Employer or Worker based on action)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    status,
    payment_mode,
    paymentMode,
    upi_id,
    upiId,
    bank_details,
    bankDetails,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid application ID format",
    });
  }

  if (!["pending", "accepted", "rejected", "hired", "completed", "paid"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status value (pending, accepted, rejected, hired, completed, paid)",
    });
  }

  const application = await Application.findById(id).populate("job_id");
  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  const currentUserId = (req.user.id || req.user._id).toString();
  const employerId = application.job_id?.employer_id
    ? application.job_id.employer_id.toString()
    : "";
  const workerId = application.worker_id
    ? application.worker_id.toString()
    : "";

  const isEmployer = employerId === currentUserId;
  const isWorker = workerId === currentUserId;

  if (!isEmployer && !isWorker) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to modify this application",
    });
  }

  // Work complete can ONLY be marked by the WORKER
  if (status === "completed") {
    if (!isWorker) {
      return res.status(403).json({
        success: false,
        message: "Only the worker can mark work as completed / सिर्फ कामगार ही काम पूरा मार्क कर सकता है",
      });
    }

    const selectedMode = payment_mode !== undefined ? payment_mode : paymentMode;
    const selectedUpi = upi_id !== undefined ? upi_id : upiId;
    const selectedBank = bank_details !== undefined ? bank_details : bankDetails;

    if (selectedMode !== undefined) application.payment_mode = selectedMode;
    if (selectedUpi !== undefined) application.upi_id = selectedUpi;
    if (selectedBank !== undefined) application.bank_details = selectedBank;

    // Also update Worker's profile so their payment preferences are preserved
    try {
      const worker = await Worker.findById(workerId);
      if (worker) {
        if (selectedMode) worker.payment_mode = selectedMode;
        if (selectedUpi !== undefined) worker.upi_id = selectedUpi;
        if (selectedBank) worker.bank_details = selectedBank;
        await worker.save();
      }
    } catch (saveWorkerErr) {
      console.warn("Failed to update worker profile payment details:", saveWorkerErr.message);
    }
  }

  // Payment released can ONLY be marked by the EMPLOYER
  if (status === "paid" && !isEmployer) {
    return res.status(403).json({
      success: false,
      message: "Only the employer can mark payment as released",
    });
  }

  // Hiring or rejecting can ONLY be done by the EMPLOYER
  if (["accepted", "hired", "rejected"].includes(status) && !isEmployer) {
    return res.status(403).json({
      success: false,
      message: "Only the employer can accept, hire, or reject applications",
    });
  }

  application.status = status;
  await application.save();

  const updatedApplication = await Application.findById(id)
    .populate("job_id")
    .populate(
      "worker_id",
      "name full_name email phone location bio avatar_url skills primary_skill experience_level is_verified verification_badge bank_details payment_mode upi_id"
    );

  res.status(200).json(updatedApplication);
});

module.exports = {
  getEmployerJobs,
  updateJob,
  deleteJob,
  getJobApplications,
  updateApplicationStatus,
};
