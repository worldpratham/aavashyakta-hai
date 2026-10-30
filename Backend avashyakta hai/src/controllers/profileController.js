const Worker = require("../models/Worker");
const Employer = require("../models/Employer");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Get current logged in user profile - ProfilePage
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  let user = null;

  if (req.user.role === "employer") {
    user = await Employer.findById(userId).select("-password");
  } else if (req.user.role === "worker") {
    user = await Worker.findById(userId).select("-password");
  }

  if (!user) {
    user = await Worker.findById(userId).select("-password");
  }
  if (!user) {
    user = await Employer.findById(userId).select("-password");
  }
  if (!user) {
    user = await User.findById(userId).select("-password").catch(() => null);
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json(user);
});

// @desc    Get user profile by ID - ProfilePage
// @route   GET /api/users/:id
// @access  Public / Protected
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let user = await Worker.findById(id).select("-password");
  if (!user) {
    user = await Employer.findById(id).select("-password");
  }
  if (!user) {
    user = await User.findById(id).select("-password").catch(() => null);
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json(user);
});

// @desc    Update user profile - ProfilePage
// @route   PUT /api/users/:id
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const userId = (req.user.id || req.user._id).toString();

  if (userId !== req.params.id) {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to update this profile",
    });
  }

  let user = await Worker.findById(req.params.id);
  let isWorker = true;

  if (!user) {
    user = await Employer.findById(req.params.id);
    isWorker = false;
  }
  if (!user) {
    user = await User.findById(req.params.id).catch(() => null);
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const {
    name,
    full_name,
    phone,
    location,
    bio,
    profileImage,
    avatar_url,
    skills,
    company_name,
    company_type,
    gst_or_id,
    aadhaar_number,
    aadhaar_verified,
    primary_skill,
    experience_level,
    bank_details,
    payment_mode,
    upi_id,
    is_verified,
    verification_status,
    verification_badge,
    is_available_now,
    available_status_text,
    latitude,
    longitude,
  } = req.body;

  if (name !== undefined) user.full_name = name;
  if (full_name !== undefined) user.full_name = full_name;
  if (phone !== undefined) {
    if (phone === null || phone === "") {
      user.phone = "";
    } else {
      const cleanPhone = phone.toString().replace(/\D/g, "").slice(0, 10);
      if (cleanPhone.length !== 10) {
        return res.status(400).json({
          success: false,
          message: "Mobile number must be exactly 10 digits",
        });
      }
      user.phone = cleanPhone;
    }
  }
  if (location !== undefined) user.location = location;
  if (bio !== undefined) user.bio = bio;
  if (profileImage !== undefined) user.avatar_url = profileImage;
  if (avatar_url !== undefined) user.avatar_url = avatar_url;
  if (company_name !== undefined && user.company_name !== undefined) {
    user.company_name = company_name;
  }
  if (company_type !== undefined && user.company_type !== undefined) {
    user.company_type = company_type;
  }
  if (gst_or_id !== undefined && user.gst_or_id !== undefined) {
    user.gst_or_id = gst_or_id;
  }
  if (aadhaar_number !== undefined) {
    user.aadhaar_number = (aadhaar_number || "").toString().replace(/\s+/g, "");
  }
  if (aadhaar_verified !== undefined) {
    user.aadhaar_verified = Boolean(aadhaar_verified);
  }
  if (bank_details !== undefined && user.bank_details !== undefined) {
    user.bank_details = bank_details;
  }
  if (payment_mode !== undefined && user.payment_mode !== undefined) {
    user.payment_mode = payment_mode;
  }
  if (upi_id !== undefined && user.upi_id !== undefined) {
    user.upi_id = upi_id;
  }
  if (primary_skill !== undefined && user.primary_skill !== undefined) {
    user.primary_skill = primary_skill;
  }
  if (experience_level !== undefined && user.experience_level !== undefined) {
    user.experience_level = experience_level;
  }
  if (is_verified !== undefined && user.is_verified !== undefined) {
    user.is_verified = is_verified;
  }
  if (verification_status !== undefined && user.verification_status !== undefined) {
    user.verification_status = verification_status;
  }
  if (verification_badge !== undefined && user.verification_badge !== undefined) {
    user.verification_badge = verification_badge;
  }
  if (is_available_now !== undefined && user.is_available_now !== undefined) {
    user.is_available_now = Boolean(is_available_now);
    user.available_updated_at = new Date();
  }
  if (available_status_text !== undefined && user.available_status_text !== undefined) {
    user.available_status_text = available_status_text;
  }
  if (latitude !== undefined) {
    user.latitude = latitude !== null && !isNaN(Number(latitude)) ? Number(latitude) : null;
  }
  if (longitude !== undefined) {
    user.longitude = longitude !== null && !isNaN(Number(longitude)) ? Number(longitude) : null;
  }
  if (user.latitude && user.longitude) {
    user.geo_location = {
      type: "Point",
      coordinates: [Number(user.longitude), Number(user.latitude)],
    };
  }
  if (skills !== undefined && isWorker) {
    user.skills = Array.isArray(skills) ? skills : [skills];
  }

  await user.save();

  res.status(200).json({
    id: user._id,
    _id: user._id,
    name: user.full_name,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    location: user.location || "",
    bio: user.bio || "",
    skills: user.skills || [],
    primary_skill: user.primary_skill || "",
    experience_level: user.experience_level || "",
    company_name: user.company_name || "",
    company_type: user.company_type || "",
    gst_or_id: user.gst_or_id || "",
    aadhaar_number: user.aadhaar_number || "",
    aadhaar_verified: user.aadhaar_verified ?? false,
    bank_details: user.bank_details || null,
    payment_mode: user.payment_mode || "bank_transfer",
    upi_id: user.upi_id || "",
    is_verified: user.is_verified ?? true,
    verification_status: user.verification_status || "verified",
    verification_badge: user.verification_badge || "verified_worker",
    is_available_now: user.is_available_now ?? false,
    available_status_text: user.available_status_text || "",
    available_updated_at: user.available_updated_at || null,
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
    profileImage: user.avatar_url || "",
    avatar_url: user.avatar_url || "",
  });
});

// @desc    Get instant available workers (for LandingPage and worker showcase)
// @route   GET /api/users/workers/available
// @access  Public
const getAvailableWorkers = asyncHandler(async (req, res) => {
  const { skill, search, available_only } = req.query;
  const filter = { is_banned: { $ne: true } };

  if (available_only === "true") {
    filter.is_available_now = true;
  }

  if (skill) {
    filter.$or = [
      { primary_skill: new RegExp(skill, "i") },
      { skills: new RegExp(skill, "i") },
    ];
  }

  if (search) {
    const sRegex = new RegExp(search, "i");
    filter.$or = [
      { full_name: sRegex },
      { primary_skill: sRegex },
      { skills: sRegex },
      { location: sRegex },
      { bio: sRegex },
    ];
  }

  // Fetch workers prioritizing live available workers first, then recently active
  let workers = await Worker.find(filter)
    .select(
      "full_name phone location bio skills primary_skill experience_level is_verified verification_badge aadhaar_verified avatar_url is_available_now available_status_text available_updated_at latitude longitude geo_location createdAt"
    )
    .sort({ is_available_now: -1, available_updated_at: -1, createdAt: -1 })
    .limit(40);

  // If available_only was requested or workers found, return them
  res.status(200).json({
    success: true,
    count: workers.length,
    workers,
  });
});

// @desc    Get nearby workers using MongoDB 2dsphere GeoJSON query
// @route   GET /api/users/workers/nearby
// @access  Public
const getNearbyWorkers = asyncHandler(async (req, res) => {
  const { lat, lng, radiusKm = 15, skill, available_only } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: "Latitude and Longitude are required for nearby query",
    });
  }

  const latitude = Number(lat);
  const longitude = Number(lng);
  const maxDistanceMeters = Number(radiusKm) * 1000;

  const filter = {
    is_banned: { $ne: true },
    geo_location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  };

  if (available_only === "true") {
    filter.is_available_now = true;
  }

  if (skill) {
    filter.$or = [
      { primary_skill: new RegExp(skill, "i") },
      { skills: new RegExp(skill, "i") },
    ];
  }

  const workers = await Worker.find(filter)
    .select(
      "full_name phone location bio skills primary_skill experience_level is_verified verification_badge aadhaar_verified avatar_url is_available_now available_status_text available_updated_at latitude longitude geo_location createdAt"
    )
    .limit(50);

  res.status(200).json({
    success: true,
    count: workers.length,
    radiusKm: Number(radiusKm),
    workers,
  });
});

module.exports = {
  getMe,
  getUserById,
  updateProfile,
  getAvailableWorkers,
  getNearbyWorkers,
};
