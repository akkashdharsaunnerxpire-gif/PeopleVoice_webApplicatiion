const mongoose = require("mongoose");

const proofSchema = new mongoose.Schema({
  issueId: { type: String, required: true },
  citizenId: { type: String, required: true },
  title: String,
  department: String,
  status: String,
  resolutionDetails: String,
  beforeImage: String,
  afterImage: String,
  resolvedAt: Date,
  location: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Proof", proofSchema);