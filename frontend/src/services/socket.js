import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

class SocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(userId) {
    if (this.socket?.connected) {
      console.log("✅ Socket already connected");
      return this.socket;
    }

    console.log("🔌 Connecting to socket server...");

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket.id);
      this.reconnectAttempts = 0;

      if (userId) {
        console.log("📝 Registering user:", userId);
        this.socket.emit("register", userId);
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      this.reconnectAttempts++;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);

      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        console.log("🔄 Reconnecting...");
        this.socket.connect();
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("✅ Reconnected after", attemptNumber, "attempts");
      if (userId) {
        this.socket.emit("register", userId);
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Task events
  emitTaskCreated(task) {
    if (this.socket?.connected) {
      console.log("📤 Emitting task:created");
      this.socket.emit("task:created", task);
    }
  }

  emitTaskUpdated(task) {
    if (this.socket?.connected) {
      console.log("📤 Emitting task:updated");
      this.socket.emit("task:updated", task);
    }
  }

  emitTaskDeleted(taskId) {
    if (this.socket?.connected) {
      console.log("📤 Emitting task:deleted");
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

  // Comment events
  emitCommentCreated(comment) {
    if (this.socket?.connected) {
      console.log("📤 Emitting comment:created");
      this.socket.emit("comment:created", comment);
    }
  }

  emitCommentUpdated(comment) {
    if (this.socket?.connected) {
      this.socket.emit("comment:updated", comment);
    }
  }

  emitCommentDeleted(commentId) {
    if (this.socket?.connected) {
      this.socket.emit("comment:deleted", commentId);
    }
  }

  onCommentCreated(callback) {
    if (this.socket) {
      this.socket.on("comment:created", callback);
    }
  }

  onCommentUpdated(callback) {
    if (this.socket) {
      this.socket.on("comment:updated", callback);
    }
  }

  onCommentDeleted(callback) {
    if (this.socket) {
      this.socket.on("comment:deleted", callback);
    }
  }
}

export default new SocketService();
