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
  notifyImproperIssueOpened ,
  forgotPassword,
  resetPassword,
  verifyOtp,
  resendOtp
} = require("../Controller/adminController");

/* AUTH */
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

/* DASHBOARD */
router.get("/issues", getAllIssues);
router.get("/issues/:id", getIssueById);
router.put("/issues/:id/status", updateIssueStatus);

/* DISTRICT LEADERBOARD */
router.get("/district-points", getDistrictPoints);
// Add this route
router.post("/issues/:id/notify-improper-view",notifyImproperIssueOpened);

/* NOTIFICATION: Officer viewed an issue - UPDATED VERSION */
router.post("/issues/:issueId/notify-view", async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // ✅ Check if already notified
    if (issue.lastOpenedNotified) {
      return res.status(200).json({ success: true, message: "Already notified" });
    }

    let message = "";
    let type = "info";

    // 🔥 CRITICAL: Different message for improperly resolved issues
    if (issue.status === "Reopened") {
      message = `⚠️ Your improperly resolved issue "${issue.reason || "Report"}" is being reviewed by the municipality.`;
      type = "warning";
    } else if (issue.status === "Sent") {
      message = `👀 Your issue "${issue.reason || "Report"}" has been viewed by the municipality and will be addressed soon.`;
      type = "info";
    } else {
      // For other statuses, use generic message
      message = `📋 Your issue "${issue.reason || "Report"}" has been reviewed by an officer.`;
    }

    // ✅ Save notification
    await Notification.create({
      citizenId: String(issue.citizenId),
      issueId: issue._id,
      message,
      status: "Opened",
      type,
      location: issue.area || issue.district || "",
      image: typeof issue.images?.[0] === "string" ? issue.images[0] : issue.images?.[0]?.url || null,
      read: false,
      createdAt: new Date(),
    });

    // ✅ Mark as notified
    issue.lastOpenedNotified = true;
    await issue.save();

    console.log(`✅ Notification sent for issue ${issueId}: ${message}`);
    res.status(200).json({ success: true, message: "Notification sent" });
  } catch (error) {
    console.error("Error sending view notification:", error);
    res.status(500).json({ message: "Failed to send notification" });
  }
});
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// Alternative: Use the controller function if you prefer
// router.post("/issues/:issueId/notify-view", notifyIssueOpened);

module.exports = router;