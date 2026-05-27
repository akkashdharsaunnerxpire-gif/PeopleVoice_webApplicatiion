import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Globe,
  AlertCircle,
  Users,
  BarChart3,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const AdminLogin = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  /* ================= STATE ================= */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= INJECT KEYFRAMES FOR PROGRESS BAR ================= */
  useEffect(() => {
    if (!document.getElementById("linear-progress-keyframes")) {
      const style = document.createElement("style");
      style.id = "linear-progress-keyframes";
      style.textContent = `
        @keyframes progressSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `;
      document.head.appendChild(style);
    }
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  /* ================= LOAD EMAIL (CORRECT LOGIC) ================= */
  useEffect(() => {
    const remembered = localStorage.getItem("rememberAdmin");
    const rememberedEmail = localStorage.getItem("adminEmail");
    const registeredEmail = localStorage.getItem("registeredEmail");

    if (remembered === "true" && rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
      return;
    }

    if (registeredEmail) {
      setEmail(registeredEmail);
    }
  }, []);

  /* ================= LOGIN HANDLER WITH 3 SEC DELAY ================= */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/admin/login`, {
        email,
        password,
      });

      /* 🔐 Store Auth Data immediately */
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminDistrict", res.data.admin.district);

      /* 💾 Remember Me */
      if (rememberMe) {
        localStorage.setItem("rememberAdmin", "true");
        localStorage.setItem("adminEmail", email);
      } else {
        localStorage.removeItem("rememberAdmin");
        localStorage.removeItem("adminEmail");
      }

      localStorage.removeItem("registeredEmail");

      /* ⏳ Wait 3 seconds before navigating (simulate processing) */
      timeoutRef.current = setTimeout(() => {
        navigate("/admin/dashboard");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid email or password. Please try again."
      );
      setLoading(false); // Stop loading on error immediately
    }
  };

  return (
    <>
      {/* ================= LINEAR PROGRESS BAR ================= */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-100 z-50 overflow-hidden shadow-sm">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-green-600 w-1/3"
            style={{ animation: "progressSlide 1.2s ease-in-out infinite" }}
          />
        </div>
      )}

      <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* ================= LEFT BRANDING ================= */}
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
              Digital Governance Control Panel
            </h2>
            <p className="text-gray-600 max-w-lg">
              Secure administrative access for managing civic issues, analytics,
              departments, and citizen engagement across Tamil Nadu.
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

        {/* ================= RIGHT LOGIN ================= */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-3xl">
              <h2 className="text-2xl font-bold">Admin Login</h2>
              <p className="text-sm text-blue-100">
                Authorized administrators only
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
                  <AlertCircle className="text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <InputField
                  icon={Mail}
                  type="email"
                  placeholder="District@gov.in"
                  value={email}
                  onChange={setEmail}
                />

                <div className="relative">
                  <InputField
                    icon={Lock}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={setPassword}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-3.5 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />
                    Remember device
                  </label>
                  <button
                    type="button"
                    className="text-blue-600 font-medium"
                    onClick={() => navigate("/admin/forgot-password")}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-bold text-white transition ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-green-600 hover:shadow-lg"
                  }`}
                >
                  {loading ? "Signing in..." : "LOGIN"}
                </button>
              </form>

              <p className="text-center text-sm mt-6">
                New admin?{" "}
                <button
                  onClick={() => navigate("/admin/register")}
                  className="text-blue-600 font-bold"
                >
                  Create Account
                </button>
              </p>
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
    </>
  );
};

/* ================= SMALL COMPONENTS ================= */
const Feature = ({ icon: Icon, title }) => (
  <div className="bg-white/80 p-4 rounded-xl shadow-sm flex items-center gap-3">
    <Icon className="text-blue-600" size={20} />
    <span className="font-medium">{title}</span>
  </div>
);

const InputField = ({ icon: Icon, type, placeholder, value, onChange }) => (
  <div className="relative">
    <Icon className="absolute left-4 top-3.5 text-gray-400" size={18} />
    <input
      type={type}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
    />
  </div>
);

export default AdminLogin;