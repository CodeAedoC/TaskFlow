import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "task_assigned",
        "task_updated",
        "comment_added",
        "project_added",
        "task_completed",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// NEW: Prevent duplicate notifications (same recipient, type, task, sender within 1 minute)
notificationSchema.index(
  { recipient: 1, type: 1, relatedTask: 1, sender: 1, createdAt: 1 },
  {
    unique: true,
    partialFilterExpression: { relatedTask: { $exists: true } },
  }
);

export default mongoose.model("Notification", notificationSchema);
