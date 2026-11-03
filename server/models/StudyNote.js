const mongoose = require("mongoose");
const studyNoteSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "StudyGroup", required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, trim: true, maxlength: 140 },
  content: { type: String, default: "", maxlength: 30000 },
  tags: { type: [String], default: [] },
  isShared: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
studyNoteSchema.index({ group: 1, updatedAt: -1 });
module.exports = mongoose.model("StudyNote", studyNoteSchema);
