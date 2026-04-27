const Notification = require("../Models/Notification");

const saveNotification = async (issue, status, customMessage = null, isImproper = false) => {
  try {
    if (!issue || !issue.citizenId) return;

    let type = "info";
    let message = "";

    if (status === "Reopened") return;

    if (status === "Resolved") {
      type = isImproper ? "warning" : "success";
      const title = issue.reason || "Report";
      message = isImproper
        ? `⚠️ Municipality has made a new resolution attempt for your improperly reported issue "${title}". Please review and confirm.`
        : `✅ Your issue "${title}" has been resolved. Please confirm.`;
    } 
    else if (status === "Closed") {
      type = "success";
      message = customMessage || `🎉 Your issue "${issue.reason || "Report"}" has been closed. Thank you!`;
    }
    else if (status === "In Progress") {
      type = "warning";
      message = customMessage || `🔄 Your issue "${issue.reason || "Report"}" is now in progress.`;
    }
    else if (status === "Opened") {
      type = "info";
      message = customMessage || `👀 Your issue "${issue.reason || "Report"}" has been viewed.`;
    }
    else {
      message = customMessage || `Your issue "${issue.reason || "Report"}" status: ${status}`;
    }

    await Notification.create({
      citizenId: String(issue.citizenId),
      issueId: issue._id,
      message,
      status,
      type,
      location: issue.area || issue.district || "",
      image: typeof issue.images?.[0] === "string" ? issue.images[0] : issue.images?.[0]?.url || null,
      read: false,
      createdAt: new Date(),
    });
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
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= MARK AS READ ================= */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification" });
  }
};

/* ================= DELETE NOTIFICATION ================= */
const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

module.exports = {
  saveNotification,
  getNotifications,
  markAsRead,
  deleteNotification,
};