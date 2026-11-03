const StudyNote = require("../models/StudyNote");
const StudyGroup = require("../models/StudyGroup");
async function accessGroup(groupId, userId) {
  const group = await StudyGroup.findOne({ _id: groupId, isActive: true });
  if (!group) return { status: 404, message: "Study group not found" };
  if (!group.members.some(m => m.user.toString() === userId.toString())) return { status: 403, message: "Only group members can access shared notes" };
  return { group };
}
exports.listNotes = async (req, res) => {
  try {
    const access = await accessGroup(req.params.groupId, req.user._id);
    if (access.message) return res.status(access.status).json({ success: false, message: access.message });
    const notes = await StudyNote.find({ group: req.params.groupId, isShared: true }).populate("author", "name avatar").populate("updatedBy", "name").sort({ updatedAt: -1 });
    res.json({ success: true, notes });
  } catch (e) { res.status(e.name === "CastError" ? 400 : 500).json({ success: false, message: "Unable to load notes" }); }
};
exports.createNote = async (req, res) => {
  try {
    const { groupId, title, content = "", tags = [] } = req.body || {};
    if (!groupId || typeof title !== "string" || !title.trim() || title.trim().length > 140) return res.status(400).json({ success: false, message: "Group and a note title of 1–140 characters are required" });
    if (typeof content !== "string" || content.length > 30000) return res.status(400).json({ success: false, message: "Note content is too long" });
    const access = await accessGroup(groupId, req.user._id);
    if (access.message) return res.status(access.status).json({ success: false, message: access.message });
    const note = await StudyNote.create({ group: groupId, author: req.user._id, updatedBy: req.user._id, title: title.trim(), content, tags: Array.isArray(tags) ? tags.filter(t => typeof t === "string").slice(0, 10) : [] });
    await note.populate("author", "name avatar");
    const io = req.app.get("io");
    if (io) io.to(`group:${groupId}`).emit("notes:changed", { groupId: String(groupId), action: "created", noteId: String(note._id) });
    res.status(201).json({ success: true, note });
  } catch (e) { res.status(e.name === "CastError" ? 400 : 500).json({ success: false, message: "Unable to create note" }); }
};
exports.updateNote = async (req, res) => {
  try {
    const note = await StudyNote.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    const groupAccess = await accessGroup(note.group, req.user._id);
    if (groupAccess.message) return res.status(groupAccess.status).json({ success: false, message: groupAccess.message });
    const membership = groupAccess.group.members.find(m => m.user.toString() === req.user._id.toString());
    if (note.author.toString() !== req.user._id.toString() && !["admin", "moderator"].includes(membership.role)) return res.status(403).json({ success: false, message: "You cannot edit this note" });
    if (req.body.title !== undefined) {
      if (typeof req.body.title !== "string") return res.status(400).json({ success: false, message: "Note title must be text" });
      note.title = req.body.title.trim();
    }
    if (req.body.content !== undefined) {
      if (typeof req.body.content !== "string") return res.status(400).json({ success: false, message: "Note content must be text" });
      note.content = req.body.content;
    }
    if (note.content.length > 30000 || !note.title || note.title.length > 140) return res.status(400).json({ success: false, message: "Invalid note title or content" });
    note.updatedBy = req.user._id;
    await note.save();
    await note.populate("author", "name avatar");
    const io = req.app.get("io");
    if (io) io.to(`group:${note.group}`).emit("notes:changed", { groupId: String(note.group), action: "updated", noteId: String(note._id) });
    res.json({ success: true, note });
  } catch (e) { res.status(e.name === "CastError" ? 400 : 500).json({ success: false, message: "Unable to update note" }); }
};
exports.deleteNote = async (req, res) => {
  try {
    const note = await StudyNote.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    const access = await accessGroup(note.group, req.user._id);
    if (access.message) return res.status(access.status).json({ success: false, message: access.message });
    const membership = access.group.members.find(m => m.user.toString() === req.user._id.toString());
    if (note.author.toString() !== req.user._id.toString() && !["admin", "moderator"].includes(membership.role)) return res.status(403).json({ success: false, message: "You cannot delete this note" });
    const groupId = String(note.group);
    const noteId = String(note._id);
    await note.deleteOne();
    const io = req.app.get("io");
    if (io) io.to(`group:${groupId}`).emit("notes:changed", { groupId, action: "deleted", noteId });
    res.json({ success: true, message: "Note deleted" });
  } catch (e) { res.status(e.name === "CastError" ? 400 : 500).json({ success: false, message: "Unable to delete note" }); }
};
