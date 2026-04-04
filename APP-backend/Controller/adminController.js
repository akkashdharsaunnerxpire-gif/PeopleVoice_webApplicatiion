const DistrictPerformance = require("../Models/district_performance");
const Admin = require("../Models/AdminModel");
const Issue = require("../Models/PostIssueModel"); // ✅ EXACT CASE
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { saveNotification } = require("../Controller/notificationController");
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

    const issues = rawIssues.map((issue) => ({
      _id: issue._id,
      title: issue.reason,
      department: issue.department,
      district: issue.district,
      area: issue.area, // 🔥 IMPORTANT
      status: issue.status,
      createdAt: issue.createdAt,
      images: issue.images_data || [],
      citizenId: issue.citizenId,
      likes: issue.likes?.length || 0,
      comments: issue.comments?.length || 0,
    }));

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

    // ✅ SAFETY CHECK (THIS FIXES CRASH)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid issue ID" });
    }

    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.status(200).json(issue);
  } catch (error) {
    console.error("Get Issue By ID Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateIssueStatus = async (req, res) => {
  try {
    const { status, afterImages, resolutionDetails } = req.body;
    const { id } = req.params;

    console.log("🔄 Updating issue status:", { id, status, hasAfterImages: !!afterImages?.length, resolutionDetails });

    const validStatuses = ["Sent", "In Progress", "Resolved", "Closed", "solved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Build update object
    const updateFields = {
      status: status,
      updatedAt: new Date(),
      notificationRead: false,
    };

    // Handle after-images (expecting array of base64 strings or URLs)
    if (afterImages && Array.isArray(afterImages) && afterImages.length > 0) {
      updateFields.after_images = afterImages;
    }

    // Handle resolution details
    if (resolutionDetails && resolutionDetails.trim()) {
      updateFields.resolution_details = resolutionDetails.trim();
    }

    // Set resolved date when status becomes Resolved
    if (status === "Resolved" && !updateFields.resolved_date) {
      updateFields.resolved_date = new Date();
    }

    // Set closed date when status becomes Closed or solved
    if (status === "Closed" || status === "solved") {
      updateFields.closedDate = new Date();
    }

    const issue = await Issue.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    console.log("✅ Issue updated:", issue._id, "Status:", status);

    // Save notification for status changes (except "Sent")
    if (status !== "Sent") {
      let message;
      if (status === "solved" || status === "Closed") {
        message = `✅ Your issue "${issue.reason || issue.description_en?.substring(0, 50)}" has been closed`;
      } else if (status === "Resolved") {
        message = `✅ Your issue "${issue.reason || issue.description_en?.substring(0, 50)}" has been resolved`;
      } else if (status === "In Progress") {
        message = `🔄 Your issue "${issue.reason || issue.description_en?.substring(0, 50)}" is now In Progress`;
      } else {
        message = `📢 Your issue "${issue.reason || issue.description_en?.substring(0, 50)}" is now ${status}`;
      }

      await saveNotification(issue, status, message);
    }

    res.json({
      success: true,
      message: "Issue status updated successfully",
      issue,
    });
  } catch (error) {
    console.error("❌ Update Status Error:", error);
    res.status(500).json({ message: "Status update failed: " + error.message });
  }
};


/* ================= GET ALL DISTRICTS + CLOSED ISSUE POINTS ================= */
exports.getDistrictPoints = async (req, res) => {
  try {
    const districts = await DistrictPerformance.find().lean();

    const resolvedCounts = await Issue.aggregate([
      {
        $match: { status: { $in: ["Resolved", "Closed", "solved"] } },
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
