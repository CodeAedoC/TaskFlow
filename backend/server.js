import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Allow frontend to connect
app.use(express.json()); // Parse JSON bodies

// Connect to database
connectDB();

// Routes
app.use("/api/auth", authRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Task Manager API Running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
