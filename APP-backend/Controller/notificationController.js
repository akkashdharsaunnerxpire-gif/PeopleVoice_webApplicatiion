const Notification = require("../Models/Notification");
const Issue = require("../Models/PostIssueModel");

/* ================= SAVE NOTIFICATION ================= */
const saveNotification = async (issue, status, customMessage = null) => {
  try {
    if (!issue || !issue.citizenId) {
      return;
    }

    let type = "info";
    if (["Resolved", "solved", "Closed"].includes(status)) type = "success";
    if (status === "In Progress") type = "warning";

    const msg =
      customMessage ||
      `Your issue "${issue.reason || "Report"}" is now ${status}`;

    const notification = await Notification.create({
      citizenId: String(issue.citizenId),
      issueId: issue._id,
      message: msg,
      status: status,
      type: type,
      location: issue.area || issue.district || "",
      image: issue.images_data?.[0] || null,
      read: false,
      createdAt: new Date(),
    });
    
    return notification;
  } catch (err) {
    console.error("Save Notification Error:", err);
  }
};

/* ================= GET NOTIFICATIONS ================= */
const getNotifications = async (req, res) => {
  try {
    const { citizenId } = req.query;

    if (!citizenId) {
      return res.status(400).json({ message: "citizenId is required" });
    }

    const notifications = await Notification.find({
      citizenId: String(citizenId),
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(notifications);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= MARK AS READ ================= */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Notification id required" });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ message: "Error updating notification" });
  }
};

/* ================= DELETE NOTIFICATION ================= */
const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete failed:", error);
    res.status(500).json({ message: "Delete failed" });
  }
};
// verify issue
exports.verifyIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, citizenId } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Not found" });

    if (!issue.verifications) issue.verifications = [];

    issue.verifications.push({
      citizenId,
      response,
      time: new Date(),
    });

    // Logic
    if (response === "yes") {
      issue.status = "Closed";
    }

    if (response === "no") {
      issue.status = "In Progress";
    }

    await issue.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying" });
  }
};

module.exports = {
  saveNotification,
  getNotifications,
  markAsRead,
  deleteNotification,
};