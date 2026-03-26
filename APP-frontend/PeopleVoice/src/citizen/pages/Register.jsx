import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  Lock,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Phone,
  MessageSquare,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const APIURL = `${BACKEND_URL}/api/auth`;

// ✅ MOBILE NUMBER VALIDATOR (Indian format)
const isValidMobile = (mobile) => /^[6-9]\d{9}$/.test(mobile);

// ✅ PASSWORD STRENGTH CHECKER
const checkPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

const getPasswordStrengthText = (strength) => {
  switch (strength) {
    case 0:
      return {
        text: "Very Weak",
        color: "text-red-500",
        bg: "bg-red-500",
        width: "20%",
      };
    case 1:
      return {
        text: "Weak",
        color: "text-orange-500",
        bg: "bg-orange-500",
        width: "40%",
      };
    case 2:
      return {
        text: "Fair",
        color: "text-yellow-500",
        bg: "bg-yellow-500",
        width: "60%",
      };
    case 3:
      return {
        text: "Good",
        color: "text-blue-500",
        bg: "bg-blue-500",
        width: "80%",
      };
    case 4:
      return {
        text: "Strong",
        color: "text-green-500",
        bg: "bg-green-500",
        width: "90%",
      };
    case 5:
      return {
        text: "Very Strong",
        color: "text-emerald-500",
        bg: "bg-emerald-500",
        width: "100%",
      };
    default:
      return {
        text: "Very Weak",
        color: "text-red-500",
        bg: "bg-red-500",
        width: "20%",
      };
  }
};

const Register = () => {
  const navigate = useNavigate();
  const passwordInputRef = useRef(null);
  // Add ref for OTP input
  const otpInputRef = useRef(null);

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [tempToken, setTempToken] = useState("");

  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  // Changed timer from 30 to 60 seconds
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Validation states
  const [mobileError, setMobileError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [touched, setTouched] = useState({
    mobile: false,
    otp: false,
    password: false,
    confirm: false,
  });

  // Password strength
  const passwordStrength = checkPasswordStrength(password);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  // Timer for OTP resend
  useEffect(() => {
    let interval;
    if (otpSent && timer > 0 && !otpVerified) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer, otpVerified]);

  // Auto-focus OTP input when OTP is sent
  useEffect(() => {
    if (otpSent && !otpVerified && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [otpSent, otpVerified]);

  // Auto-focus password field after OTP verification
  useEffect(() => {
    if (otpVerified && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [otpVerified]);

  // Real-time validation
  useEffect(() => {
    if (touched.mobile) {
      if (!mobile) setMobileError("Mobile number is required");
      else if (!isValidMobile(mobile))
        setMobileError(
          "Invalid Indian mobile number (10 digits, starting with 6-9)",
        );
      else setMobileError("");
    }
  }, [mobile, touched.mobile]);

  useEffect(() => {
    if (touched.otp) {
      if (!otp) setOtpError("OTP is required");
      else if (otp.length !== 6) setOtpError("OTP must be 6 digits");
      else if (!/^\d+$/.test(otp)) setOtpError("OTP must contain only numbers");
      else setOtpError("");
    }
  }, [otp, touched.otp]);

  useEffect(() => {
    if (touched.password && otpVerified) {
      if (!password) setPasswordError("Password is required");
      else if (password.length < 6)
        setPasswordError("Password must be at least 6 characters");
      else setPasswordError("");
    }
  }, [password, touched.password, otpVerified]);

  useEffect(() => {
    if (touched.confirm && otpVerified) {
      if (!confirm) setConfirmError("Please confirm your password");
      else if (password !== confirm) setConfirmError("Passwords do not match");
      else setConfirmError("");
    }
  }, [confirm, password, touched.confirm, otpVerified]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Send OTP
  const handleSendOtp = async () => {
    setTouched((prev) => ({ ...prev, mobile: true }));

    if (!mobile || !isValidMobile(mobile)) {
      setMobileError("Please enter a valid mobile number");
      return;
    }

    try {
      setOtpLoading(true);
      setError("");

      const res = await fetch(`${APIURL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setOtpSent(true);
      // Reset timer to 60 seconds when OTP is sent
      setTimer(60);
      setCanResend(false);
      
      // Clear any existing OTP when sending new one
      setOtp("");
      setOtpError("");
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    setTouched((prev) => ({ ...prev, otp: true }));

    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${APIURL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      // ✅ VERY IMPORTANT
      setTempToken(data.tempToken);

      console.log("Saved tempToken:", data.tempToken);

      setOtpVerified(true);
      setOtpSent(false);
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    setTouched({ mobile: true, otp: true, password: true, confirm: true });

    if (!mobile || !isValidMobile(mobile)) return false;
    if (!otpVerified) {
      setError("Please verify your mobile number first");
      return false;
    }
    if (!password || password.length < 6) return false;
    if (password !== confirm) return false;
    if (!acceptedTerms) {
      setError("Please accept the terms and conditions");
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await fetch(`${APIURL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile,
          password,
          tempToken, // ✅ MUST SEND
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      localStorage.setItem("citizenId", data.citizenId);
      localStorage.setItem("mobile", mobile);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("registrationDate", new Date().toISOString());
 
      // Success animation and redirect
      setTimeout(() => {
        navigate("/feed", { replace: true });
      }, 1000);
    } catch (err) {
      console.error("REGISTER ERROR FULL:", err);
       const form = document.getElementById("register-form");
      form?.classList.add("animate-shake");
      setTimeout(() => form?.classList.remove("animate-shake"), 500);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4 py-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-400 rounded-bl-full opacity-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-400 to-cyan-400 rounded-tr-full opacity-10" />

          {/* Header with Animation */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="inline-block p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4">
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-gray-500 mt-2">
              Join PeopleVoice to report issues in your community
            </p>
          </motion.div>

          {/* Error Message with Animation */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Registration Progress
              </span>
              <span className="text-sm text-gray-500">
                {otpVerified ? "Step 2/2" : "Step 1/2"}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: otpVerified ? "100%" : "50%" }}
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Form */}
          <form
            id="register-form"
            onSubmit={handleRegister}
            className="space-y-5"
          >
            {/* Mobile Number Field */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone
                    className={`w-5 h-5 ${mobileError ? "text-red-400" : "text-gray-400"}`}
                  />
                </div>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  onBlur={() => handleBlur("mobile")}
                  placeholder="+91"
                  disabled={otpVerified}
                  maxLength={10}
                  className={`w-full pl-10 pr-24 py-3 border rounded-xl outline-none transition-all duration-200
                    ${
                      mobileError && touched.mobile
                        ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : touched.mobile && !mobileError && mobile
                          ? "border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    }
                    ${otpVerified ? "bg-gray-50" : ""}`}
                />
                {!otpVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading || !isValidMobile(mobile)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {otpLoading
                      ? "Sending..."
                      : otpSent
                        ? "Resend"
                        : "Send OTP"}
                  </button>
                )}
                {otpVerified && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>
              <AnimatePresence>
                {touched.mobile && mobileError && !otpVerified && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {mobileError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* OTP Verification Section */}
            {otpSent && !otpVerified && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Enter OTP
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      ref={otpInputRef}
                      id="otp-input"
                      type="text"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      onBlur={() => handleBlur("otp")}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className={`w-full pl-10 pr-24 py-3 border rounded-xl outline-none transition-all duration-200
                        ${
                          otpError && touched.otp
                            ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                            : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.length !== 6}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                  <AnimatePresence>
                    {touched.otp && otpError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {otpError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Resend Timer - Updated to show minutes and seconds */}
                <div className="text-center">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Resend OTP in {Math.floor(timer / 60)}:
                      {(timer % 60).toString().padStart(2, "0")} minutes
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Password Fields - Only visible after OTP verification */}
            {otpVerified && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Password Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock
                        className={`w-5 h-5 ${passwordError ? "text-red-400" : "text-gray-400"}`}
                      />
                    </div>
                    <input
                      ref={passwordInputRef}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => handleBlur("password")}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-3 border rounded-xl outline-none transition-all duration-200
                        ${
                          passwordError && touched.password
                            ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                            : touched.password && !passwordError && password
                              ? "border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                              : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Password strength:
                        </span>
                        <span
                          className={`text-xs font-medium ${strengthInfo.color}`}
                        >
                          {strengthInfo.text}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: strengthInfo.width }}
                          transition={{ duration: 0.3 }}
                          className={`h-full ${strengthInfo.bg}`}
                        />
                      </div>
                      <ul className="grid grid-cols-2 gap-1 mt-2">
                        <PasswordRequirement
                          met={password.length >= 8}
                          text="Min 8 characters"
                        />
                        <PasswordRequirement
                          met={/[A-Z]/.test(password)}
                          text="Uppercase letter"
                        />
                        <PasswordRequirement
                          met={/[a-z]/.test(password)}
                          text="Lowercase letter"
                        />
                        <PasswordRequirement
                          met={/[0-9]/.test(password)}
                          text="Number"
                        />
                        <PasswordRequirement
                          met={/[^A-Za-z0-9]/.test(password)}
                          text="Special character"
                        />
                      </ul>
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {touched.password && passwordError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {passwordError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock
                        className={`w-5 h-5 ${confirmError ? "text-red-400" : "text-gray-400"}`}
                      />
                    </div>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onBlur={() => handleBlur("confirm")}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-10 py-3 border rounded-xl outline-none transition-all duration-200
                        ${
                          confirmError && touched.confirm
                            ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                            : touched.confirm && !confirmError && confirm
                              ? "border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                              : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      )}
                    </button>
                  </div>
                  <AnimatePresence>
                    {touched.confirm && confirmError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {confirmError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Terms and Conditions - Only show after OTP verification */}
            {otpVerified && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 mt-4"
              >
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1 cursor-pointer"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  I agree to the{" "}
                  <a
                    href="#"
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Privacy Policy
                  </a>
                </label>
              </motion.div>
            )}

            {/* Submit Button - Only show after OTP verification */}
            {otpVerified && (
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </motion.button>
            )}
          </form>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-green-600 hover:text-green-700 font-medium transition-colors relative group"
              >
                Login
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            </p>
          </motion.div>

          {/* Privacy Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-center text-gray-400 mt-6 pt-4 border-t border-gray-100"
          >
            🔒 Your information is securely encrypted
            <br />
            We'll never share your personal data
          </motion.p>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-2px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(2px);
          }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
      `}</style>
    </div>
  );
};

// Password Requirement Component
const PasswordRequirement = ({ met, text }) => (
  <motion.li
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-1 text-xs"
  >
    {met ? (
      <CheckCircle className="w-3 h-3 text-green-500" />
    ) : (
      <XCircle className="w-3 h-3 text-gray-300" />
    )}
    <span className={met ? "text-gray-600" : "text-gray-400"}>{text}</span>
  </motion.li>
);

export default Register;