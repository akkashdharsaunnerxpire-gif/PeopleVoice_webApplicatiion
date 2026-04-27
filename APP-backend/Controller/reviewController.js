const Review = require("../Models/Review");
const Issue = require("../Models/PostIssueModel");
const { saveNotification } = require("./notificationController");

// POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const { issueId, citizenId, isResolved, rating, feedback } = req.body;

    if (!issueId || !citizenId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    let existing = await Review.findOne({ issueId, citizenId });

    /* ================= FIRST TIME REVIEW ================= */
    if (!existing) {
      if (isResolved === undefined) {
        return res.status(400).json({
          success: false,
          message: "isResolved required",
        });
      }

      if (isResolved === false && (!feedback || feedback.trim() === "")) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid reason",
        });
      }

      const review = await Review.create({
        issueId,
        citizenId,
        isResolved,
        rating: rating || null,
        feedback: feedback?.trim() || "",
      });

      // If citizen says NOT resolved, mark issue as Reopened
      if (isResolved === false && (issue.status === "Resolved" || issue.status === "Closed")) {
        issue.status = "Reopened";
        await issue.save();
        console.log(`✅ Issue ${issueId} marked as REOPENED - Improper report`);
      }

      return res.json({
        success: true,
        message: "Review saved",
        review,
      });
    }

    /* ================= UPDATE EXISTING REVIEW ================= */
    // Check if there's a negative review (improper issue)
    const negativeReview = await Review.findOne({
      issueId,
      citizenId,
      isResolved: false
    });

    // Check if user already re-confirmed
    const alreadyReConfirmed = existing && existing.isResolved === true;

    // Block update if normal issue already submitted
    if (typeof isResolved !== "undefined") {
      if (!negativeReview) {
        // Normal issue - already submitted
        return res.status(400).json({
          success: false,
          message: "Already submitted",
        });
      }
      
      if (alreadyReConfirmed) {
        // Improper issue but already re-confirmed
        return res.status(400).json({
          success: false,
          message: "Already submitted",
        });
      }
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Update the review (re-confirmation for improper issue)
    if (typeof isResolved !== "undefined") {
      existing.isResolved = isResolved;
      existing.feedback = isResolved === true ? "The issue has been properly resolved now." : existing.feedback;
    }
    if (rating !== undefined) existing.rating = rating;
    if (feedback !== undefined) existing.feedback = feedback.trim();

    await existing.save();

    // If citizen confirms YES for improper issue, close it
    if (negativeReview && isResolved === true) {
      issue.status = "Closed";
      await issue.save();
      console.log(`✅ Issue ${issueId} CLOSED after proper re-confirmation`);
    }

    return res.json({
      success: true,
      message: "Review updated",
      review: existing,
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= CHECK REVIEW SUBMITTED ================= */
exports.checkReviewSubmitted = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { citizenId } = req.query;

    if (!issueId || !citizenId) {
      return res.status(400).json({
        success: false,
        message: "Missing issueId or citizenId",
      });
    }

    // Get the user's review
    const review = await Review.findOne({ issueId, citizenId });
    
    // Check if there's a negative review (improper issue)
    const negativeReview = await Review.findOne({
      issueId,
      citizenId,
      isResolved: false
    });

    const hasSubmitted = review !== null;
    const issue = await Issue.findById(issueId);
    const isImproper = negativeReview !== null;
    const alreadyReConfirmed = review && review.isResolved === true;
    
    // 🔥 CRITICAL: allowResubmit true ONLY when:
    // 1. Issue is improper (has negative review)
    // 2. Issue status is "Resolved" (admin made new attempt, not Reopened)
    // 3. User has NOT already re-confirmed
    const isPendingReconfirm = issue?.status === "Resolved" && isImproper && !alreadyReConfirmed;
    const allowResubmit = isPendingReconfirm;

    console.log(`📋 Check - Issue: ${issueId}`);
    console.log(`   hasSubmitted: ${hasSubmitted}`);
    console.log(`   isImproper: ${isImproper}`);
    console.log(`   issueStatus: ${issue?.status}`);
    console.log(`   alreadyReConfirmed: ${alreadyReConfirmed}`);
    console.log(`   allowResubmit: ${allowResubmit}`);

    return res.json({
      submitted: hasSubmitted,
      allowResubmit: allowResubmit,
    });
  } catch (error) {
    console.error("Check review error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================= GET ALL REVIEWS ================= */
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate("issueId");
    res.json({ success: true, reviews });
  } catch (err) {
    console.error("Fetch reviews error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET /api/reviews/previous/:issueId
exports.getPreviousReview = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { citizenId } = req.query;

    if (!issueId || !citizenId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const review = await Review.findOne({
      issueId,
      citizenId,
      isResolved: false,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      feedback: review?.feedback || "",
    });
  } catch (error) {
    console.error("Get previous review error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};