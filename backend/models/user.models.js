import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    emailVerified: {
      type: Boolean,
      default: true,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Remove the pre-save middleware temporarily to debug
// userSchema.pre("save", async function (next) {...});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    console.log("Debug password comparison:");
    console.log("User email:", this.email);
    console.log("Stored hash length:", this.password.length);
    console.log("Candidate password length:", candidatePassword.length);

    // Log first few characters of both passwords (safely)
    console.log("Stored hash preview:", this.password.substring(0, 10) + "...");
    console.log(
      "Candidate password:",
      candidatePassword.substring(0, 1) + "..." + candidatePassword.slice(-1)
    );

    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log("bcrypt comparison result:", isMatch);
    return isMatch;
  } catch (error) {
    console.error("Password comparison error details:", error);
    throw error;
  }
};

export default mongoose.model("User", userSchema);
