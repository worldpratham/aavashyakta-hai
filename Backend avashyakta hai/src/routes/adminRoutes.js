const express = require("express");
const router = express.Router();
const adminOnly = require("../middleware/adminMiddleware");
const {
  getAdminStats,
  getAdminUsers,
  toggleUserVerification,
  toggleUserBan,
  getAdminJobs,
  deleteAdminJob,
  getAdminApplications,
} = require("../controllers/adminController");

// All routes are strictly protected for Manager / Admin
router.use(adminOnly);

router.get("/stats", getAdminStats);
router.get("/users", getAdminUsers);
router.put("/users/:id/verify", toggleUserVerification);
router.put("/users/:id/ban", toggleUserBan);
router.get("/jobs", getAdminJobs);
router.delete("/jobs/:id", deleteAdminJob);
router.get("/applications", getAdminApplications);

module.exports = router;
