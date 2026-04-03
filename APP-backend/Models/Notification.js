const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  citizenId: {
    type: String,
    required: true,
    index: true,
  },
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PostIssue",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Pending",
  },
  type: {
    type: String,
    enum: ["info", "success", "warning", "error"],
    default: "info",
  },
  location: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", NotificationSchema);