const Job = require("../models/Job");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get all jobs (with search, category, location filters) - LandingPage & JobsPage
// @route   GET /api/jobs
// @access  Public
const getAllJobs = asyncHandler(async (req, res) => {
  const { category, location, status = "open", search } = req.query;

  const filter = {};
  if (status) {
    filter.status = status;
  }
  if (category) {
    filter.category = new RegExp(category, "i");
  }
  if (location) {
    filter.location = new RegExp(location, "i");
  }
  if (search) {
    filter.$or = [
      { title: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
      { job: new RegExp(search, "i") },
    ];
  }

  const jobs = await Job.find(filter)
    .populate("employer_id", "name full_name email phone location avatar_url company_name company_type is_verified verification_status")
    .sort({ createdAt: -1 });

  res.status(200).json(jobs);
});

// @desc    Get aggregated job statistics (by city & category) - LandingPage
// @route   GET /api/jobs/stats
// @access  Public
const getJobStats = asyncHandler(async (req, res) => {
  const [totalJobs, rawByCategory, rawByCity] = await Promise.all([
    Job.countDocuments({ status: "open" }),
    Job.aggregate([
      { $match: { status: "open" } },
      {
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "job_id",
          as: "applications",
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          appliedCount: { $sum: { $size: "$applications" } },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Job.aggregate([
      {
        $match: {
          status: "open",
          location: { $exists: true, $type: "string", $nin: ["", null] },
        },
      },
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  // Consolidate categories (clean whitespace, proper Title Case)
  const categoryMap = new Map();
  rawByCategory.forEach((item) => {
    if (!item._id || typeof item._id !== "string") return;
    const trimmed = item._id.trim();
    if (!trimmed) return;

    const formattedCat = trimmed
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    const key = formattedCat.toLowerCase();
    if (categoryMap.has(key)) {
      const existing = categoryMap.get(key);
      existing.count += item.count;
      existing.appliedCount += item.appliedCount || 0;
    } else {
      categoryMap.set(key, {
        _id: formattedCat,
        count: item.count,
        appliedCount: item.appliedCount || 0,
      });
    }
  });

  const byCategory = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);

  // Consolidate and format city names (clean whitespace, group similar cities)
  const cityMap = new Map();

  rawByCity.forEach((item) => {
    if (!item._id || typeof item._id !== "string") return;
    const trimmed = item._id.trim();
    if (!trimmed) return;

    // If city contains comma (e.g. "Bhopal, Madhya Pradesh"), extract primary city
    let cityName = trimmed;
    if (trimmed.includes(",")) {
      const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        cityName = parts[0];
      }
    }

    // Capitalize each word nicely (Title Case, e.g. "surat" -> "Surat")
    const formattedCity = cityName
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    const key = formattedCity.toLowerCase();
    if (cityMap.has(key)) {
      cityMap.get(key).count += item.count;
    } else {
      cityMap.set(key, {
        _id: formattedCity,
        count: item.count,
      });
    }
  });

  const byCity = Array.from(cityMap.values()).sort((a, b) => b.count - a.count);

  res.status(200).json({
    success: true,
    totalJobs,
    byCategory,
    byCity,
  });
});

module.exports = {
  getAllJobs,
  getJobStats,
};

