const SavedIssue = require("../Models/SavedIssue");
const Complaint = require("../Models/PostIssueModel");
const mongoose = require("mongoose");

/* ================= TOGGLE SAVE ================= */
exports.toggleSaveIssue = async (req, res) => {
  try {
    const { citizenId, issueId } = req.body;

    if (!citizenId || !issueId) {
      return res.status(400).json({
        success: false,
        message: "citizenId and issueId are required",
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issueId format",
      });
    }

    const issue = await Complaint.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const existing = await SavedIssue.findOne({ citizenId, issueId });

    if (existing) {
      // Unsave
      await SavedIssue.deleteOne({ _id: existing._id });
      return res.json({
        success: true,
        saved: false,
        message: "Removed from saved",
      });
    }

    // Save
    const saved = await SavedIssue.create({ citizenId, issueId });

    // Return the saved item with populated issue data for immediate use
    const populatedSaved = {
      issueId: saved.issueId,
      issueData: issue,
    };

    res.json({
      success: true,
      saved: true,
      data: populatedSaved,
      message: "Added to saved",
    });
  } catch (err) {
    console.error("TOGGLE SAVE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= CHECK SAVED ================= */
exports.checkSaved = async (req, res) => {
  try {
    const { citizenId, issueId } = req.query;

    if (!citizenId || !issueId) {
      return res.status(400).json({
        success: false,
        message: "citizenId & issueId required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({ success: false, message: "Invalid issueId" });
    }

    const saved = await SavedIssue.findOne({ citizenId, issueId });

    res.json({
      success: true,
      isSaved: !!saved,
    });
  } catch (err) {
    console.error("CHECK SAVED ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= GET SAVED ISSUES ================= */
exports.getSavedIssues = async (req, res) => {
  try {
    const { citizenId } = req.params;

    if (!citizenId) {
      return res.status(400).json({ success: false, message: "citizenId required" });
    }

    const savedIssues = await SavedIssue.find({ citizenId }).sort({ savedAt: -1 });

    // Use Promise.all to fetch issue data concurrently
    const results = await Promise.all(
      savedIssues.map(async (item) => {
        // Skip if issueId is invalid
        if (!mongoose.Types.ObjectId.isValid(item.issueId)) {
          await SavedIssue.deleteOne({ _id: item._id }); // clean up
          return null;
        }

        const issue = await Complaint.findById(item.issueId);
        if (!issue) {
          await SavedIssue.deleteOne({ _id: item._id }); // remove orphaned entry
          return null;
        }

        return {
          issueId: item.issueId,
          issueData: issue,
        };
      })
    );

    // Filter out nulls (deleted or invalid issues)
    const validResults = results.filter((item) => item !== null);

    res.json({
      success: true,
      data: validResults,
      count: validResults.length,
    });
  } catch (err) {
    console.error("GET SAVED ISSUES ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};