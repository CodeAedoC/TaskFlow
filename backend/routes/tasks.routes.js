import express from "express";
import { body, validationResult } from "express-validator";
import Task from "../models/task.models.js";
import Project from "../models/project.models.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  notifyTaskAssignment,
  notifyTaskUpdate,
} from "../utils/notifications.utils.js";

const router = express.Router();

// GET STATISTICS - FIXED
router.get('/statistics', authenticate, async (req, res) => {
  try {
    // Get all projects user is part of
    const userProjects = await Project.find({
      $or: [
        { owner: req.userId },
        { members: req.userId }
      ]
    }).select('_id');
    
    const projectIds = userProjects.map(p => p._id);
    
    // Build query conditions
    const orConditions = [
      { user: req.userId },
      { assignedTo: req.userId }
    ];
    
    if (projectIds.length > 0) {
      orConditions.push({ project: { $in: projectIds } });
    }
    
    const baseQuery = { $or: orConditions };
    
    const total = await Task.countDocuments(baseQuery);
    const completed = await Task.countDocuments({ $and: [baseQuery, { status: 'completed' }] });
    const inProgress = await Task.countDocuments({ $and: [baseQuery, { status: 'in-progress' }] });
    const pending = await Task.countDocuments({ $and: [baseQuery, { status: 'pending' }] });
    const high = await Task.countDocuments({ $and: [baseQuery, { priority: 'high' }] });
    const medium = await Task.countDocuments({ $and: [baseQuery, { priority: 'medium' }] });
    const low = await Task.countDocuments({ $and: [baseQuery, { priority: 'low' }] });

    res.json({
      total,
      byStatus: { completed, inProgress, pending },
      byPriority: { high, medium, low }
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// GET SINGLE TASK - FIXED to include project access
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'name color')
      .populate('user', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to this task
    const hasAccess = 
      task.user._id.toString() === req.userId.toString() ||
      task.assignedTo.some(u => u._id.toString() === req.userId.toString());
    
    // If not directly involved, check if user is in the project
    if (!hasAccess && task.project) {
      const project = await Project.findOne({
        _id: task.project._id,
        $or: [
          { owner: req.userId },
          { members: req.userId }
        ]
      });
      
      if (!project) {
        return res.status(403).json({ message: 'Not authorized to view this task' });
      }
    } else if (!hasAccess && !task.project) {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }
    
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET ALL TASKS - FIXED MongoDB query
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, search, project, assignedUser } = req.query;
    
    console.log('🔍 User requesting tasks:', req.userId);
    console.log('🔍 Filters:', { status, priority, search, project, assignedUser });
    
    let query;
    
    if (project) {
      // Filtering by specific project
      const projectDoc = await Project.findOne({
        _id: project,
        $or: [
          { owner: req.userId },
          { members: req.userId }
        ]
      });
      
      if (!projectDoc) {
        return res.status(403).json({ message: 'Not authorized to view this project' });
      }
      
      query = { project: project };
    } else {
      // Get all projects user is part of
      const userProjects = await Project.find({
        $or: [
          { owner: req.userId },
          { members: req.userId }
        ]
      }).select('_id');
      
      const projectIds = userProjects.map(p => p._id);
      
      // Build query conditions
      const orConditions = [
        { user: req.userId },           // Tasks created by user
        { assignedTo: req.userId }      // Tasks assigned to user
      ];
      
      // Add project tasks if user has projects
      if (projectIds.length > 0) {
        orConditions.push({ project: { $in: projectIds } });
      }
      
      query = { $or: orConditions };
    }
    
    // Apply additional filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedUser) query.assignedTo = assignedUser;
    
    // Handle search
    if (search) {
      query = {
        $and: [
          query,
          {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } }
            ]
          }
        ]
      };
    }

    console.log('🔍 MongoDB Query:', JSON.stringify(query, null, 2));

    const tasks = await Task.find(query)
      .populate('project', 'name color')
      .populate('user', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${tasks.length} tasks`);
    
    res.json(tasks);
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// CREATE TASK
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

      // ADDED: Clean up empty project field
      const taskData = {
        ...req.body,
        user: req.userId,
      };

      // Remove project field if it's empty string
      if (
        taskData.project === "" ||
        taskData.project === null ||
        taskData.project === undefined
      ) {
        delete taskData.project;
      }

      // Remove assignedTo if it's empty array
      if (taskData.assignedTo && taskData.assignedTo.length === 0) {
        delete taskData.assignedTo;
      }

      if (taskData.project && taskData.assignedTo?.length > 0) {
        const project = await Project.findById(taskData.project);

        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }

        const invalidUsers = taskData.assignedTo.filter(
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

      const task = new Task(taskData);

      await task.save();
      await task.populate("project", "name color");
      await task.populate("user", "name email");
      await task.populate("assignedTo", "name email");

      // Send notifications to assigned users
      if (task.assignedTo && task.assignedTo.length > 0) {
        await notifyTaskAssignment(
          task,
          task.assignedTo.map((u) => u._id),
          req.userId
        );
      }

      res.status(201).json(task);
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

router.post("/reorder", authenticate, async (req, res) => {
  const { taskIds, status } = req.body;
  if (!Array.isArray(taskIds) || typeof status !== "string") {
    return res.status(400).json({ message: "Invalid payload" });
  }
  try {
    // Update all positions in bulk
    const bulkOps = taskIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { position: index, status },
      },
    }));
    await Task.bulkWrite(bulkOps);
    res.json({ message: "Tasks reordered successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Bulk reorder failed", error: error.message });
  }
});

// UPDATE TASK - FIXED authorization
router.put('/:id',
  authenticate,
  [
    body('title').optional().trim().notEmpty(),
    body('status').optional().isIn(['pending', 'in-progress', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('assignedTo').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const task = await Task.findById(req.params.id);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check if user has access to this task
      const hasDirectAccess = 
        task.user.toString() === req.userId ||
        task.assignedTo?.some(userId => userId.toString() === req.userId);

      // If no direct access, check if user is in the task's project
      if (!hasDirectAccess && task.project) {
        const project = await Project.findOne({
          _id: task.project,
          $or: [
            { owner: req.userId },
            { members: req.userId }
          ]
        });

        if (!project) {
          return res.status(403).json({ message: 'Not authorized to update this task' });
        }
      } else if (!hasDirectAccess && !task.project) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }

      // Validate assignedTo users are in project if project exists
      if (req.body.project && req.body.assignedTo?.length > 0) {
        const project = await Project.findById(req.body.project);
        
        if (!project) {
          return res.status(404).json({ message: 'Project not found' });
        }

        const invalidUsers = req.body.assignedTo.filter(
          userId => !project.members.some(memberId => memberId.toString() === userId)
        );

        if (invalidUsers.length > 0) {
          return res.status(400).json({ 
            message: 'Some users are not members of this project' 
          });
        }
      }

      // Track old assigned users for notifications
      const oldAssignedUsers = task.assignedTo || [];
      
      // Update task
      Object.assign(task, req.body);
      await task.save();
      
      await task.populate('project', 'name color');
      await task.populate('user', 'name email');
      await task.populate('assignedTo', 'name email');

      // Send notifications for new assignments
      if (req.body.assignedTo) {
        const newAssignedUsers = req.body.assignedTo.filter(
          userId => !oldAssignedUsers.some(oldId => oldId.toString() === userId)
        );

        if (newAssignedUsers.length > 0) {
          await notifyTaskAssignment(task, newAssignedUsers, req.userId);
        }
      }

      res.json(task);
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);


// DELETE TASK - FIXED authorization
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has access to this task
    const hasDirectAccess = 
      task.user.toString() === req.userId ||
      task.assignedTo?.some(userId => userId.toString() === req.userId);

    // If no direct access, check if user is in the task's project
    if (!hasDirectAccess && task.project) {
      const project = await Project.findOne({
        _id: task.project,
        $or: [
          { owner: req.userId },
          { members: req.userId }
        ]
      });

      if (!project) {
        return res.status(403).json({ message: 'Not authorized to delete this task' });
      }
    } else if (!hasDirectAccess && !task.project) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    // Only task creator can delete (even if they're a project member)
    if (task.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only task creator can delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    
    // Delete associated comments
    await Comment.deleteMany({ task: req.params.id });
    
    // Delete associated notifications
    await Notification.deleteMany({ relatedTask: req.params.id });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


export default router;
