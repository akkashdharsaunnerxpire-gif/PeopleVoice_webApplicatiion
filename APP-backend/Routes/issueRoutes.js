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
  getMyIssues,
  deleteComment,
  updateComment,
  verifyIssue,
} = require("../Controller/PostIssueController");

// POST ISSUE
router.post("/post-issue-data", postIssue);

// GET ALL ISSUES (with pagination & filters)
router.get("/issues", getAllIssues);

// CHECK NEW POSTS (smart polling)
router.get("/issues/check-new", checkNewPosts);

// GET SINGLE ISSUE
router.get("/issues/:id", getIssue);

router.get("/my-issues", getMyIssues);

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

// DELETE ISSUE
router.delete("/issues/:id", deleteIssue);

router.post("/issues/verify/:id", verifyIssue);

module.exports = router;  