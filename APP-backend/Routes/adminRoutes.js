const { saveNotification } = require("../Controller/notificationController");
const Issue = require("../Models/PostIssueModel"); // needed for fetching issue details
const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  loginAdmin,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  getDistrictPoints,
} = require("../Controller/adminController");

// Import notification controller

/* AUTH */
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

/* DASHBOARD */
router.get("/issues", getAllIssues);
router.get("/issues/:id", getIssueById);
router.put("/issues/:id/status", updateIssueStatus);

/* DISTRICT LEADERBOARD */
router.get("/district-points", getDistrictPoints);

/* NOTIFICATION: Officer viewed an issue */
router.post("/issues/:issueId/notify-view", async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const customMessage = `Officer has viewed your case: "${issue.reason || "Issue"}"`;

    await saveNotification(issue, "Viewed", customMessage);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending view notification:", error);
    res.status(500).json({ message: "Failed" });
  }
});
module.exports = router;