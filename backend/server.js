import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import taskRoutes from "./routes/tasks.routes.js";
import projectRoutes from "./routes/projects.routes.js";
import commentRoutes from "./routes/comments.routes.js"; // NEW

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:5173",
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/comments", commentRoutes); // NEW

// Socket.io
const userSockets = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId) => {
    userSockets.set(userId, socket.id);
  });

  socket.on("task:created", (data) => {
    socket.broadcast.emit("task:created", data);
  });

  socket.on("task:updated", (data) => {
    socket.broadcast.emit("task:updated", data);
  });

  socket.on("task:deleted", (data) => {
    socket.broadcast.emit("task:deleted", data);
  });

  socket.on("project:created", (data) => {
    socket.broadcast.emit("project:created", data);
  });

  socket.on("project:updated", (data) => {
    socket.broadcast.emit("project:updated", data);
  });

  // NEW: Comment events
  socket.on("comment:created", (data) => {
    socket.broadcast.emit("comment:created", data);
  });

  socket.on("comment:updated", (data) => {
    socket.broadcast.emit("comment:updated", data);
  });

  socket.on("comment:deleted", (data) => {
    socket.broadcast.emit("comment:deleted", data);
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { io };
