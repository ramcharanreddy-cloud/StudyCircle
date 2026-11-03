const User = require("../models/User");
const StudyGroup = require("../models/StudyGroup");
const Discussion = require("../models/Discussion");
const Resource = require("../models/Resource");
const StudySession = require("../models/StudySession");
const ChatMessage = require("../models/ChatMessage");
const cloudinary = require("../config/cloudinary");

exports.overview = async (_req, res) => {
  const [users, groups, discussions, resources, sessions, messages, recentUsers, recentGroups, recentDiscussions, recentResources] = await Promise.all([
    User.countDocuments(), StudyGroup.countDocuments(), Discussion.countDocuments(),
    Resource.countDocuments(), StudySession.countDocuments(), ChatMessage.countDocuments(),
    User.find().select("name email role isActive createdAt").sort({ createdAt: -1 }).limit(8),
    StudyGroup.find().select("name subject privacy isActive members createdAt").sort({ createdAt: -1 }).limit(8),
    Discussion.find().select("title content group author createdAt").populate("group", "name").populate("author", "name").sort({ createdAt: -1 }).limit(12),
    Resource.find().select("title resourceType group uploadedBy createdAt").populate("group", "name").populate("uploadedBy", "name").sort({ createdAt: -1 }).limit(12)
  ]);
  res.json({ success: true, stats: { users, groups, discussions, resources, sessions, messages }, recentUsers, recentGroups, recentDiscussions, recentResources });
};
exports.listUsers = async (_req, res) => {
  const users = await User.find().select("name email role isActive createdAt").sort({ createdAt: -1 }).limit(200);
  res.json({ success: true, users });
};
exports.setUserStatus = async (req, res) => {
  if (typeof req.body?.isActive !== "boolean") return res.status(400).json({ success: false, message: "isActive must be a boolean" });
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });
  const isActive = req.body.isActive === true;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select("name email role isActive");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  if (!isActive) {
    const io = req.app.get("io");
    if (io) {
      const sockets = await io.fetchSockets();
      sockets.filter(socket => String(socket.user?._id) === String(user._id)).forEach(socket => socket.disconnect(true));
    }
  }
  res.json({ success: true, user });
};
exports.setGroupStatus = async (req, res) => {
  if (typeof req.body?.isActive !== "boolean") return res.status(400).json({ success: false, message: "isActive must be a boolean" });
  const group = await StudyGroup.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive === true }, { new: true }).select("name subject isActive");
  if (!group) return res.status(404).json({ success: false, message: "Group not found" });
  if (!group.isActive) {
    const io = req.app.get("io");
    if (io) io.to(`group:${group._id}`).emit("group:disabled", { groupId: String(group._id) });
    if (io) await io.in(`group:${group._id}`).socketsLeave(`group:${group._id}`);
  }
  res.json({ success: true, group });
};
exports.removeDiscussion = async (req, res) => {
  const item = await Discussion.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Discussion not found" });
  res.json({ success: true, message: "Discussion removed by administrator" });
};
exports.removeResource = async (req, res) => {
  const item = await Resource.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: "Resource not found" });
  if (item.filePublicId) {
    await cloudinary.uploader.destroy(item.filePublicId, { resource_type: "raw" });
  }
  await item.deleteOne();
  res.json({ success: true, message: "Resource removed by administrator" });
};
