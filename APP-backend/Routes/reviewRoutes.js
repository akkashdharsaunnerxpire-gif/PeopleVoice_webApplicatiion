const express = require("express");
const { createReview, checkReviewSubmitted ,getAllReviews} = require("../Controller/reviewController");

const router = express.Router();

router.post("/", createReview);
router.get("/check/:issueId", checkReviewSubmitted);
router.get("/", getAllReviews);

module.exports = router;