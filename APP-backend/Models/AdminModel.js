const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      required: true,
      unique: true,
    },

    // Government login email
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    // Contact email (personal / official)
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "ADMIN",
    },

    // Security fields
    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    // 🔁 Password reset OTP fields (for forgot password)
    resetOtp: {
      type: String,  // Store as string to preserve leading zeros
      default: null,
    },

    resetOtpExpires: {
      type: Date,
      default: null,
    },

    // Legacy reset fields (keep for other flows if needed)
    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // Login protection
    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Admin || mongoose.model("Admin", adminSchema);