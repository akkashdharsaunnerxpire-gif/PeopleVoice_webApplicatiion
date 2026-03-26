import React, { useState } from "react";
import axios from "axios";
import { 
  UserPlus, 
  Lock, 
  Mail, 
  Building2, 
  MapPin, 
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
const API_BASE = import.meta.env.VITE_BACKEND_URL;

const AdminRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    district: "",
    email: "",
    password: "",
    confirmPassword: "",
    secretKey: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  // Tamil Nadu districts list
  const tamilNaduDistricts = [
    "Ariyalur",
    "Chengalpattu",
    "Chennai",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kallakurichi",
    "Kanchipuram",
    "Kanyakumari",
    "Karur",
    "Krishnagiri",
    "Madurai",
    "Mayiladuthurai",
    "Nagapattinam",
    "Namakkal",
    "Nilgiris",
    "Perambalur",
    "Pudukkottai",
    "Ramanathapuram",
    "Ranipet",
    "Salem",
    "Sivaganga",
    "Tenkasi",
    "Thanjavur",
    "Theni",
    "Thoothukudi",
    "Tiruchirappalli",
    "Tirunelveli",
    "Tirupattur",
    "Tiruppur",
    "Tiruvallur",
    "Tiruvannamalai",
    "Tiruvarur",
    "Vellore",
    "Viluppuram",
    "Virudhunagar"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for email field - if user manually types, don't auto-update
    if (name === "email") {
      setFormData({
        ...formData,
        [name]: value
      });
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    if (!formData.district) {
      setError("Please select your district");
      return false;
    }

    if (!formData.email.endsWith("@gov.in") && !formData.email.endsWith("@tn.gov.in")) {
      setError("Only government email addresses (@gov.in or @tn.gov.in) are allowed");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (!formData.secretKey) {
      setError("Secret key is required for registration");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE}/api/admin/register`,
        {
          district: formData.district,
          email: formData.email,
          password: formData.password,
          secretKey: formData.secretKey
        }
      );

      setSuccess("Admin account created successfully! Redirecting to login...");
      
      // Store temporary data
      localStorage.setItem("registeredEmail", formData.email);
      localStorage.setItem("registeredDistrict", formData.district);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/admin/login");
      }, 2000);

    } catch (err) {
      const errorMsg = err.response?.data?.message || "Registration failed. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictSelect = (district) => {
    // Convert district name to lowercase and remove spaces for email
    const districtForEmail = district.toLowerCase().replace(/\s+/g, '');
    
    setFormData({
      ...formData,
      district,
      email: `${districtForEmail}@gov.in`
    });
  };

  // Function to generate email from district
  const generateEmailFromDistrict = (districtName) => {
    if (!districtName) return "";
    return districtName.toLowerCase().replace(/\s+/g, '') + "@gov.in";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Main Container */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-blue-700 to-purple-700 p-8 text-white">
            <div className="absolute top-4 right-4 opacity-20">
              <Building2 size={48} />
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <UserPlus size={36} className="drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">PeopleVoice Admin Registration</h1>
                <p className="text-blue-100 text-sm font-medium">
                  District Administration Portal · Government of Tamil Nadu
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Secure Registration Portal</span>
              </div>
              <span className="opacity-50">•</span>
              <span>v2.4.1</span>
              <span className="opacity-50">•</span>
              <span>Restricted Access</span>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left Column - Registration Form */}
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="text-blue-600" size={20} />
                  <h2 className="text-lg font-bold text-gray-800">Admin Account Creation</h2>
                </div>
                <p className="text-sm text-gray-600">
                  Register your district administration account. All fields are mandatory.
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={18} />
                    <span className="text-sm font-medium text-green-800">{success}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-red-500" size={18} />
                    <span className="text-sm font-medium text-red-800">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* District Selection */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <MapPin size={14} />
                    Select District
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-xl">
                    {tamilNaduDistricts.map((district) => (
                      <button
                        key={district}
                        type="button"
                        onClick={() => handleDistrictSelect(district)}
                        className={`p-3 text-sm rounded-lg transition-all duration-200 ${
                          formData.district === district
                            ? 'bg-blue-100 border-2 border-blue-500 text-blue-700 font-semibold scale-[1.02]'
                            : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        {district}
                      </button>
                    ))}
                  </div>
                  {formData.district && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-xs text-green-600">
                        Selected: <span className="font-semibold">{formData.district}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <Mail size={14} />
                    Government Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="text-gray-400 group-hover:text-blue-500 transition-colors" size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={formData.district ? generateEmailFromDistrict(formData.district) : "districtname@gov.in"}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm placeholder:text-gray-400 hover:border-gray-400"
                      readOnly={!!formData.district}
                    />
                    {formData.district && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          Auto-generated
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.district ? (
                      <span>Email auto-generated as: <code className="bg-gray-100 px-1 rounded">{generateEmailFromDistrict(formData.district)}</code></span>
                    ) : (
                      "Email will be auto-generated based on district selection"
                    )}
                  </p>
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <Lock size={14} />
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="text-gray-400 group-hover:text-blue-500 transition-colors" size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a strong password"
                      className="w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm placeholder:text-gray-400 hover:border-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="text-gray-400 hover:text-gray-600 transition-colors" size={18} />
                      ) : (
                        <Eye className="text-gray-400 hover:text-gray-600 transition-colors" size={18} />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <p className="text-xs text-gray-500">
                      Must be at least 8 characters with letters, numbers, and symbols
                    </p>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <Lock size={14} />
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="text-gray-400 group-hover:text-blue-500 transition-colors" size={18} />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm placeholder:text-gray-400 hover:border-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="text-gray-400 hover:text-gray-600 transition-colors" size={18} />
                      ) : (
                        <Eye className="text-gray-400 hover:text-gray-600 transition-colors" size={18} />
                      )}
                    </button>
                  </div>
                  {formData.password && formData.confirmPassword && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${formData.password === formData.confirmPassword ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <p className={`text-xs ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                        {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Secret Key Field */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                    <KeyRound size={14} />
                    Secret Key
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="text-gray-400 group-hover:text-blue-500 transition-colors" size={18} />
                    </div>
                    <input
                      type={showSecretKey ? "text" : "password"}
                      name="secretKey"
                      required
                      value={formData.secretKey}
                      onChange={handleChange}
                      placeholder="Enter government-issued secret key"
                      className="w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm placeholder:text-gray-400 hover:border-gray-400 tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showSecretKey ? (
                        <EyeOff className="text-gray-400 hover:text-gray-600 transition-colors" size={18} />
                      ) : (
                        <Eye className="text-gray-400 hover:text-gray-600 transition-colors" size={18} />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Provided by state government authorities
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 px-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl active:scale-[0.99]'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <UserPlus size={18} />
                      <span>Register Admin Account</span>
                    </div>
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/admin/login")}
                      className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      Sign In Here
                    </button>
                  </p>
                </div>
              </form>
            </div>

            {/* Right Column - Information */}
            <div className="lg:border-l lg:border-gray-200 lg:pl-8">
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-blue-600" size={20} />
                  Registration Guidelines
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">District Selection</span>
                      <p className="text-xs text-gray-600">Select your administrative district from Tamil Nadu</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Auto-generated Email</span>
                      <p className="text-xs text-gray-600">Email will be: <code className="bg-gray-100 px-1 rounded">districtname@gov.in</code></p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Examples</span>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>Chennai → <code className="bg-gray-100 px-1 rounded">chennai@gov.in</code></div>
                        <div>Coimbatore → <code className="bg-gray-100 px-1 rounded">coimbatore@gov.in</code></div>
                        <div>Madurai → <code className="bg-gray-100 px-1 rounded">madurai@gov.in</code></div>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Password Requirements</span>
                      <p className="text-xs text-gray-600">Minimum 8 characters with complexity requirements</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt=2"></div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Secret Key</span>
                      <p className="text-xs text-gray-600">Obtain secret key from state government authorities</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <KeyRound size={16} />
                  About Secret Key
                </h4>
                <p className="text-xs text-blue-700">
                  The secret key is a unique authentication code provided by the Tamil Nadu 
                  State Government to authorized district administrators. This ensures only 
                  verified government personnel can create admin accounts.
                </p>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Sample Registrations</h4>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-800 mb-1">Chennai District</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <code className="bg-gray-100 px-2 rounded">chennai@gov.in</code>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-800 mb-1">Coimbatore District</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <code className="bg-gray-100 px-2 rounded">coimbatore@gov.in</code>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-800 mb-1">Madurai District</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <code className="bg-gray-100 px-2 rounded">madurai@gov.in</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                © {new Date().getFullYear()} PeopleVoice · Tamil Nadu Government
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-green-700">Secure Registration</span>
                </div>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">Authorized Access Only</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Government of Tamil Nadu · Digital Governance Initiative
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;