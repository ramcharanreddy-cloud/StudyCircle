
const StudyGroup = require("../models/StudyGroup");
const Discussion = require("../models/Discussion");
const StudySession = require("../models/StudySession");
const Notification = require("../models/Notification");

// ==========================================
// GET USER DASHBOARD
// GET /api/dashboard
// ==========================================

const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Find all active groups the user belongs to
    const joinedGroups = await StudyGroup.find({
      isActive: true,
      "members.user": userId
    })
      .select("name description subject privacy members createdBy createdAt")
      .populate("createdBy", "name avatar")
      .sort({ createdAt: -1 });

    const groupIds = joinedGroups.map(group => group._id);

    // Find upcoming sessions in the user's groups
    const upcomingSessions = await StudySession.find({
      group: { $in: groupIds },
      status: "scheduled",
      scheduledAt: { $gte: now }
    })
      .populate("group", "name")
      .populate("createdBy", "name avatar")
      .sort({ scheduledAt: 1 })
      .limit(5);

    // Find recent discussions in the user's groups
    const recentDiscussions = await Discussion.find({
      group: { $in: groupIds }
    })
      .populate("author", "name avatar")
      .populate("group", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    // Find recent notifications belonging to the user
    const recentNotifications = await Notification.find({
      recipient: userId
    })
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate dashboard statistics
    const [
      totalGroups,
      groupsCreated,
      totalDiscussions,
      totalUpcomingSessions,
      unreadNotifications
    ] = await Promise.all([
      StudyGroup.countDocuments({
        isActive: true,
        "members.user": userId
      }),

      StudyGroup.countDocuments({
        isActive: true,
        createdBy: userId
      }),

      Discussion.countDocuments({
        group: { $in: groupIds }
      }),

      StudySession.countDocuments({
        group: { $in: groupIds },
        status: "scheduled",
        scheduledAt: { $gte: now }
      }),

      Notification.countDocuments({
        recipient: userId,
        isRead: false
      })
    ]);

    return res.status(200).json({
      success: true,
      message: "Dashboard data fetched successfully",

      statistics: {
        totalGroups,
        groupsCreated,
        totalDiscussions,
        totalUpcomingSessions,
        unreadNotifications
      },

      joinedGroups,

      upcomingSessions,

      recentDiscussions,

      recentNotifications
    });

  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard data"
    });
  }
};

module.exports = {
  getDashboard
};
