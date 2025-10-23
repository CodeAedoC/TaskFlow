import express from "express";
import { body, validationResult } from "express-validator";
import Project from "../models/project.models.js";
import Task from "../models/task.models.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { notifyProjectMemberAdded } from "../utils/notifications.utils.js";

const router = express.Router();

// Get all user's projects
router.get("/", authenticate, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.userId }, { members: req.userId }],
      isArchived: false,
    })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single project with tasks
router.get("/:id", authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [{ owner: req.userId }, { members: req.userId }],
    }).populate("owner members", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const tasks = await Task.find({ project: project._id })
      .populate("user assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json({ project, tasks });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create project
router.post(
  "/",
  authenticate,
  [
    body("name").trim().notEmpty().withMessage("Project name is required"),
    body("color")
      .optional()
      .isIn([
        "#14b8a6",
        "#3b82f6",
        "#8b5cf6",
        "#ec4899",
        "#f59e0b",
        "#10b981",
        "#ef4444",
        "#6366f1",
      ]),
    body("memberIds").optional().isArray(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, color, memberIds } = req.body;

      const members = [req.userId];
      if (memberIds && Array.isArray(memberIds)) {
        memberIds.forEach((memberId) => {
          if (!members.includes(memberId)) {
            members.push(memberId);
          }
        });
      }

      const project = new Project({
        name,
        description,
        color: color || "#14b8a6",
        owner: req.userId,
        members,
      });

      await project.save();
      await project.populate("owner members", "name email");

      // Notify new members
      if (memberIds && memberIds.length > 0) {
        for (const memberId of memberIds) {
          if (memberId !== req.userId) {
            await notifyProjectMemberAdded(project, memberId, req.userId);
          }
        }
      }

      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// Update project
router.put("/:id", authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or unauthorized" });
    }

    const { name, description, color, memberIds } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;

    if (memberIds && Array.isArray(memberIds)) {
      const members = [req.userId];
      memberIds.forEach((memberId) => {
        if (!members.includes(memberId)) {
          members.push(memberId);
        }
      });
      project.members = members;
    }

    await project.save();
    await project.populate("owner members", "name email");

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete project
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or unauthorized" });
    }

    await Task.updateMany(
      { project: project._id },
      { $unset: { project: "" } }
    );

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Add member to project
router.post("/:id/members", authenticate, async (req, res) => {
  try {
    const { userId } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or unauthorized" });
    }

    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();

      // Notify the new member
      await notifyProjectMemberAdded(project, userId, req.userId);
    }

    await project.populate("owner members", "name email");
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Remove member from project
router.delete("/:id/members/:userId", authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!project) {
      return res
        .status(404)
        .json({ message: "Project not found or unauthorized" });
    }

    project.members = project.members.filter(
      (m) => m.toString() !== req.params.userId
    );
    await project.save();
    await project.populate("owner members", "name email");

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get project statistics
router.get("/:id/statistics", authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [{ owner: req.userId }, { members: req.userId }],
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const total = await Task.countDocuments({ project: project._id });
    const completed = await Task.countDocuments({
      project: project._id,
      status: "completed",
    });
    const inProgress = await Task.countDocuments({
      project: project._id,
      status: "in-progress",
    });
    const pending = await Task.countDocuments({
      project: project._id,
      status: "pending",
    });

    res.json({
      total,
      byStatus: { completed, inProgress, pending },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
