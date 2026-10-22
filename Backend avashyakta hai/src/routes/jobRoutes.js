const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getJobs,
  getJobStats,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getEmployerJobs,
} = require("../controllers/jobController");

// Public job retrieval routes
router.get("/", getJobs);
router.get("/stats", getJobStats);
router.get("/employer/:id", getEmployerJobs);
router.get("/:id", getJobById);


// Protected job management routes
router.post("/", protect, createJob);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);

module.exports = router;
