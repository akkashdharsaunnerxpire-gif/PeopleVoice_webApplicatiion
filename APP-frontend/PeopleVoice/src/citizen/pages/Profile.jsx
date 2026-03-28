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
    <div className={`min-h-screen pb-24 pt-6 px-4 transition-colors
      ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
      
      <div className="max-w-2xl mx-auto">
        <div
          className={`rounded-3xl shadow-xl p-6 sm:p-8 border transition-all
            ${isDark 
              ? "bg-gray-900 border-gray-800 text-gray-100" 
              : "bg-white border-gray-200 text-gray-900"}`}
        >
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {firstLetter}
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-bold">{user.name}</h2>
              <p className="text-sm opacity-75 mt-1">@{user.username}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 text-sm opacity-75">
                <MapPin size={18} />
                <span>{user.district}</span>
              </div>
              <p className="text-sm mt-4 opacity-90 leading-relaxed max-w-md">
                {user.bio}
              </p>
            </div>
          </div>

          <h3 className="font-semibold text-lg mb-4 px-1">Quick Actions</h3>

          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all
                  ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-emerald-500">{item.icon}</div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight size={20} className="opacity-40" />
              </button>
            ))}
          </div>

          <div className={`border-t my-8 ${isDark ? "border-gray-800" : "border-gray-200"}`} />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 
              text-white rounded-2xl font-semibold flex items-center justify-center gap-3 shadow-lg transition-all"
          >
            <LogOut size={22} />
            Logout
          </button>

          <div className="text-center mt-6 text-xs opacity-60 font-mono tracking-wider">
            Citizen ID: {citizenId}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;