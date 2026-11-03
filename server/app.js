const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const groupRoutes = require("./routes/groupRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const memberRoutes = require("./routes/memberRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const chatRoutes = require("./routes/chatRoutes");
const noteRoutes = require("./routes/noteRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error("Origin is not allowed by CORS"); error.status = 403; return callback(error);
  },
  credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
}));
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Try again later." }
});
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/member-management", memberRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StudyCircle API is running!"
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || (error.name === "MulterError" ? 400 : 500);
  const message = status >= 500 && process.env.NODE_ENV === "production"
    ? "Internal server error"
    : (error.message || "Internal server error");
  res.status(status).json({ success: false, message });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});


module.exports = app;