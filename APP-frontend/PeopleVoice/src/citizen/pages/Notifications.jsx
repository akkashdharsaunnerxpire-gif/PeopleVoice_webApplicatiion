import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Notifications = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const citizenId = localStorage.getItem("citizenId");

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      if (!citizenId) return;

      try {
        const res = await axios.get(
          `${BACKEND_URL}/api/notifications?citizenId=${citizenId}`,
        );
        if (mounted) {
          setNotifications(res.data || []);
        }
      } catch (err) {
        console.error("Fetch notifications error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadNotifications();

    const interval = setInterval(loadNotifications, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [citizenId]);

  const markAsRead = async (id) => {
    if (!id) return;
    try {
      await axios.put(`${BACKEND_URL}/api/notifications/read/${id}`);

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );

      window.dispatchEvent(new CustomEvent("notification_update"));
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const handleNotificationClick = async (id, notification) => {
    if (!id) return;
    if (!notification.read) {
      await markAsRead(id);
    }
    navigate("/peopleVoice/my-issues");
  };

  // ✅ FIXED: use "images" not "images_data"
  const getImage = (n) =>
    n.issueId?.images?.[0] || n.image || "https://via.placeholder.com/150x150";

  return (
    <div
      className={`min-h-screen pb-20 ${isDark ? "bg-black/95" : "bg-gray-50"}`}
    >
      {/* Header */}
      <div
        className={`sticky top-0 z-10 backdrop-blur-md border-b px-4 py-3 
        ${isDark ? "bg-black/95 border-gray-800" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <div
            className={`p-1.5 rounded-full ${isDark ? "bg-emerald-950" : "bg-emerald-100"}`}
          >
            <Bell size={18} className="text-emerald-600" />
          </div>
          <h1
            className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Notifications
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 pt-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-5 w-5 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <div
            className={`mt-16 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            <Bell size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-base font-medium">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2 mt-1">
            {notifications.map((n) => {
              const unread = !n.read;
              const image = getImage(n);

              return (
                <motion.div
                  key={n._id}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleNotificationClick(n._id, n)}
                  className={`
  cursor-pointer flex gap-3 p-3 rounded-xl border transition-all active:scale-[0.97]

  ${
    unread
      ? isDark
        ? "bg-gray-900 border-emerald-500/40 shadow-md"
        : "bg-white border-emerald-300 shadow-md"
      : isDark
        ? "bg-gray-900/60 border-gray-800 opacity-70"
        : "bg-gray-100 border-gray-200 opacity-70"
  }

  hover:scale-[1.01]
`}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 pt-0.5">
                    <div
                      className={`p-2 rounded-full${unread 
  ? (isDark ? "text-white" : "text-gray-900") 
  : (isDark ? "text-gray-500 opacity-80" : "text-gray-400 opacity-80")
}`}
                    >
                      {n.status?.toLowerCase().includes("solved") ||
                      n.status?.toLowerCase().includes("resolved") ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : n.status?.toLowerCase().includes("progress") ? (
                        <Info size={16} className="text-blue-500" />
                      ) : (
                        <AlertCircle size={16} className="text-amber-500" />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-1">
                    {unread && (
  <span className="ml-2 text-[10px] px-2 py-0.5 bg-emerald-500 text-white rounded-full">
    NEW
  </span>
)}
                    <p
                      className={`text-[14px] leading-tight font-medium 
                      ${
                        unread
                          ? isDark
                            ? "text-white"
                            : "text-gray-900"
                          : isDark
                            ? "text-gray-400"
                            : "text-gray-600"
                      }`}
                    >
                      {n.message}
                    </p>

                    {n.location && (
                      <p
                        className={`mt-0.5 text-[12px] ${isDark ? "text-gray-400" : "text-gray-500"} truncate`}
                      >
                        📍 {n.location}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span
                        className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                          n.status?.toLowerCase() === "resolved" ||
                          n.status?.toLowerCase() === "solved"
                            ? isDark
                              ? "bg-green-900/60 text-green-400"
                              : "bg-green-100 text-green-700"
                            : n.status?.toLowerCase() === "in-progress"
                              ? isDark
                                ? "bg-amber-900/60 text-amber-400"
                                : "bg-amber-100 text-amber-700"
                              : isDark
                                ? "bg-gray-800 text-gray-400"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {n.status || "Pending"}
                      </span>

                      <span className="text-gray-400 text-[11.5px]">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Image + Unread Dot */}
                  <div className="flex flex-col items-end gap-0.5">
                    {image && (
                      <img
                        src={image}
                        alt="Issue"
                        className={`w-9 h-9 rounded-lg object-cover border 
                          ${isDark ? "border-gray-700" : "border-gray-200"}`}
                      />
                    )}

                    {unread && (
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-14" />
    </div>
  );
};

export default Notifications;
