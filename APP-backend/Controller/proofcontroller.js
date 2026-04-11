const Proof = require("../Models/proofs");


// ✅ Save Proof
exports.saveProof = async (req, res) => {
  try {
    const { issueId, citizenId } = req.body;

    // Validation
    if (!issueId || !citizenId) {
      return res.status(400).json({ error: "issueId & citizenId required" });
    }

    // Prevent duplicate
    const existing = await Proof.findOne({ issueId, citizenId });
    if (existing) {
      return res.json({ success: false, message: "Proof already saved" });
    }

    const proof = new Proof(req.body);
    await proof.save();

    res.json({ success: true, proof });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ✅ Get User Proofs
exports.getUserProofs = async (req, res) => {
  try {
    const { citizenId } = req.query;

    if (!citizenId) {
      return res.status(400).json({ error: "citizenId required" });
    }

    const proofs = await Proof.find({ citizenId }).sort({ createdAt: -1 });

    res.json({ success: true, proofs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ✅ Check Proof Exists
exports.checkProof = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { citizenId } = req.query;

    if (!issueId || !citizenId) {
      return res.status(400).json({ error: "issueId & citizenId required" });
    }

    const proof = await Proof.findOne({ issueId, citizenId });

    res.json({ saved: !!proof });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ✅ Delete Proof
exports.deleteProof = async (req, res) => {
  try {
    const { proofId } = req.params;

    const deleted = await Proof.findByIdAndDelete(proofId);

    if (!deleted) {
      return res.status(404).json({ error: "Proof not found" });
    }

    res.json({ success: true, message: "Proof deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};