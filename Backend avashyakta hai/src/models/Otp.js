const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    target: {
      type: String,
      required: [true, "Phone or email target is required"],
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, "OTP is required"],
      trim: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB automatic TTL deletion when current time >= expires_at
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "otps",
  }
);

module.exports = mongoose.model("Otp", otpSchema);
