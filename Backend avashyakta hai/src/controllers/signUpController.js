const Worker = require("../models/Worker");
const Employer = require("../models/Employer");
const User = require("../models/User");
const { generateToken } = require("../utils/token");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Register a new user (Worker or Employer) - SignUpPage
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const body = req.body || {};

  const displayName = (body.full_name || body.name || body.fullName || "").trim();
  const cleanEmail = (body.email || "").trim().toLowerCase();
  const cleanRole = (body.role || "").trim().toLowerCase();
  const cleanPassword = body.password || "";
  const cleanPhone = (body.phone || "").replace(/\D/g, "").slice(0, 10);
  const cleanLocation = (body.location || "").trim();
  const cleanCompany = (body.company_name || body.companyName || "").trim();
  const cleanCompanyType = body.company_type || body.companyType || "Company / Business";
  const cleanGstOrId = (body.gst_or_id || body.gstOrId || "").trim();
  const cleanAadhaar = (body.aadhaar_number || body.aadhaarNumber || "").replace(/\s+/g, "");
  const cleanAadhaarVerified = body.aadhaar_verified ?? body.aadhaarVerified ?? true;
  const cleanPrimarySkill = body.primary_skill || body.primarySkill || "";
  const cleanExperience = body.experience_level || body.experienceLevel || "Fresher / <1 Year";
  const cleanAvatar = body.profileImage || body.avatar_url || body.avatarUrl || "";
  const cleanBio = body.bio || "";
  const cleanBankDetails = body.bank_details || body.bankDetails || null;
  const cleanPaymentMode = body.payment_mode || body.paymentMode || "bank_transfer";
  const cleanUpiId = body.upi_id || body.upiId || "";
  const cleanTerms = body.terms_accepted ?? body.termsAccepted ?? true;

  const rawSkills = body.skills;
  const skillList = Array.isArray(rawSkills)
    ? rawSkills
    : rawSkills
    ? [rawSkills]
    : cleanPrimarySkill
    ? [cleanPrimarySkill]
    : [];

  if (!displayName || !cleanEmail || !cleanPassword || !cleanRole) {
    return res.status(400).json({
      success: false,
      message: "Name, email, password, and role are required",
    });
  }

  if (!["worker", "employer"].includes(cleanRole)) {
    return res.status(400).json({
      success: false,
      message: "Role must be either worker or employer",
    });
  }

  const emailRegexPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegexPattern.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address",
    });
  }

  if (body.phone && cleanPhone.length !== 10) {
    return res.status(400).json({
      success: false,
      message: "Mobile number must be exactly 10 digits",
    });
  }

  const emailRegex = new RegExp(`^${cleanEmail}$`, "i");

  // Check existence across all collections
  const [existingWorker, existingEmployer, existingUser] = await Promise.all([
    Worker.findOne({ email: emailRegex }),
    Employer.findOne({ email: emailRegex }),
    User.findOne({ email: emailRegex }).catch(() => null),
  ]);

  if (existingWorker || existingEmployer || existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists with this email address",
    });
  }

  let user;
  if (cleanRole === "employer") {
    // 1. Save to employers collection
    user = await Employer.create({
      full_name: displayName,
      email: cleanEmail,
      password: cleanPassword,
      role: "employer",
      phone: cleanPhone,
      company_name: cleanCompany || displayName,
      company_type: cleanCompanyType,
      gst_or_id: cleanGstOrId,
      aadhaar_number: cleanAadhaar,
      aadhaar_verified: cleanAadhaarVerified,
      is_verified: true,
      verification_status: "verified",
      location: cleanLocation,
      bio: cleanBio,
      avatar_url: cleanAvatar,
    });

    // 2. Also sync to users collection
    await User.create({
      _id: user._id,
      full_name: displayName,
      email: cleanEmail,
      password: cleanPassword,
      role: "employer",
      phone: cleanPhone,
      company_name: cleanCompany || displayName,
      company_type: cleanCompanyType,
      gst_or_id: cleanGstOrId,
      aadhaar_number: cleanAadhaar,
      aadhaar_verified: cleanAadhaarVerified,
      is_verified: true,
      verification_status: "verified",
      location: cleanLocation,
      bio: cleanBio,
      avatar_url: cleanAvatar,
    }).catch((err) => console.warn("User sync warning:", err.message));
  } else {
    // 1. Save to workers collection
    user = await Worker.create({
      full_name: displayName,
      email: cleanEmail,
      password: cleanPassword,
      role: "worker",
      phone: cleanPhone,
      primary_skill: cleanPrimarySkill || (skillList[0] || ""),
      experience_level: cleanExperience,
      is_verified: true,
      verification_badge: "verified_worker",
      skills: skillList,
      location: cleanLocation,
      bio: cleanBio,
      avatar_url: cleanAvatar,
      aadhaar_number: cleanAadhaar,
      aadhaar_verified: cleanAadhaarVerified,
      bank_details: cleanBankDetails || {
        account_holder_name: displayName,
        account_number: "",
        ifsc_code: "",
        bank_name: "",
      },
      payment_mode: cleanPaymentMode,
      upi_id: cleanUpiId,
      terms_accepted: cleanTerms,
      terms_accepted_at: cleanTerms ? new Date() : null,
    });

    // 2. Also sync to users collection
    await User.create({
      _id: user._id,
      full_name: displayName,
      email: cleanEmail,
      password: cleanPassword,
      role: "worker",
      phone: cleanPhone,
      primary_skill: cleanPrimarySkill || (skillList[0] || ""),
      experience_level: cleanExperience,
      is_verified: true,
      verification_status: "verified",
      skills: skillList,
      location: cleanLocation,
      bio: cleanBio,
      avatar_url: cleanAvatar,
      aadhaar_number: cleanAadhaar,
      bank_details: cleanBankDetails,
      payment_mode: cleanPaymentMode,
      upi_id: cleanUpiId,
      terms_accepted: cleanTerms,
    }).catch((err) => console.warn("User sync warning:", err.message));
  }

  console.log(`✅ [SignUp] Registered new ${cleanRole}: ${cleanEmail} (ID: ${user._id})`);
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    token,
    user: {
      _id: user._id,
      id: user._id,
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
      is_verified: user.is_verified ?? true,
      verification_status: user.verification_status || "verified",
      verification_badge: user.verification_badge || "verified_worker",
      profileImage: user.avatar_url || "",
      avatar_url: user.avatar_url || "",
      aadhaar_number: user.aadhaar_number || "",
      aadhaar_verified: user.aadhaar_verified ?? false,
      bank_details: user.bank_details || null,
      payment_mode: user.payment_mode || "bank_transfer",
      upi_id: user.upi_id || "",
      terms_accepted: user.terms_accepted ?? false,
    },
  });
});

module.exports = {
  register,
};
