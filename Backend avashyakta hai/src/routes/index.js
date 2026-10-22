const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const jobRoutes = require("./jobRoutes");
const applicationRoutes = require("./applicationRoutes");
const adminRoutes = require("./adminRoutes");
const {
  login,
  register,
  sendOtp,
  verifyOtp,
  forgotPasswordSendOtp,
  resetPasswordWithOtp,
} = require("../controllers/authController");

// API health check
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API routes are working",
    timestamp: new Date().toISOString(),
  });
});

// Legacy root route aliases for maximum frontend compatibility
router.post("/login", login);
router.post("/register", register);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password/send-otp", forgotPasswordSendOtp);
router.post("/forgot-password/reset", resetPasswordWithOtp);

// Resource Routers
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
