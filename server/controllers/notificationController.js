
const Notification = require("../models/Notification");

// ==========================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// ==========================================

const getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const filter = {
      recipient: req.user._id
    };

    if (req.query.unread === "true") {
      filter.isRead = false;
    }

    const totalNotifications = await Notification.countDocuments(filter);

    const notifications = await Notification.find(filter)
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      totalNotifications,
      unreadCount,
      currentPage: page,
      totalPages: Math.ceil(totalNotifications / limit),
      notifications
    });

  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching notifications"
    });
  }
};


// ==========================================
// GET UNREAD NOTIFICATION COUNT
// GET /api/notifications/unread-count
// ==========================================

const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error("Unread count error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching unread count"
    });
  }
};


// ==========================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// ==========================================

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id
      },
      {
        $set: { isRead: true }
      },
      {
        returnDocument: "after",
        runValidators: true
      }
    ).populate("sender", "name avatar");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID"
      });
    }

    console.error("Mark notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating notification"
    });
  }
};


// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// ==========================================

const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Mark all notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating notifications"
    });
  }
};


// ==========================================
// DELETE ONE NOTIFICATION
// DELETE /api/notifications/:id
// ==========================================

const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID"
      });
    }

    console.error("Delete notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting notification"
    });
  }
};


// ==========================================
// DELETE ALL MY NOTIFICATIONS
// DELETE /api/notifications
// ==========================================

const deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: "All notifications deleted successfully",
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error("Delete all notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting notifications"
    });
  }
};


module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
};
