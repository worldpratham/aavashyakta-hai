const mongoose = require("mongoose");
const User = require("../models/User");
const Worker = require("../models/Worker");
const Employer = require("../models/Employer");
const Job = require("../models/Job");
const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get complete platform stats for Manager
// @route   GET /api/admin/stats
// @access  Private (Manager Only)
const getAdminStats = asyncHandler(async (req, res) => {
  const [
    workerCount,
    employerCount,
    totalJobs,
    openJobs,
    closedJobs,
    totalApplications,
    completedApplications,
    paidApplications,
  ] = await Promise.all([
    Worker.countDocuments({ email: { $ne: "manager@gmail.com" } }),
    Employer.countDocuments({ email: { $ne: "manager@gmail.com" } }),
    Job.countDocuments(),
    Job.countDocuments({ status: "open" }),
    Job.countDocuments({ status: "closed" }),
    Application.countDocuments(),
    Application.countDocuments({ status: "completed" }),
    Application.countDocuments({ status: "paid" }),
  ]);

  // Payment mode breakdown
  const [cashCount, upiCount, bankCount] = await Promise.all([
    Application.countDocuments({ payment_mode: "cash" }),
    Application.countDocuments({ payment_mode: "upi" }),
    Application.countDocuments({ payment_mode: "bank_transfer" }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      totalWorkers: workerCount,
      totalEmployers: employerCount,
      totalUsers: workerCount + employerCount,
      totalJobs,
      openJobs,
      closedJobs,
      totalApplications,
      completedApplications,
      paidApplications,
      payouts: {
        cash: cashCount,
        upi: upiCount,
        bank: bankCount,
      },
    },
  });
});

// @desc    Get all users (Workers & Employers) for Manager
// @route   GET /api/admin/users
// @access  Private (Manager Only)
const getAdminUsers = asyncHandler(async (req, res) => {
  const [workers, employers] = await Promise.all([
    Worker.find({ email: { $ne: "manager@gmail.com" } })
      .select("-password")
      .sort({ createdAt: -1 }),
    Employer.find({ email: { $ne: "manager@gmail.com" } })
      .select("-password")
      .sort({ createdAt: -1 }),
  ]);

  const formattedWorkers = workers.map((w) => ({
    id: w._id,
    _id: w._id,
    name: w.full_name,
    full_name: w.full_name,
    email: w.email,
    phone: w.phone || "",
    role: "worker",
    location: w.location || "",
    skills: w.skills || [],
    primary_skill: w.primary_skill || "",
    experience_level: w.experience_level || "",
    is_verified: w.is_verified ?? true,
    verification_status: w.verification_status || "verified",
    is_banned: Boolean(w.is_banned),
    avatar_url: w.avatar_url || "",
    payment_mode: w.payment_mode || "",
    createdAt: w.createdAt,
  }));

  const formattedEmployers = employers.map((e) => ({
    id: e._id,
    _id: e._id,
    name: e.full_name,
    full_name: e.full_name,
    email: e.email,
    phone: e.phone || "",
    role: "employer",
    location: e.location || "",
    company_name: e.company_name || "",
    company_type: e.company_type || "",
    is_verified: e.is_verified ?? true,
    verification_status: e.verification_status || "verified",
    is_banned: Boolean(e.is_banned),
    avatar_url: e.avatar_url || "",
    createdAt: e.createdAt,
  }));

  const allUsers = [...formattedEmployers, ...formattedWorkers];

  res.status(200).json({
    success: true,
    count: allUsers.length,
    users: allUsers,
  });
});

// @desc    Toggle user verification
// @route   PUT /api/admin/users/:id/verify
// @access  Private (Manager Only)
const toggleUserVerification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_verified, verification_status } = req.body;

  let user = await Worker.findById(id);
  if (!user) user = await Employer.findById(id);
  if (!user) user = await User.findById(id).catch(() => null);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const newVerified = is_verified !== undefined ? Boolean(is_verified) : !user.is_verified;
  user.is_verified = newVerified;
  user.verification_status = verification_status || (newVerified ? "verified" : "unverified");
  await user.save();

  res.status(200).json({
    success: true,
    message: `User verification updated to ${newVerified ? "Verified" : "Unverified"}`,
    user: {
      id: user._id,
      is_verified: user.is_verified,
      verification_status: user.verification_status,
    },
  });
});

// @desc    Toggle user ban/block status
// @route   PUT /api/admin/users/:id/ban
// @access  Private (Manager Only)
const toggleUserBan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_banned } = req.body;

  let user = await Worker.findById(id);
  if (!user) user = await Employer.findById(id);
  if (!user) user = await User.findById(id).catch(() => null);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const newBanned = is_banned !== undefined ? Boolean(is_banned) : !user.is_banned;
  user.is_banned = newBanned;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User has been ${newBanned ? "Suspended / Blocked" : "Unblocked"}`,
    user: {
      id: user._id,
      is_banned: user.is_banned,
    },
  });
});

// @desc    Get all jobs for moderation
// @route   GET /api/admin/jobs
// @access  Private (Manager Only)
const getAdminJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find()
    .populate("employer_id", "full_name name email phone company_name location is_verified")
    .sort({ createdAt: -1 });

  // Get application count per job
  const jobsWithCount = await Promise.all(
    jobs.map(async (job) => {
      const appCount = await Application.countDocuments({ job_id: job._id });
      const jobObj = job.toObject();
      jobObj.id = jobObj._id;
      jobObj.applicationsCount = appCount;
      return jobObj;
    })
  );

  res.status(200).json({
    success: true,
    jobs: jobsWithCount,
  });
});

// @desc    Delete any job (moderation)
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Manager Only)
const deleteAdminJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await Job.findById(id);
  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  // Delete all applications for this job
  await Application.deleteMany({ job_id: id });
  await job.deleteOne();

  res.status(200).json({
    success: true,
    message: "Job and its applications deleted successfully by Manager",
  });
});

// @desc    Get all applications & payouts for Manager
// @route   GET /api/admin/applications
// @access  Private (Manager Only)
const getAdminApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find()
    .populate("job_id", "title category wage wage_type location employer_id")
    .populate(
      "worker_id",
      "name full_name email phone location avatar_url skills primary_skill bank_details payment_mode upi_id"
    )
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    applications,
  });
});

module.exports = {
  getAdminStats,
  getAdminUsers,
  toggleUserVerification,
  toggleUserBan,
  getAdminJobs,
  deleteAdminJob,
  getAdminApplications,
};
