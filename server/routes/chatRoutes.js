const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const { getMessages, sendMessage } = require("../controllers/chatController");
router.use(protect);
router.get("/:groupId", getMessages);
router.post("/:groupId", sendMessage);
module.exports = router;
