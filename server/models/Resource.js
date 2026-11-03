
const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyGroup",
      required: true
    },

    uploadedBy: {
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
      maxlength: 1000,
      default: ""
    },

    resourceType: {
      type: String,
      enum: ["pdf", "document", "link", "video"],
      required: true
    },

    url: {
      type: String,
      required: true
    },

    filePublicId: {
      type: String,
      default: null
    },

    fileFormat: {
      type: String,
      default: null
    },

    fileSize: {
      type: Number,
      default: null
    },

    subject: {
      type: String,
      trim: true,
      default: ""
    },

    topic: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

resourceSchema.index({ group: 1, createdAt: -1 });
resourceSchema.index({ group: 1, subject: 1, topic: 1 });

module.exports = mongoose.model("Resource", resourceSchema);
