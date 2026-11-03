const mongoose = require("mongoose");
const chatMessageSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "StudyGroup", required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true, trim: true, maxlength: 3000 },
  editedAt: { type: Date, default: null }
}, { timestamps: true });
chatMessageSchema.index({ group: 1, createdAt: -1 });
module.exports = mongoose.model("ChatMessage", chatMessageSchema);
