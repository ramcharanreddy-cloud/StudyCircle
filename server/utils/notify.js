const Notification = require("../models/Notification");

async function notifyUsers({ app, recipients, sender, type, message, relatedId, relatedModel }) {
  const uniqueRecipients = [...new Set((recipients || []).map(id => String(id)).filter(id => id && id !== String(sender)))];
  if (!uniqueRecipients.length) return [];
  try {
    const notifications = await Notification.insertMany(uniqueRecipients.map(recipient => ({
      recipient, sender: sender || null, type, message, relatedId: relatedId || null, relatedModel: relatedModel || null
    })));
    const io = app?.get("io");
    if (io) {
      notifications.forEach(notification => {
        io.to(`user:${notification.recipient}`).emit("notification:new", {
          _id: notification._id,
          type: notification.type,
          message: notification.message,
          relatedId: notification.relatedId,
          relatedModel: notification.relatedModel,
          isRead: false,
          createdAt: notification.createdAt
        });
      });
    }
    return notifications;
  } catch (error) {
    // A notification failure must not turn a successfully persisted primary action into a failed API response.
    console.error("[StudyCircle] Notification delivery failed:", error.message);
    return [];
  }
}

module.exports = { notifyUsers };
