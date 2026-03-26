const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  citizenId: { type: String, required: true, index: true },
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
 ref: "PostIssue",
    required: true,
  },
  type: {
    type: String,
    enum: ["success", "warning", "info"],
    default: "info",
  },
  message: { type: String, required: true },
  status: { type: String, required: true },
  location: { type: String, default: "" },
  image: { type: String, default: null },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
