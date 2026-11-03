const { notifyUsers } = require("../utils/notify");

const StudyGroup = require("../models/StudyGroup");

// CREATE STUDY GROUP
const createGroup = async (req, res) => {
  try {
    const {
      name,
      description,
      subject,
      privacy,
      tags,
      maxMembers
    } = req.body;

    // 1. Validate required fields
    if (!name || !description || !subject) {
      return res.status(400).json({
        success: false,
        message: "Name, description and subject are required"
      });
    }

    // 2. Validate group name
    if (typeof name !== "string" || name.trim().length < 3 || name.trim().length > 80) {
      return res.status(400).json({
        success: false,
        message: "Group name must contain 3 to 80 characters"
      });
    }

    // 3. Validate description
    if (typeof description !== "string" || description.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Description must be 500 characters or fewer"
      });
    }

    // 4. Validate subject
    if (typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid subject is required"
      });
    }

    // 5. Validate privacy
    if (privacy !== undefined && !["public", "private"].includes(privacy)) {
      return res.status(400).json({
        success: false,
        message: "Privacy must be public or private"
      });
    }

    // 6. Validate tags
    if (
      tags !== undefined &&
      (!Array.isArray(tags) ||
        !tags.every(tag => typeof tag === "string"))
    ) {
      return res.status(400).json({
        success: false,
        message: "Tags must be an array of strings"
      });
    }

    // 7. Validate maximum members
    if (
      maxMembers !== undefined &&
      (!Number.isInteger(maxMembers) || maxMembers < 2 || maxMembers > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "Maximum members must be between 2 and 500"
      });
    }

    // 8. Create group
    const group = await StudyGroup.create({
      name: name.trim(),
      description: description.trim(),
      subject: subject.trim(),
      privacy: privacy || "public",
      tags: tags
        ? tags.map(tag => tag.trim()).filter(Boolean)
        : [],
      maxMembers: maxMembers || 50,

      // Creator comes from verified JWT
      createdBy: req.user._id,

      // Creator automatically becomes admin
      members: [
        {
          user: req.user._id,
          role: "admin"
        }
      ]
    });

    // 9. Return response
    res.status(201).json({
      success: true,
      message: "Study group created successfully",
      group
    });

  } catch (error) {
    console.error("Create group error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create study group"
    });
  }
};

// GET PUBLIC STUDY GROUPS
const getPublicGroups = async (req, res) => {
  try {
    // 1. Read query parameters
    const {
      search,
      subject,
      tag,
      page = 1,
      limit = 10
    } = req.query;

    // 2. Validate pagination
    const currentPage = Number(page);
    const pageLimit = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      !Number.isInteger(pageLimit) ||
      currentPage < 1 ||
      pageLimit < 1 ||
      pageLimit > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination values"
      });
    }

    // 3. Build database filter
    const filter = {
      privacy: "public",
      isActive: true
    };

    // 4. Search group name, description and subject
    if (search && search.trim()) {
      filter.$text = {
        $search: search.trim()
      };
    }

    // 5. Filter by subject
    if (subject && subject.trim()) {
      filter.subject = {
        $regex: subject.trim(),
        $options: "i"
      };
    }

    // 6. Filter by tag
    if (tag && tag.trim()) {
      filter.tags = {
        $regex: tag.trim(),
        $options: "i"
      };
    }

    // 7. Calculate pagination
    const skip = (currentPage - 1) * pageLimit;

    // 8. Fetch groups and total count
    const [groups, totalGroups] = await Promise.all([
      StudyGroup.find(filter)
        .select("-__v")
        .populate("createdBy", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit),

      StudyGroup.countDocuments(filter)
    ]);

    // 9. Return response
    res.status(200).json({
      success: true,
      totalGroups,
      currentPage,
      totalPages: Math.ceil(totalGroups / pageLimit),
      groups
    });

  } catch (error) {
    console.error("Discover groups error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch study groups"
    });
  }
};


const joinGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    // 1. Find active group
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

    // 2. Only public groups can be joined directly
    if (group.privacy !== "public") {
      return res.status(403).json({
        success: false,
        message: "Private groups require an invitation or approval"
      });
    }

    // 3. Prevent duplicate membership
    const alreadyMember = group.members.some(
      member => member.user.toString() === userId.toString()
    );

    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: "You are already a member of this group"
      });
    }

    // 4. Check member limit
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: "This study group is full"
      });
    }

    // 5. Add member
    group.members.push({
      user: userId,
      role: "member"
    });

    await group.save();
    await notifyUsers({
      app: req.app,
      recipients: [group.createdBy],
      sender: userId,
      type: "group_join",
      message: `${req.user.name} joined your study group "${group.name}"`,
      relatedId: group._id,
      relatedModel: "StudyGroup"
    });

    res.status(200).json({
      success: true,
      message: "Successfully joined the study group",
      memberCount: group.members.length
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    console.error("Join group error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to join study group"
    });
  }
};

// LEAVE STUDY GROUP
const leaveGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    // 1. Find the group
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

    // 2. Check whether user is a member
    const memberIndex = group.members.findIndex(
      member => member.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this group"
      });
    }

    // 3. Prevent creator from leaving
    if (group.createdBy.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Group creator cannot leave the group. Transfer ownership first."
      });
    }

    // 4. Remove user from members array
    group.members.splice(memberIndex, 1);

    // 5. Save updated group
    await group.save();

    res.status(200).json({
      success: true,
      message: "Successfully left the study group",
      memberCount: group.members.length
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    console.error("Leave group error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while leaving group"
    });
  }
};

// GET STUDY GROUP MEMBERS
const getGroupMembers = async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    // 1. Find the group and populate member details
    const group = await StudyGroup.findOne({
      _id: groupId,
      isActive: true
    }).populate("members.user", "name email avatar");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    // 2. Check whether the user can view members
    const isMember = group.members.some(
      member => member.user._id.toString() === userId.toString()
    );

    if (group.privacy === "private" && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You must be a group member to view its members"
      });
    }

    // 3. Return member details
    const members = group.members.map(member => ({
      userId: member.user._id,
      name: member.user.name,
      email: member.user.email,
      avatar: member.user.avatar,
      role: member.role,
      joinedAt: member.joinedAt
    }));

    res.status(200).json({
      success: true,
      groupName: group.name,
      memberCount: members.length,
      members
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    console.error("Get group members error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching group members"
    });
  }
};
module.exports = {
  createGroup,
  getPublicGroups,
  joinGroup,
  leaveGroup,
  getGroupMembers
};