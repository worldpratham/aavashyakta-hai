const mongoose = require("mongoose");
const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get all applications submitted by a worker - MyApplicationsPage
// @route   GET /api/applications/worker/:id
// @access  Private (Worker)
const getWorkerApplications = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid worker ID format",
    });
  }

  const applications = await Application.find({ worker_id: id })
    .populate("job_id")
    .populate(
      "worker_id",
      "name full_name email phone location avatar_url bank_details payment_mode upi_id"
    )
    .sort({ createdAt: -1 });

  res.status(200).json(applications);
});

// @desc    Delete / withdraw an application - MyApplicationsPage
// @route   DELETE /api/applications/:id
// @access  Private (Worker)
const withdrawApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid application ID format",
    });
  }

  const application = await Application.findById(id);
  if (!application) {
    return res.status(404).json({
      success: false,
      message: "Application not found",
    });
  }

  const currentUserId = (req.user.id || req.user._id).toString();
  if (application.worker_id.toString() !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to delete this application",
    });
  }

  await application.deleteOne();

  res.status(200).json({
    success: true,
    message: "Application deleted successfully",
  });
});

module.exports = {
  getWorkerApplications,
  withdrawApplication,
};
