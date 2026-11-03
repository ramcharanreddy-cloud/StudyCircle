
const StudyGroup = require("../models/StudyGroup");
const JoinRequest = require("../models/JoinRequest");

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const findGroup = async (groupId) => {
  return StudyGroup.findOne({
    _id: groupId,
    isActive: true
  });
};

const getMember = (group, userId) => {
  return group.members.find(
    member => member.user.toString() === userId.toString()
  );
};

const isAdmin = (group, userId) => {
  const member = getMember(group, userId);

  return (
    group.createdBy.toString() === userId.toString() ||
    member?.role === "admin"
  );
};

const isModeratorOrAdmin = (group, userId) => {
  const member = getMember(group, userId);

  return (
    group.createdBy.toString() === userId.toString() ||
    ["admin", "moderator"].includes(member?.role)
  );
};


// ==========================================
// GET GROUP MEMBERS
// GET /api/member-management/:groupId/members
// ==========================================

const getGroupMembers = async (req, res) => {
  try {
    const group = await findGroup(req.params.groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    const currentMember = getMember(group, req.user._id);

    if (group.privacy === "private" && !currentMember) {
      return res.status(403).json({
        success: false,
        message: "You must be a group member to view members"
      });
    }

    await group.populate("members.user", "name email avatar");

    return res.status(200).json({
      success: true,
      groupName: group.name,
      totalMembers: group.members.length,
      members: group.members
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    console.error("Get members error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching members"
    });
  }
};


// ==========================================
// PROMOTE / DEMOTE MEMBER
// PATCH /api/member-management/:groupId/members/:userId/role
// ==========================================

const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["moderator", "member"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be moderator or member"
      });
    }

    const group = await findGroup(req.params.groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    if (!isAdmin(group, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only group admins can change member roles"
      });
    }

    const targetMember = getMember(group, req.params.userId);

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: "Member not found in this group"
      });
    }

    if (
      targetMember.user.toString() === group.createdBy.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "The group owner's role cannot be changed"
      });
    }

    targetMember.role = role;

    await group.save();

    return res.status(200).json({
      success: true,
      message: `Member role updated to ${role}`,
      member: {
        userId: targetMember.user,
        role: targetMember.role
      }
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group or user ID"
      });
    }

    console.error("Update member role error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating member role"
    });
  }
};


// ==========================================
// REMOVE MEMBER
// DELETE /api/member-management/:groupId/members/:userId
// ==========================================

const removeMember = async (req, res) => {
  try {
    const group = await findGroup(req.params.groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    const requesterId = req.user._id;
    const targetId = req.params.userId;

    const requester = getMember(group, requesterId);
    const target = getMember(group, targetId);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "Member not found in this group"
      });
    }

    if (target.user.toString() === group.createdBy.toString()) {
      return res.status(400).json({
        success: false,
        message: "The group owner cannot be removed"
      });
    }

    const requesterIsOwner =
      group.createdBy.toString() === requesterId.toString();

    const requesterIsAdmin = isAdmin(group, requesterId);

    // Admins and moderators can remove ordinary members.
    // Only the owner can remove another admin or moderator.
    if (
      !requesterIsAdmin &&
      !(requester?.role === "moderator" && target.role === "member")
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to remove this member"
      });
    }

    if (
      !requesterIsOwner &&
      ["admin", "moderator"].includes(target.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the group owner can remove admins or moderators"
      });
    }

    group.members = group.members.filter(
      member => member.user.toString() !== targetId.toString()
    );

    await group.save();

    return res.status(200).json({
      success: true,
      message: "Member removed successfully"
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group or user ID"
      });
    }

    console.error("Remove member error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while removing member"
    });
  }
};


// ==========================================
// REQUEST TO JOIN PRIVATE GROUP
// POST /api/member-management/:groupId/request
// ==========================================

const requestToJoinGroup = async (req, res) => {
  try {
    const group = await findGroup(req.params.groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    if (group.privacy !== "private") {
      return res.status(400).json({
        success: false,
        message: "Join requests are only needed for private groups"
      });
    }

    if (getMember(group, req.user._id)) {
      return res.status(409).json({
        success: false,
        message: "You are already a group member"
      });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: "This group has reached its member limit"
      });
    }

    const existingRequest = await JoinRequest.findOne({
      group: group._id,
      user: req.user._id,
      status: "pending"
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending join request"
      });
    }

    const joinRequest = await JoinRequest.create({
      group: group._id,
      user: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: "Join request submitted successfully",
      joinRequest
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    console.error("Join request error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while submitting join request"
    });
  }
};


// ==========================================
// GET PENDING JOIN REQUESTS
// GET /api/member-management/:groupId/requests
// ==========================================

const getJoinRequests = async (req, res) => {
  try {
    const group = await findGroup(req.params.groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    if (!isModeratorOrAdmin(group, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only group admins and moderators can view join requests"
      });
    }

    const requests = await JoinRequest.find({
      group: group._id,
      status: "pending"
    })
      .populate("user", "name email avatar")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      totalRequests: requests.length,
      requests
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    console.error("Get join requests error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching join requests"
    });
  }
};


// ==========================================
// ACCEPT / REJECT JOIN REQUEST
// PATCH /api/member-management/:groupId/requests/:requestId
// ==========================================

const reviewJoinRequest = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be accepted or rejected"
      });
    }

    const group = await findGroup(req.params.groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    if (!isModeratorOrAdmin(group, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only group admins and moderators can review requests"
      });
    }

    const joinRequest = await JoinRequest.findOne({
      _id: req.params.requestId,
      group: group._id,
      status: "pending"
    });

    if (!joinRequest) {
      return res.status(404).json({
        success: false,
        message: "Pending join request not found"
      });
    }

    if (status === "accepted") {
      if (getMember(group, joinRequest.user)) {
        return res.status(409).json({
          success: false,
          message: "This user is already a group member"
        });
      }

      if (group.members.length >= group.maxMembers) {
        return res.status(400).json({
          success: false,
          message: "This group has reached its member limit"
        });
      }

      group.members.push({
        user: joinRequest.user,
        role: "member"
      });

      await group.save();
    }

    joinRequest.status = status;
    joinRequest.reviewedBy = req.user._id;
    joinRequest.reviewedAt = new Date();

    await joinRequest.save();

    return res.status(200).json({
      success: true,
      message: `Join request ${status} successfully`,
      joinRequest
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group or request ID"
      });
    }

    console.error("Review join request error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while reviewing join request"
    });
  }
};


// ==========================================
// TRANSFER GROUP OWNERSHIP
// PATCH /api/member-management/:groupId/transfer-ownership
// ==========================================

const transferOwnership = async (req, res) => {
  try {
    const { newOwnerId } = req.body;

    if (!newOwnerId) {
      return res.status(400).json({
        success: false,
        message: "New owner ID is required"
      });
    }

    const group = await findGroup(req.params.groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the current group owner can transfer ownership"
      });
    }

    const newOwner = getMember(group, newOwnerId);

    if (!newOwner) {
      return res.status(404).json({
        success: false,
        message: "The new owner must already be a group member"
      });
    }

    if (newOwner.user.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You are already the group owner"
      });
    }

    const currentOwner = getMember(group, req.user._id);

    if (currentOwner) {
      currentOwner.role = "admin";
    }

    newOwner.role = "admin";
    group.createdBy = newOwner.user;

    await group.save();

    return res.status(200).json({
      success: true,
      message: "Group ownership transferred successfully",
      newOwnerId: group.createdBy
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group or user ID"
      });
    }

    console.error("Transfer ownership error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while transferring ownership"
    });
  }
};


module.exports = {
  getGroupMembers,
  updateMemberRole,
  removeMember,
  requestToJoinGroup,
  getJoinRequests,
  reviewJoinRequest,
  transferOwnership
};
