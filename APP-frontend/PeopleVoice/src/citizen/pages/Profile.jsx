import React, { useEffect, useState, useRef } from "react";
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
  Award,
  MessageCircle,
  Heart,
  TrendingUp,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useUserValues } from "../../Context/UserValuesContext";
import { useTheme } from "../../Context/ThemeContext";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 0.8 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (start === end) return;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{count}</span>;
};

const Profile = () => {
  const navigate = useNavigate();
  const userValues = useUserValues() || {};
  const { isDark } = useTheme();
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.9]);

  const citizenId = localStorage.getItem("citizenId");
  const [proofsCount, setProofsCount] = useState(0);
  const [loadingProofs, setLoadingProofs] = useState(true);
  const [stats, setStats] = useState({ issues: 0, likes: 0, comments: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!citizenId) {
      alert("Please login first");
      navigate("/peopleVoice/login");
    }
  }, [citizenId, navigate]);

  // Fetch proofs count and stats
  useEffect(() => {
    const fetchData = async () => {
      if (!citizenId) return;
      
      try {
        setLoadingProofs(true);
        setLoadingStats(true);
        
        // Fetch proofs
        const proofsRes = await axios.get(`${BACKEND_URL}/api/proofs?citizenId=${citizenId}`);
        const proofs = proofsRes.data.proofs || [];
        setProofsCount(proofs.length);
        localStorage.setItem("proofsCount", proofs.length);
        
        // Fetch user's issues stats
        const issuesRes = await axios.get(`${BACKEND_URL}/api/my-issues?citizenId=${citizenId}&limit=100`);
        const issues = issuesRes.data.issues || [];
        const totalLikes = issues.reduce((sum, issue) => sum + (issue.likes?.length || 0), 0);
        const totalComments = issues.reduce((sum, issue) => sum + (issue.comments?.length || 0), 0);
        setStats({
          issues: issues.length,
          likes: totalLikes,
          comments: totalComments,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        const cachedCount = parseInt(localStorage.getItem("proofsCount") || "0");
        setProofsCount(cachedCount);
      } finally {
        setLoadingProofs(false);
        setLoadingStats(false);
      }
    };

    fetchData();
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

  // Menu items with count badges
  const menuItems = [
    { label: "My Proofs", icon: <FolderCheck size={20} />, path: "/peopleVoice/proofspage", isNew: true, count: proofsCount, loading: loadingProofs, color: "emerald" },
    { label: "My Complaints", icon: <FileText size={20} />, path: "/peopleVoice/my-issues", color: "blue" },
    { label: "Saved Issues", icon: <Bookmark size={20} />, path: "/peopleVoice/saved", color: "purple" },
    { label: "Notifications", icon: <Bell size={20} />, path: "/peopleVoice/notifications", color: "amber", badge: 3 },
    { label: "Report New Issue", icon: <Edit size={20} />, path: "/peopleVoice/post-issue", color: "rose" },
    { label: "Settings", icon: <SettingsIcon size={20} />, path: "/peopleVoice/settings", color: "gray" },
    { label: "Privacy & Security", icon: <Shield size={20} />, path: "/peopleVoice/privacy", color: "gray" },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 300 } },
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    hover: { scale: 1.02, x: 5, transition: { type: "spring", stiffness: 400 } },
    tap: { scale: 0.98 },
  };

  const statCardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, delay: 0.2 } },
    hover: { y: -5, boxShadow: "0 20px 25px -12px rgba(0,0,0,0.2)" },
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen overflow-y-auto transition-colors duration-500 ${
        isDark ? "bg-gradient-to-br from-gray-950 to-black" : "bg-gradient-to-br from-gray-50 to-white"
      }`}
    >
      {/* Animated floating gradient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Sticky Header with parallax */}
      <motion.div
        style={{ opacity: headerOpacity }}
        className={`sticky top-0 z-30 backdrop-blur-xl border-b ${
          isDark ? "bg-black/60 border-gray-800" : "bg-white/60 border-gray-200"
        }`}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full transition-all ${
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-200"
            }`}
          >
            <ArrowLeft size={20} />
          </motion.button>
          <h1 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            My Profile
          </h1>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.05 }}
          className={`relative rounded-2xl shadow-2xl overflow-hidden mt-4 ${
            isDark ? "bg-gray-900/80 border border-gray-800" : "bg-white border border-gray-100"
          }`}
        >
          {/* Profile header with animated gradient border */}
          <div className="relative p-6 pb-4">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 animate-gradient-x" />
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar with pulse animation */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-emerald-500/20">
                  {firstLetter}
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"
                />
              </motion.div>

              <div className="text-center sm:text-left flex-1">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold flex items-center gap-2 justify-center sm:justify-start"
                >
                  {user.name}
                  <Sparkles size={16} className="text-emerald-500" />
                </motion.h2>
                <p className="text-sm opacity-70 mt-0.5">@{user.username}</p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-sm opacity-70"
                >
                  <MapPin size={16} className="text-emerald-500" />
                  <span>{user.district}</span>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-sm mt-3 opacity-80 leading-relaxed max-w-md"
                >
                  {user.bio}
                </motion.p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-2 px-6 pb-4"
          >
            {[
              { label: "Issues", value: stats.issues, icon: <FileText size={14} />, color: "blue" },
              { label: "Likes", value: stats.likes, icon: <Heart size={14} />, color: "rose" },
              { label: "Comments", value: stats.comments, icon: <MessageCircle size={14} />, color: "amber" },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                variants={statCardVariants}
                whileHover="hover"
                className={`rounded-xl p-3 text-center transition-all ${
                  isDark ? "bg-gray-800/50" : "bg-gray-50"
                }`}
              >
                <div className={`text-${stat.color}-500 flex justify-center mb-1`}>{stat.icon}</div>
                <p className="text-xl font-bold">
                  {loadingStats ? (
                    <div className="w-6 h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mx-auto" />
                  ) : (
                    <AnimatedCounter value={stat.value} duration={0.6} />
                  )}
                </p>
                <p className="text-[10px] uppercase tracking-wider opacity-60">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Menu Items Section */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider opacity-50">Menu</h3>
              <TrendingUp size={12} className="opacity-40" />
            </div>
            <div className="space-y-1">
              <AnimatePresence>
                {menuItems.map((item, idx) => (
                  <motion.button
                    key={item.label}
                    variants={menuItemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      isDark ? "hover:bg-gray-800/80" : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-${item.color || "emerald"}-500`}>{item.icon}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.label}</span>
                        {item.count !== undefined && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isDark
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {item.loading ? "..." : item.count}
                          </span>
                        )}
                        {item.badge && (
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                        {item.isNew && (
                          <span
                            className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                              isDark
                                ? "bg-emerald-900 text-emerald-300"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="opacity-40" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className={`border-t mx-4 ${isDark ? "border-gray-800" : "border-gray-200"}`} />

          {/* Logout Button with animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleLogout}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl font-semibold flex items-center justify-center gap-3 shadow-lg transition-all duration-200"
            >
              <LogOut size={18} />
              Logout
            </motion.button>
          </motion.div>

          {/* Footer */}
          <div className="text-center pb-4 text-[10px] opacity-40 font-mono">
            <p>Citizen ID: {citizenId.slice(0, 8)}...{citizenId.slice(-4)}</p>
            <p className="mt-1">PeopleVoice v2.0 • Citizen Connect</p>
          </div>
        </motion.div>
      </div>

      {/* Custom CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { transform: translateX(0%); }
          50% { transform: translateX(100%); }
        }
        .animate-gradient-x {
          background-size: 200% 100%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Profile;