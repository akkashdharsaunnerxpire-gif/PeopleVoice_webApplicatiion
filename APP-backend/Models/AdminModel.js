const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "ADMIN",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
