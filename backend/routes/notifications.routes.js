import express from "express";
import Notification from "../models/notification.models.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all notifications for current user
router.get("/", authenticate, async (req, res) => {
  try {
    const { limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: req.userId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate("sender", "name email")
      .populate("relatedTask", "title")
      .populate("relatedProject", "name color")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Mark all notifications as read - BEFORE :id routes
router.put("/read-all", authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Clear all read notifications - BEFORE :id routes
router.delete("/read", authenticate, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.userId,
      isRead: true,
    });

    res.json({
      message: "Read notifications cleared",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear read error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Mark notification as read
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete notification
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted", deletedId: notification._id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
