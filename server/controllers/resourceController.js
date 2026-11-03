
const Resource = require("../models/Resource");
const StudyGroup = require("../models/StudyGroup");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

// ==========================================
// CLOUDINARY UPLOAD HELPER
// ==========================================

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "studycircle/resources",
        resource_type: "raw",
        use_filename: false
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};


// ==========================================
// CREATE / UPLOAD RESOURCE
// POST /api/resources
// ==========================================

const createResource = async (req, res) => {
  let uploadedFilePublicId = null;

  try {
    const {
      groupId,
      title,
      description,
      resourceType,
      url,
      subject,
      topic
    } = req.body;

    const userId = req.user._id;

    // Validate required fields
    if (!groupId || !title || !resourceType) {
      return res.status(400).json({
        success: false,
        message: "Group ID, title and resource type are required"
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 150
    ) {
      return res.status(400).json({
        success: false,
        message: "Title must be between 1 and 150 characters"
      });
    }

    if (
      description !== undefined &&
      (typeof description !== "string" || description.length > 1000)
    ) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 1000 characters"
      });
    }

    if (
      !["pdf", "document", "link", "video"].includes(resourceType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource type"
      });
    }

    // Find active group
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

    // Verify membership
    const isMember = group.members.some(
      member => member.user.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Join the group before sharing resources"
      });
    }

    let resourceUrl = "";
    let filePublicId = null;
    let fileFormat = null;
    let fileSize = null;

    // FILE UPLOAD
    if (["pdf", "document"].includes(resourceType)) {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a file to upload"
        });
      }

      const result = await uploadToCloudinary(req.file);

      resourceUrl = result.secure_url;
      filePublicId = result.public_id;
      fileFormat = result.format || null;
      fileSize = result.bytes;

      uploadedFilePublicId = result.public_id;
    }

    // EXTERNAL LINK OR VIDEO
    if (["link", "video"].includes(resourceType)) {
      if (!url || typeof url !== "string") {
        return res.status(400).json({
          success: false,
          message: "A valid resource URL is required"
        });
      }

      let parsedUrl;

      try {
        parsedUrl = new URL(url);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid resource URL"
        });
      }

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({
          success: false,
          message: "Only HTTP and HTTPS URLs are allowed"
        });
      }

      resourceUrl = parsedUrl.href;
    }

    // SAVE RESOURCE IN MONGODB
    const resource = await Resource.create({
      group: groupId,
      uploadedBy: userId,
      title: title.trim(),
      description: description || "",
      resourceType,
      url: resourceUrl,
      filePublicId,
      fileFormat,
      fileSize,
      subject: subject || "",
      topic: topic || ""
    });

    uploadedFilePublicId = null;

    await resource.populate("uploadedBy", "name avatar");

    return res.status(201).json({
      success: true,
      message: "Resource shared successfully",
      resource
    });

  } catch (error) {
    // Clean up uploaded file if database creation fails
    if (uploadedFilePublicId) {
      try {
        await cloudinary.uploader.destroy(
          uploadedFilePublicId,
          { resource_type: "raw" }
        );
      } catch (cleanupError) {
        console.error("Cloudinary cleanup error:", cleanupError);
      }
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    console.error("Create resource error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while sharing resource"
    });
  }
};


// ==========================================
// GET GROUP RESOURCES
// GET /api/resources/group/:groupId
// ==========================================

const getGroupResources = async (req, res) => {
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
        message: "You must be a group member to view these resources"
      });
    }

    // Search and filters
    const {
      search,
      subject,
      topic,
      type,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {
      group: groupId
    };

    if (subject) {
      filter.subject = new RegExp(subject, "i");
    }

    if (topic) {
      filter.topic = new RegExp(topic, "i");
    }

    if (type) {
      if (!["pdf", "document", "link", "video"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid resource type filter"
        });
      }

      filter.resourceType = type;
    }

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { title: new RegExp(safeSearch, "i") },
        { description: new RegExp(safeSearch, "i") },
        { subject: new RegExp(safeSearch, "i") },
        { topic: new RegExp(safeSearch, "i") }
      ];
    }

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(limit, 10) || 10)
    );

    const totalResources = await Resource.countDocuments(filter);

    const resources = await Resource.find(filter)
      .populate("uploadedBy", "name avatar")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    return res.status(200).json({
      success: true,
      groupName: group.name,
      totalResources,
      currentPage,
      totalPages: Math.ceil(totalResources / pageSize),
      resources
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID"
      });
    }

    console.error("Get resources error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching resources"
    });
  }
};


// ==========================================
// GET SINGLE RESOURCE
// GET /api/resources/:id
// ==========================================

const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate("uploadedBy", "name avatar")
      .populate("group", "name privacy");

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found"
      });
    }

    const group = await StudyGroup.findOne({
      _id: resource.group._id,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Study group not found"
      });
    }

    const isMember = group.members.some(
      member => member.user.toString() === req.user._id.toString()
    );

    if (group.privacy === "private" && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You must be a group member to view this resource"
      });
    }

    return res.status(200).json({
      success: true,
      resource
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid resource ID"
      });
    }

    console.error("Get resource error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching resource"
    });
  }
};


// ==========================================
// DELETE RESOURCE
// DELETE /api/resources/:id
// ==========================================

const deleteResource = async (req, res) => {
  try {
    const userId = req.user._id;

    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found"
      });
    }

    // Only the original uploader can delete
    if (resource.uploadedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete resources uploaded by you"
      });
    }

    // Delete Cloudinary file if this resource has one
    if (resource.filePublicId) {
      await cloudinary.uploader.destroy(
        resource.filePublicId,
        { resource_type: "raw" }
      );
    }

    await Resource.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Resource deleted successfully"
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid resource ID"
      });
    }

    console.error("Delete resource error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting resource"
    });
  }
};


// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
  createResource,
  getGroupResources,
  getResourceById,
  deleteResource
};
