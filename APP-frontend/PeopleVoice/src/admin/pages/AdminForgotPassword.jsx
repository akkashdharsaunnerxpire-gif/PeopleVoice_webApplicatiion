import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Globe,
  ShieldCheck,
  Users,
  BarChart3,
  Building2,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const AdminForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("email"); // email -> otp -> password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Error & success messages
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resetError, setResetError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/admin/forgot-password`, {
        email,
      });

      if (res.data.success) {
        setSuccessMsg("OTP sent to your email. Check spam folder if not received.");
        setTimeout(() => {
          setStep("otp");
          setSuccessMsg("");
        }, 2000);
      } else {
        setError(res.data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to send reset email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP (optional, add route in backend)
  const handleResendOtp = async () => {
    setResending(true);
    setOtpError("");
    try {
      const res = await axios.post(`${API_BASE}/api/admin/resend-otp`, { email });
      if (res.data.success) {
        setSuccessMsg("New OTP sent to your email.");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setOtpError(res.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setOtpError("Could not resend OTP. Try again.");
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError("");
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    setVerifying(true);
    try {
      const res = await axios.post(`${API_BASE}/api/admin/verify-otp`, {
        email,
        otp,
      });

      if (res.data.success) {
        setSuccessMsg("OTP verified! Redirecting...");
        setTimeout(() => {
          setStep("password");
          setSuccessMsg("");
        }, 1000);
      } else {
        setOtpError(res.data.message || "Invalid OTP");
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setVerifying(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");

    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match");
      return;
    }

    setResetLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/admin/reset-password`, {
        email,
        otp,
        newPassword,
      });

      if (res.data.success) {
        setSuccessMsg("Password reset successful! Redirecting to login...");
        timeoutRef.current = setTimeout(() => {
          navigate("/admin/login");
        }, 3000);
      } else {
        setResetError(res.data.message || "Failed to reset password");
      }
    } catch (err) {
      setResetError(err.response?.data?.message || "Something went wrong");
    } finally {
      setResetLoading(false);
    }
  };

  const goBack = () => {
    if (step === "otp") {
      setStep("email");
      setOtp("");
      setOtpError("");
    } else if (step === "password") {
      setStep("otp");
      setNewPassword("");
      setConfirmPassword("");
      setResetError("");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Left branding - unchanged */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-200 rounded-full opacity-20 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl">
              <Globe className="text-white" size={34} />
            </div>
            <div>
              <h1 className="text-4xl font-black">PEOPLEVOICE</h1>
              <p className="text-blue-700 font-semibold">ADMIN PLATFORM</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            {step === "email" && "Reset Your Password"}
            {step === "otp" && "Verify OTP"}
            {step === "password" && "Create New Password"}
          </h2>
          <p className="text-gray-600 max-w-lg">
            {step === "email" &&
              "Enter your registered email address and we'll send you an OTP to reset your password securely."}
            {step === "otp" &&
              `We sent a 6‑digit code to ${email}. Enter it below to continue.`}
            {step === "password" &&
              "OTP verified. Now create a strong new password."}
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4">
          <Feature icon={Users} title="Citizen Management" />
          <Feature icon={BarChart3} title="Real-time Analytics" />
          <Feature icon={ShieldCheck} title="High Security" />
          <Feature icon={Building2} title="District Control" />
        </div>
        <p className="relative z-10 text-sm text-gray-500">
          Government of Tamil Nadu • Secure Digital Initiative
        </p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-3xl">
            <h2 className="text-2xl font-bold">
              {step === "email" && "Reset Password"}
              {step === "otp" && "Enter OTP"}
              {step === "password" && "Set New Password"}
            </h2>
            <p className="text-sm text-blue-100">
              {step === "email" && "We'll help you regain access"}
              {step === "otp" && "Check your inbox"}
              {step === "password" && "Minimum 8 characters"}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Global success message */}
            {successMsg && (
              <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl flex gap-3">
                <CheckCircle className="text-green-500" size={20} />
                <p className="text-sm text-green-700">{successMsg}</p>
              </div>
            )}

            {/* STEP 1: Email */}
            {step === "email" && (
              <>
                {error && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <InputField
                    icon={Mail}
                    type="email"
                    placeholder="Admin Email"
                    value={email}
                    onChange={setEmail}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-xl font-bold text-white transition ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-green-600 hover:shadow-lg"
                    }`}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </form>
              </>
            )}

            {/* STEP 2: OTP */}
            {step === "otp" && (
              <>
                {otpError && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <p className="text-sm text-red-700">{otpError}</p>
                  </div>
                )}
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <InputField
                    icon={Mail}
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                  />
                  <button
                    type="submit"
                    disabled={verifying}
                    className={`w-full py-3 rounded-xl font-bold text-white transition ${
                      verifying
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-green-600 hover:shadow-lg"
                    }`}
                  >
                    {verifying ? "Verifying..." : "Verify OTP"}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <button
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="text-blue-600 text-sm flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
                    {resending ? "Sending..." : "Resend OTP"}
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: New Password */}
            {step === "password" && (
              <>
                {resetError && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
                    <AlertCircle className="text-red-500" size={20} />
                    <p className="text-sm text-red-700">{resetError}</p>
                  </div>
                )}
                {!successMsg?.includes("successful") ? (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password (min. 8 characters)"
                        className="w-full pl-11 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-gray-400"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full pl-11 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-3.5 text-gray-400"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className={`w-full py-3 rounded-xl font-bold text-white transition ${
                        resetLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-green-600 hover:shadow-lg"
                      }`}
                    >
                      {resetLoading ? "Resetting..." : "Reset Password"}
                    </button>
                  </form>
                ) : null}
              </>
            )}

            {/* Back button */}
            {step !== "email" && (
              <div className="mt-6 text-center">
                <button
                  onClick={goBack}
                  className="text-blue-600 font-medium inline-flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              </div>
            )}

            {/* Direct login link */}
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate("/admin/login")}
                className="text-gray-500 text-sm hover:text-blue-600"
              >
                Back to Login
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-50 text-xs text-gray-500 flex justify-between rounded-b-3xl">
            <span>© {new Date().getFullYear()} PeopleVoice</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Secure
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ icon: Icon, title }) => (
  <div className="bg-white/80 p-4 rounded-xl shadow-sm flex items-center gap-3">
    <Icon className="text-blue-600" size={20} />
    <span className="font-medium">{title}</span>
  </div>
);

const InputField = ({ icon: Icon, type, placeholder, value, onChange, maxLength }) => (
  <div className="relative">
    <Icon className="absolute left-4 top-3.5 text-gray-400" size={18} />
    <input
      type={type}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
    />
  </div>
);

export default AdminForgotPassword;