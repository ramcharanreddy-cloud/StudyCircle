
const express = require("express");
const router = express.Router();

const {
  createResource,
  getGroupResources,
  getResourceById,
  deleteResource
} = require("../controllers/resourceController");

const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// Upload file or share external link
router.post("/", protect, upload.single("file"), createResource);

// Get resources belonging to a group
router.get("/group/:groupId", protect, getGroupResources);

// Get one resource
router.get("/:id", protect, getResourceById);

// Delete resource uploaded by current user
router.delete("/:id", protect, deleteResource);

module.exports = router;
