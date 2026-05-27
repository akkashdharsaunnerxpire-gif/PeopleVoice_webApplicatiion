import React, { useEffect, useState, useRef, useCallback } from "react";
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
  ChevronLeft,
  Bookmark,
  FileCheck,
  ArrowUp,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useTheme } from "../../Context/ThemeContext";
import { themeColors } from "../components/constants";

// ---------- Constants ----------
const BASE = "/peopleVoice";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const SCROLL_THRESHOLD = 20;
const THROTTLE_DELAY = 50;

// ---------- Breakpoint Hook ----------
const useBreakpoint = () => {
  const [breakpoints, setBreakpoints] = useState({
    isMobile: false,
    isDesktop: false,
    isLargeDesktop: false,
  });

  useEffect(() => {
    const mediaQueries = {
      isMobile: window.matchMedia("(max-width: 767px)"),
      isDesktop: window.matchMedia("(min-width: 768px)"),
      isLargeDesktop: window.matchMedia("(min-width: 1280px)"),
    };
    const update = () => {
      setBreakpoints({
        isMobile: mediaQueries.isMobile.matches,
        isDesktop: mediaQueries.isDesktop.matches,
        isLargeDesktop: mediaQueries.isLargeDesktop.matches,
      });
    };
    update();
    const listeners = Object.values(mediaQueries).map((mq) => {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    });
    return () => listeners.forEach((cleanup) => cleanup());
  }, []);

  return breakpoints;
};

// ---------- Click Outside ----------
const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};

// ---------- Throttle with RAF ----------
const useThrottle = (fn, delay) => {
  const lastRun = useRef(0);
  const rafId = useRef(null);
  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        fn(...args);
        lastRun.current = now;
      });
    }
  }, [fn, delay]);
};

// ---------- Desktop Nav Item ----------
const DesktopNavItem = ({ icon: Icon, activeIcon: ActiveIcon, label, to, isActive, isMini, badge, hasNew }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const FinalIcon = isActive && ActiveIcon ? ActiveIcon : Icon;

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => navigate(`${BASE}${to}`)}
      className={`relative flex items-center w-full rounded-xl transition-all duration-200 group
        ${isMini ? "justify-center px-0 py-3" : "gap-4 px-4 py-3"}
        ${isActive 
          ? "bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 font-semibold" 
          : isDark ? "text-gray-400 hover:bg-white/5" : "text-gray-600 hover:bg-gray-50"
        }`}
      aria-label={`Navigate to ${label}`}
    >
      {isActive && (
        <motion.div
          layoutId="activeDesktopIndicator"
          className="absolute inset-0 rounded-xl bg-green-500/10 dark:bg-green-500/20 -z-0"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <div className="relative z-10 flex items-center gap-4">
        <FinalIcon className={`w-5 h-5 ${isActive ? "stroke-current" : ""}`} />
        {!isMini && <span className="text-sm font-medium">{label}</span>}
      </div>
      {!isMini && badge > 0 && (
        <span className="absolute right-4 min-w-[20px] h-[20px] text-[10px] bg-red-500 text-white font-bold rounded-full flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      {!isMini && hasNew && (
        <span className="absolute right-4 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">
          NEW
        </span>
      )}
      {isMini && (badge > 0 || hasNew) && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
      {isMini && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 tooltip">
          {label}
          {badge > 0 && ` (${badge})`}
          {hasNew && " · New"}
        </div>
      )}
    </motion.button>
  );
};

// ---------- Mobile Nav Item (smaller icons: w-6 h-6) ----------
const MobileNavItem = ({ icon: Icon, activeIcon: ActiveIcon, label, to, isActive, badge, hasNew }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const FinalIcon = isActive && ActiveIcon ? ActiveIcon : Icon;

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate(`${BASE}${to}`)}
      className="relative flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all"
      aria-label={label}
    >
      <div className="relative">
        <FinalIcon
          className={`w-6 h-6 transition-colors ${
            isActive
              ? isDark ? "text-green-400" : "text-green-600"
              : isDark ? "text-gray-400" : "text-gray-500"
          }`}
        />
        {badge > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
        {hasNew && !badge && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
        )}
        {isActive && (
          <motion.div
            layoutId="activeMobileIndicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </div>
      <span
        className={`text-[10px] mt-1 font-medium ${
          isActive
            ? isDark ? "text-green-400" : "text-green-600"
            : isDark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </motion.button>
  );
};

// ---------- Main Navigation ----------
const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);

  const [activeNav, setActiveNav] = useState("home");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [hasNewProof, setHasNewProof] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const lastScrollY = useRef(0);
  const scrollLock = useRef(false);
  const { isDark, toggleDarkMode } = useTheme();
  const { isDesktop, isLargeDesktop } = useBreakpoint();

  // Auto-collapse sidebar
  useEffect(() => {
    if (isDesktop && !isLargeDesktop) setIsSidebarCollapsed(true);
    else if (isDesktop && isLargeDesktop) setIsSidebarCollapsed(false);
  }, [isDesktop, isLargeDesktop]);

  // New proof indicator
  useEffect(() => {
    const checkNew = () => setHasNewProof(localStorage.getItem("hasNewProof") === "true");
    checkNew();
    window.addEventListener("proof_update", checkNew);
    return () => window.removeEventListener("proof_update", checkNew);
  }, []);

  // Fetch unread notifications
  const fetchUnreadCount = useCallback(async () => {
    const citizenId = localStorage.getItem("citizenId");
    if (!citizenId) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/notifications?citizenId=${citizenId}`);
      const unread = (res.data || []).filter((n) => n.read === false).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  // Polling + visibility
  useEffect(() => {
    let interval;
    const startPolling = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        if (document.visibilityState === "visible") fetchUnreadCount();
      }, 30000);
    };
    startPolling();
    const visibilityHandler = () => {
      if (document.visibilityState === "visible") fetchUnreadCount();
    };
    document.addEventListener("visibilitychange", visibilityHandler);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, [fetchUnreadCount]);

  // Custom events
  useEffect(() => {
    const handleCustomUpdate = (event) => {
      const type = event.detail?.type;
      if (type === "DECREMENT") setUnreadCount((prev) => Math.max(0, prev - 1));
      else if (type === "RESET") setUnreadCount(0);
      else if (type === "NEW") setUnreadCount((prev) => prev + 1);
      else fetchUnreadCount();
    };
    window.addEventListener("notification_update", handleCustomUpdate);
    return () => window.removeEventListener("notification_update", handleCustomUpdate);
  }, [fetchUnreadCount]);

  // Scroll handler
  const handleScroll = useThrottle(() => {
    if (scrollLock.current) return;
    const current = window.scrollY;
    const delta = current - lastScrollY.current;
    if (Math.abs(delta) < 5) return;
    if (delta > 0 && current > SCROLL_THRESHOLD) {
      setShowBottomNav(false);
      scrollLock.current = true;
      setTimeout(() => { scrollLock.current = false; }, 200);
    } else if (delta < 0) {
      setShowBottomNav(true);
    }
    setShowScrollTop(current > 300);
    lastScrollY.current = current;
  }, THROTTLE_DELAY);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Active route
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith(`${BASE}/feed`)) setActiveNav("home");
    else if (path.startsWith(`${BASE}/my-issues`)) setActiveNav("myissues");
    else if (path.startsWith(`${BASE}/post-issue`)) setActiveNav("post");
    else if (path.startsWith(`${BASE}/notifications`)) setActiveNav("notifications");
    else if (path.startsWith(`${BASE}/profile`)) setActiveNav("profile");
    else if (path.startsWith(`${BASE}/proofspage`)) setActiveNav("complaintproofs");
    setShowMoreMenu(false);
  }, [location.pathname]);

  useClickOutside(menuRef, () => setShowMoreMenu(false));
  useEffect(() => {
    const onEsc = (e) => { if (e.key === "Escape") setShowMoreMenu(false); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate(`${BASE}/login`);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Desktop nav items
  const navItems = [
    { id: "home", icon: LayoutGrid, label: "Home Feed", to: "/feed" },
    { id: "myissues", icon: FileText, label: "My Issues", to: "/my-issues" },
    { id: "complaintproofs", icon: FileCheck, label: "Complaint Proofs", to: "/proofspage", hasNew: hasNewProof },
    { id: "post", icon: PlusCircle, label: "Post Issue", to: "/post-issue" },
    { id: "notifications", icon: Bell, activeIcon: BellDot, label: "Notifications", to: "/notifications", badge: unreadCount },
    { id: "profile", icon: UserCircle, label: "Profile", to: "/profile" },
  ];

  // Mobile bottom nav – 4 core items
  const mobileCoreItems = [
    { id: "home", icon: LayoutGrid, label: "Home", to: "/feed" },
    { id: "myissues", icon: FileText, label: "Issues", to: "/my-issues" },
    { id: "notifications", icon: Bell, activeIcon: BellDot, label: "Alerts", to: "/notifications", badge: unreadCount },
    { id: "profile", icon: UserCircle, label: "Profile", to: "/profile" },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className={`hidden md:flex fixed top-0 left-0 z-40 h-screen flex-col border-r shadow-xl transition-all duration-300
          ${isSidebarCollapsed ? "w-20" : "w-72"}
          ${isDark ? themeColors.dark.bg + " " + themeColors.dark.border : themeColors.light.card + " " + themeColors.light.border}`}
      >
        {/* Logo + Toggle */}
        <div className={`p-4 border-b ${isDark ? "border-white/10" : "border-gray-200"} flex items-center justify-between`}>
          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <h1 className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  PeopleVoice
                </h1>
                <p className={`text-[9px] font-black uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Citizen Connect
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1" role="navigation" aria-label="Main menu">
          {navItems.map((item) => (
            <DesktopNavItem
              key={item.id}
              icon={item.icon}
              activeIcon={item.activeIcon}
              label={item.label}
              to={item.to}
              isActive={activeNav === item.id}
              isMini={isSidebarCollapsed}
              badge={item.badge}
              hasNew={item.hasNew}
            />
          ))}
        </nav>

        {/* More Options (Desktop) */}
        <div className={`p-3 border-t ${isDark ? "border-white/10" : "border-gray-200"} relative`} ref={menuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex items-center w-full rounded-xl transition-colors
              ${isSidebarCollapsed ? "justify-center px-0 py-3" : "gap-4 px-4 py-3"}
              ${isDark ? "text-white hover:bg-white/10" : "text-gray-800 hover:bg-gray-100"}`}
            aria-label="More options menu"
          >
            <Menu className="w-5 h-5" />
            {!isSidebarCollapsed && (
              <>
                <span className="text-sm font-bold flex-1 text-left">More Options</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${showMoreMenu ? "rotate-90" : ""}`} />
              </>
            )}
          </button>
          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`absolute bottom-full left-0 right-0 mb-2 rounded-xl shadow-2xl border overflow-hidden z-50
                  ${isDark ? "bg-gray-900 border-white/10 text-white" : "bg-white border-gray-200 text-gray-800"}`}
              >
                <button onClick={() => navigate(`${BASE}/saved`)} className={`flex items-center gap-3 w-full px-4 py-3 ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}>
                  <Bookmark className="w-5 h-5 text-green-500" /> <span>Saved Items</span>
                </button>
                <button onClick={toggleDarkMode} className={`flex items-center gap-3 w-full px-4 py-3 ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}>
                  {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-purple-600" />}
                  <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
                </button>
                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-900/20 dark:hover:bg-red-900/30">
                  <LogOut className="w-5 h-5" /> <span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden border-t shadow-lg backdrop-blur-xl transition-transform duration-300
          ${isDark ? "bg-gray-900/95 border-gray-800" : "bg-white/95 border-gray-200"}`}
        style={{
          transform: showBottomNav ? "translateY(0)" : "translateY(100%)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around px-2 py-1">
          {/* Left: Home + Issues */}
          {mobileCoreItems.slice(0, 2).map((item) => (
            <MobileNavItem
              key={item.id}
              icon={item.icon}
              activeIcon={item.activeIcon}
              label={item.label}
              to={item.to}
              isActive={activeNav === item.id}
              badge={item.badge}
              hasNew={item.hasNew}
            />
          ))}

          {/* Center: Post FAB (smaller icon) */}
          <div className="relative flex flex-col items-center justify-center flex-1 -mt-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(`${BASE}/post-issue`)}
              className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full p-3 shadow-xl border-4 border-white dark:border-gray-900 transition-all duration-200 hover:shadow-2xl"
              aria-label="Post new issue"
            >
              <PlusCircle size={24} />
            </motion.button>
            <span className={`text-[10px] mt-1 font-medium ${
              activeNav === "post" 
                ? (isDark ? "text-green-400" : "text-green-600") 
                : (isDark ? "text-gray-400" : "text-gray-500")
            }`}>
              Post
            </span>
          </div>

          {/* Right: Alerts + Profile */}
          {mobileCoreItems.slice(2, 4).map((item) => (
            <MobileNavItem
              key={item.id}
              icon={item.icon}
              activeIcon={item.activeIcon}
              label={item.label}
              to={item.to}
              isActive={activeNav === item.id}
              badge={item.badge}
              hasNew={item.hasNew}
            />
          ))}
        </div>
      </nav>

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className={`fixed bottom-20 right-4 z-40 p-3 rounded-full shadow-lg backdrop-blur-md
              md:bottom-8 md:right-8
              ${isDark ? "bg-gray-800/80 text-white hover:bg-gray-700" : "bg-white/80 text-gray-800 hover:bg-gray-100"}`}
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <style>{`
        .tooltip {
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
        }
        @media (max-width: 1280px) {
          .group:hover .tooltip {
            left: auto;
            right: 100%;
            margin-left: 0;
            margin-right: 8px;
          }
        }
      `}</style>
    </>
  );
};

export default React.memo(Navigation);