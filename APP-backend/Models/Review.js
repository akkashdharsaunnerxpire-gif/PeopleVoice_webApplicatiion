const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: true,
    },
    issueId: {
      type: String,
      required: true,
      index: true,
    },
    citizenId: {
      type: String,
      required: true,
      index: true,
    },
    isResolved: {
      type: Boolean,
      required: true,
    },
    feedback: { type: String, default: "" },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure one review per issue per citizen
reviewSchema.index({ issueId: 1, citizenId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
