import React, { useEffect, useState, useRef } from "react";
import {
  LayoutGrid,
  FileText,
  PlusCircle,
  Bell,
  BellDot,
  UserCircle,
  Menu,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  Bookmark,
  FileCheck,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useTheme } from "../../Context/ThemeContext";
import { themeColors } from "../components/constants";

const BASE = "/peopleVoice";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  const [activeNav, setActiveNav] = useState("home");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBottomNav, setShowBottomNav] = useState(true);

  const lastScrollY = useRef(0);
  const { isDark, toggleDarkMode } = useTheme();
  const [hasNewProof, setHasNewProof] = useState(false);

  useEffect(() => {
    const checkNew = () => {
      const isNew = localStorage.getItem("hasNewProof") === "true";
      setHasNewProof(isNew);
    };

    checkNew();

    window.addEventListener("proof_update", checkNew);
    return () => window.removeEventListener("proof_update", checkNew);
  }, []);

  // fetch unread count
  const fetchUnreadCount = async () => {
    const citizenId = localStorage.getItem("citizenId");
    if (!citizenId) return;

    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/notifications?citizenId=${citizenId}`,
      );
      const unread = (res.data || []).filter((n) => n.read === false).length;
      setUnreadCount(unread);
    } catch (err) {
      console.log(err);
    }
  };

  // initial + polling
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // custom event listener
  useEffect(() => {
    const handleUpdate = () => fetchUnreadCount();
    window.addEventListener("notification_update", handleUpdate);
    return () =>
      window.removeEventListener("notification_update", handleUpdate);
  }, []);

  // scroll hide/show nav (only for bottom nav)
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > lastScrollY.current && current > 10) {
        setShowBottomNav(false);
      } else {
        setShowBottomNav(true);
      }
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // active nav
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith(`${BASE}/feed`)) setActiveNav("home");
    else if (path.startsWith(`${BASE}/my-issues`)) setActiveNav("myissues");
    else if (path.startsWith(`${BASE}/post-issue`)) setActiveNav("post");
    else if (path.startsWith(`${BASE}/notifications`))
      setActiveNav("notifications");
    else if (path.startsWith(`${BASE}/profile`)) setActiveNav("profile");
    else if (path.startsWith(`${BASE}/proofspage`))
      setActiveNav("complaintproofs");
    setShowMoreMenu(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate(`${BASE}/login`);
  };

  const NavItem = ({
    icon: Icon,
    activeIcon: ActiveIcon,
    label,
    to,
    nav,
    badge = 0,
    isMobile = false,
  }) => {
    const isActive = activeNav === nav;
    const FinalIcon = isActive && ActiveIcon ? ActiveIcon : Icon;

    if (isMobile) {
      return (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (location.pathname !== `${BASE}${to}`) {
              navigate(`${BASE}${to}`, { replace: true });
            }
          }}
          className={`relative inline-flex items-center justify-center p-1 rounded-full transition-colors ${
            isActive
              ? isDark
                ? "text-green-400"
                : "text-green-600"
              : isDark
                ? "text-gray-400"
                : "text-gray-500"
          }`}
        >
          <FinalIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          {badge > 0 && (
            <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </motion.button>
      );
    }

    // Desktop / Tablet version (sidebar)
    return (
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate(`${BASE}${to}`)}
        className={`relative flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all ${
          isActive
            ? "bg-green-500/10 text-green-600 font-bold dark:bg-green-500/20 dark:text-green-400"
            : isDark
              ? "text-gray-400 hover:bg-white/5"
              : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        <FinalIcon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
        {badge > 0 && (
          <span className="absolute right-4 min-w-[20px] h-[20px] text-[10px] bg-red-500 text-white font-bold rounded-full flex items-center justify-center">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </motion.button>
    );
  };

  return (
    <>
      {/* DESKTOP / TABLET SIDEBAR – visible from md breakpoint (≥768px) */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className={`hidden md:flex fixed top-0 left-0 z-40 h-screen w-72 flex-col border-r shadow-xl
          ${
            isDark
              ? themeColors.dark.bg + " " + themeColors.dark.border
              : themeColors.light.card + " " + themeColors.light.border
          }`}
      >
        {/* Logo */}
        <div
          className={`p-6 border-b ${
            isDark ? "border-white/10" : "border-gray-200"
          }`}
        >
          <h1 className="text-3xl font-black italic tracking-tighter bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            PeopleVoice
          </h1>
          <p
            className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Citizen Connect
          </p>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <NavItem icon={LayoutGrid} label="Home Feed" to="/feed" nav="home" />
          <NavItem
            icon={FileText}
            label="My Issues"
            to="/my-issues"
            nav="myissues"
          />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`${BASE}/proofspage`)}
            className={`relative flex items-center gap-4 w-full px-4 py-3 rounded-xl ${
              activeNav === "complaintproofs"
                ? "bg-green-500/10 text-green-600 font-bold"
                : "text-gray-600"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm font-medium">Complaint Proofs</span>

            {hasNewProof && (
              <span className="absolute right-4 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                NEW
              </span>
            )}
          </motion.button>
          <NavItem
            icon={PlusCircle}
            label="Post Issue"
            to="/post-issue"
            nav="post"
          />
          <NavItem
            icon={Bell}
            activeIcon={BellDot}
            label="Notifications"
            to="/notifications"
            nav="notifications"
            badge={unreadCount}
          />
          <NavItem
            icon={UserCircle}
            label="Profile"
            to="/profile"
            nav="profile"
          />
        </nav>

        {/* More Options */}
        <div
          className={`p-4 border-t ${
            isDark ? "border-white/10" : "border-gray-200"
          } relative`}
          ref={menuRef}
        >
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-colors
              ${
                isDark
                  ? "text-white hover:bg-white/10"
                  : "text-gray-800 hover:bg-gray-100"
              }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-sm font-bold flex-1 text-left">
              More Options
            </span>
            <ChevronRight
              className={`w-4 h-4 transition-transform ${
                showMoreMenu ? "rotate-90" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`absolute bottom-full left-4 right-4 mb-2 rounded-xl shadow-2xl border overflow-hidden
                  ${
                    isDark
                      ? "bg-gray-900 border-white/10 text-white"
                      : "bg-white border-gray-200 text-gray-800"
                  }`}
              >
                <button
                  onClick={() => navigate(`${BASE}/saved`)}
                  className={`flex items-center gap-3 w-full px-4 py-3 transition-colors
                    ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                >
                  <Bookmark className="w-5 h-5 text-green-500" />
                  <span>Saved Items</span>
                </button>

                <button
                  onClick={toggleDarkMode}
                  className={`flex items-center gap-3 w-full px-4 py-3 transition-colors
                    ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                >
                  {isDark ? (
                    <Sun className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-purple-600" />
                  )}
                  <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* ========== IMPROVED MOBILE BOTTOM NAVIGATION ========== */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden
          border-t shadow-lg backdrop-blur-xl transition-transform duration-300
          ${isDark ? "bg-gray-900/95 border-gray-800" : "bg-white/95 border-gray-200"}
          pb-safe`}
        style={{
          transform: showBottomNav ? "translateY(0)" : "translateY(100%)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-center justify-around px-2 py-1">
          {/* Home */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`${BASE}/feed`, { replace: true })}
            className="relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all"
          >
            <div className="relative">
              <LayoutGrid
                className={`w-6 h-6 transition-colors ${
                  activeNav === "home"
                    ? isDark
                      ? "text-green-400"
                      : "text-green-600"
                    : isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                }`}
              />
              {activeNav === "home" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </div>
            <span
              className={`text-[10px] mt-1 font-medium ${
                activeNav === "home"
                  ? isDark
                    ? "text-green-400"
                    : "text-green-600"
                  : isDark
                    ? "text-gray-400"
                    : "text-gray-500"
              }`}
            >
              Home
            </span>
          </motion.button>

          {/* My Issues */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`${BASE}/my-issues`)}
            className="relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all"
          >
            <div className="relative">
              <FileText
                className={`w-6 h-6 transition-colors ${
                  activeNav === "myissues"
                    ? isDark
                      ? "text-green-400"
                      : "text-green-600"
                    : isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                }`}
              />
              {activeNav === "myissues" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </div>
            <span
              className={`text-[10px] mt-1 font-medium ${
                activeNav === "myissues"
                  ? isDark
                    ? "text-green-400"
                    : "text-green-600"
                  : isDark
                    ? "text-gray-400"
                    : "text-gray-500"
              }`}
            >
              My Issues
            </span>
          </motion.button>

          {/* Post (Floating Action Button style) */}
          <div className="relative flex flex-col items-center justify-center flex-1 -mt-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(`${BASE}/post-issue`)}
              className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full p-3.5 shadow-xl border-4 border-white dark:border-gray-900 transition-all duration-200 hover:shadow-2xl"
            >
              <PlusCircle size={24} />
            </motion.button>
            <span
              className={`text-[10px] mt-1 font-medium ${
                activeNav === "post"
                  ? isDark
                    ? "text-green-400"
                    : "text-green-600"
                  : isDark
                    ? "text-gray-400"
                    : "text-gray-500"
              }`}
            >
              Post
            </span>
          </div>

          {/* Proofs (with NEW badge) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`${BASE}/proofspage`)}
            className="relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all"
          >
            <div className="relative">
              <FileCheck
                className={`w-6 h-6 transition-colors ${
                  activeNav === "complaintproofs"
                    ? isDark
                      ? "text-green-400"
                      : "text-green-600"
                    : isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                }`}
              />
              {hasNewProof && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                  NEW
                </span>
              )}
              {activeNav === "complaintproofs" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </div>
            <span
              className={`text-[10px] mt-1 font-medium ${
                activeNav === "complaintproofs"
                  ? isDark
                    ? "text-green-400"
                    : "text-green-600"
                  : isDark
                    ? "text-gray-400"
                    : "text-gray-500"
              }`}
            >
              Proofs
            </span>
          </motion.button>

          {/* Profile */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`${BASE}/profile`)}
            className="relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all"
          >
            <div className="relative">
              <UserCircle
                className={`w-6 h-6 transition-colors ${
                  activeNav === "profile"
                    ? isDark
                      ? "text-green-400"
                      : "text-green-600"
                    : isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                }`}
              />
              {activeNav === "profile" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </div>
            <span
              className={`text-[10px] mt-1 font-medium ${
                activeNav === "profile"
                  ? isDark
                    ? "text-green-400"
                    : "text-green-600"
                  : isDark
                    ? "text-gray-400"
                    : "text-gray-500"
              }`}
            >
              Profile
            </span>
          </motion.button>
        </div>
      </nav>
    </>
  );
};

export default React.memo(Navigation);
