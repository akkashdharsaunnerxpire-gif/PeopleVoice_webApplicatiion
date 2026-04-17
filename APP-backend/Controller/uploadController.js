const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = async (file, folder) => {
  return await cloudinary.uploader.upload(file, { folder });
};

// 👤 USER
exports.uploadImage = async (req, res) => {
  try {
    const file = req.body.image;

    if (!file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const result = await uploadToCloudinary(file, "issues/before");

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id, // 🔥 ADD THIS LINE
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};

// 👨‍💼 ADMIN
exports.uploadAdminProofImage = async (req, res) => {
  try {
    const file = req.body.image;

    if (!file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const result = await uploadToCloudinary(file, "issues/after");

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id, // 🔥 ADD HERE ALSO
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
};
