const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const { listNotes, createNote, updateNote, deleteNote } = require("../controllers/noteController");
router.use(protect);
router.get("/group/:groupId", listNotes);
router.post("/", createNote);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);
module.exports = router;
