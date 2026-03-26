const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const auth = require("../Controller/authController");

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: "Too many OTP requests. Try again later.",
});

router.post("/send-otp", otpLimiter, auth.sendOtp);
router.post("/verify-otp", auth.verifyOtp);
router.post("/register", auth.register);
router.post("/login", auth.login);

// ✅ NEW ROUTES
router.post("/forgot-password", otpLimiter, auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);

module.exports = router;