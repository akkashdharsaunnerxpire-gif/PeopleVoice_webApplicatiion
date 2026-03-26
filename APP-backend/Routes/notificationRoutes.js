const express = require("express");
const router = express.Router();
const notificationController = require("../Controller/notificationController");

router.get("/", notificationController.getNotifications);
router.put("/read/:id", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
