const DistrictPerformance = require("../Models/district_performance");
const Admin = require("../Models/AdminModel");
const Issue = require("../Models/PostIssueModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Review = require("../Models/Review");
const mongoose = require("mongoose");
const { saveNotification } = require("../Controller/notificationController");
const Notification = require("../Models/Notification");

/* ================= ADMIN REGISTER ================= */
exports.registerAdmin = async (req, res) => {
  try {
    const { district, email, password, secretKey } = req.body;

    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({
        message: "Invalid secret key. Unauthorized access.",
      });
    }

    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { district }],
    });

    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin already exists for this district or email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      district,
      email,
      password: hashedPassword,
      role: "ADMIN",
    });

    res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        id: admin._id,
        district: admin.district,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin Register Error:", error);
    res.status(500).json({
      message: "Server error while registering admin",
    });
  }
};

/* ================= ADMIN LOGIN ================= */
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: admin.role,
        district: admin.district,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      token,
      admin: {
        name: "District Admin",
        role: admin.role,
        district: admin.district,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

/* ================= GET ALL ISSUES ================= */
exports.getAllIssues = async (req, res) => {
  try {
    const {
      search,
      status,
      department,
      district,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { reason: { $regex: search, $options: "i" } },
        { description_en: { $regex: search, $options: "i" } },
        { description_ta: { $regex: search, $options: "i" } },
      ];
    }

    if (status && status !== "All") query.status = status;
    if (department && department !== "All") query.department = department;
    if (district && district !== "All") query.district = district;

    const skip = (page - 1) * limit;

    const [rawIssues, total] = await Promise.all([
      Issue.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Issue.countDocuments(query),
    ]);

    const issues = await Promise.all(
      rawIssues.map(async (issue) => {
        const issueObj = {
          _id: issue._id,
          title: issue.reason,
          department: issue.department,
          district: issue.district,
          area: issue.area,
          status: issue.status,
          createdAt: issue.createdAt,
          images: issue.images,
          citizenId: issue.citizenId,
          likes: issue.likes?.length || 0,
          comments: issue.comments?.length || 0,
        };

        if (issue.status === "Reopened" || issue.isImproper === true) {
          const negativeReview = await Review.findOne({
            issueId: issue._id,
            isResolved: false,
          })
            .sort({ createdAt: -1 })
            .lean();
          if (negativeReview && negativeReview.feedback) {
            issueObj.negativeReview = { feedback: negativeReview.feedback };
          } else {
            issueObj.negativeReview = { feedback: "" };
          }
        }
        return issueObj;
      }),
    );

    res.json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      issues,
    });
  } catch (err) {
    console.error("Fetch Issues Error:", err);
    res.status(500).json({ message: "Failed to fetch issues" });
  }
};

/* ================= GET ISSUE BY ID ================= */
exports.getIssueById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid issue ID" });
    }

    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    let negativeReview = null;
    if (issue.status === "Reopened" || issue.isImproper === true) {
      negativeReview = await Review.findOne({
        issueId: issue._id,
        isResolved: false,
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    res.status(200).json({
      ...issue._doc,
      images: issue.images || [],
      after_images: issue.after_images || [],
      negativeReview: negativeReview
        ? { feedback: negativeReview.feedback }
        : null,
    });
  } catch (error) {
    console.error("Get Issue By ID Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE ISSUE STATUS ================= */
exports.updateIssueStatus = async (req, res) => {
  try {
    const { status, afterImages, resolutionDetails } = req.body;
    const { id } = req.params;

    console.log("🔄 Updating issue status:", {
      id,
      status,
      hasAfterImages: !!afterImages?.length,
      resolutionDetails,
    });

    const validStatuses = ["Sent", "In Progress", "Resolved", "Closed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const oldIssue = await Issue.findById(id);
    if (!oldIssue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const updateFields = {
      status,
      updatedAt: new Date(),
      notificationRead: false,
    };

    if (Array.isArray(afterImages) && afterImages.length > 0) {
      updateFields.after_images = afterImages;
    }

    if (resolutionDetails && resolutionDetails.trim()) {
      updateFields.resolution_details = resolutionDetails.trim();
    }

    if (status === "Resolved") {
      updateFields.resolved_date = new Date();
      updateFields.lastOpenedNotified = false;
    }

    if (status === "Closed") {
      updateFields.closedDate = new Date();
    }

    const issue = await Issue.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    console.log("✅ Issue updated:", issue._id, "Status:", status);

    // Send notification - Check Review collection for negative review
    if (status !== "Sent") {
      const hasNegativeReview = await Review.findOne({
        issueId: id,
        isResolved: false
      });
      
      const wasImproper = hasNegativeReview !== null;
      
      let message = "";
      let type = "info";

      if (status === "Resolved") {
        if (wasImproper) {
          message = `⚠️ Municipality has made a new resolution attempt for your improperly reported issue "${issue.reason || "Report"}". Please review and confirm.`;
          type = "warning";
        } else {
          message = `✅ Your issue "${issue.reason || "Report"}" has been resolved. Please confirm.`;
          type = "success";
        }
      } 
      else if (status === "Closed") {
        message = `🎉 Your issue "${issue.reason || "Report"}" has been closed. Thank you for using PeopleVoice!`;
        type = "success";
      } 
      else if (status === "In Progress") {
        if (wasImproper) {
          message = `🔄 Your improperly reported issue "${issue.reason || "Report"}" is now being processed properly.`;
          type = "warning";
        } else {
          message = `🔄 Your issue "${issue.reason || "Report"}" is now in progress.`;
          type = "warning";
        }
      } 
      else {
        message = `Your issue "${issue.reason || "Report"}" status: ${status}`;
      }

      await saveNotification(issue, status, message, wasImproper);
    }

    res.json({
      success: true,
      message: "Issue status updated successfully",
      issue,
    });
  } catch (error) {
    console.error("❌ Update Status Error:", error);
    res.status(500).json({
      message: "Status update failed: " + error.message,
    });
  }
};

/* ================= GET DISTRICT POINTS ================= */
exports.getDistrictPoints = async (req, res) => {
  try {
    const districts = await DistrictPerformance.find().lean();

    const resolvedCounts = await Issue.aggregate([
      {
        $match: { status: { $in: ["Resolved", "Closed"] } },
      },
      {
        $group: {
          _id: "$district",
          count: { $sum: 1 },
        },
      },
    ]);

    const map = {};
    resolvedCounts.forEach((d) => {
      map[d._id] = d.count;
    });

    const result = districts.map((d) => ({
      district: d.district,
      issuesResolved: map[d.district] || 0,
    }));

    result.sort((a, b) => b.issuesResolved - a.issuesResolved);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("District Points Error:", error);
    res.status(500).json({ message: "Failed to fetch district points" });
  }
};

// Add this to adminController.js
exports.notifyImproperIssueOpened = async (req, res) => {
  try {
    const { id } = req.params;
    
    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Check if already notified
    if (issue.lastOpenedNotified) {
      return res.json({ success: true, message: "Already notified" });
    }

    // Check if this is an improper issue
    const hasNegativeReview = await Review.findOne({
      issueId: id,
      isResolved: false
    });

    let message = "";
    let type = "info";
    
    if (hasNegativeReview) {
      message = `⚠️ Officer is reviewing your improperly reported issue "${issue.reason || "Report"}".`;
      type = "warning";
    } else if (issue.status === "Sent") {
      message = `👀 Officer has viewed your issue "${issue.reason || "Report"}" and will address it soon.`;
      type = "info";
    }

    if (message) {
      await Notification.create({
        citizenId: String(issue.citizenId),
        issueId: issue._id,
        message,
        status: "Opened",
        type,
        location: issue.area || issue.district || "",
        image: typeof issue.images?.[0] === "string" ? issue.images[0] : issue.images?.[0]?.url || null,
        read: false,
        createdAt: new Date(),
      });

      issue.lastOpenedNotified = true;
      await issue.save();
    }

    res.json({ success: true, message: "Notification sent" });
  } catch (error) {
    console.error("Notify improper issue opened error:", error);
    res.status(500).json({ message: "Server error" });
  }
};