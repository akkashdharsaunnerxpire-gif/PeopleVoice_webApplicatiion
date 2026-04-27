const express = require("express");
const router = express.Router();
const {
  createReview,
  checkReviewSubmitted,
  getAllReviews,
  getPreviousReview
} = require("../Controller/reviewController");

router.post("/", createReview);
router.get("/check/:issueId", checkReviewSubmitted);
router.get("/", getAllReviews);
router.get("/previous/:issueId", getPreviousReview);

module.exports = router;