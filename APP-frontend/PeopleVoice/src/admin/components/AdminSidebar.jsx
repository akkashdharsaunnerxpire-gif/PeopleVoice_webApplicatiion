import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
} from "lucide-react";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/admin/issues`;

const links = [
  { name: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { name: "All Issues", to: "/admin/dashboard/issues", icon: ClipboardList },
  { name: "Analytics", to: "/admin/dashboard/analytics", icon: BarChart3 },
  { name: "Departments", to: "/admin/dashboard/departments", icon: Users },
  { name: "Settings", to: "/admin/dashboard/settings", icon: Settings },
];

const POLLING_INTERVAL = 30000; // 30 seconds

const AdminSidebar = () => {
  const navigate = useNavigate();
  const adminDistrict = localStorage.getItem("adminDistrict");
  const [pendingIssuesCount, setPendingIssuesCount] = useState(0);
  const isMounted = useRef(true);

  const fetchPendingIssuesCount = async () => {
    if (!adminDistrict) return;
    try {
      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        params: { 
          district: adminDistrict, 
          limit: 1000 // Get more issues to count properly
        },
      });
      
      // Filter out closed/resolved issues
      const allIssues = res.data.issues || [];
      const pendingIssues = allIssues.filter(
        issue => issue.status !== "solved" && 
                 issue.status !== "Closed" && 
                 issue.status !== "Resolved"
      );
      
      if (isMounted.current) {
        setPendingIssuesCount(pendingIssues.length);
      }
    } catch (err) {
      console.error("Failed to fetch pending issues count", err);
      if (isMounted.current) {
        setPendingIssuesCount(0);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchPendingIssuesCount();

    const intervalId = setInterval(fetchPendingIssuesCount, POLLING_INTERVAL);

    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
    };
  }, [adminDistrict]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  return (
    <aside className="w-64 h-screen bg-slate-50 border-r border-gray-200 flex flex-col font-sans">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-8 border-b border-gray-200 bg-white">
        <motion.div
          initial={{ rotate: -20, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <ShieldCheck className="text-emerald-600 mr-3" size={28} />
        </motion.div>
        <h1 className="font-bold text-gray-800 tracking-tight text-lg">
          Tamil Nadu GovPanel
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {links.map(({ name, to, icon: Icon }) => (
          <NavLink
            key={name}
            to={to}
            end={to === "/admin/dashboard"}
            className={({ isActive }) =>
              `relative flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-emerald-100/80 rounded-xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Left side: Icon + Name */}
                <div className="flex items-center gap-3">
                  <Icon
                    size={20}
                    className={`transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"
                    }`}
                  />
                  <span className="relative z-10">{name}</span>
                </div>

                {/* Pending issues count (excluding closed/resolved) */}
                {name === "All Issues" && pendingIssuesCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className={`flex h-6 w-auto min-w-[24px] items-center justify-center rounded-full px-2 text-[11px] font-black border border-white shadow-lg ${
                      isActive 
                        ? 'bg-red-600 text-white animate-pulse' // Pulsing on active tab
                        : 'bg-red-500 text-white' // Changed to red even when inactive for better visibility
                    }`}
                  >
                    {pendingIssuesCount > 99 ? "99+" : pendingIssuesCount}
                  </motion.span>
                )}

                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t bg-white/50">
        <button
          className="flex items-center gap-3 w-full px-4 py-2 text-slate-500 hover:text-red-600 transition-colors text-sm font-medium"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;