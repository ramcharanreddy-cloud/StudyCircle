const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

const discussionSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyGroup",
      required: true
    },

    author: {
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

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    comments: [commentSchema],

    isPinned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

discussionSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model("Discussion", discussionSchema);