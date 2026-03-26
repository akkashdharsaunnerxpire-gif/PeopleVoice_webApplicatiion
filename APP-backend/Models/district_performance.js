const mongoose = require("mongoose");

const DistrictPerformanceSchema = new mongoose.Schema({
  district: {
    type: String,
    unique: true,
    required: true
  },

  issuesResolved: {
    type: Number,
    default: 0
  },
}, { timestamps: true });

module.exports = mongoose.model(
  "DistrictPerformance",
  DistrictPerformanceSchema
);
