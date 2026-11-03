const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar
    }
  });
});

router.get("/protected-test", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "You accessed a protected route!",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email
    }
  });
});

module.exports = router;