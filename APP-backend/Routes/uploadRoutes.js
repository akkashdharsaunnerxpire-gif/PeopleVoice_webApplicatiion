const express = require("express");
const router = express.Router();
const { uploadImage ,uploadAdminProofImage} = require("../Controller/uploadController");

router.post("/uploadimage", uploadImage);
router.post("/uploadadminimage", uploadAdminProofImage);

module.exports = router;