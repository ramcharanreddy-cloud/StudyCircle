
const express = require("express");
const router = express.Router();

const {
  createDiscussion,
  getGroupDiscussions,
  addComment,
  toggleLike,
  updateDiscussion,
  deleteDiscussion,
  togglePin
} = require("../controllers/discussionController");

const { protect } = require("../middleware/authMiddleware");

// Create discussion
router.post("/", protect, createDiscussion);

// Get group discussions
router.get("/group/:groupId", protect, getGroupDiscussions);

// Add comment
router.post("/:id/comments", protect, addComment);

// Like / Unlike discussion
router.post("/:id/like", protect, toggleLike);

// Edit discussion
router.put("/:id", protect, updateDiscussion);

// Delete discussion
router.delete("/:id", protect, deleteDiscussion);

// Pin / Unpin discussion
router.patch("/:id/pin", protect, togglePin);

module.exports = router;
