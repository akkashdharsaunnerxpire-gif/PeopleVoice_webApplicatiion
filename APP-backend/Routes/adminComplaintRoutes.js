const express = require("express");
const router = express.Router();

const adminController = require("../Controller/adminComplaintController");

/* IMPORTANT: functions must exist */
router.get(
  "/admin/issues/:id",
  adminController.getIssueById
);

router.patch(
  "/admin/status/complaints/:id/action",
  adminController.handleStatusAction
);

router.patch(
  "/admin/status/complaints/:id/resolve",
  adminController.resolveIssue
);

module.exports = router;
