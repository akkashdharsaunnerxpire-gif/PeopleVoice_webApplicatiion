const User = require("../Models/UserModel");
const Otp = require("../Models/OtpModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/* ================= GENERATE OTP ================= */
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ================= SEND SMS ================= */
const sendSMS = async (mobile, otp) => {
  try {
    const formatted = `+91${mobile}`;

    // 🔥 If Twilio credentials missing → fallback to console
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      console.log("🔐 OTP (NO TWILIO CONFIG):", otp);
      return;
    }

    await client.messages.create({
      body: `Your PeopleVoice OTP is ${otp}. Valid for 1 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formatted,
    });

    console.log("✅ SMS Sent to:", formatted);

  } catch (err) {
    console.error("❌ Twilio Error:", err.message);
    console.log("🔐 Fallback OTP:", otp); // fallback print
  }
};

/* ================= SEND OTP ================= */
exports.sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }

    const exists = await User.findOne({ mobile });
    if (exists) {
      return res.status(409).json({ message: "Already registered" });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Delete old OTPs
    await Otp.deleteMany({ mobile });

    await Otp.create({
      mobile,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      verified: false,
    });

    await sendSMS(mobile, otp);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });

  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
};

/* ================= VERIFY OTP ================= */
exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, mobileNumber, otp } = req.body;

    // ✅ Support both register & forgot-password
    const phone = mobile || mobileNumber;

    if (!phone) {
      return res.status(400).json({ message: "Mobile number required" });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP required" });
    }

    const record = await Otp.findOne({ mobile: phone })
      .sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (record.attempts >= 3) {
      return res.status(400).json({ message: "Too many attempts" });
    }

    const valid = await bcrypt.compare(otp, record.otp);

    if (!valid) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Mark OTP verified
    record.verified = true;
    await record.save();

    // 🔥 CREATE TEMP TOKEN (VERY IMPORTANT)
    const tempToken = jwt.sign(
      { mobile: phone },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }   // temporary token for registration
    );

    return res.json({
      success: true,
      message: "OTP verified successfully",
      tempToken   // ✅ SEND THIS TO FRONTEND
    });

  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({
      message: "OTP verification failed",
    });
  }
};

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    const { mobile, password, tempToken } = req.body;

    if (!mobile || !password || !tempToken) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 🔐 Verify temp token 
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: "Verification expired. Please verify OTP again.",
      });
    }

    if (decoded.mobile !== mobile) {
      return res.status(401).json({
        message: "Invalid verification token",
      });
    }

    // ✅ Check verified OTP
    const verifiedOtp = await Otp.findOne({
      mobile,
      verified: true,
    });

    if (!verifiedOtp) {
      return res.status(401).json({
        message: "Mobile not verified",
      });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists. Please login.",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const citizenId =
      "CID-" + crypto.randomBytes(3).toString("hex").toUpperCase();

    const user = await User.create({
      mobile,
      password: hashed,
      citizenId,
      isVerified: true,
    });

    await Otp.deleteMany({ mobile });

    const token = jwt.sign(
      { id: user._id, citizenId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      token,
      citizenId,
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    return res.status(500).json({
      message: err.message || "Registration failed",
    });
  }
};
/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const user = await User.findOne({ mobile });
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, citizenId: user.citizenId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      citizenId: user.citizenId,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      message: "Login failed",
    });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }

    const user = await User.findOne({ mobile: mobileNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await Otp.deleteMany({ mobile: mobileNumber });

    await Otp.create({
      mobile: mobileNumber,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0,
      verified: false,
    });

    await sendSMS(mobileNumber, otp);

    return res.json({
      success: true,
      message: "OTP sent for password reset",
    });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { mobileNumber, otp, newPassword } = req.body;

    const record = await Otp.findOne({
      mobile: mobileNumber,
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const valid = await bcrypt.compare(otp, record.otp);
    if (!valid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ mobile: mobileNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await Otp.deleteMany({ mobile: mobileNumber });

    return res.json({
      success: true,
      message: "Password reset successful",
    });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({
      message: "Reset failed",
    });
  }
};