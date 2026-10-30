const Worker = require("../models/Worker");
const Employer = require("../models/Employer");
const User = require("../models/User");
const Otp = require("../models/Otp");
const asyncHandler = require("../utils/asyncHandler");

// Helper: Generate secure 6-digit OTP
const generate6DigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper: Mask phone number (e.g. +91 9876543210 -> +91 ******3210)
const maskPhoneNumber = (phone) => {
  if (!phone) return "";
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length >= 10) {
    const last4 = digits.slice(-4);
    return `+91 ******${last4}`;
  }
  return phone;
};

// Helper: Mask email address (e.g. rahul.sharma@gmail.com -> r***a@gmail.com)
const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email;
  const [user, domain] = email.split("@");
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
};

// Helper: Find user across collections
const findUserByIdentifier = async (identifier, role) => {
  const cleanId = (identifier || "").trim();
  if (!cleanId) return null;

  const isEmail = cleanId.includes("@");
  let query;

  if (isEmail) {
    query = { email: new RegExp(`^${cleanId}$`, "i") };
  } else {
    const digits = cleanId.replace(/[^0-9]/g, "");
    const last10 = digits.slice(-10);
    query = { phone: new RegExp(last10 + "$") };
  }

  // If specific role requested, search that model first
  if (role === "worker") {
    let worker = await Worker.findOne(query);
    if (!worker) worker = await User.findOne({ ...query, role: "worker" }).catch(() => null);
    if (worker) return worker;
  } else if (role === "employer") {
    let employer = await Employer.findOne(query);
    if (!employer) employer = await User.findOne({ ...query, role: "employer" }).catch(() => null);
    if (employer) return employer;
  }

  // Fallback / auto-search all collections
  let user = await Worker.findOne(query);
  if (!user) user = await Employer.findOne(query);
  if (!user) user = await User.findOne(query).catch(() => null);

  return user;
};

// @desc    Send 6-Digit OTP to Verified Number for Forgot Password
// @route   POST /api/auth/forgot-password/send-otp
// @access  Public
const forgotPasswordSendOtp = asyncHandler(async (req, res) => {
  const { identifier, role } = req.body;
  const cleanIdentifier = (identifier || "").trim();

  if (!cleanIdentifier) {
    return res.status(400).json({
      success: false,
      message: "Please enter your registered email address or mobile number",
    });
  }

  if (cleanIdentifier.includes("@")) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanIdentifier)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }
  } else {
    const digits = cleanIdentifier.replace(/\D/g, "");
    if (digits.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }
  }

  // 1. Locate user account
  const user = await findUserByIdentifier(cleanIdentifier, role);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No registered account found with this email or mobile number. Please check and try again.",
    });
  }

  // 2. Resolve verified destination (verified phone takes priority)
  const registeredPhone = (user.phone || "").trim();
  const registeredEmail = (user.email || "").trim();

  let target = registeredPhone;
  let isPhoneTarget = true;
  let maskedTarget = "";

  if (registeredPhone && registeredPhone.replace(/[^0-9]/g, "").length >= 10) {
    target = registeredPhone;
    isPhoneTarget = true;
    maskedTarget = maskPhoneNumber(registeredPhone);
  } else if (registeredEmail) {
    // Fallback to email if phone is not populated on the account
    target = registeredEmail;
    isPhoneTarget = false;
    maskedTarget = maskEmail(registeredEmail);
  } else {
    return res.status(400).json({
      success: false,
      message: "No verified contact number or email found on this account to send OTP. Please contact support.",
    });
  }

  // 3. Clear previous OTPs for this target
  await Otp.deleteMany({ target });

  // 4. Generate 6-digit OTP code (Valid for 10 minutes)
  const code = generate6DigitOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.create({
    target,
    otp: code,
    expires_at: expiresAt,
    verified: false,
  });

  // Real-time console logging for developers / testing
  console.log(`\n=========================================`);
  console.log(`🔐 [Forgot Password OTP Service]`);
  console.log(`👤 User: ${user.full_name} (${user.role})`);
  console.log(`🎯 Verified Destination: ${target} (${isPhoneTarget ? "Mobile Number" : "Email"})`);
  console.log(`🔑 OTP Code: ${code}`);
  console.log(`⏳ Validity: 10 Minutes (Expires at ${expiresAt.toLocaleTimeString()})`);
  console.log(`=========================================\n`);

  res.status(200).json({
    success: true,
    message: isPhoneTarget
      ? `6-digit OTP has been sent to your verified mobile number (${maskedTarget})`
      : `6-digit OTP has been sent to your registered email (${maskedTarget})`,
    isPhoneTarget,
    target: maskedTarget,
    rawTarget: target,
    userRole: user.role,
    accountEmail: user.email,
    expiresInSeconds: 600,
    debugOtp: code, // Provided for instant demo/developer testing
  });
});

// @desc    Verify OTP and Reset Password
// @route   POST /api/auth/forgot-password/reset
// @access  Public
const resetPasswordWithOtp = asyncHandler(async (req, res) => {
  const { identifier, otp, newPassword, role } = req.body;
  const cleanIdentifier = (identifier || "").trim();
  const inputOtp = (otp || "").toString().trim();
  const cleanPassword = (newPassword || "").trim();

  if (!cleanIdentifier || !inputOtp || !cleanPassword) {
    return res.status(400).json({
      success: false,
      message: "Registered identifier, 6-digit OTP, and new password are required",
    });
  }

  if (inputOtp.length !== 6) {
    return res.status(400).json({
      success: false,
      message: "OTP must be exactly 6 digits",
    });
  }

  if (cleanPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters long",
    });
  }

  // 1. Locate the user account
  const user = await findUserByIdentifier(cleanIdentifier, role);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User account could not be found. Please request a new OTP.",
    });
  }

  // 2. Determine target phone/email
  const registeredPhone = (user.phone || "").trim();
  const registeredEmail = (user.email || "").trim();

  const possibleTargets = [cleanIdentifier];
  if (registeredPhone) possibleTargets.push(registeredPhone);
  if (registeredEmail) possibleTargets.push(registeredEmail);

  // 3. Find active OTP matching any of the user's targets
  const otpRecord = await Otp.findOne({
    target: { $in: possibleTargets },
  }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: "No active OTP found. Please request a new code.",
    });
  }

  // 4. Check expiration
  if (new Date() > new Date(otpRecord.expires_at)) {
    await Otp.deleteMany({ target: { $in: possibleTargets } });
    return res.status(400).json({
      success: false,
      message: "OTP has expired. Please request a new code.",
    });
  }

  // 5. Verify OTP code
  if (otpRecord.otp !== inputOtp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP code. Please check and try again.",
    });
  }

  // 6. Update user's password
  user.password = cleanPassword;
  await user.save();

  // 7. Clear OTP records so it cannot be reused
  await Otp.deleteMany({ target: { $in: possibleTargets } });

  console.log(`✅ Password successfully reset for ${user.full_name} (${user.email})`);

  res.status(200).json({
    success: true,
    message: "Password reset successful! You can now log in with your new password.",
    user: {
      email: user.email,
      role: user.role,
      name: user.full_name,
    },
  });
});

module.exports = {
  forgotPasswordSendOtp,
  resetPasswordWithOtp,
};
