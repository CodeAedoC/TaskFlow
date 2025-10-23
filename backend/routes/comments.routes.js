import express from "express";
import { body, validationResult } from "express-validator";
import Comment from "../models/comment.models.js";
import Task from "../models/task.models.js";
import Project from "../models/project.models.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { notifyNewComment } from "../utils/notifications.utils.js";

const router = express.Router();

// Get all comments for a task - FIXED authorization
router.get("/task/:taskId", authenticate, async (req, res) => {
  try {
    console.log("📥 Fetching comments for task:", req.params.taskId);

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      console.log("❌ Task not found");
      return res.status(404).json({ message: "Task not found" });
    }

    // Check if user has access to this task
    const hasDirectAccess =
      task.user.toString() === req.userId ||
      task.assignedTo?.some((userId) => userId.toString() === req.userId);

    // If no direct access, check if user is in the task's project
    if (!hasDirectAccess && task.project) {
      const project = await Project.findOne({
        _id: task.project,
        $or: [{ owner: req.userId }, { members: req.userId }],
      });

      if (!project) {
        console.log("❌ User not authorized to view this task");
        return res
          .status(403)
          .json({ message: "Not authorized to view this task" });
      }
    } else if (!hasDirectAccess && !task.project) {
      console.log("❌ User not authorized (no project and not involved)");
      return res
        .status(403)
        .json({ message: "Not authorized to view this task" });
    }

    const comments = await Comment.find({ task: req.params.taskId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${comments.length} comments`);
    res.json(comments);
  } catch (error) {
    console.error("❌ Get comments error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create comment - FIXED authorization
router.post(
  "/",
  authenticate,
  [
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Comment content is required"),
    body("task").notEmpty().withMessage("Task ID is required"),
  ],
  async (req, res) => {
    try {
      console.log("📝 Creating comment:", req.body);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content, task } = req.body;

      const taskExists = await Task.findById(task).populate("user assignedTo");

      if (!taskExists) {
        console.log("❌ Task not found");
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if user has access to this task
      const hasDirectAccess =
        taskExists.user._id.toString() === req.userId ||
        taskExists.assignedTo?.some(
          (user) => user._id.toString() === req.userId
        );

      // If no direct access, check if user is in the task's project
      if (!hasDirectAccess && taskExists.project) {
        const project = await Project.findOne({
          _id: taskExists.project,
          $or: [{ owner: req.userId }, { members: req.userId }],
        });

        if (!project) {
          console.log("❌ User not authorized to comment on this task");
          return res
            .status(403)
            .json({ message: "Not authorized to comment on this task" });
        }
      } else if (!hasDirectAccess && !taskExists.project) {
        console.log("❌ User not authorized (no project and not involved)");
        return res
          .status(403)
          .json({ message: "Not authorized to comment on this task" });
      }

      console.log("📝 Creating comment on task:", taskExists.title);
      console.log("👤 Comment author:", req.userId);

      const comment = new Comment({
        content,
        task,
        user: req.userId,
      });

      await comment.save();
      await comment.populate("user", "name email");

      // Build recipients list (exclude comment author)
      const recipientIds = new Set();

      if (taskExists.user._id.toString() !== req.userId.toString()) {
        recipientIds.add(taskExists.user._id.toString());
      }

      if (taskExists.assignedTo && taskExists.assignedTo.length > 0) {
        taskExists.assignedTo.forEach((user) => {
          if (user._id.toString() !== req.userId.toString()) {
            recipientIds.add(user._id.toString());
          }
        });
      }

      const recipients = Array.from(recipientIds);

      console.log("📨 Sending notifications to:", recipients);

      if (recipients.length > 0) {
        await notifyNewComment(comment, taskExists, recipients);
      }

      console.log("✅ Comment created successfully");
      res.status(201).json(comment);
    } catch (error) {
      console.error("❌ Comment creation error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Update comment
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    const comment = await Comment.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!comment) {
      return res
        .status(404)
        .json({ message: "Comment not found or unauthorized" });
    }

    comment.content = content;
    comment.isEdited = true;
    await comment.save();
    await comment.populate("user", "name email");

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete comment
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!comment) {
      return res
        .status(404)
        .json({ message: "Comment not found or unauthorized" });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
