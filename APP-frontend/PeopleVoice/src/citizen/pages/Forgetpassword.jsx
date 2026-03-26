import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  Key,
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const APIURL = `${BACKEND_URL}/api/auth`;

// ✅ MOBILE NUMBER VALIDATOR
const isValidMobileNumber = (number) => /^[0-9]{10}$/.test(number); // 10-digit number

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("mobile"); // 'mobile' | 'otp' | 'reset'

  // Form values
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [progress, setProgress] = useState(0);

  // Validation
  const [mobileError, setMobileError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [touched, setTouched] = useState({
    mobile: false,
    password: false,
    confirm: false,
  });

  const otpRefs = useRef([]);
  const verificationInProgress = useRef(false);

  // Linear progress bar animation
  useEffect(() => {
    let timer;
    if (loading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prevProgress + 1; // Linear increment
        });
      }, 30); // 30ms * 100 = 3000ms (3 seconds)

      return () => {
        clearInterval(interval);
      };
    } else {
      setProgress(0);
    }
  }, [loading]);

  // Password strength (same as Register)
  const checkPasswordStrength = (pw) => {
    let strength = 0;
    if (pw.length >= 8) strength++;
    if (/[A-Z]/.test(pw)) strength++;
    if (/[a-z]/.test(pw)) strength++;
    if (/[0-9]/.test(pw)) strength++;
    if (/[^A-Za-z0-9]/.test(pw)) strength++;
    return strength;
  };

  const getStrengthInfo = (strength) => {
    const map = {
      0: {
        text: "Very Weak",
        color: "text-red-500",
        bg: "bg-red-500",
        width: "20%",
      },
      1: {
        text: "Weak",
        color: "text-orange-500",
        bg: "bg-orange-500",
        width: "40%",
      },
      2: {
        text: "Fair",
        color: "text-yellow-500",
        bg: "bg-yellow-500",
        width: "60%",
      },
      3: {
        text: "Good",
        color: "text-blue-500",
        bg: "bg-blue-500",
        width: "80%",
      },
      4: {
        text: "Strong",
        color: "text-green-500",
        bg: "bg-green-500",
        width: "90%",
      },
      5: {
        text: "Very Strong",
        color: "text-emerald-500",
        bg: "bg-emerald-500",
        width: "100%",
      },
    };
    return map[strength] || map[0];
  };

  const pwStrength = checkPasswordStrength(newPassword);
  const strengthInfo = getStrengthInfo(pwStrength);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(
      () => setResendTimer((t) => Math.max(0, t - 1)),
      1000,
    );
    return () => clearInterval(id);
  }, [resendTimer]);

  // Auto-verify OTP when all digits are entered
  useEffect(() => {
    const isOtpComplete = otp.every(digit => digit !== "");
    
    if (isOtpComplete && step === "otp" && !loading && !verificationInProgress.current) {
      // Small delay to ensure last digit is registered
      const timer = setTimeout(() => {
        handleVerifyOtp(new Event('submit'));
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [otp, step, loading]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1 || !/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    // Handle left arrow key
    if (e.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    // Handle right arrow key
    if (e.key === "ArrowRight" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;

    const newOtp = Array(6).fill("");
    text.split("").forEach((d, i) => {
      if (i < 6) newOtp[i] = d;
    });
    setOtp(newOtp);

    // Focus the next empty input or last input
    const nextFocus = Math.min(text.length, 5);
    requestAnimationFrame(() => {
      otpRefs.current[nextFocus]?.focus();
    });

    // If pasted 6 digits, auto-verify
    if (text.length === 6) {
      setTimeout(() => {
        handleVerifyOtp(new Event('submit'));
      }, 300);
    }
  };

  // Step 1 – Send OTP (via mobile)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMobileError("");

    if (!mobileNumber) {
      setMobileError("Mobile number is required");
      return;
    }
    if (!isValidMobileNumber(mobileNumber)) {
      setMobileError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${APIURL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not send code");

      setSuccess(`Code sent to ${mobileNumber}`);
      
      // Simulate 3 seconds loading before moving to next step
      setTimeout(() => {
        setStep("otp");
        setResendTimer(60);
        setOtp(Array(6).fill(""));
        setLoading(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Step 2 – Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    // Prevent multiple verification attempts
    if (verificationInProgress.current || loading) return;
    
    setError("");
    setOtpError("");

    const code = otp.join("");
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setOtpError("Please enter a valid 6-digit code");
      return;
    }

    verificationInProgress.current = true;
    setLoading(true);
    
    try {
      const res = await fetch(`${APIURL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobileNumber, otp: code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid code");

      setSuccess("Code verified!");
      
      // Simulate 3 seconds loading before moving to next step
      setTimeout(() => {
        setStep("reset");
        setLoading(false);
        verificationInProgress.current = false;
      }, 3000);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      verificationInProgress.current = false;
      
      // Clear OTP on error for better UX
      setOtp(Array(6).fill(""));
      // Focus first input
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }
  };

  // Step 3 – Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setPasswordError("");
    setConfirmError("");

    if (!newPassword) {
      setPasswordError("Password is required");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${APIURL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber,
          otp: otp.join(""),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password reset failed");

      setSuccess("Password reset successful! Redirecting...");
      
      // Simulate 3 seconds loading before redirect
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    setOtp(Array(6).fill("")); // Clear OTP when resending
    await handleSendOtp({ preventDefault: () => {} });
  };

  const goBack = () => {
    if (step === "otp") {
      setStep("mobile");
      verificationInProgress.current = false;
    }
    if (step === "reset") {
      setStep("otp");
    }
    setError("");
    setSuccess("");
  };

  const PasswordRequirement = ({ met, text }) => (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-1.5 text-xs"
    >
      {met ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 text-gray-300" />
      )}
      <span className={met ? "text-gray-700" : "text-gray-400"}>{text}</span>
    </motion.li>
  );

  return (
    <>
      {/* Global Progress Bar at Top of DOM */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: '#e5e7eb',
              zIndex: 9999
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(to right, #10b981, #059669)',
                width: `${progress}%`
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
            {/* Back button */}
            {step !== "mobile" && (
              <motion.button
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                onClick={goBack}
                className="absolute top-6 left-6 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            )}

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-block p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4">
                {step === "mobile" && (
                  <Phone className="w-8 h-8 text-green-600" />
                )}
                {step === "otp" && <Key className="w-8 h-8 text-green-600" />}
                {step === "reset" && <Lock className="w-8 h-8 text-green-600" />}
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {step === "mobile"
                  ? "Forgot Password?"
                  : step === "otp"
                    ? "Verify Code"
                    : "Reset Password"}
              </h1>
              <p className="text-gray-500 mt-2 text-sm">
                {step === "mobile" &&
                  "We'll send a verification code to your mobile number"}
                {step === "otp" && (
                  <>
                    Code sent to{" "}
                    <span className="font-medium text-green-700">
                      {mobileNumber}
                    </span>
                  </>
                )}
                {step === "reset" && "Choose a strong new password"}
              </p>
            </div>

            {/* Messages */}
            <AnimatePresence>
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-700">{success}</p>
                </motion.div>
              )}

              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* ────────────────────────────────────────────── */}
              {/*                MOBILE STEP                     */}
              {/* ────────────────────────────────────────────── */}
              {step === "mobile" && (
                <motion.form
                  key="mobile"
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  onSubmit={handleSendOtp}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => {
                          // Allow only numbers
                          const value = e.target.value.replace(/\D/g, "");
                          setMobileNumber(value);
                        }}
                        onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
                        placeholder="+91"
                        maxLength="10"
                        disabled={loading}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl transition-all
                          ${
                            touched.mobile && mobileError
                              ? "border-red-400 bg-red-50/60"
                              : touched.mobile && mobileNumber && !mobileError
                                ? "border-green-400 bg-green-50/40"
                                : "border-gray-200 hover:border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          }
                          ${loading ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    {touched.mobile && mobileError && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {mobileError}
                      </p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3.5 rounded-xl font-medium shadow-lg shadow-green-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" /> Send Code
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}

              {/* ────────────────────────────────────────────── */}
              {/*                   OTP STEP                     */}
              {/* ────────────────────────────────────────────── */}
              {step === "otp" && (
                <motion.form
                  key="otp"
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onAnimationComplete={() => {
                    setTimeout(() => {
                      otpRefs.current[0]?.focus();
                    }, 0);
                  }}
                  onSubmit={handleVerifyOtp}
                >
                  <div className="text-center">
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Enter 6-digit code
                    </label>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => (otpRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          onPaste={i === 0 ? handleOtpPaste : undefined}
                          disabled={loading}
                          className={`w-11 h-12 text-center text-xl font-semibold border rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all
                            ${loading ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        />
                      ))}
                    </div>
                    {otpError && (
                      <p className="mt-3 text-xs text-red-600 flex items-center justify-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {otpError}
                      </p>
                    )}
                    
                    {/* Auto-verification hint */}
                    {!loading && !error && otp.every(d => d !== "") && (
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-xs text-green-600 flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verifying automatically...
                      </motion.p>
                    )}
                  </div>

                  <div className="text-center mt-6 mb-6">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendTimer > 0 || loading}
                      className="text-sm text-green-600 hover:text-green-800 disabled:text-gray-400 flex items-center gap-1.5 mx-auto transition-colors"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${resendTimer > 0 ? "animate-spin" : ""}`}
                      />
                      {resendTimer > 0
                        ? `Resend in ${resendTimer}s`
                        : "Resend code"}
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    disabled={loading || otp.some(d => d === "")}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3.5 rounded-xl font-medium shadow-lg shadow-green-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Key className="w-5 h-5" /> Verify
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}

              {/* ────────────────────────────────────────────── */}
              {/*                 RESET PASSWORD                 */}
              {/* ────────────────────────────────────────────── */}
              {step === "reset" && (
                <motion.form
                  key="reset"
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  onSubmit={handleResetPassword}
                  className="space-y-6"
                >
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onBlur={() =>
                          setTouched((t) => ({ ...t, password: true }))
                        }
                        placeholder="••••••••"
                        disabled={loading}
                        className={`w-full pl-11 pr-11 py-3 border rounded-xl transition-all
                          ${
                            touched.password && passwordError
                              ? "border-red-400 bg-red-50/60"
                              : touched.password && newPassword && !passwordError
                                ? "border-green-400 bg-green-50/40"
                                : "border-gray-200 hover:border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          }
                          ${loading ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>

                    {newPassword && !loading && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-gray-500">Strength:</span>
                          <span className={`font-medium ${strengthInfo.color}`}>
                            {strengthInfo.text}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: strengthInfo.width }}
                            className={`h-full ${strengthInfo.bg} transition-all duration-300`}
                          />
                        </div>

                        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                          <PasswordRequirement
                            met={newPassword.length >= 8}
                            text="8+ characters"
                          />
                          <PasswordRequirement
                            met={/[A-Z]/.test(newPassword)}
                            text="Uppercase"
                          />
                          <PasswordRequirement
                            met={/[a-z]/.test(newPassword)}
                            text="Lowercase"
                          />
                          <PasswordRequirement
                            met={/[0-9]/.test(newPassword)}
                            text="Number"
                          />
                          <PasswordRequirement
                            met={/[^A-Za-z0-9]/.test(newPassword)}
                            text="Special char"
                          />
                        </ul>
                      </div>
                    )}

                    {touched.password && passwordError && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() =>
                          setTouched((t) => ({ ...t, confirm: true }))
                        }
                        placeholder="••••••••"
                        disabled={loading}
                        className={`w-full pl-11 pr-11 py-3 border rounded-xl transition-all
                          ${
                            touched.confirm && confirmError
                              ? "border-red-400 bg-red-50/60"
                              : touched.confirm &&
                                  confirmPassword &&
                                  !confirmError
                                ? "border-green-400 bg-green-50/40"
                                : "border-gray-200 hover:border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                          }
                          ${loading ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showConfirm ? (
                          <EyeOff className="w-5 h-5 text-gray-500" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>

                    {touched.confirm && confirmError && (
                      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {confirmError}
                      </p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3.5 rounded-xl font-medium shadow-lg shadow-green-500/20 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" /> Reset Password
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Footer links */}
            <div className="mt-8 text-center space-y-3">
              <Link
                to="/login"
                className={`text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1.5 ${loading ? 'pointer-events-none opacity-50' : ''}`}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>

              <p className="text-xs text-gray-400 pt-3 border-t border-gray-100">
                🔐 Your account security is our priority
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ForgotPassword;