const mongoose = require("mongoose");
// Ensure Employer model is registered
require("./Employer");

const jobSchema = new mongoose.Schema(
  {
    employer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: [true, "Employer ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    job: {
      type: String,
      default: "",
      trim: true,
    },
    task_details: {
      type: String,
      default: "",
      trim: true,
    },
    wage: {
      type: Number,
      required: [true, "Wage amount is required"],
    },
    wage_type: {
      type: String,
      enum: {
        values: ["task", "daily", "weekly", "monthly", "fixed"],
        message: "Wage type must be task, daily, weekly, monthly, or fixed",
      },
      required: [true, "Wage type is required"],
    },
    phone: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: function (v) {
          return !v || /^[0-9]{10}$/.test(v);
        },
        message: "Contact mobile number must be exactly 10 digits",
      },
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
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
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        ret.employerId = ret.employer_id;
        ret.taskDetails = ret.task_details;
        ret.wageType = ret.wage_type;
        ret.latitude = ret.latitude ?? null;
        ret.longitude = ret.longitude ?? null;
        ret.geo_location = ret.geo_location || null;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Virtuals for camelCase compatibility
jobSchema.virtual("employerId").get(function () {
  return this.employer_id;
}).set(function (val) {
  this.employer_id = val;
});

jobSchema.virtual("taskDetails").get(function () {
  return this.task_details;
}).set(function (val) {
  this.task_details = val;
});

jobSchema.virtual("wageType").get(function () {
  return this.wage_type;
}).set(function (val) {
  this.wage_type = val;
});

// 2dsphere Geospatial Index for nearby jobs radius query
jobSchema.index({ geo_location: "2dsphere" });

module.exports = mongoose.model("Job", jobSchema);
