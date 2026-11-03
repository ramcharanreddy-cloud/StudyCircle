
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false
    },

    avatar: {
      type: String,
      default: ""
    },

    bio: {
      type: String,
      maxlength: 250,
      default: ""
    },

    interests: {
      type: [String],
      default: []
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student"
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

const User = mongoose.model("User", userSchema);

module.exports = User;
