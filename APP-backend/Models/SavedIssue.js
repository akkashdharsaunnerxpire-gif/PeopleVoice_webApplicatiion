const mongoose = require("mongoose");

const savedIssueSchema = new mongoose.Schema({

  citizenId: {
    type: String,   // ✅ change ObjectId → String
    required: true,
  },

  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PostIssue",
    required: true,
  },

  savedAt: {
    type: Date,
    default: Date.now,
  },

});

module.exports =
  mongoose.models.SavedIssue ||
  mongoose.model("SavedIssue", savedIssueSchema);