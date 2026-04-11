const express = require("express");
const router = express.Router();
const proofController = require("../Controller/proofcontroller");

router.post('/save', proofController.saveProof);
router.get('/', proofController.getUserProofs);
router.get('/check/:issueId', proofController.checkProof);
router.delete('/:proofId', proofController.deleteProof);

module.exports = router;