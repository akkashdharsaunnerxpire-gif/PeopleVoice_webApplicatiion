import React, { useState, useEffect } from "react";
import { Phone, Lock, Eye, EyeOff, AlertCircle, LogIn } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const APIURL = `${BACKEND_URL}/api/auth`;

// ✅ MOBILE NUMBER VALIDATOR (adjust regex based on your country format)
const isValidMobileNumber = (number) => /^[0-9]{10}$/.test(number); // 10-digit number

const Login = () => {
  const navigate = useNavigate();

  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Load saved mobile number if "remember me" was checked
  useEffect(() => {
    const savedMobile = localStorage.getItem("rememberedMobile");
    if (savedMobile) {
      setMobileNumber(savedMobile);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    let isValid = true;

    // Mobile number validation
    if (!mobileNumber) {
      setMobileError("Mobile number is required");
      isValid = false;
    } else if (!isValidMobileNumber(mobileNumber)) {
      setMobileError("Please enter a valid 10-digit mobile number");
      isValid = false;
    } else {
      setMobileError("");
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await fetch(`${APIURL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: mobileNumber,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // ✅ STORE AUTH INFO
      localStorage.setItem("citizenId", data.citizenId);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("loginTimestamp", Date.now().toString());

      // Store mobile number if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberedMobile", mobileNumber);
      } else {
        localStorage.removeItem("rememberedMobile");
      }

      // Smooth navigation after 5 seconds
      setTimeout(() => {
        navigate("../feed", { replace: true });
      }, 5000);
    } catch (err) {
      setError(err.message || "Server error. Please try again later.");
      setLoading(false); // Stop loading on error

      // Shake animation on error
      const form = document.getElementById("login-form");
      form?.classList.add("animate-shake");
      setTimeout(() => form?.classList.remove("animate-shake"), 500);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 px-4">
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                PeopleVoice
              </h1>
              <p className="text-gray-500 mt-2 flex items-center justify-center gap-2">
                <span className="w-8 h-px bg-gradient-to-r from-transparent to-gray-300" />
                Login with mobile number
                <span className="w-8 h-px bg-gradient-to-l from-transparent to-gray-300" />
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

            {/* Form */}
            <form id="login-form" onSubmit={handleLogin} className="space-y-5">
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
                    value={mobileNumber}
                    onChange={(e) => {
                      // Allow only numbers
                      const value = e.target.value.replace(/\D/g, "");
                      setMobileNumber(value);
                    }}
                    onBlur={() =>
                      mobileNumber && isValidMobileNumber(mobileNumber)
                        ? setMobileError("")
                        : null
                    }
                    placeholder="+91"
                    maxLength="10"
                    disabled={loading}
                    className={`w-full pl-10 pr-3 py-3 border rounded-xl outline-none transition-all duration-200
                      ${
                        mobileError
                          ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      }
                      ${loading ? "bg-gray-50 cursor-not-allowed" : ""}`}
                  />
                </div>
                <AnimatePresence>
                  {mobileError && (
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
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className={`w-full pl-10 pr-10 py-3 border rounded-xl outline-none transition-all duration-200
                      ${
                        passwordError
                          ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      }
                      ${loading ? "bg-gray-50 cursor-not-allowed" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {passwordError && (
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

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  to="../forgotpassword"
                  className={`text-sm text-green-600 hover:text-green-700 font-medium transition-colors ${loading ? "pointer-events-none opacity-50" : ""}`}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-green-500/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Login
                  </>
                )}
              </motion.button>
            </form>

            {/* Register Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-center"
            >
              <p className="text-gray-500">
                Don't have an account?{" "}
                <Link
                  to="../register"
                  className={`text-green-600 hover:text-green-700 font-medium transition-colors relative group ${loading ? "pointer-events-none opacity-50" : ""}`}
                >
                  Register
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
              🔒 Login uses your mobile number securely.
              <br />
              Only your Citizen ID is shown publicly.
            </motion.p>
          </div>
        </motion.div>
      </div>

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
    </>
  );
};

export default Login;
