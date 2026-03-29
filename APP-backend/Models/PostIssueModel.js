const mongoose = require("mongoose");


const CommentSchema = new mongoose.Schema(
  {
    citizenId: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    likes: {
      type: [String],
      default: [],
    },

    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    editedAt: Date,
  },
  { timestamps: true }
);


const PostIssueSchema = new mongoose.Schema(
  {
    citizenId: {
      type: String,
      required: true,
      index: true,
    },

    district: String,
    area: String,
    department: String,
    reason: String,

    description_en: String,
    description_ta: String,
    hashtags: [String],

    /* 📸 BEFORE images */
    images_data: {
      type: [String],
      required: true,
    },

    /* ✅ AFTER images (Admin only) */
    after_images: {
      type: [String],
      default: [],
    },

    resolution_details: String,

    /* ⏱ STATUS (Citizen-visible only) */
    status: {
      type: String,
      enum: ["Sent", "In Progress", "Resolved", "Closed", "solved"],
      default: "Sent",
    },
    notificationRead: {
      type: Boolean,
      default: false,
    },

    // ✅ CHOOSE ONE: Either use camelCase OR snake_case, not both
    // Option A: Use camelCase (recommended for JavaScript)
    municipalityInformedDate: Date,
    closedDate: Date,

    // OR Option B: Use snake_case (if you prefer)
    // municipality_informed_date: Date,
    // closed_date: Date,

    resolved_date: Date,

    likes: {
      type: [String],
      default: [],
    },

    comments: {
      type: [CommentSchema],
      default: [],
    },

    device_fingerprint: String,
    ip_address: String,
  },

  { timestamps: true },
);

/* ✅ SAFE EXPORT (FIXES OverwriteModelError) */
module.exports =
  mongoose.models.PostIssue || mongoose.model("PostIssue", PostIssueSchema);
