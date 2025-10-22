import express from "express";
import { body, validationResult } from "express-validator";
import Task from "../models/task.models.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const { status, priority, search } = req.query;

    let query = { user: req.userId }; 

    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/statistics", authenticate, async (req, res) => {
  try {
    const total = await Task.countDocuments({ user: req.userId });
    const completed = await Task.countDocuments({
      user: req.userId,
      status: "completed",
    });
    const inProgress = await Task.countDocuments({
      user: req.userId,
      status: "in-progress",
    });
    const pending = await Task.countDocuments({
      user: req.userId,
      status: "pending",
    });

    const highPriority = await Task.countDocuments({
      user: req.userId,
      priority: "high",
    });
    const mediumPriority = await Task.countDocuments({
      user: req.userId,
      priority: "medium",
    });
    const lowPriority = await Task.countDocuments({
      user: req.userId,
      priority: "low",
    });

    res.json({
      total,
      byStatus: {
        completed,
        inProgress,
        pending,
      },
      byPriority: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post(
  "/",
  authenticate,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("status").optional().isIn(["pending", "in-progress", "completed"]),
    body("priority").optional().isIn(["low", "medium", "high"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const task = new Task({
        ...req.body,
        user: req.userId,
      });

      await task.save();
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

router.put("/:id", authenticate, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    Object.assign(task, req.body);
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully", taskId: task._id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
