import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/user.models.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      let user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }

      user = new User({
        name,
        email: email.toLowerCase(),
        password,
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        userId: user.id,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const payload = {
        userId: user.id,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get current user
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Search users - ENHANCED WITH LOGGING
router.get("/search", authenticate, async (req, res) => {
  try {
    const { q } = req.query;

    console.log("Search query:", q);
    console.log("Current user ID:", req.userId);

    if (!q || q.length < 2) {
      return res.json([]);
    }

    // Get all users except current user
    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("name email")
      .limit(10);

    console.log("Found users:", users.length);
    console.log("Users:", users);

    res.json(users);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// NEW: Get all users (for testing)
router.get("/users", authenticate, async (req, res) => {
  try {
    const users = await User.find().select("name email").limit(50);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
