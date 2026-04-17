const express = require("express");
const router = express.Router();

// 🔥 IMPORT FULL CONTROLLER (NO DESTRUCTURE)
const issueController = require("../Controller/PostIssueController");

// POST ISSUE
router.post("/post-issue-data", issueController.postIssue);

// GET ALL ISSUES (with pagination & filters)
router.get("/issues", issueController.getAllIssues);

// CHECK NEW POSTS (smart polling)
router.get("/issues/check-new", issueController.checkNewPosts);

// GET SINGLE ISSUE
router.get("/issues/:id", issueController.getIssue);

// GET MY ISSUES
router.get("/my-issues", issueController.getMyIssues);

// LIKE/UNLIKE POST
router.post("/issues/:id/like", issueController.toggleLike);

// ADD COMMENT
router.post("/issues/:id/comment", issueController.addComment);

// LIKE/UNLIKE COMMENT
router.post(
  "/issues/:issueId/comment/:commentId/like",
  issueController.toggleCommentLike
);

// DELETE COMMENT
router.delete(
  "/issues/:issueId/comment/:commentId",
  issueController.deleteComment
);

// UPDATE COMMENT
router.put(
  "/issues/:issueId/comment/:commentId",
  issueController.updateComment
);

// DELETE ISSUE
router.delete("/issues/:id", issueController.deleteIssue);

// VERIFY ISSUE
router.post("/issues/verify/:id", issueController.verifyIssue);

module.exports = router;