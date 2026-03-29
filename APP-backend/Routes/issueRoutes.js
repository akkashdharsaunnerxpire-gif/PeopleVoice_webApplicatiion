const express = require("express");
const router = express.Router();

const {
  postIssue,
  getAllIssues,
  toggleLike,
  addComment,
  toggleCommentLike,
  checkNewPosts,
  getIssue,
  deleteIssue,
  deleteComment,
  updateComment,
  getIssueWithFreshComments
} = require("../Controller/PostIssueController");

// POST ISSUE
router.post("/post-issue-data", postIssue);

// GET ALL ISSUES (with pagination & filters)
router.get("/issues", getAllIssues);

// CHECK NEW POSTS (smart polling)
router.get("/issues/check-new", checkNewPosts);

// GET SINGLE ISSUE
router.get("/issues/:id", getIssue);

// LIKE/UNLIKE POST
router.post("/issues/:id/like", toggleLike);

// ADD COMMENT
router.post("/issues/:id/comment", addComment);

// LIKE/UNLIKE COMMENT
router.post("/issues/:issueId/comment/:commentId/like", toggleCommentLike);

// DELETE COMMENT
router.delete("/issues/:issueId/comment/:commentId", deleteComment);

// UPDATE COMMENT
router.put("/issues/:issueId/comment/:commentId", updateComment);

// GET FRESH COMMENTS (for sync)
router.get("/issues/:id/fresh-comments", getIssueWithFreshComments);

// DELETE ISSUE
router.delete("/issues/:id", deleteIssue);

module.exports = router;