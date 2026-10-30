const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const employerSchema = new mongoose.Schema(
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
      default: "employer",
      enum: ["employer", "admin"],
    },
    is_banned: {
      type: Boolean,
      default: false,
    },
    company_name: {
      type: String,
      default: "",
      trim: true,
    },
    company_type: {
      type: String,
      default: "Company / Business",
      trim: true,
    },
    gst_or_id: {
      type: String,
      default: "",
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
    verification_status: {
      type: String,
      enum: ["unverified", "pending", "verified"],
      default: "verified",
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
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "employers",
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
employerSchema.virtual("name").get(function () {
  return this.full_name;
}).set(function (name) {
  this.full_name = name;
});

// Virtual for profileImage -> avatar_url
employerSchema.virtual("profileImage").get(function () {
  return this.avatar_url;
}).set(function (img) {
  this.avatar_url = img;
});

// Compare password method: Direct plain-text comparison (with fallback for legacy bcrypt hashes)
employerSchema.methods.comparePassword = async function (enteredPassword) {
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

module.exports = mongoose.model("Employer", employerSchema, "employers");
