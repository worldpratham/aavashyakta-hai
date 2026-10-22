const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  register,
  login,
  getMe,
  sendOtp,
  verifyOtp,
  forgotPasswordSendOtp,
  resetPasswordWithOtp,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password/send-otp", forgotPasswordSendOtp);
router.post("/forgot-password/reset", resetPasswordWithOtp);
router.get("/me", protect, getMe);

module.exports = router;
