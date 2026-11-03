const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const User = require("./models/User");
const StudyGroup = require("./models/StudyGroup");

const PORT = Number(process.env.PORT) || 5000;
const origins = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map(v => v.trim()).filter(Boolean);

async function startServer() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing from server/.env");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters");
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: origins, credentials: true },
    pingTimeout: 20000,
    pingInterval: 25000
  });
  app.set("io", io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id name avatar isActive");
      if (!user || !user.isActive) return next(new Error("Account unavailable"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid or expired session"));
    }
  });

  io.on("connection", socket => {
    socket.join(`user:${socket.user._id}`);
    socket.on("group:typing", payload => {
      const groupId = payload?.groupId;
      if (typeof groupId !== "string" || !/^[a-f\d]{24}$/i.test(groupId)) return;
      if (!socket.rooms.has(`group:${groupId}`)) return;
      const now = Date.now();
      if (now - (socket.data.lastTypingAt || 0) < 700) return;
      socket.data.lastTypingAt = now;
      socket.to(`group:${groupId}`).emit("chat:typing", {
        groupId,
        userId: String(socket.user._id),
        name: socket.user.name
      });
    });

    socket.on("group:join", async (groupId, ack = () => {}) => {
      try {
        if (typeof groupId !== "string" || !/^[a-f\d]{24}$/i.test(groupId)) return ack({ success: false, message: "Invalid group" });
        const group = await StudyGroup.findOne({ _id: groupId, isActive: true }).select("members");
        const member = group?.members.some(m => m.user.toString() === socket.user._id.toString());
        if (!member) return ack({ success: false, message: "Group membership required" });
        for (const room of socket.rooms) if (room.startsWith("group:")) socket.leave(room);
        socket.join(`group:${groupId}`);
        ack({ success: true });
      } catch {
        ack({ success: false, message: "Unable to join chat room" });
      }
    });
    socket.on("disconnect", () => {});
  });

  server.listen(PORT, () => {
    console.log(`[StudyCircle] API running at http://localhost:${PORT}`);
    console.log(`[StudyCircle] Socket.IO ready`);
    console.log(`[StudyCircle] Health check: http://localhost:${PORT}/api/health`);
  });

  const shutdown = () => {
    io.close(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
startServer().catch(error => {
  console.error("[StudyCircle] Server startup failed:", error.message);
  process.exit(1);
});
