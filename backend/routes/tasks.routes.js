import express from "express";
import { body, validationResult } from "express-validator";
import Task from "../models/task.models.js";
import Project from "../models/project.models.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET STATISTICS
router.get("/statistics", authenticate, async (req, res) => {
  try {
    const total = await Task.countDocuments({
      $or: [{ user: req.userId }, { assignedTo: req.userId }],
    });

    const completed = await Task.countDocuments({
      $or: [{ user: req.userId }, { assignedTo: req.userId }],
      status: "completed",
    });

    const inProgress = await Task.countDocuments({
      $or: [{ user: req.userId }, { assignedTo: req.userId }],
      status: "in-progress",
    });

    const pending = await Task.countDocuments({
      $or: [{ user: req.userId }, { assignedTo: req.userId }],
      status: "pending",
    });

    const high = await Task.countDocuments({
      $or: [{ user: req.userId }, { assignedTo: req.userId }],
      priority: "high",
    });

    const medium = await Task.countDocuments({
      $or: [{ user: req.userId }, { assignedTo: req.userId }],
      priority: "medium",
    });

    const low = await Task.countDocuments({
      $or: [{ user: req.userId }, { assignedTo: req.userId }],
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
        high,
        medium,
        low,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET ALL TASKS with filtering by creator
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, search, project, assignedUser } = req.query;
    
    let query = {
      $or: [
        { user: req.userId },
        { assignedTo: req.userId }
      ]
    };
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (project) query.project = project;
    
    // NEW: Filter by assigned user
    if (assignedUser) {
      query.assignedTo = assignedUser;
      delete query.$or; // Remove OR condition when filtering by specific user
    }
    
    if (search) {
      const searchQuery = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
      query = { ...query, ...searchQuery };
    }

    const tasks = await Task.find(query)
      .populate('project', 'name color')
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// GET SINGLE TASK
router.get("/:id", authenticate, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.userId }, { assignedTo: req.userId }],
    })
      .populate("project", "name color")
      .populate("user", "name email")
      .populate("assignedTo", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// CREATE TASK with project member validation
router.post(
  "/",
  authenticate,
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("status").optional().isIn(["pending", "in-progress", "completed"]),
    body("priority").optional().isIn(["low", "medium", "high"]),
    body("assignedTo").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // NEW: Validate assigned users are project members
      if (req.body.project && req.body.assignedTo?.length > 0) {
        const project = await Project.findById(req.body.project);

        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }

        // Check if all assigned users are project members
        const invalidUsers = req.body.assignedTo.filter(
          (userId) =>
            !project.members.some((memberId) => memberId.toString() === userId)
        );

        if (invalidUsers.length > 0) {
          return res.status(400).json({
            message:
              "Some users are not members of this project. Add them to the project first.",
          });
        }
      }

      const task = new Task({
        ...req.body,
        user: req.userId,
      });

      await task.save();
      await task.populate("project", "name color");
      await task.populate("user", "name email");
      await task.populate("assignedTo", "name email");

      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// UPDATE TASK
router.put("/:id", authenticate, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.userId }, { assignedTo: req.userId }],
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only owner can reassign tasks
    if (req.body.assignedTo && task.user.toString() !== req.userId) {
      return res.status(403).json({ message: "Only task owner can reassign" });
    }

    // NEW: Validate assigned users are project members
    if (req.body.project && req.body.assignedTo?.length > 0) {
      const project = await Project.findById(req.body.project);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const invalidUsers = req.body.assignedTo.filter(
        (userId) =>
          !project.members.some((memberId) => memberId.toString() === userId)
      );

      if (invalidUsers.length > 0) {
        return res.status(400).json({
          message:
            "Some users are not members of this project. Add them to the project first.",
        });
      }
    }

    Object.assign(task, req.body);
    await task.save();
    await task.populate("project", "name color");
    await task.populate("user", "name email");
    await task.populate("assignedTo", "name email");

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// DELETE TASK
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!task) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
