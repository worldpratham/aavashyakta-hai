const mongoose = require("mongoose");
const Job = require("../models/Job");
const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get single job details by ID - JobDetailPage
// @route   GET /api/jobs/:id
// @access  Public
const getJobDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid job ID format",
    });
  }

  const job = await Job.findById(id).populate(
    "employer_id",
    "name full_name email phone location avatar_url company_name company_type is_verified verification_status"
  );

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  res.status(200).json(job);
});

// @desc    Apply for a job - JobDetailPage
// @route   POST /api/applications
// @access  Private (Worker only)
const applyForJob = asyncHandler(async (req, res) => {
  if (req.user.role !== "worker") {
    return res.status(403).json({
      success: false,
      message: "Only workers can apply for jobs",
    });
  }

  const { jobId, job_id, expectedWage, expected_wage, message } = req.body;
  const targetJobId = jobId || job_id;
  const workerId = req.user.id || req.user._id;

  if (!targetJobId) {
    return res.status(400).json({
      success: false,
      message: "Job ID is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(targetJobId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid job ID format",
    });
  }

  const job = await Job.findById(targetJobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  if (job.status === "closed") {
    return res.status(400).json({
      success: false,
      message: "This job listing is closed and no longer accepting applications",
    });
  }

  const existingApplication = await Application.findOne({
    job_id: targetJobId,
    worker_id: workerId,
  });

  if (existingApplication) {
    return res.status(400).json({
      success: false,
      message: "You have already applied for this job",
    });
  }

  const wageValue = expectedWage !== undefined ? expectedWage : expected_wage;

  const application = await Application.create({
    job_id: targetJobId,
    worker_id: workerId,
    expected_wage: wageValue !== undefined && wageValue !== "" ? Number(wageValue) : null,
    message: message || "",
  });

  const populatedApp = await Application.findById(application._id)
    .populate("job_id")
    .populate("worker_id", "name full_name email phone location avatar_url");

  res.status(201).json(populatedApp);
});

module.exports = {
  getJobDetails,
  applyForJob,
};
