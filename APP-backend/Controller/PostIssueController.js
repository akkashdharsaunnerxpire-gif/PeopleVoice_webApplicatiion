const mongoose = require("mongoose");
const Complaint = require("../Models/PostIssueModel");
const SavedIssue = require("../Models/SavedIssue");
const redisClient = require("../config/redis");
const Issue = require("../Models/PostIssueModel");
const cloudinary = require("../config/cloudinary");

/* ---------------- HELPER: Get current cache version (or create) ---------------- */
const getCacheVersion = async () => {
  let version = await redisClient.get("cache:version:issues");
  if (!version) {
    version = "1";
    await redisClient.set("cache:version:issues", version);
  }
  return version;
};

/* ---------------- HELPER: Increment cache version (invalidates all caches) ---------------- */
const invalidateAllCaches = async () => {
  const newVersion = Date.now().toString(); // Use timestamp for unique version
  await redisClient.set("cache:version:issues", newVersion);
  console.log(
    `🔄 Cache version updated to ${newVersion} – all caches invalidated`,
  );
};

/* ---------------- POST ISSUE ---------------- */


exports.postIssue = async (req, res) => {
  try {
    const issue = await Complaint.create({
      ...req.body,
      likes: [],
      likeCount: 0,
      comments: [],
    });
    await invalidateAllCaches();
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
    const version = await getCacheVersion();
    const sortedQuery = Object.keys(req.query)
      .sort()
      .reduce((acc, key) => {
        acc[key] = req.query[key];
        return acc;
      }, {});

    const cacheKey = `issues:v${version}:${JSON.stringify(sortedQuery)}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("⚡ Cache HIT", cacheKey);
      return res.json(JSON.parse(cachedData));
    }

    console.log("🐢 Cache MISS → DB", cacheKey);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.department && req.query.department !== "All")
      filter.department = req.query.department;

    if (req.query.status && req.query.status !== "All")
      filter.status = req.query.status;

    const totalCount = await Complaint.countDocuments(filter);
    const issues = await Complaint.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const response = {
      success: true,
      page,
      limit,
      total: totalCount,
      hasMore: skip + issues.length < totalCount,
      issues,
    };

    await redisClient.setEx(cacheKey, 20, JSON.stringify(response));
    res.json(response);
  } catch (err) {
    console.error("getAllIssues error:", err);
    res.status(500).json({ success: false, message: err.message });
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

    await invalidateAllCaches();

    res.json({
      success: true,
      likes: updated.likes,
      likeCount: updated.likeCount,
      liked: !liked,
    });
  } catch (err) {
    console.error("toggleLike error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- ADD COMMENT (WITH FULL NESTED REPLY SUPPORT) ---------------- */
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
    issue.updatedAt = new Date();
    await issue.save();

    await invalidateAllCaches();

    res.status(201).json({
      success: true,
      message: "Comment added",
      newComment,
      comments: issue.comments,
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
      return res
        .status(400)
        .json({ success: false, message: "citizenId required" });
    }

    const issue = await Complaint.findById(issueId);
    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    const comment = issue.comments.id(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    const alreadyLiked = comment.likes.includes(citizenId);
    if (alreadyLiked) {
      comment.likes.pull(citizenId);
    } else {
      comment.likes.addToSet(citizenId);
    }
    issue.updatedAt = new Date();
    await issue.save();

    await invalidateAllCaches();

    res.json({
      success: true,
      commentId,
      likes: comment.likes,
      likeCount: comment.likes.length,
      likedByUser: comment.likes.includes(citizenId),
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
    console.error("getIssue error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ---------------- GET MY ISSUES (only logged-in citizen's posts) ---------------- */
exports.getMyIssues = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const { citizenId } = req.query;

    if (!citizenId) {
      return res.status(400).json({
        success: false,
        message: "citizenId is required",
      });
    }

    const version = await getCacheVersion();
    const cacheKey = `my-issues:v${version}:${citizenId}:${page}:${limit}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("⚡ My Issues Cache HIT", cacheKey);
      return res.json(JSON.parse(cachedData));
    }

    console.log("🐢 My Issues Cache MISS → DB", cacheKey);
    const skip = (page - 1) * limit;
    const filter = { citizenId };

    const totalCount = await Complaint.countDocuments(filter);
    const issues = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const response = {
      success: true,
      page,
      limit,
      total: totalCount,
      hasMore: skip + issues.length < totalCount,
      issues,
    };

    await redisClient.setEx(cacheKey, 20, JSON.stringify(response));
    res.json(response);
  } catch (err) {
    console.error("getMyIssues error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ---------------- DELETE COMMENT ---------------- */
exports.deleteComment = async (req, res) => {
  try {
    const { issueId, commentId } = req.params;
    const { citizenId } = req.body;

    if (!citizenId) {
      return res
        .status(400)
        .json({ success: false, message: "citizenId required" });
    }

    const issue = await Complaint.findById(issueId);
    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    const comment = issue.comments.id(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    const isCommentAuthor = comment.citizenId === citizenId;
    const isPostOwner = issue.citizenId === citizenId;

    if (!isCommentAuthor && !isPostOwner) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized – only the comment author or post owner can delete this comment",
      });
    }

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
      (c) => !commentsToDelete.has(c._id.toString()),
    );
    issue.updatedAt = new Date();
    await issue.save();

    await invalidateAllCaches();

    res.json({
      success: true,
      message: "Comment and all replies deleted",
      deletedCount: commentsToDelete.size,
      remainingComments: issue.comments.length,
    });
  } catch (err) {
    console.error("deleteComment error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error while deleting comment" });
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
    issue.updatedAt = new Date();
    await issue.save();

    await invalidateAllCaches();

    res.json({
      success: true,
      comments: issue.comments,
      message: "Comment updated successfully",
    });
  } catch (err) {
    console.error("updateComment error:", err);
    res.status(500).json({ message: err.message });
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

    // 🔥 DELETE BEFORE IMAGES
    if (issue.images?.length) {
      for (let img of issue.images) {
        if (img?.publicId) {
          try {
            await cloudinary.uploader.destroy(img.publicId);
            console.log("Deleted BEFORE image:", img.publicId);
          } catch (err) {
            console.error("Failed to delete BEFORE image:", img.publicId);
          }
        }
      }
    }

    // 🔥 DELETE AFTER IMAGES
    if (issue.after_images?.length) {
      for (let img of issue.after_images) {
        if (img?.publicId) {
          try {
            await cloudinary.uploader.destroy(img.publicId);
            console.log("Deleted AFTER image:", img.publicId);
          } catch (err) {
            console.error("Failed to delete AFTER image:", img.publicId);
          }
        }
      }
    }

    // 🔥 DELETE FROM DB
    await Complaint.findByIdAndDelete(id);

    // 🔥 REMOVE SAVED POSTS
    await SavedIssue.deleteMany({
      issueId: new mongoose.Types.ObjectId(id),
    });

    // 🔥 INVALIDATE CACHE
    await invalidateAllCaches();

    res.json({
      success: true,
      message: "✅ Issue + Cloudinary images deleted successfully",
    });
  } catch (err) {
    console.error("DELETE ISSUE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.verifyIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, citizenId } = req.body;

    const issue = await Complaint.findById(id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (!issue.verifications) issue.verifications = [];

    issue.verifications.push({
      citizenId,
      response,
      time: new Date(),
    });

    // 🔥 STATUS UPDATE LOGIC
    if (response === "yes") {
      issue.status = "Closed";
    } else if (response === "no") {
      issue.status = "In Progress";
    }

    await issue.save();
    await invalidateAllCaches();

    res.json({ success: true });
  } catch (err) {
    console.error("verifyIssue error:", err);
    res.status(500).json({ message: "Error verifying issue" });
  }
};