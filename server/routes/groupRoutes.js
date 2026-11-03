const express = require("express");
const router = express.Router();

const {
  createGroup,
  getPublicGroups,
  joinGroup,
  leaveGroup,
getGroupMembers
} = require("../controllers/groupController");

const { protect } = require("../middleware/authMiddleware");

// Discover public groups
router.get("/", getPublicGroups);

// Create a group
router.post("/", protect, createGroup);

router.post("/:id/join", protect, joinGroup);
router.delete("/:id/leave", protect, leaveGroup);
router.get("/:id/members", protect, getGroupMembers);

module.exports = router;