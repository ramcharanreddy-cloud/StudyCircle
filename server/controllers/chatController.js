const ChatMessage = require("../models/ChatMessage");
const StudyGroup = require("../models/StudyGroup");

async function getMemberGroup(groupId, userId) {
  const group = await StudyGroup.findOne({ _id: groupId, isActive: true });
  if (!group) return { error: "Study group not found", status: 404 };
  const member = group.members.some(m => m.user.toString() === userId.toString());
  if (!member) return { error: "Join this group to access its chat", status: 403 };
  return { group };
}

exports.getMessages = async (req, res) => {
  try {
    const access = await getMemberGroup(req.params.groupId, req.user._id);
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const filter = { group: req.params.groupId };
    if (req.query.before) {
      const cursor = new Date(req.query.before);
      if (Number.isNaN(cursor.getTime())) return res.status(400).json({ success: false, message: "Invalid message cursor" });
      filter.createdAt = { $lt: cursor };
    }
    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 }).limit(limit + 1)
      .populate("sender", "name avatar");
    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();
    res.json({ success: true, messages: messages.reverse(), hasMore });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({ success: false, message: error.name === "CastError" ? "Invalid group ID" : "Unable to load chat" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content || content.length > 3000) return res.status(400).json({ success: false, message: "Message must contain 1–3000 characters" });
    const access = await getMemberGroup(req.params.groupId, req.user._id);
    if (access.error) return res.status(access.status).json({ success: false, message: access.error });
    const message = await ChatMessage.create({ group: req.params.groupId, sender: req.user._id, content });
    await message.populate("sender", "name avatar");
    const io = req.app.get("io");
    if (io) io.to(`group:${req.params.groupId}`).emit("chat:message", message);
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(error.name === "CastError" ? 400 : 500).json({ success: false, message: "Unable to send message" });
  }
};
