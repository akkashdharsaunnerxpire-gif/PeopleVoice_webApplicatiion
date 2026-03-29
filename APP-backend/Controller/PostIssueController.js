const mongoose = require("mongoose");
const Complaint = require("../Models/PostIssueModel");
const SavedIssue = require("../Models/SavedIssue");

/* ---------------- POST ISSUE ---------------- */
exports.postIssue = async (req, res) => {
  try {
    const issue = await Complaint.create({
      ...req.body,
      likes: [],
      likeCount: 0,
      comments: [],
      commentCount: 0,
    });

    res.status(201).json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ---------------- GET ALL ISSUES (with pagination) ---------------- */
exports.getAllIssues = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 5, 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.district && req.query.district !== "All")
      filter.district = req.query.district;
    if (req.query.department && req.query.department !== "All")
      filter.department = req.query.department;
    if (req.query.status && req.query.status !== "All")
      filter.status = req.query.status;
    if (req.query.citizenId) filter.citizenId = req.query.citizenId;
    if (req.query.onlyWithImages === "true")
      filter.images_data = { $exists: true, $ne: [] };

    let sortOption = { createdAt: -1 };
    switch (req.query.sortBy) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "mostLiked":
        sortOption = { likeCount: -1 };
        break;
      case "mostCommented":
        sortOption = { commentCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const totalCount = await Complaint.countDocuments(filter);
    const issues = await Complaint.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      page,
      limit,
      total: totalCount,
      hasMore: skip + issues.length < totalCount,
      issues,
    });
  } catch (err) {
    console.error("getAllIssues error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch issues" });
  }
};

/* ---------------- CHECK FOR NEW POSTS ---------------- */
exports.checkNewPosts = async (req, res) => {
  try {
    const { since } = req.query;
    const sinceTimestamp = parseInt(since) || 0;
    const sinceDate = new Date(sinceTimestamp);

    const newIssueCount = await Complaint.countDocuments({
      createdAt: { $gt: sinceDate },
    });

    const latestPost = await Complaint.findOne()
      .sort({ createdAt: -1 })
      .select("createdAt");

    res.json({
      success: true,
      hasNewPosts: newIssueCount > 0,
      newPostCount: newIssueCount,
      latestPostTime: latestPost?.createdAt || null,
      lastChecked: Date.now(),
    });
  } catch (error) {
    console.error("Error checking new posts:", error);
    res
      .status(500)
      .json({ success: false, message: "Error checking for new posts" });
  }
};

/* ---------------- LIKE / UNLIKE POST ---------------- */
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { citizenId } = req.body;

    if (!citizenId)
      return res.status(400).json({ message: "citizenId required" });

    const issue = await Complaint.findById(id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const liked = issue.likes.includes(citizenId);

    let updateOperation;
    if (liked) {
      updateOperation = {
        $pull: { likes: citizenId },
        $inc: { likeCount: -1 },
      };
    } else {
      updateOperation = {
        $addToSet: { likes: citizenId },
        $inc: { likeCount: 1 },
      };
    }

    const updated = await Complaint.findByIdAndUpdate(id, updateOperation, {
      new: true,
    });

    res.json({
      success: true,
      likes: updated.likes,
      likeCount: updated.likeCount,
      liked: !liked,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- ADD COMMENT (WITH NESTED REPLY SUPPORT) ---------------- */
exports.addComment = async (req, res) => {
  try {
    const { id: issueId } = req.params;
    const { citizenId, text, parentCommentId } = req.body;

    if (!citizenId || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "citizenId and non-empty text are required",
      });
    }

    const issue = await Complaint.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      citizenId,
      text: text.trim(),
      likes: [],
      parentCommentId: parentCommentId || null,
      replies: [],
      createdAt: new Date(),
    };

    // Function to add reply recursively
    const addReplyToComment = (comments, parentId, newReply) => {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i]._id.toString() === parentId) {
          comments[i].replies.push(newReply);
          return true;
        }
        if (comments[i].replies && comments[i].replies.length > 0) {
          if (addReplyToComment(comments[i].replies, parentId, newReply)) {
            return true;
          }
        }
      }
      return false;
    };

    if (parentCommentId) {
      // Add as reply to existing comment
      const added = addReplyToComment(issue.comments, parentCommentId, newComment);
      if (!added) {
        return res.status(400).json({ success: false, message: "Parent comment not found" });
      }
    } else {
      // Add as root comment
      issue.comments.push(newComment);
    }

    issue.commentCount = (issue.commentCount || 0) + 1;
    await issue.save();

    res.status(201).json({
      success: true,
      message: "Comment added",
      newComment,
    });
  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

/* ---------------- LIKE / UNLIKE COMMENT (FIXED FOR NESTED STRUCTURE) ---------------- */
exports.toggleCommentLike = async (req, res) => {
  try {
    const { issueId, commentId } = req.params;
    const { citizenId } = req.body;

    if (!citizenId) {
      return res.status(400).json({ 
        success: false, 
        message: "citizenId required" 
      });
    }

    const issue = await Complaint.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    // Function to find and update comment recursively
    let targetComment = null;
    let parentPath = [];

    const findComment = (comments, id, path = []) => {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i]._id.toString() === id) {
          targetComment = comments[i];
          parentPath = [...path, i];
          return true;
        }
        if (comments[i].replies && comments[i].replies.length > 0) {
          if (findComment(comments[i].replies, id, [...path, i, 'replies'])) {
            return true;
          }
        }
      }
      return false;
    };

    findComment(issue.comments, commentId);
    
    if (!targetComment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const isLiked = targetComment.likes.includes(citizenId);
    
    if (isLiked) {
      targetComment.likes = targetComment.likes.filter(id => id !== citizenId);
    } else {
      targetComment.likes.push(citizenId);
    }

    await issue.save();

    res.json({
      success: true,
      commentId,
      likes: targetComment.likes,
      likeCount: targetComment.likes.length,
      likedByUser: !isLiked,
    });
  } catch (err) {
    console.error("toggleCommentLike error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ---------------- GET SINGLE ISSUE ---------------- */
exports.getIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Complaint.findById(id);

    if (!issue) return res.status(404).json({ message: "Issue not found" });

    res.json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- DELETE COMMENT (WITH NESTED STRUCTURE) ---------------- */
exports.deleteComment = async (req, res) => {
  try {
    const { issueId, commentId } = req.params;
    const { citizenId } = req.body;

    if (!citizenId) {
      return res.status(400).json({ success: false, message: "citizenId required" });
    }

    const issue = await Complaint.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    // Function to find comment and check authorization
    let targetComment = null;
    let parentPath = [];

    const findCommentAndPath = (comments, id, path = []) => {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i]._id.toString() === id) {
          targetComment = comments[i];
          parentPath = [...path, i];
          return true;
        }
        if (comments[i].replies && comments[i].replies.length > 0) {
          if (findCommentAndPath(comments[i].replies, id, [...path, i, 'replies'])) {
            return true;
          }
        }
      }
      return false;
    };

    findCommentAndPath(issue.comments, commentId);
    
    if (!targetComment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Check authorization
    const isCommentAuthor = targetComment.citizenId === citizenId;
    const isPostOwner = issue.citizenId === citizenId;

    if (!isCommentAuthor && !isPostOwner) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized – only the comment author or post owner can delete this comment",
      });
    }

    // Function to count total comments to delete (including replies)
    const countComments = (comment) => {
      let count = 1;
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach(reply => {
          count += countComments(reply);
        });
      }
      return count;
    };

    const commentsToDeleteCount = countComments(targetComment);
    
    // Function to remove comment from nested structure
    const removeComment = (comments, id) => {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i]._id.toString() === id) {
          comments.splice(i, 1);
          return true;
        }
        if (comments[i].replies && comments[i].replies.length > 0) {
          if (removeComment(comments[i].replies, id)) {
            return true;
          }
        }
      }
      return false;
    };

    let parentArray = issue.comments;
    if (parentPath.length > 0) {
      let current = issue.comments;
      for (let i = 0; i < parentPath.length - 1; i++) {
        if (typeof parentPath[i] === 'number') {
          current = current[parentPath[i]].replies;
        }
      }
      parentArray = current;
      parentArray.splice(parentPath[parentPath.length - 1], 1);
    } else {
      removeComment(issue.comments, commentId);
    }

    issue.commentCount = Math.max(0, (issue.commentCount || 0) - commentsToDeleteCount);
    await issue.save();

    res.json({
      success: true,
      message: "Comment and all replies deleted",
      deletedCount: commentsToDeleteCount,
      remainingComments: issue.commentCount,
    });
  } catch (err) {
    console.error("deleteComment error:", err);
    res.status(500).json({ success: false, message: "Server error while deleting comment" });
  }
};

/* ---------------- UPDATE COMMENT ---------------- */
exports.updateComment = async (req, res) => {
  try {
    const { issueId, commentId } = req.params;
    const { citizenId, text } = req.body;

    if (!citizenId || !text?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "citizenId and text are required" 
      });
    }

    const issue = await Complaint.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    // Function to find and update comment
    let targetComment = null;

    const findAndUpdateComment = (comments, id) => {
      for (let i = 0; i < comments.length; i++) {
        if (comments[i]._id.toString() === id) {
          targetComment = comments[i];
          return true;
        }
        if (comments[i].replies && comments[i].replies.length > 0) {
          if (findAndUpdateComment(comments[i].replies, id)) {
            return true;
          }
        }
      }
      return false;
    };

    findAndUpdateComment(issue.comments, commentId);
    
    if (!targetComment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    if (targetComment.citizenId !== citizenId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    targetComment.text = text.trim();
    targetComment.editedAt = new Date();

    await issue.save();

    res.json({
      success: true,
      message: "Comment updated successfully",
    });
  } catch (err) {
    console.error("updateComment error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ---------------- DELETE ISSUE ---------------- */
exports.deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await Complaint.findById(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    await Complaint.findByIdAndDelete(id);

    await SavedIssue.deleteMany({
      issueId: new mongoose.Types.ObjectId(id),
    });

    res.json({
      success: true,
      message: "Issue deleted and saved posts removed",
    });
  } catch (err) {
    console.error("DELETE ISSUE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
/* ---------------- GET ISSUE WITH FRESH COMMENTS ---------------- */
exports.getIssueWithFreshComments = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Complaint.findById(id);
    
    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }
    
    res.json({ 
      success: true, 
      comments: issue.comments,
      commentCount: issue.commentCount 
    });
  } catch (err) {
    console.error("getIssueWithFreshComments error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};