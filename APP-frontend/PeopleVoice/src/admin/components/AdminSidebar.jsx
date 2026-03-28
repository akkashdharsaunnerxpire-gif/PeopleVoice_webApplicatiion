import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  ShieldCheck,
  LogOut,
  Users,
  BarChart3
} from "lucide-react";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/admin/issues`;

const links = [
  { name: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { name: "All Issues", to: "/admin/dashboard/issues", icon: ClipboardList },
  { name: "Analytics", to: "/admin/dashboard/analytics", icon: BarChart3 },
  { name: "Departments", to: "/admin/dashboard/departments", icon: Users },
  { name: "Settings", to: "/admin/dashboard/settings", icon: Settings },
];

const POLLING_INTERVAL = 30000;

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
          limit: 1000 
        },
      });

      const allIssues = res.data.issues || [];
      const pendingIssues = allIssues.filter(
        (issue) =>
          issue.status !== "solved" &&
          issue.status !== "Closed" &&
          issue.status !== "Resolved"
      );

      if (isMounted.current) {
        setPendingIssuesCount(pendingIssues.length);
      }
    } catch (err) {
      console.error("Failed to fetch pending issues count", err);
      if (isMounted.current) setPendingIssuesCount(0);
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
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: -20, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <ShieldCheck className="text-emerald-600" size={32} />
          </motion.div>
          <div>
            <h1 className="font-bold text-xl text-gray-900 tracking-tight">
              Tamil Nadu
            </h1>
            <p className="text-xs text-gray-500 -mt-1">GovPanel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {links.map(({ name, to, icon: Icon }) => (
          <NavLink
            key={name}
            to={to}
            end={to === "/admin/dashboard"}
            className={({ isActive }) =>
              `group relative flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "text-emerald-700 bg-emerald-50"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-emerald-50 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}

                <div className="flex items-center gap-3">
                  <Icon
                    size={20}
                    className={`transition-transform group-hover:scale-110 ${
                      isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"
                    }`}
                  />
                  <span className="relative z-10">{name}</span>
                </div>

                {/* Notification Badge for All Issues */}
                {name === "All Issues" && pendingIssuesCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow ${
                      isActive ? "bg-red-600 text-white" : "bg-red-500 text-white"
                    }`}
                  >
                    {pendingIssuesCount > 99 ? "99+" : pendingIssuesCount}
                  </motion.span>
                )}

                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 text-sm font-medium"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;