const express = require("express");
const router = express.Router();
const { uploadImage ,uploadAdminProofImage} = require("../Controller/uploadController");

router.post("/upload", uploadImage);
router.post("/upload/admin", uploadAdminProofImage);

module.exports = router;