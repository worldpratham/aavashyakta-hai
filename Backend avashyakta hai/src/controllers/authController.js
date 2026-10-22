const { register } = require("./signUpController");
const { login } = require("./signInController");
const { getMe } = require("./profileController");
const { sendOtp, verifyOtp } = require("./otpController");
const {
  forgotPasswordSendOtp,
  resetPasswordWithOtp,
} = require("./forgotPasswordController");

module.exports = {
  register,
  login,
  getMe,
  sendOtp,
  verifyOtp,
  forgotPasswordSendOtp,
  resetPasswordWithOtp,
};

