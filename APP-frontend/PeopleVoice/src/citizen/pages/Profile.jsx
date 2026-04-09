import React, { useEffect } from "react";
import {
  MapPin,
  FileText,
  LogOut,
  Edit,
  ChevronRight,
  Bookmark,
  Bell,
  Settings as SettingsIcon,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserValues } from "../../Context/UserValuesContext";
import { useTheme } from "../../Context/ThemeContext";

const Profile = () => {
  const navigate = useNavigate();
  const userValues = useUserValues() || {};
  const { isDark } = useTheme();

  const citizenId = localStorage.getItem("citizenId");

  useEffect(() => {
    if (!citizenId) {
      alert("Please login first");
      navigate("/peopleVoice/login");
    }
  }, [citizenId, navigate]);

  if (!citizenId) return null;

  const { allIssues = [] } = userValues;
  const myIssues = allIssues.filter((issue) => issue?.citizenId === citizenId);

  const savedUser = JSON.parse(localStorage.getItem("profileUser") || "null");

  const user = savedUser || {
    name: "Citizen User",
    username: citizenId?.toLowerCase() || "unknown",
    district: myIssues[0]?.district || "Tamil Nadu",
    bio: "Concerned citizen raising public issues for a better society.",
  };

  const firstLetter = user.name?.[0]?.toUpperCase() || "C";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/peopleVoice/login");
  };

  const menuItems = [
    { label: "Saved Issues", icon: <Bookmark size={20} />, path: "/peopleVoice/saved" },
    { label: "Notifications", icon: <Bell size={20} />, path: "/peopleVoice/notifications" },
    { label: "My Complaints", icon: <FileText size={20} />, path: "/peopleVoice/my-issues" },
    { label: "Report New Issue", icon: <Edit size={20} />, path: "/peopleVoice/post-issue" },
    { label: "Settings", icon: <SettingsIcon size={20} />, path: "/peopleVoice/settings" },
    { label: "Privacy & Security", icon: <Shield size={20} />, path: "/peopleVoice/privacy" },
  ];

  return (
    <div
      className={`min-h-screen py-6 px-3 transition-colors duration-300 ${
        isDark ? "bg-black/95" : "bg-gray-50"
      }`}
    >
      <div className="max-w-2xl mx-auto">
        <div
          className={`rounded-2xl shadow-xl p-5 sm:p-6 transition-all ${
            isDark
              ? "bg-gray-900/90 border border-gray-800 text-gray-100"
              : "bg-white border border-gray-200 text-gray-900"
          }`}
        >
          {/* Optional Back Button (if you want navigation consistency) */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-full transition-all duration-200 ${
                isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
              }`}
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">My Profile</h1>
          </div>

          {/* Profile Header - cleaner layout */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 mt-2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {firstLetter}
            </div>

            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-sm opacity-70 mt-0.5">@{user.username}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-sm opacity-70">
                <MapPin size={16} />
                <span>{user.district}</span>
              </div>
              <p className="text-sm mt-3 opacity-80 leading-relaxed max-w-md">
                {user.bio}
              </p>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3 opacity-70 tracking-wide">
              QUICK ACTIONS
            </h3>
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                    isDark ? "hover:bg-gray-800/70" : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-emerald-500">{item.icon}</div>
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <ChevronRight size={18} className="opacity-40" />
                </button>
              ))}
            </div>
          </div>

          <div className={`border-t my-6 ${isDark ? "border-gray-800" : "border-gray-200"}`} />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 
              text-white rounded-xl font-semibold flex items-center justify-center gap-3 shadow-md transition-all duration-200"
          >
            <LogOut size={20} />
            Logout
          </button>

          {/* Citizen ID */}
          <div className="text-center mt-5 text-xs opacity-50 font-mono tracking-wider">
            Citizen ID: {citizenId}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;