
const express = require("express");
const router = express.Router();

const {
  getGroupMembers,
  updateMemberRole,
  removeMember,
  requestToJoinGroup,
  getJoinRequests,
  reviewJoinRequest,
  transferOwnership
} = require("../controllers/memberController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// View group members
router.get("/:groupId/members", getGroupMembers);

// Promote or demote a member
router.patch("/:groupId/members/:userId/role", updateMemberRole);

// Remove a member
router.delete("/:groupId/members/:userId", removeMember);

// Request to join a private group
router.post("/:groupId/request", requestToJoinGroup);

// View pending join requests
router.get("/:groupId/requests", getJoinRequests);

// Accept or reject a join request
router.patch("/:groupId/requests/:requestId", reviewJoinRequest);

// Transfer group ownership
router.patch("/:groupId/transfer-ownership", transferOwnership);

module.exports = router;
