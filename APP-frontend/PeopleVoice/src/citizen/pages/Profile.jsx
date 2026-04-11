import React, { useEffect, useState } from "react";
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
  FolderCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserValues } from "../../Context/UserValuesContext";
import { useTheme } from "../../Context/ThemeContext";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Profile = () => {
  const navigate = useNavigate();
  const userValues = useUserValues() || {};
  const { isDark } = useTheme();

  const citizenId = localStorage.getItem("citizenId");
  const [proofsCount, setProofsCount] = useState(0);
  const [loadingProofs, setLoadingProofs] = useState(true);

  useEffect(() => {
    if (!citizenId) {
      alert("Please login first");
      navigate("/peopleVoice/login");
    }
  }, [citizenId, navigate]);

  // Fetch proofs count from API
  useEffect(() => {
    const fetchProofsCount = async () => {
      if (!citizenId) return;
      
      try {
        setLoadingProofs(true);
        const res = await axios.get(`${BACKEND_URL}/api/proofs?citizenId=${citizenId}`);
        const count = res.data.proofs?.length || 0;
        setProofsCount(count);
        localStorage.setItem("proofsCount", count);
      } catch (err) {
        console.error("Error fetching proofs count:", err);
        // Fallback to localStorage
        const cachedCount = parseInt(localStorage.getItem("proofsCount") || "0");
        setProofsCount(cachedCount);
      } finally {
        setLoadingProofs(false);
      }
    };

    fetchProofsCount();
  }, [citizenId]);

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

  // Menu items with Proofs - showing count in brackets
  const menuItems = [
    { 
      label: "My Proofs", 
      icon: <FolderCheck size={20} />, 
      path: "/peopleVoice/proofspage", 
      isNew: true,
      count: proofsCount,
      loading: loadingProofs
    },
    { label: "Saved Issues", icon: <Bookmark size={20} />, path: "/peopleVoice/saved" },
    { label: "Notifications", icon: <Bell size={20} />, path: "/peopleVoice/notifications" },
    { label: "My Complaints", icon: <FileText size={20} />, path: "/peopleVoice/my-issues" },
    { label: "Report New Issue", icon: <Edit size={20} />, path: "/peopleVoice/post-issue" },
    { label: "Settings", icon: <SettingsIcon size={20} />, path: "/peopleVoice/settings" },
    { label: "Privacy & Security", icon: <Shield size={20} />, path: "/peopleVoice/privacy" },
  ];

  // Quick stats - using real proof count
  const resolvedCount = myIssues.filter(i => i.status?.toLowerCase() === "resolved").length;

  return (
    <div
      className={`min-h-screen py-4 px-3 transition-colors duration-300 ${
        isDark ? "bg-black/95" : "bg-gray-50"
      }`}
    >
      <div className="max-w-2xl mx-auto">
        <div
          className={`rounded-2xl shadow-xl p-4 sm:p-6 transition-all ${
            isDark
              ? "bg-gray-900/90 border border-gray-800 text-gray-100"
              : "bg-white border border-gray-200 text-gray-900"
          }`}
        >
          {/* Back Button */}
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

          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 mt-2">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {firstLetter}
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
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

          {/* Stats Cards - Shows real proof count */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className={`text-center p-3 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-gray-100"}`}>
              <p className="text-2xl font-bold">{myIssues.length}</p>
              <p className="text-xs opacity-70">Complaints</p>
            </div>
            <div className={`text-center p-3 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-gray-100"}`}>
              <p className="text-2xl font-bold">{proofsCount}</p>
              <p className="text-xs opacity-70">Proofs</p>
            </div>
            <div className={`text-center p-3 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-gray-100"}`}>
              <p className="text-2xl font-bold">{resolvedCount}</p>
              <p className="text-xs opacity-70">Resolved</p>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3 opacity-70 tracking-wide">
              QUICK ACTIONS
            </h3>
            <div className="space-y-1">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                    isDark ? "hover:bg-gray-800/70" : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-emerald-500">
                      {item.icon}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{item.label}</span>
                      {item.count !== undefined && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isDark 
                            ? "bg-gray-700 text-gray-300" 
                            : "bg-gray-200 text-gray-700"
                        }`}>
                          {item.loading ? "..." : item.count}
                        </span>
                      )}
                      {item.isNew && item.label === "My Proofs" && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          isDark ? "bg-emerald-900 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          NEW
                        </span>
                      )}
                    </div>
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

          {/* App Version */}
          <div className="text-center mt-3 text-[10px] opacity-30">
            PeopleVoice v2.0 • Citizen Connect
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;