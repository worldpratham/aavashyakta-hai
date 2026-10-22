const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const workerSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      default: "worker",
      enum: ["worker"],
    },
    is_banned: {
      type: Boolean,
      default: false,
    },
    skills: {
      type: [String],
      default: [],
    },
    primary_skill: {
      type: String,
      default: "",
      trim: true,
    },
    experience_level: {
      type: String,
      default: "Fresher / <1 Year",
      trim: true,
    },
    is_verified: {
      type: Boolean,
      default: true,
    },
    is_phone_verified: {
      type: Boolean,
      default: true,
    },
    verification_badge: {
      type: String,
      enum: ["unverified", "phone_verified", "verified_worker"],
      default: "verified_worker",
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    avatar_url: {
      type: String,
      default: "",
      trim: true,
    },
    aadhaar_number: {
      type: String,
      default: "",
      trim: true,
    },
    aadhaar_verified: {
      type: Boolean,
      default: false,
    },
    bank_details: {
      account_holder_name: { type: String, default: "" },
      account_number: { type: String, default: "" },
      ifsc_code: { type: String, default: "" },
      bank_name: { type: String, default: "" },
    },
    payment_mode: {
      type: String,
      default: "bank_transfer",
      enum: ["bank_transfer", "upi", "cash", ""],
    },
    upi_id: {
      type: String,
      default: "",
      trim: true,
    },
    terms_accepted: {
      type: Boolean,
      default: false,
    },
    terms_accepted_at: {
      type: Date,
      default: null,
    },
    is_available_now: {
      type: Boolean,
      default: false,
    },
    available_status_text: {
      type: String,
      default: "",
      trim: true,
    },
    available_updated_at: {
      type: Date,
      default: null,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    geo_location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
  },
  {
    timestamps: true,
    collection: "workers",
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        ret._id = ret._id;
        ret.name = ret.full_name;
        ret.full_name = ret.full_name;
        ret.profileImage = ret.avatar_url;
        ret.avatar_url = ret.avatar_url;
        ret.is_available_now = ret.is_available_now ?? false;
        ret.available_status_text = ret.available_status_text || "";
        ret.available_updated_at = ret.available_updated_at || null;
        ret.latitude = ret.latitude ?? null;
        ret.longitude = ret.longitude ?? null;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual for name -> full_name
workerSchema.virtual("name").get(function () {
  return this.full_name;
}).set(function (name) {
  this.full_name = name;
});

// Virtual for profileImage -> avatar_url
workerSchema.virtual("profileImage").get(function () {
  return this.avatar_url;
}).set(function (img) {
  this.avatar_url = img;
});

// Compare password method: Direct plain-text comparison (with fallback for legacy bcrypt hashes)
workerSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;

  if (this.password === enteredPassword) {
    return true;
  }

  const isBcrypt = this.password.startsWith("$") || this.password.startsWith("$");
  if (isBcrypt) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  return false;
};

// 2dsphere Geospatial Index for ultra-fast near-me live queries
workerSchema.index({ geo_location: "2dsphere" });

module.exports = mongoose.model("Worker", workerSchema, "workers");
