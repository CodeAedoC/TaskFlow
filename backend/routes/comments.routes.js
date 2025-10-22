import express from "express";
import { body, validationResult } from "express-validator";
import Comment from "../models/comment.models.js";
import Task from "../models/task.models.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/task/:taskId", authenticate, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      $or: [{ user: req.userId }, { assignedTo: req.userId }],
    });

    if (!task) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    const comments = await Comment.find({ task: req.params.taskId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

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
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content, task } = req.body;

      // Verify task exists and user has access
      const taskExists = await Task.findOne({
        _id: task,
        $or: [{ user: req.userId }, { assignedTo: req.userId }],
      });

      if (!taskExists) {
        return res
          .status(404)
          .json({ message: "Task not found or unauthorized" });
      }

      const comment = new Comment({
        content,
        task,
        user: req.userId,
      });

      await comment.save();
      await comment.populate("user", "name email");

      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

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
