
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    type: {
      type: String,
      enum: [
        "group_join",
        "group_invite",
        "discussion_comment",
        "discussion_like",
        "session_created",
        "session_updated",
        "session_cancelled",
        "join_request",
        "join_request_accepted",
        "join_request_rejected",
        "system"
      ],
      required: true
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    relatedModel: {
      type: String,
      enum: ["StudyGroup", "Discussion", "StudySession", null],
      default: null
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
