const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createApplication,
  getWorkerApplications,
  getJobApplications,
  updateApplication,
  deleteApplication,
} = require("../controllers/applicationController");

// All application routes are protected
router.use(protect);

router.post("/", createApplication);
router.get("/worker/:id", getWorkerApplications);
router.get("/job/:id", getJobApplications);
router.put("/:id", updateApplication);
router.delete("/:id", deleteApplication);

module.exports = router;
