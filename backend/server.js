import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/tasks.routes.js";
import projectRoutes from "./routes/projects.routes.js";
import commentRoutes from "./routes/comments.routes.js"; // ← Check this line
import notificationRoutes from "./routes/notifications.routes.js";
import { fileURLToPath } from "url";
import helmet from "helmet";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGO_URI;
const CLIENT_URL = process.env.CLIENT_URL;

// Add this near the top after other imports
app.use(helmet());

const allowedOrigins = [
  "https://codeaedoc.github.io", 
  "http://localhost:5173", 
]

// Update CORS configuration
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// Update cors configuration
const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL
        : allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

if (process.env.NODE_ENV === "production") {
  // Serve static files from the frontend build
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // Handle React routing, return all requests to React app
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
  });
}

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

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { io };
