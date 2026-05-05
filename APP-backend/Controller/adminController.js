const DistrictPerformance = require("../Models/district_performance");
const Admin = require("../Models/AdminModel");
const Issue = require("../Models/PostIssueModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Review = require("../Models/Review");
const mongoose = require("mongoose");
const { saveNotification } = require("../Controller/notificationController");
const Notification = require("../Models/Notification");
const sendEmail = require("../utils/sendEmail");

/* ================= ADMIN REGISTER ================= */
exports.registerAdmin = async (req, res) => {
  try {
    const { fullName, district, email, contactEmail, password, secretKey } =
      req.body;

    // 🔐 Secret key check
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(401).json({
        message: "Invalid secret key. Unauthorized access.",
      });
    }

    // ❗ Validate required fields
    if (!fullName || !district || !email || !contactEmail || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 📧 Validate gov email
    if (!email.endsWith("@gov.in") && !email.endsWith("@tn.gov.in")) {
      return res.status(400).json({
        message: "Only government emails allowed",
      });
    }

    // 🔍 Check existing admin
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { district }],
    });

    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin already exists for this district or email",
      });
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create admin
    const admin = await Admin.create({
      fullName,
      district,
      email,
      contactEmail,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
      isVerified: true, // later you can change this
    });

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        district: admin.district,
        email: admin.email,
        contactEmail: admin.contactEmail,
      },
    });
  } catch (error) {
    console.error("Admin Register Error:", error);
    res.status(500).json({
      success: false,
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
        name: admin.fullName,
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
    const {
      status,
      afterImages,
      resolutionDetails,
      resolvedByAdminMunicipality,
      resolutionDepartment,
      resolutionOfficerName,
      resolutionConfirmationStatement,
    } = req.body;
    const { id } = req.params;

    console.log("🔄 Updating issue status:", { id, status, hasAfterImages: !!afterImages?.length });

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

    // After‑images
    if (Array.isArray(afterImages) && afterImages.length > 0) {
      updateFields.after_images = afterImages;
    }

    // Resolution details
    if (resolutionDetails && resolutionDetails.trim()) {
      updateFields.resolution_details = resolutionDetails.trim();
    }

    // Date handling
    if (status === "Resolved") {
      updateFields.resolved_date = new Date();
      updateFields.lastOpenedNotified = false;
    }
    if (status === "Closed") {
      updateFields.closedDate = new Date();
    }

    // ✅ Store the new resolution acknowledgment fields (if provided)
    if (resolvedByAdminMunicipality) updateFields.resolvedByAdminMunicipality = resolvedByAdminMunicipality;
    if (resolutionDepartment) updateFields.resolutionDepartment = resolutionDepartment;
    if (resolutionOfficerName) updateFields.resolutionOfficerName = resolutionOfficerName;
    if (resolutionConfirmationStatement) updateFields.resolutionConfirmationStatement = resolutionConfirmationStatement;

    const issue = await Issue.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    console.log("✅ Issue updated:", issue._id, "Status:", status);

    // Notifications (unchanged)
    if (status !== "Sent") {
      const hasNegativeReview = await Review.findOne({ issueId: id, isResolved: false });
      const wasImproper = hasNegativeReview !== null;
      let message = "", type = "info";
      if (status === "Resolved") {
        message = wasImproper
          ? `⚠️ Municipality has made a new resolution attempt for your improperly reported issue "${issue.reason || "Report"}". Please review and confirm.`
          : `✅ Your issue "${issue.reason || "Report"}" has been resolved. Please confirm.`;
        type = "success";
      } else if (status === "Closed") {
        message = `🎉 Your issue "${issue.reason || "Report"}" has been closed. Thank you for using PeopleVoice!`;
        type = "success";
      } else if (status === "In Progress") {
        message = wasImproper
          ? `🔄 Your improperly reported issue "${issue.reason || "Report"}" is now being processed properly.`
          : `🔄 Your issue "${issue.reason || "Report"}" is now in progress.`;
        type = "warning";
      } else {
        message = `Your issue "${issue.reason || "Report"}" status: ${status}`;
      }
      await saveNotification(issue, status, message, wasImproper);
    }

    res.json({ success: true, message: "Issue status updated successfully", issue });
  } catch (error) {
    console.error("❌ Update Status Error:", error);
    res.status(500).json({ message: "Status update failed: " + error.message });
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
      isResolved: false,
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
        image:
          typeof issue.images?.[0] === "string"
            ? issue.images[0]
            : issue.images?.[0]?.url || null,
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

// ================= FORGOT PASSWORD =================
// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ contactEmail: email });

    if (!admin) {
      return res.json({ success: true, message: "If account exists, OTP sent" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.resetOtp = otp;                // store as string
    admin.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await admin.save();

    await sendEmail(
      admin.contactEmail,
      "Password Reset OTP - PeopleVoice Admin",
      `<h2>Your OTP is: ${otp}</h2><p>Valid for 10 minutes.</p>`
    );

    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Error sending OTP" });
  }
};

// ================= VERIFY OTP =================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const admin = await Admin.findOne({ contactEmail: email });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Convert stored OTP to string for comparison
    const storedOtp = admin.resetOtp ? String(admin.resetOtp) : null;
    if (!storedOtp || storedOtp !== otp || admin.resetOtpExpires < Date.now()) {
      console.log(`OTP mismatch: stored=${storedOtp}, received=${otp}`);
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const admin = await Admin.findOne({ contactEmail: email });
    const storedOtp = admin?.resetOtp ? String(admin.resetOtp) : null;

    if (!admin || !storedOtp || storedOtp !== otp || admin.resetOtpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.resetOtp = null;
    admin.resetOtpExpires = null;
    admin.loginAttempts = 0;
    admin.lockUntil = null;
    await admin.save();

    await sendEmail(
      admin.contactEmail,
      "Password Reset Successful",
      `<p>Your admin password has been successfully reset.</p>`
    ).catch(console.error);

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Error resetting password" });
  }
};
// ================= (Optional) RESEND OTP =================
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ contactEmail: email });

    if (!admin) {
      return res.json({ success: true, message: "If account exists, OTP sent" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.resetOtp = otp;
    admin.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await admin.save();

    await sendEmail(
      admin.contactEmail,
      "New Password Reset OTP",
      `<h2>Your new OTP is: ${otp}</h2><p>Valid for 10 minutes.</p>`
    );

    res.json({ success: true, message: "New OTP sent" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to resend OTP" });
  }
};

