import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { body, validationResult } from "express-validator";
import User from "../models/user.models.js";
import { sendVerificationEmail } from "../utils/email.utils.js";
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
        emailVerified: false,
      });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      user.emailVerified = true;
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = Date.now() + 24 * 3600 * 1000; // 24 hours

      await user.save();

      const verificationUrl = `${process.env.CLIENT_URL}/#/verify-email?token=${verificationToken}`;

      try {
        await sendVerificationEmail(user.email, verificationUrl);
        res.status(201).json({
          message:
            "Registration successful. Please check your email to verify your account.",
          requiresVerification: true,
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Delete the user if email sending fails
        await User.findByIdAndDelete(user._id);
        throw new Error("Failed to complete registration. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error.message });
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
      console.log("Login attempt for email:", email);

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        console.log("User not found");
        return res.status(400).json({ message: "Invalid credentials" });
      }

      console.log("User found, verification status:", user.emailVerified);

      // Use the comparePassword method from the user model
      const isMatch = await user.comparePassword(password);
      console.log("Password match result:", isMatch);

      if (!isMatch) {
        console.log("Password mismatch for user:", email);
        return res.status(400).json({ message: "Invalid credentials" });
      }

      if (!user.emailVerified) {
        return res.status(403).json({
          message: "Please verify your email address before logging in",
          isVerificationError: true,
        });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({
        token,
        user: {
          _id: user._id,
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get current user
router.get("/me", [authenticate], async (req, res) => {
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

// Replace the existing verify-email route with this updated version:

router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;
    console.log("Verification attempt with token:", token);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log("Invalid or expired token");
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // Update user verification status
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    // Generate a login token after verification
    const loginToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Email verified successfully. You can now log in.",
      verified: true,
      token: loginToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: true,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during verification",
      error: error.message,
    });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 3600 * 1000;
    await user.save();

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(user.email, verificationUrl);

    res.json({ message: "Verification email resent successfully" });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add this temporary debug route
router.get("/check-verification/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.json({ message: "User not found" });
    }
    res.json({
      email: user.email,
      verified: user.emailVerified,
      verificationToken: user.emailVerificationToken,
      expires: user.emailVerificationExpires,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add this debug endpoint

router.get("/debug-user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.json({ message: "User not found" });
    }

    // Return user details without sensitive information
    res.json({
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      hasVerificationToken: !!user.emailVerificationToken,
      tokenExpiry: user.emailVerificationExpires,
      verificationStatus: {
        isVerified: user.emailVerified,
        hasToken: !!user.emailVerificationToken,
        isTokenExpired: user.emailVerificationExpires < Date.now(),
      },
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ message: "Server error", error: error.toString() });
  }
});

// WARNING: Only for debugging - remove in production
router.post("/debug-password", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({ status: "User not found" });
    }

    const isMatch = await user.comparePassword(password);

    res.json({
      email: user.email,
      passwordLength: user.password.length,
      passwordHash: user.password.substring(0, 10) + "...",
      attemptedMatch: isMatch,
      verified: user.emailVerified,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      message: "Password reset successful",
      passwordHash: user.password.substring(0, 10) + "...",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/test-email", async (req, res) => {
  try {
    await sendVerificationEmail(
      req.body.email,
      "http://localhost:5173/test-verification"
    );
    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send test email",
      error: error.message,
    });
  }
});

export default router;
