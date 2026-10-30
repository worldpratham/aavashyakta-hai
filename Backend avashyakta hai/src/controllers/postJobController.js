const Job = require("../models/Job");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Create a new job - PostJobPage
// @route   POST /api/jobs
// @access  Private (Employer only)
const createJob = asyncHandler(async (req, res) => {
  if (req.user.role !== "employer") {
    return res.status(403).json({
      success: false,
      message: "Only employers can post jobs",
    });
  }

  const employerId = req.user.id || req.user._id;

  const {
    title,
    description,
    category,
    location,
    address,
    job,
    taskDetails,
    task_details,
    wage,
    wageType,
    wage_type,
    phone,
    latitude,
    longitude,
  } = req.body;

  if (!title || !description || !category || !location) {
    return res.status(400).json({
      success: false,
      message: "Title, description, category, and location are required",
    });
  }

  const resolvedWageType = wageType || wage_type;
  if (wage === undefined || wage === null || wage === "") {
    return res.status(400).json({
      success: false,
      message: "Wage is required",
    });
  }

  if (!resolvedWageType) {
    return res.status(400).json({
      success: false,
      message: "Wage type is required (task, daily, weekly, monthly, fixed)",
    });
  }

  let resolvedCategory = typeof category === "string" ? category.trim() : "";
  if (
    (resolvedCategory.toLowerCase() === "other" || !resolvedCategory) &&
    job &&
    typeof job === "string" &&
    job.trim()
  ) {
    resolvedCategory = job.trim();
  }

  let cleanPhone = "";
  if (phone && typeof phone === "string" && phone.trim()) {
    cleanPhone = phone.replace(/\D/g, "").slice(0, 10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Contact phone must be a valid 10-digit mobile number",
      });
    }
  }

  const jobData = {
    employer_id: employerId,
    title: typeof title === "string" ? title.trim() : title,
    description: typeof description === "string" ? description.trim() : description,
    category: resolvedCategory || "Other",
    location: typeof location === "string" ? location.trim() : location,
    address: typeof address === "string" ? address.trim() : "",
    job: typeof job === "string" ? job.trim() : "",
    task_details: taskDetails || task_details || "",
    wage: Number(wage),
    wage_type: resolvedWageType,
    phone: cleanPhone,
    latitude: latitude !== undefined && latitude !== null && !isNaN(Number(latitude)) ? Number(latitude) : null,
    longitude: longitude !== undefined && longitude !== null && !isNaN(Number(longitude)) ? Number(longitude) : null,
    status: "open",
  };

  if (jobData.latitude && jobData.longitude) {
    jobData.geo_location = {
      type: "Point",
      coordinates: [jobData.longitude, jobData.latitude],
    };
  }

  const createdJob = await Job.create(jobData);

  const populatedJob = await Job.findById(createdJob._id).populate(
    "employer_id",
    "name full_name email phone location avatar_url"
  );

  res.status(201).json(populatedJob);
});

module.exports = {
  createJob,
};
