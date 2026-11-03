
const mongoose = require("mongoose");

const studyGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      minlength: 3,
      maxlength: 80
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: 500
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },

        role: {
          type: String,
          enum: ["admin", "moderator", "member"],
          default: "member"
        },

        joinedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    privacy: {
      type: String,
      enum: ["public", "private"],
      default: "public"
    },

    tags: {
      type: [String],
      default: []
    },

    maxMembers: {
      type: Number,
      default: 50,
      min: 2,
      max: 500
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Search optimization
studyGroupSchema.index({
  name: "text",
  description: "text",
  subject: "text",
  tags: "text"
});

const StudyGroup = mongoose.model("StudyGroup", studyGroupSchema);

module.exports = StudyGroup;
