const mongoose = require("mongoose");
const Complaint = require("../Models/PostIssueModel");
const SavedIssue = require("../Models/SavedIssue");
const redisClient = require("../config/redis");
const Issue = require("../Models/PostIssueModel");

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

    await Complaint.findByIdAndDelete(id);
    await SavedIssue.deleteMany({
      issueId: new mongoose.Types.ObjectId(id),
    });

    await invalidateAllCaches();

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
const User = require("../Models/UserModel");
const Otp = require("../Models/OtpModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

/* ================= GENERATE OTP ================= */
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ================= SEND SMS ================= */
const sendSMS = async (mobile, otp) => {
  try {
    const formatted = `+91${mobile}`;

    // 🔥 If Twilio credentials missing → fallback to console
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.log("🔐 OTP (NO TWILIO CONFIG):", otp);
      return;
    }

    await client.messages.create({
      body: `Your PeopleVoice OTP is ${otp}. Valid for 1 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formatted,
    });

    console.log("✅ SMS Sent to:", formatted);
  } catch (err) {
    console.error("❌ Twilio Error:", err.message);
    console.log("🔐 Fallback OTP:", otp); // fallback print
  }
};

/* ================= SEND OTP ================= */
exports.sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }

    const exists = await User.findOne({ mobile });
    if (exists) {
      return res.status(409).json({ message: "Already registered" });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Delete old OTPs
    await Otp.deleteMany({ mobile });

    await Otp.create({
      mobile,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      verified: false,
    });

    await sendSMS(mobile, otp);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, mobileNumber, otp } = req.body;

    // ✅ Support both register & forgot-password
    const phone = mobile || mobileNumber;

    if (!phone) {
      return res.status(400).json({ message: "Mobile number required" });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP required" });
    }

    const record = await Otp.findOne({ mobile: phone }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (record.attempts >= 3) {
      return res.status(400).json({ message: "Too many attempts" });
    }

    const valid = await bcrypt.compare(otp, record.otp);

    if (!valid) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Mark OTP verified
    record.verified = true;
    await record.save();

    // 🔥 CREATE TEMP TOKEN (VERY IMPORTANT)
    const tempToken = jwt.sign(
      { mobile: phone },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }, // temporary token for registration
    );

    return res.json({
      success: true,
      message: "OTP verified successfully",
      tempToken, // ✅ SEND THIS TO FRONTEND
    });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({
      message: "OTP verification failed",
    });
  }
};

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const { mobile, password, tempToken } = req.body;

    if (!mobile || !password || !tempToken) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 🔐 Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: "Verification expired. Please verify OTP again.",
      });
    }

    if (decoded.mobile !== mobile) {
      return res.status(401).json({
        message: "Invalid verification token",
      });
    }

    // ✅ Check verified OTP
    const verifiedOtp = await Otp.findOne({
      mobile,
      verified: true,
    });

    if (!verifiedOtp) {
      return res.status(401).json({
        message: "Mobile not verified",
      });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists. Please login.",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const citizenId =
      "CID-" + crypto.randomBytes(3).toString("hex").toUpperCase();

    const user = await User.create({
      mobile,
      password: hashed,
      citizenId,
      isVerified: true,
    });

    await Otp.deleteMany({ mobile });

    const token = jwt.sign(
      { id: user._id, citizenId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      success: true,
      token,
      citizenId,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    return res.status(500).json({
      message: err.message || "Registration failed",
    });
  }
};
/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, citizenId: user.citizenId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.json({
      success: true,
      token,
      citizenId: user.citizenId,
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      message: "Login failed",
    });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }

    const user = await User.findOne({ mobile: mobileNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await Otp.deleteMany({ mobile: mobileNumber });

    await Otp.create({
      mobile: mobileNumber,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      verified: false,
    });

    await sendSMS(mobileNumber, otp);

    return res.json({
      success: true,
      message: "OTP sent for password reset",
    });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
};
exports.verifyIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, citizenId } = req.body;

    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ message: "Not found" });

    if (!issue.verifications) issue.verifications = [];

    issue.verifications.push({
      citizenId,
      response,
      time: new Date(),
    });

    // Logic
    if (response === "yes") {
      issue.status = "Closed";
    }

    if (response === "no") {
      issue.status = "In Progress";
    }

    await issue.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying" });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { mobileNumber, otp, newPassword } = req.body;

    const record = await Otp.findOne({
      mobile: mobileNumber,
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const valid = await bcrypt.compare(otp, record.otp);
    if (!valid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ mobile: mobileNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await Otp.deleteMany({ mobile: mobileNumber });

    return res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({
      message: "Reset failed",
    });
  }
  // verify issue
};
