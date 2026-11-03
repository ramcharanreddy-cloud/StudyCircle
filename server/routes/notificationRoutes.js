
const express = require("express");
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

// All notification routes require authentication
router.use(protect);

// Get notifications
router.get("/", getNotifications);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Mark all as read
router.patch("/read-all", markAllAsRead);

// Delete all notifications
router.delete("/", deleteAllNotifications);

// Mark one notification as read
router.patch("/:id/read", markAsRead);

// Delete one notification
router.delete("/:id", deleteNotification);

module.exports = router;
