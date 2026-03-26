const express = require("express");
const router = express.Router();

const {
  toggleSaveIssue,
  checkSaved,
  getSavedIssues,
} = require("../Controller/savedController");

router.post("/toggle", toggleSaveIssue);
router.get("/check", checkSaved);
router.get("/:citizenId", getSavedIssues);

module.exports = router;