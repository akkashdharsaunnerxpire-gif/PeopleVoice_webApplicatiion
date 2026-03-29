const Notification = require("../Models/Notification");
const Issue = require("../Models/PostIssueModel"); // ✅ FORCE LOAD

/* ================= SAVE ================= */
const saveNotification = async (issue, status, customMessage = null) => {
  try {
    if (!issue || !issue.citizenId) return;

    let type = "info";
    if (["Resolved", "solved", "Closed"].includes(status)) type = "success";
    if (status === "In Progress") type = "warning";

    const msg =
      customMessage ||
      `Your issue "${issue.reason || "Report"}" is now ${status}`;
    const exists = await Notification.findOne({
      citizenId: String(issue.citizenId),
      issueId: issue._id,
      message: msg,
      status: status,
    });

    if (exists) {
      console.log("⚠️ Duplicate notification blocked");
      return;
    }

    await Notification.create({
      citizenId: String(issue.citizenId),
      issueId: issue._id,
      message: msg,
      status,
      type,
      location: issue.area || "",
      image: issue.images_data?.[0] || null,
      read: false,
    });

    console.log("✅ Notification saved");
  } catch (err) {
    console.error("❌ Save Error:", err);
  }
};

/* ================= GET ================= */
const getNotifications = async (req, res) => {
  try {
    const { citizenId } = req.query;

    if (!citizenId) {
      return res.status(400).json({ message: "citizenId is required" });
    }

    console.log("Fetching notifications for:", citizenId); // ← important debug

    const notifications = await Notification.find({
      citizenId: String(citizenId), // safe side
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "issueId",
        ref: "PostIssue",
        select: "reason images_data area department",
      })
      .lean(); // ← faster + easier to debug

    console.log(`Found ${notifications.length} notifications`);

    res.json(notifications);
  } catch (error) {
    console.error("❌ Fetch notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= READ ================= */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Notification id required" });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error("❌ Mark read error:", error);
    res.status(500).json({ message: "Error updating notification" });
  }
};

/* ================= DELETE ================= */
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
