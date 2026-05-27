const { saveNotification } = require("../Controller/notificationController");
const Issue = require("../Models/PostIssueModel");
const Notification = require("../Models/Notification"); // Add this import
const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  loginAdmin,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  getDistrictPoints,
  notifyIssueOpened,
  notifyImproperIssueOpened,
  forgotPassword,
  resetPassword,
  verifyOtp,
  resendOtp,
  getIssueStats,
} = require("../Controller/adminController");

/* AUTH */
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

/* DASHBOARD */
router.get("/issues", getAllIssues);
router.get("/issues/stats", getIssueStats);
router.get("/issues/:id", getIssueById);
router.put("/issues/:id/status", updateIssueStatus);

/* DISTRICT LEADERBOARD */
router.get("/district-points", getDistrictPoints);

// Add this route
router.post("/issues/:id/notify-improper-view", notifyImproperIssueOpened);
router.post("/issues/:id/notify-view", notifyIssueOpened);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// Alternative: Use the controller function if you prefer
// router.post("/issues/:issueId/notify-view", notifyIssueOpened);

module.exports = router;
