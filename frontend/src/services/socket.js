import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId) {
    this.socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected");
      if (userId) {
        this.socket.emit("register", userId);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emitTaskCreated(task) {
    if (this.socket) {
      this.socket.emit("task:created", task);
    }
  }

  emitTaskUpdated(task) {
    if (this.socket) {
      this.socket.emit("task:updated", task);
    }
  }

  emitTaskDeleted(taskId) {
    if (this.socket) {
      this.socket.emit("task:deleted", taskId);
    }
  }

  onTaskCreated(callback) {
    if (this.socket) {
      this.socket.on("task:created", callback);
    }
  }

  onTaskUpdated(callback) {
    if (this.socket) {
      this.socket.on("task:updated", callback);
    }
  }

  onTaskDeleted(callback) {
    if (this.socket) {
      this.socket.on("task:deleted", callback);
    }
  }
}

export default new SocketService();
