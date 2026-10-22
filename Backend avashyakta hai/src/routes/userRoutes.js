const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getUserById,
  updateUser,
  getAvailableWorkers,
  getNearbyWorkers,
} = require("../controllers/userController");

// Public available workers showcase (must be defined before /:id)
router.get("/workers/available", getAvailableWorkers);
router.get("/workers/nearby", getNearbyWorkers);

router.get("/:id", getUserById);
router.put("/:id", protect, updateUser);

module.exports = router;
