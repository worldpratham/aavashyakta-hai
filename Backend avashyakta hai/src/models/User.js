const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
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
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    phone: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^[0-9]{10}$/.test(v);
        },
        message: "Mobile number must be exactly 10 digits",
      },
    },
    role: {
      type: String,
      enum: {
        values: ["employer", "worker", "admin"],
        message: "Role must be employer, worker, or admin",
      },
      required: [true, "Role is required"],
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
    },
    experience_level: {
      type: String,
      default: "",
    },
    company_name: {
      type: String,
      default: "",
    },
    company_type: {
      type: String,
      default: "",
    },
    gst_or_id: {
      type: String,
      default: "",
    },
    is_verified: {
      type: Boolean,
      default: true,
    },
    is_phone_verified: {
      type: Boolean,
      default: true,
    },
    verification_status: {
      type: String,
      default: "verified",
    },
    verification_badge: {
      type: String,
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
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        ret._id = ret._id;
        ret.name = ret.full_name;
        ret.full_name = ret.full_name;
        ret.profileImage = ret.avatar_url;
        ret.avatar_url = ret.avatar_url;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtual for name -> full_name
userSchema.virtual("name").get(function () {
  return this.full_name;
}).set(function (name) {
  this.full_name = name;
});

// Virtual for profileImage -> avatar_url
userSchema.virtual("profileImage").get(function () {
  return this.avatar_url;
}).set(function (img) {
  this.avatar_url = img;
});

// Compare password method: Direct plain-text comparison (with fallback for any legacy hashes)
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;

  // Direct match for plain-text password
  if (this.password === enteredPassword) {
    return true;
  }

  // Fallback check if the password in DB happens to be an old bcrypt hash
  const isBcrypt = this.password.startsWith("$2a$") || this.password.startsWith("$2b$");
  if (isBcrypt) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  return false;
};

module.exports = mongoose.model("User", userSchema);
