
const express = require("express");
const router = express.Router();

const {
  createSession,
  getGroupSessions,
  getSessionById,
  joinSession,
  leaveSession,
  updateSession,
  cancelSession
} = require("../controllers/sessionController");

const { protect } = require("../middleware/authMiddleware");

// Create a study session
router.post("/", protect, createSession);

// Get all sessions in a group
router.get("/group/:groupId", protect, getGroupSessions);

// Join a session
router.post("/:id/join", protect, joinSession);

// Leave a session
router.delete("/:id/leave", protect, leaveSession);

// Update a session
router.put("/:id", protect, updateSession);

// Cancel a session
router.delete("/:id", protect, cancelSession);

// Get one session
router.get("/:id", protect, getSessionById);

module.exports = router;
