import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/tasks.routes.js";
import projectRoutes from "./routes/projects.routes.js";
import commentRoutes from "./routes/comments.routes.js"; // ← Check this line
import notificationRoutes from "./routes/notifications.routes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
          ],
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

app.use(cors());
app.use(express.json());

connectDB();

// Routes - CHECK ALL ARE REGISTERED
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/comments", commentRoutes); // ← CRITICAL: Check this line
app.use("/api/notifications", notificationRoutes);

// Test route to verify server is working
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Socket.io
const userSockets = new Map();

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("register", (userId) => {
    if (!userId) {
      console.log("⚠️ Registration attempt without userId");
      return;
    }

    userSockets.set(userId, socket.id);
    socket.userId = userId;

    console.log(`✅ User ${userId} registered with socket ${socket.id}`);
    console.log(`📊 Total connected users: ${userSockets.size}`);
  });

  socket.on("task:created", (data) => {
    console.log("📤 Broadcasting task:created");
    socket.broadcast.emit("task:created", data);
  });

  socket.on("task:updated", (data) => {
    console.log("📤 Broadcasting task:updated");
    socket.broadcast.emit("task:updated", data);
  });

  socket.on("task:deleted", (data) => {
    console.log("📤 Broadcasting task:deleted");
    socket.broadcast.emit("task:deleted", data);
  });

  socket.on("project:created", (data) => {
    socket.broadcast.emit("project:created", data);
  });

  socket.on("project:updated", (data) => {
    socket.broadcast.emit("project:updated", data);
  });

  socket.on("comment:created", (data) => {
    console.log("📤 Broadcasting comment:created");
    socket.broadcast.emit("comment:created", data);
  });

  socket.on("comment:updated", (data) => {
    socket.broadcast.emit("comment:updated", data);
  });

  socket.on("comment:deleted", (data) => {
    socket.broadcast.emit("comment:deleted", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`🗑️ Removed user ${socket.userId} from registry`);
      console.log(`📊 Total connected users: ${userSockets.size}`);
    }
  });
});

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Registered routes:`);
  console.log(`   - /api/auth`);
  console.log(`   - /api/tasks`);
  console.log(`   - /api/projects`);
  console.log(`   - /api/comments`);
  console.log(`   - /api/notifications`);
});

export { io };
