const Worker = require("../models/Worker");
const Employer = require("../models/Employer");
const User = require("../models/User");
const { generateToken } = require("../utils/token");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Authenticate user & get token (Worker or Employer) - SignInPage
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const cleanEmail = email.trim();
  const emailRegex = new RegExp(`^${cleanEmail}$`, "i");

  let user = null;

  // Helpers to check collections
  const findWorkerAccount = async () => {
    let acc = await Worker.findOne({ email: emailRegex });
    if (!acc) {
      acc = await User.findOne({ email: emailRegex, role: "worker" }).catch(() => null);
    }
    return acc;
  };

  const findEmployerAccount = async () => {
    let acc = await Employer.findOne({ email: emailRegex });
    if (!acc) {
      acc = await User.findOne({ email: emailRegex, role: "employer" }).catch(() => null);
    }
    return acc;
  };

  const isManagerEmail = cleanEmail.toLowerCase() === "manager@gmail.com";

  if (isManagerEmail) {
    user = await User.findOne({ email: emailRegex });
    if (!user) user = await Employer.findOne({ email: emailRegex });
    if (!user) user = await Worker.findOne({ email: emailRegex });
  } else if (role === "worker") {
    // Attempt to find worker account
    user = await findWorkerAccount();

    if (!user) {
      // Check if this account actually belongs to a Recruiter / Employer
      const employerAccount = await findEmployerAccount();
      if (employerAccount) {
        return res.status(400).json({
          success: false,
          roleMismatch: true,
          targetRole: "employer",
          message: "Please Shift to Recruiter login",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } else if (role === "employer") {
    // Attempt to find employer account
    user = await findEmployerAccount();

    if (!user) {
      // Check if this account actually belongs to a Worker
      const workerAccount = await findWorkerAccount();
      if (workerAccount) {
        return res.status(400).json({
          success: false,
          roleMismatch: true,
          targetRole: "worker",
          message: "Please Shift to Worker login",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } else {
    // If no role was passed, fallback to search Worker -> Employer -> User
    user = await Worker.findOne({ email: emailRegex });
    if (!user) {
      user = await Employer.findOne({ email: emailRegex });
    }
    if (!user) {
      user = await User.findOne({ email: emailRegex }).catch(() => null);
    }
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  if (user.is_banned) {
    return res.status(403).json({
      success: false,
      message: "Your account has been suspended by the administrator / आपका खाता एडमिन द्वारा ब्लॉक कर दिया गया है",
    });
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: "Login successful",
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
    },
  });
});

module.exports = {
  login,
};
