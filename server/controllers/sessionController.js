const { notifyUsers } = require("../utils/notify");

const StudySession = require("../models/StudySession");
const StudyGroup = require("../models/StudyGroup");

// Helper: check whether user belongs to group
const isGroupMember = (group, userId) => {
  return group.members.some(
    member => member.user.toString() === userId.toString()
  );
};

// Helper: validate meeting URL
const isValidMeetingUrl = (url) => {
  if (!url) return true;

  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};


// ==========================================
// CREATE STUDY SESSION
// POST /api/sessions
// ==========================================

const createSession = async (req, res) => {
  try {
    const {
      groupId,
      title,
      description,
      scheduledAt,
      duration,
      meetingLink,
      maxParticipants
    } = req.body;

    if (!groupId || !title || !scheduledAt || !duration) {
      return res.status(400).json({
        success: false,
        message: "Group, title, date and duration are required"
      });
    }

    if (typeof title !== "string" || !title.trim() || title.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: "Title must be between 1 and 150 characters"
      });
    }

    const sessionDate = new Date(scheduledAt);
    const sessionDuration = Number(duration);
    const participantLimit = Number(maxParticipants ?? 20);

    if (
      Number.isNaN(sessionDate.getTime()) ||
      sessionDate <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Session must be scheduled for a future date"
      });
    }

    if (
      !Number.isInteger(sessionDuration) ||
      sessionDuration < 15 ||
      sessionDuration > 480
    ) {
      return res.status(400).json({
        success: false,
        message: "Duration must be between 15 and 480 minutes"
      });
    }

    if (
      !Number.isInteger(participantLimit) ||
      participantLimit < 2 ||
      participantLimit > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum participants must be between 2 and 500"
      });
    }

    if (
      description !== undefined &&
      (typeof description !== "string" || description.length > 2000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 2000 characters"
      });
    }

    if (
      meetingLink !== undefined &&
      !isValidMeetingUrl(meetingLink)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid meeting URL"
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

    if (!isGroupMember(group, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Join the group before scheduling a session"
      });
    }

    const session = await StudySession.create({
      group: groupId,
      createdBy: req.user._id,
      title: title.trim(),
      description: description || "",
      scheduledAt: sessionDate,
      duration: sessionDuration,
      meetingLink: meetingLink || "",
      maxParticipants: participantLimit,
      participants: [{ user: req.user._id }]
    });

    await session.populate([
      { path: "createdBy", select: "name avatar" },
      { path: "participants.user", select: "name avatar" }
    ]);
    await notifyUsers({
      app: req.app,
      recipients: group.members.map(member => member.user),
      sender: req.user._id,
      type: "session_created",
      message: `${req.user.name} scheduled "${session.title}"`,
      relatedId: session._id,
      relatedModel: "StudySession"
    });

    return res.status(201).json({
      success: true,
      message: "Study session scheduled successfully",
      session
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    console.error("Create session error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating session"
    });
  }
};


// ==========================================
// GET GROUP SESSIONS
// GET /api/sessions/group/:groupId
// ==========================================

const getGroupSessions = async (req, res) => {
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

    if (!isGroupMember(group, userId)) {
      return res.status(403).json({
        success: false,
        message: "Only group members can view sessions"
      });
    }

    const filter = { group: groupId };

    if (req.query.status) {
      if (!["scheduled", "cancelled", "completed"].includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid session status"
        });
      }

      filter.status = req.query.status;
    } else {
      filter.status = { $ne: "cancelled" };
    }

    if (req.query.upcoming === "true") {
      filter.scheduledAt = { $gte: new Date() };
      filter.status = "scheduled";
    }

    const sessions = await StudySession.find(filter)
      .populate("createdBy", "name avatar")
      .populate("participants.user", "name avatar")
      .sort({ scheduledAt: 1 });

    return res.status(200).json({
      success: true,
      totalSessions: sessions.length,
      sessions
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    console.error("Get sessions error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching sessions"
    });
  }
};


// ==========================================
// GET SINGLE SESSION
// GET /api/sessions/:id
// ==========================================

const getSessionById = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id)
      .populate("createdBy", "name avatar")
      .populate("participants.user", "name avatar")
      .populate("group", "name privacy");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Study session not found"
      });
    }

    const group = await StudyGroup.findOne({
      _id: session.group._id,
      isActive: true
    });

    if (!group || !isGroupMember(group, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You must be a group member to view this session"
      });
    }

    return res.status(200).json({
      success: true,
      session
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID"
      });
    }

    console.error("Get session error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching session"
    });
  }
};


// ==========================================
// JOIN / RSVP TO SESSION
// POST /api/sessions/:id/join
// ==========================================

const joinSession = async (req, res) => {
  try {
    const userId = req.user._id;

    const session = await StudySession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Study session not found"
      });
    }

    const group = await StudyGroup.findOne({
      _id: session.group,
      isActive: true
    });

    if (!group || !isGroupMember(group, userId)) {
      return res.status(403).json({
        success: false,
        message: "You must belong to this study group"
      });
    }

    if (session.status !== "scheduled" || session.scheduledAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "This session is no longer available for joining"
      });
    }

    const alreadyJoined = session.participants.some(
      participant => participant.user.toString() === userId.toString()
    );

    if (alreadyJoined) {
      return res.status(409).json({
        success: false,
        message: "You have already joined this session"
      });
    }

    if (session.participants.length >= session.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "This session has reached its participant limit"
      });
    }

    session.participants.push({ user: userId });
    await session.save();
    await notifyUsers({
      app: req.app,
      recipients: [session.createdBy],
      sender: userId,
      type: "system",
      message: `${req.user.name} joined your study session "${session.title}"`,
      relatedId: session._id,
      relatedModel: "StudySession"
    });

    return res.status(200).json({
      success: true,
      message: "You joined the study session successfully",
      participantCount: session.participants.length
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID"
      });
    }

    console.error("Join session error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while joining session"
    });
  }
};


// ==========================================
// LEAVE / CANCEL RSVP
// DELETE /api/sessions/:id/leave
// ==========================================

const leaveSession = async (req, res) => {
  try {
    const userId = req.user._id;

    const session = await StudySession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Study session not found"
      });
    }

    const group = await StudyGroup.findOne({
      _id: session.group,
      isActive: true
    });

    if (!group || !isGroupMember(group, userId)) {
      return res.status(403).json({
        success: false,
        message: "You must belong to this study group"
      });
    }

    if (session.status !== "scheduled" || session.scheduledAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "You cannot leave a session that is no longer scheduled"
      });
    }

    if (session.createdBy.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "The session creator cannot leave their own session"
      });
    }

    const participantExists = session.participants.some(
      participant => participant.user.toString() === userId.toString()
    );

    if (!participantExists) {
      return res.status(400).json({
        success: false,
        message: "You have not joined this session"
      });
    }

    session.participants = session.participants.filter(
      participant => participant.user.toString() !== userId.toString()
    );

    await session.save();

    return res.status(200).json({
      success: true,
      message: "You left the study session successfully",
      participantCount: session.participants.length
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID"
      });
    }

    console.error("Leave session error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while leaving session"
    });
  }
};


// ==========================================
// UPDATE SESSION
// PUT /api/sessions/:id
// ==========================================

const updateSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Study session not found"
      });
    }

    if (session.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the session creator can update it"
      });
    }

    if (session.status !== "scheduled" || session.scheduledAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "This session can no longer be updated"
      });
    }

    const allowedFields = [
      "title",
      "description",
      "scheduledAt",
      "duration",
      "meetingLink",
      "maxParticipants"
    ];

    for (const field of Object.keys(req.body)) {
      if (!allowedFields.includes(field)) {
        return res.status(400).json({
          success: false,
          message: `You cannot update the ${field} field`
        });
      }
    }

    if (req.body.title !== undefined) {
      if (
        typeof req.body.title !== "string" ||
        !req.body.title.trim() ||
        req.body.title.trim().length > 150
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid session title"
        });
      }

      session.title = req.body.title.trim();
    }

    if (req.body.description !== undefined) {
      if (
        typeof req.body.description !== "string" ||
        req.body.description.length > 2000
      ) {
        return res.status(400).json({
          success: false,
          message: "Description cannot exceed 2000 characters"
        });
      }

      session.description = req.body.description;
    }

    if (req.body.scheduledAt !== undefined) {
      const date = new Date(req.body.scheduledAt);

      if (Number.isNaN(date.getTime()) || date <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Choose a future session date"
        });
      }

      session.scheduledAt = date;
    }

    if (req.body.duration !== undefined) {
      const duration = Number(req.body.duration);

      if (!Number.isInteger(duration) || duration < 15 || duration > 480) {
        return res.status(400).json({
          success: false,
          message: "Duration must be between 15 and 480 minutes"
        });
      }

      session.duration = duration;
    }

    if (req.body.meetingLink !== undefined) {
      if (!isValidMeetingUrl(req.body.meetingLink)) {
        return res.status(400).json({
          success: false,
          message: "Invalid meeting URL"
        });
      }

      session.meetingLink = req.body.meetingLink;
    }

    if (req.body.maxParticipants !== undefined) {
      const limit = Number(req.body.maxParticipants);

      if (
        !Number.isInteger(limit) ||
        limit < 2 ||
        limit > 500 ||
        limit < session.participants.length
      ) {
        return res.status(400).json({
          success: false,
          message: "Participant limit cannot be below current participants or outside 2–500"
        });
      }

      session.maxParticipants = limit;
    }

    await session.save();

    await session.populate([
      { path: "createdBy", select: "name avatar" },
      { path: "participants.user", select: "name avatar" }
    ]);

    return res.status(200).json({
      success: true,
      message: "Study session updated successfully",
      session
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID"
      });
    }

    console.error("Update session error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating session"
    });
  }
};


// ==========================================
// CANCEL SESSION
// DELETE /api/sessions/:id
// ==========================================

const cancelSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Study session not found"
      });
    }

    if (session.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the session creator can cancel it"
      });
    }

    if (session.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "This session is already cancelled or completed"
      });
    }

    session.status = "cancelled";
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Study session cancelled successfully"
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID"
      });
    }

    console.error("Cancel session error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while cancelling session"
    });
  }
};


module.exports = {
  createSession,
  getGroupSessions,
  getSessionById,
  joinSession,
  leaveSession,
  updateSession,
  cancelSession
};
