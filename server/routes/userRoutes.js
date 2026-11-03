
const express = require("express");
const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  getPublicProfile
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

// Protected routes
router.get("/profile", protect, getMyProfile);
router.put("/profile", protect, updateMyProfile);

// Public route
router.get("/:id", getPublicProfile);

module.exports = router;
