const Complaint = require("../Models/PostIssueModel");
const DistrictPerformance = require("../Models/district_performance");
const mongoose = require("mongoose");

/* ✅ ADD THIS LINE */
const { saveNotification } = require("../Controller/notificationController");

/* ======================================
   UPDATE ISSUE STATUS
====================================== */
exports.handleStatusAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const issue = await Complaint.findById(id);

    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    let update = {};

    /* ---------- NOTIFY ---------- */
    if (action === "notify") {
      update = {
        status: "In Progress",
        municipalityInformedDate: new Date(),
        notificationRead: false,
      };
    } else if (action === "close") {
      /* ---------- CLOSE ---------- */
      if (issue.status !== "solved") {
        await DistrictPerformance.findOneAndUpdate(
          { district: issue.district },
          { $inc: { issuesResolved: 1 } },
          { upsert: true },
        );
      }

      update = {
        status: "solved",
        closedDate: new Date(),
        notificationRead: false,
      };
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    const updatedIssue = await Complaint.findByIdAndUpdate(id, update, {
      new: true,
    });

    /* 🔥 ADD THIS (NOTIFICATION SAVE) */
    // 🔥 CORRECT NOTIFICATION LOGIC
    if (action === "notify") {
      await saveNotification(
        updatedIssue,
        updatedIssue.status,
        `Officer has started working on your issue: "${updatedIssue.reason}"`,
      );
    }

    if (action === "close") {
      await saveNotification(
        updatedIssue,
        updatedIssue.status,
        `Your issue "${updatedIssue.reason}" has been closed`,
      );
    }

    res.json({
      success: true,
      message: `Issue ${updatedIssue.status}`,
      issue: updatedIssue,
    });
  } catch (err) {
    console.error("Status Action Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ======================================
   RESOLVE ISSUE (AFTER IMAGES)
====================================== */
exports.resolveIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { after_images, resolution_details } = req.body;

    if (!after_images || after_images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "After images required",
      });
    }

    const issue = await Complaint.findById(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    if (issue.status !== "Resolved") {
      await DistrictPerformance.findOneAndUpdate(
        { district: issue.district },
        { $inc: { issuesResolved: 1 } },
        { upsert: true },
      );
    }

    const updatedIssue = await Complaint.findByIdAndUpdate(
      id,
      {
        after_images,
        resolution_details,
        status: "Resolved",
        resolved_date: new Date(),
        notificationRead: false,
      },
      { new: true },
    );

    /* 🔥 ADD THIS (NOTIFICATION SAVE) */
    await saveNotification(
      updatedIssue,
      updatedIssue.status,
      `Your issue "${updatedIssue.reason}" has been resolved`,
    );

    res.json({
      success: true,
      message: "Issue resolved",
      issue: updatedIssue,
    });
  } catch (err) {
    console.error("Resolve Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ======================================
   GET SINGLE ISSUE
====================================== */
exports.getIssueById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const issue = await Complaint.findById(id);
    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    res.json({ success: true, issue });
  } catch (err) {
    console.error("Get Issue Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
