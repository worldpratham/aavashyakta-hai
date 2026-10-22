const mongoose = require("mongoose");
// Ensure Job and Worker models are registered
require("./Job");
require("./Worker");

const applicationSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job ID is required"],
      index: true,
    },
    worker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: [true, "Worker ID is required"],
      index: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    expected_wage: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "accepted", "rejected", "hired", "completed", "paid"],
        message: "Status must be pending, accepted, rejected, hired, completed, or paid",
      },
      default: "pending",
      index: true,
    },
    payment_mode: {
      type: String,
      enum: {
        values: ["upi", "bank_transfer", "cash", ""],
        message: "Payment mode must be upi, bank_transfer, cash, or empty",
      },
      default: "",
    },
    upi_id: {
      type: String,
      default: "",
      trim: true,
    },
    bank_details: {
      account_holder_name: { type: String, default: "" },
      account_number: { type: String, default: "" },
      ifsc_code: { type: String, default: "" },
      bank_name: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id;
        ret.jobId = ret.job_id;
        ret.workerId = ret.worker_id;
        ret.expectedWage = ret.expected_wage;
        ret.paymentMode = ret.payment_mode;
        ret.upiId = ret.upi_id;
        ret.bankDetails = ret.bank_details;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ job_id: 1, worker_id: 1 }, { unique: true });

// Virtuals for camelCase compatibility
applicationSchema.virtual("jobId").get(function () {
  return this.job_id;
}).set(function (val) {
  this.job_id = val;
});

applicationSchema.virtual("workerId").get(function () {
  return this.worker_id;
}).set(function (val) {
  this.worker_id = val;
});

applicationSchema.virtual("expectedWage").get(function () {
  return this.expected_wage;
}).set(function (val) {
  this.expected_wage = val;
});

applicationSchema.virtual("paymentMode").get(function () {
  return this.payment_mode;
}).set(function (val) {
  this.payment_mode = val;
});

applicationSchema.virtual("upiId").get(function () {
  return this.upi_id;
}).set(function (val) {
  this.upi_id = val;
});

applicationSchema.virtual("bankDetails").get(function () {
  return this.bank_details;
}).set(function (val) {
  this.bank_details = val;
});

module.exports = mongoose.model("Application", applicationSchema);
