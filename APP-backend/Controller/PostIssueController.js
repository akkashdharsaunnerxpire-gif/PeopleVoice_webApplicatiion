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

    let sortOption = { createdAt: -1 }; // default newest
    switch (req.query.sortBy) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "mostLiked":
        sortOption = { likeCount: -1 };
        break;
      case "mostCommented":
        sortOption = { commentsCount: -1 };
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

    // ❌ REMOVED: issues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

/* ---------------- ADD COMMENT (WITH FULL NESTED REPLY SUPPORT) ---------------- */
// controllers/PostIssueController.js

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
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    // Optional: validate parent exists if provided
    if (parentCommentId) {
      const parentExists = issue.comments.some(
        (c) => c._id.toString() === parentCommentId,
      );
      if (!parentExists) {
        return res
          .status(400)
          .json({ success: false, message: "Parent comment not found" });
      }
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      citizenId,
      text: text.trim(),
      likes: [],
      parentCommentId: parentCommentId || null,
      createdAt: new Date(),
    };

    issue.comments.push(newComment);
    await issue.save();

    res.status(201).json({
      success: true,
      message: "Comment added",
      newComment,
      comments: issue.comments, // optional - can be removed if frontend manages it
    });
  } catch (err) {
    console.error("addComment error:", err);
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};
/* ---------------- LIKE / UNLIKE COMMENT (WITH NESTED SUPPORT) ---------------- */
exports.toggleCommentLike = async (req, res) => {
  try {
    const { issueId, commentId } = req.params;
    const { citizenId } = req.body;

    if (!citizenId) {
      return res.status(400).json({
        success: false,
        message: "citizenId required",
      });
    }

    const issue = await Complaint.findById(issueId);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // ✅ Find comment directly from flat array
    const comment = issue.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const alreadyLiked = comment.likes.includes(citizenId);

    if (alreadyLiked) {
      comment.likes.pull(citizenId);
    } else {
      comment.likes.addToSet(citizenId);
    }

    await issue.save();

    res.json({
      success: true,
      commentId,
      likes: comment.likes,
      likeCount: comment.likes.length,
      likedByUser: comment.likes.includes(citizenId),
    });
  } catch (err) {
    console.error("toggleCommentLike error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
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

/* ---------------- DELETE COMMENT ---------------- */
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

    const comment = issue.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // ✅ Allow deletion if user is comment author OR post owner
    const isCommentAuthor = comment.citizenId === citizenId;
    const isPostOwner = issue.citizenId === citizenId;

    if (!isCommentAuthor && !isPostOwner) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized – only the comment author or post owner can delete this comment",
      });
    }

    // --- Recursive deletion of all replies ---
    const commentsToDelete = new Set([commentId]);

    const findDescendants = (parentId) => {
      issue.comments.forEach((c) => {
        if (c.parentCommentId?.toString() === parentId.toString()) {
          commentsToDelete.add(c._id.toString());
          findDescendants(c._id);
        }
      });
    };

    findDescendants(commentId);

    issue.comments = issue.comments.filter(
      (c) => !commentsToDelete.has(c._id.toString())
    );

    await issue.save();

    res.json({
      success: true,
      message: "Comment and all replies deleted",
      deletedCount: commentsToDelete.size,
      remainingComments: issue.comments.length,
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

    const issue = await Complaint.findById(issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const comment = issue.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    if (comment.citizenId !== citizenId)
      return res.status(403).json({ message: "Unauthorized" });

    comment.text = text;
    comment.editedAt = new Date();

    await issue.save();

    res.json({
      success: true,
      comments: issue.comments,
      message: "Comment updated successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- DELETE ISSUE ---------------- */
/* ---------------- DELETE ISSUE ---------------- */
exports.deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;

    /* FIND ISSUE */

    const issue = await Complaint.findById(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    /* DELETE ISSUE */

    await Complaint.findByIdAndDelete(id);

    /* DELETE SAVED REFERENCES */

    const result = await SavedIssue.deleteMany({
      issueId: new mongoose.Types.ObjectId(id),
    });

    console.log("Deleted saved count:", result.deletedCount);

    res.json({
      success: true,
      message: "Issue deleted and saved posts removed",
      deletedSaved: result.deletedCount,
    });
  } catch (err) {
    console.error("DELETE ISSUE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
