import React, { useEffect } from "react";
import {
  MapPin,
  FileText,
  LogOut,
  Edit,
  ChevronRight,
  Bookmark,
  Bell,
  Settings,
  Shield,
  Moon,
  Sun,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserValues } from "../../Context/UserValuesContext";
import { useTheme } from "../../Context/ThemeContext";
import { themeColors } from "../components/constants";

const Profile = () => {
  const navigate = useNavigate();
  const userValues = useUserValues() || {};
  const { allIssues = [] } = userValues;

  const { isDark, toggleDarkMode } = useTheme();    // ← now using toggle

  const citizenId = localStorage.getItem("citizenId");

  useEffect(() => {
    if (!citizenId) {
      alert("Please login first");
      navigate("/peopleVoice/login");
    }
  }, [citizenId, navigate]);

  if (!citizenId) return null;

  const myIssues = allIssues.filter(
    (issue) => issue?.citizenId === citizenId
  );

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
    { label: "Saved Issues", icon: <Bookmark size={18} />, path: "/peopleVoice/saved" },
    { label: "Notifications", icon: <Bell size={18} />, path: "/peopleVoice/notifications" },
    { label: "My Complaints", icon: <FileText size={18} />, path: "/peopleVoice/my-issues" },
    { label: "Report New Issue", icon: <Edit size={18} />, path: "/peopleVoice/post-issue" },
    { label: "Settings", icon: <Settings size={18} />, path: "/peopleVoice/settings" },
    { label: "Privacy & Security", icon: <Shield size={18} />, path: "/peopleVoice/privacy" },
  ];

  return (
    <div
      className={`min-h-screen pb-24 pt-6 px-4 sm:px-6
        ${isDark ? themeColors.dark.bg : themeColors.light.bg}`}
    >
      <div className="max-w-2xl mx-auto">
        <div
          className={`rounded-2xl shadow-lg p-6 sm:p-8 border
            ${isDark 
              ? "bg-gray-800 border-gray-700 text-gray-100" 
              : "bg-white border-gray-200 text-gray-900"}`}
        >
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-7">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
              {firstLetter}
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-sm opacity-80 mt-0.5">@{user.username}</p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2 text-sm opacity-80">
                <MapPin size={16} />
                <span>{user.district}</span>
              </div>
              <p className="text-sm mt-3 opacity-90 max-w-md">{user.bio}</p>
            </div>
          </div>

          <h3 className="font-semibold text-lg mb-3 px-1">Quick Actions</h3>

          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-colors
                  ${isDark ? "hover:bg-gray-700/60" : "hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="text-green-600 dark:text-green-400">{item.icon}</div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight size={18} className="opacity-50" />
              </button>
            ))}
          </div>

          <div className={`border-t my-6 ${isDark ? "border-gray-700" : "border-gray-200"}`}></div>

          <button
            onClick={handleLogout}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 
              text-white rounded-xl font-semibold flex items-center justify-center gap-2.5 shadow-md transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>

          <div className="text-center mt-6 text-xs opacity-60 font-mono">
            Citizen ID: {citizenId}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
