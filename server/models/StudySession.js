
const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyGroup",
      required: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ""
    },

    scheduledAt: {
      type: Date,
      required: true
    },

    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 480
    },

    meetingLink: {
      type: String,
      trim: true,
      default: ""
    },

    maxParticipants: {
      type: Number,
      min: 2,
      default: 20
    },

    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },

        joinedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled"
    }
  },
  {
    timestamps: true
  }
);

studySessionSchema.index({ group: 1, scheduledAt: 1 });
studySessionSchema.index({ createdBy: 1 });

module.exports = mongoose.model("StudySession", studySessionSchema);

