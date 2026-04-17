const Review = require("../Models/Review");

// POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const { issueId, citizenId, isResolved, rating, feedback } = req.body;

    // Validation
    if (!issueId || !citizenId || isResolved === undefined || !feedback) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    if (isResolved === true && (!rating || rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5 when resolved" });
    }

    // Check if review already exists
    const existing = await Review.findOne({ issueId, citizenId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Review already submitted for this issue" });
    }

    const review = new Review({
      issueId,
      citizenId,
      isResolved,
      rating: isResolved ? rating : null,
      feedback,
    });

    await review.save();
    res.status(201).json({ success: true, message: "Review submitted", review });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/reviews/check/:issueId?citizenId=xxx
exports.checkReviewSubmitted = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { citizenId } = req.query;

    if (!issueId || !citizenId) {
      return res.status(400).json({ success: false, message: "Missing issueId or citizenId" });
    }

    const review = await Review.findOne({ issueId, citizenId });
    res.json({ submitted: !!review });
  } catch (error) {
    console.error("Check review error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate("issueId"); // optional

    res.json({ success: true, reviews });
  } catch (err) {
    console.error("Fetch reviews error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};