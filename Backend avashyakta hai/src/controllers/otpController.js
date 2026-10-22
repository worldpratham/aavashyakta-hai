const Otp = require("../models/Otp");
const asyncHandler = require("../utils/asyncHandler");

// Generate a secure random 6-digit OTP
const generate6DigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send 6-Digit OTP to Mobile Number or Email
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = asyncHandler(async (req, res) => {
  const { phone, email, purpose = "verification" } = req.body;
  const target = (phone || email || "").trim();

  if (!target) {
    return res.status(400).json({
      success: false,
      message: "Mobile number or email is required to send OTP",
    });
  }

  // Basic mobile number / email validation
  if (phone && !/^[0-9]{10,13}$/.test(target.replace(/[^0-9]/g, ""))) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid 10-digit mobile number",
    });
  }

  // Delete previous pending OTPs for this target
  await Otp.deleteMany({ target });

  // Generate 6-digit OTP code
  const code = generate6DigitOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

  await Otp.create({
    target,
    otp: code,
    expires_at: expiresAt,
    verified: false,
  });

  // Log in console for real-time visibility during development/testing
  console.log(`\n=========================================`);
  console.log(`🔐 [OTP Service] 6-Digit Code Generated`);
  console.log(`📱 Target: ${target}`);
  console.log(`🔑 OTP: ${code}`);
  console.log(`⏳ Valid For: 5 Minutes (Expires at ${expiresAt.toLocaleTimeString()})`);
  console.log(`📌 Purpose: ${purpose}`);
  console.log(`=========================================\n`);

  res.status(200).json({
    success: true,
    message: `6-Digit OTP sent successfully to ${target}`,
    target,
    expiresInSeconds: 300,
    // Provide debugOtp in response for instant developer testing
    debugOtp: code,
  });
});

// @desc    Verify 6-Digit OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, email, otp } = req.body;
  const target = (phone || email || "").trim();
  const inputOtp = (otp || "").toString().trim();

  if (!target || !inputOtp) {
    return res.status(400).json({
      success: false,
      message: "Target (phone/email) and 6-digit OTP are required",
    });
  }

  if (inputOtp.length !== 6) {
    return res.status(400).json({
      success: false,
      message: "OTP must be exactly 6 digits",
    });
  }

  const record = await Otp.findOne({ target }).sort({ createdAt: -1 });

  if (!record) {
    return res.status(400).json({
      success: false,
      message: "No active OTP found. Please request a new code.",
    });
  }

  if (new Date() > new Date(record.expires_at)) {
    await Otp.deleteMany({ target });
    return res.status(400).json({
      success: false,
      message: "OTP has expired. Please request a new code.",
    });
  }

  if (record.otp !== inputOtp) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP code. Please check and try again.",
    });
  }

  // Mark as verified
  record.verified = true;
  await record.save();

  res.status(200).json({
    success: true,
    message: "OTP verified successfully!",
    verified: true,
    target,
  });
});

module.exports = {
  sendOtp,
  verifyOtp,
};
