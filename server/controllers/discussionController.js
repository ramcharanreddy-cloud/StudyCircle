const { notifyUsers } = require("../utils/notify");

const Discussion = require("../models/Discussion");
const StudyGroup = require("../models/StudyGroup");

// ==========================================
// CREATE DISCUSSION
// POST /api/discussions
// ==========================================

const createDiscussion = async (req, res) => {
  try {
    const { groupId, title, content } = req.body;
    const userId = req.user._id;

    if (!groupId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: "Group ID, title and content are required"
      });
    }

    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      !title.trim() ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid title and content are required"
      });
    }

    if (title.trim().length > 150 || content.trim().length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Title or content exceeds the allowed length"
      });
    }

    const group = await StudyGroup.findOne({
      _id: groupId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    const isMember = group.members.some(
      member => member.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Join this study group before creating discussions"
      });
    }

    const discussion = await Discussion.create({
      group: groupId,
      author: userId,
      title: title.trim(),
      content: content.trim()
    });

    await discussion.populate("author", "name avatar");
    await notifyUsers({
      app: req.app,
      recipients: group.members.map(member => member.user),
      sender: userId,
      type: "system",
      message: `${req.user.name} started a discussion: ${discussion.title}`,
      relatedId: discussion._id,
      relatedModel: "Discussion"
    });

    return res.status(201).json({
      success: true,
      message: "Discussion created successfully",
      discussion
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    console.error("Create discussion error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating discussion"
    });
  }
};


// ==========================================
// GET GROUP DISCUSSIONS
// GET /api/discussions/group/:groupId
// ==========================================

const getGroupDiscussions = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await StudyGroup.findOne({
      _id: groupId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    const isMember = group.members.some(
      member => member.user.toString() === userId.toString()
    );

    if (group.privacy === "private" && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You must be a group member to view these discussions"
      });
    }

    const discussions = await Discussion.find({
      group: groupId
    })
      .populate("author", "name avatar")
      .populate("comments.user", "name avatar")
      .sort({
        isPinned: -1,
        createdAt: -1
      });

    return res.status(200).json({
      success: true,
      groupName: group.name,
      count: discussions.length,
      discussions
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    console.error("Get discussions error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching discussions"
    });
  }
};


// ==========================================
// ADD COMMENT
// POST /api/discussions/:id/comments
// ==========================================

const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user._id;

    if (
      !content ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required"
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 1000 characters"
      });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found"
      });
    }

    const group = await StudyGroup.findOne({
      _id: discussion.group,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    const isMember = group.members.some(
      member => member.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Join the study group before commenting"
      });
    }

    discussion.comments.push({
      user: userId,
      content: content.trim()
    });

    await discussion.save();
    await discussion.populate("comments.user", "name avatar");

    const newComment =
      discussion.comments[discussion.comments.length - 1];
    await notifyUsers({
      app: req.app,
      recipients: [discussion.author],
      sender: userId,
      type: "discussion_comment",
      message: `${req.user.name} commented on your discussion "${discussion.title}"`,
      relatedId: discussion._id,
      relatedModel: "Discussion"
    });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: newComment
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid discussion ID"
      });
    }

    console.error("Add comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while adding comment"
    });
  }
};


// ==========================================
// LIKE / UNLIKE DISCUSSION
// POST /api/discussions/:id/like
// ==========================================

const toggleLike = async (req, res) => {
  try {
    const userId = req.user._id;

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found"
      });
    }

    const group = await StudyGroup.findOne({
      _id: discussion.group,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    const isMember = group.members.some(
      member => member.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Join the study group before liking discussions"
      });
    }

    const alreadyLiked = discussion.likes.some(
      id => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      discussion.likes.pull(userId);
    } else {
      discussion.likes.push(userId);
    }

    await discussion.save();

    return res.status(200).json({
      success: true,
      message: alreadyLiked
        ? "Discussion unliked successfully"
        : "Discussion liked successfully",
      liked: !alreadyLiked,
      likeCount: discussion.likes.length
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid discussion ID"
      });
    }

    console.error("Toggle like error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating like"
    });
  }
};


// ==========================================
// EDIT DISCUSSION
// PUT /api/discussions/:id
// ==========================================

const updateDiscussion = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user._id;

    if (title === undefined && content === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide title or content to update"
      });
    }

    if (
      (title !== undefined &&
        (typeof title !== "string" || !title.trim())) ||
      (content !== undefined &&
        (typeof content !== "string" || !content.trim()))
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and content must be valid non-empty text"
      });
    }

    if (
      (title !== undefined && title.trim().length > 150) ||
      (content !== undefined && content.trim().length > 5000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Title or content exceeds the allowed length"
      });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found"
      });
    }

    if (discussion.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own discussions"
      });
    }

    if (title !== undefined) {
      discussion.title = title.trim();
    }

    if (content !== undefined) {
      discussion.content = content.trim();
    }

    await discussion.save();
    await discussion.populate("author", "name avatar");

    return res.status(200).json({
      success: true,
      message: "Discussion updated successfully",
      discussion
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid discussion ID"
      });
    }

    console.error("Update discussion error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating discussion"
    });
  }
};


// ==========================================
// DELETE DISCUSSION
// DELETE /api/discussions/:id
// ==========================================

const deleteDiscussion = async (req, res) => {
  try {
    const userId = req.user._id;

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found"
      });
    }

    if (discussion.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own discussions"
      });
    }

    await Discussion.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Discussion deleted successfully"
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid discussion ID"
      });
    }

    console.error("Delete discussion error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting discussion"
    });
  }
};


// ==========================================
// PIN / UNPIN DISCUSSION
// PATCH /api/discussions/:id/pin
// ==========================================

const togglePin = async (req, res) => {
  try {
    const userId = req.user._id;

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found"
      });
    }

    const group = await StudyGroup.findOne({
      _id: discussion.group,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    // Find the logged-in user's membership
    const membership = group.members.find(
      member => member.user.toString() === userId.toString()
    );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "You must be a group member to pin discussions"
      });
    }

    // Only admin or moderator can pin/unpin
    if (!["admin", "moderator"].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        message: "Only group admins and moderators can pin discussions"
      });
    }

    // Toggle pin status
    discussion.isPinned = !discussion.isPinned;

    await discussion.save();

    return res.status(200).json({
      success: true,
      message: discussion.isPinned
        ? "Discussion pinned successfully"
        : "Discussion unpinned successfully",
      isPinned: discussion.isPinned
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid discussion ID"
      });
    }

    console.error("Toggle pin error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while pinning discussion"
    });
  }
};


// ==========================================
// EXPORT ALL CONTROLLERS
// ==========================================

module.exports = {
  createDiscussion,
  getGroupDiscussions,
  addComment,
  toggleLike,
  updateDiscussion,
  deleteDiscussion,
  togglePin
};
