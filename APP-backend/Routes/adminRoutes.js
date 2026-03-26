const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  loginAdmin,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  getDistrictPoints,
} = require("../Controller/adminController");

/* AUTH */
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

/* DASHBOARD */
router.get("/issues", getAllIssues);
router.get("/issues/:id", getIssueById);
router.put("/issues/:id/status", updateIssueStatus);

/* DISTRICT LEADERBOARD */
router.get("/district-points", getDistrictPoints);

module.exports = router;
