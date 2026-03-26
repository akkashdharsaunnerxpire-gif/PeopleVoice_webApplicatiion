import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";
import { themeColors } from "../components/constants";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Notifications = () => {
  const { isDark } = useTheme();
  const theme = isDark ? themeColors.dark : themeColors.light;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

 const citizenId = localStorage.getItem("citizenId");

useEffect(() => {
  let mounted = true;

  async function load() {
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/notifications?citizenId=${citizenId}`
      );

     if (mounted) {
        setNotifications(res.data || []);
}
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  }

  if (!citizenId) return;

  load();

  const interval = setInterval(load, 15000);

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
  prev.map((n) => (n._id === id ? { ...n, read: true } : n))
);

    window.dispatchEvent(new CustomEvent("notification_update"));
  } catch (err) {
    console.error("Mark read error:", err);
  }
};




const handleNotificationClick = async (id, notification) => {
  if (!id) {
    console.error("Notification ID missing");
    return;
  }

  if (!notification.read) {
    await markAsRead(id);
  }

  navigate("/peopleVoice/my-issues");
};

  // Helper: safe image source
  const getImage = (n) =>
    n.issueId?.images_data?.[0] || n.image || "https://via.placeholder.com/150";

  const getAccent = (type, unread) => {
    if (!unread) return "text-gray-400";
    if (type === "success") return "text-green-500";
    if (type === "info") return "text-blue-500";
    if (type === "warning") return "text-yellow-500";
    return "text-gray-500";
  };

  return (
    <div className={`min-h-screen pb-20 ${theme.bg}`}>
      {/* Header */}
      <div
        className={`sticky top-0 z-10 backdrop-blur-md border-b px-4 py-3 ${theme.bg} ${theme.border}`}
      >
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-full">
            <Bell
              size={20}
              className="text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <h1 className={`text-xl font-semibold ${theme.text}`}>
            Notifications
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 pt-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-7 w-7 border-3 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <div
            className={`mt-16 text-center ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <Bell size={40} className="mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2.5 mt-2">
            {notifications.map((n) => {
              const unread = !n.read;
              const accent = getAccent(n.type, unread);
              const image = getImage(n);

              return (
                <motion.div
                 key={n._id}
                  whileHover={{ y: -2 }}
                  onClick={() => handleNotificationClick(n._id, n)}
                  className={`
                    cursor-pointer flex gap-3 p-3 rounded-xl border
                    transition-all duration-200 active:scale-[0.98]
                    ${
                      unread
                        ? `${theme.card} border-emerald-400/40 shadow-md`
                        : `${theme.card} opacity-80`
                    }
                    ${theme.border}
                  `}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 pt-0.5">
                    <div
                      className={`p-2 rounded-full ${
                        unread
                          ? "bg-emerald-100 dark:bg-emerald-950/50"
                          : "bg-gray-100 dark:bg-gray-800/60"
                      }`}
                    >
                      {n.type === "success" ? (
                        <CheckCircle2 size={18} className={accent} />
                      ) : n.type === "info" ? (
                        <Info size={18} className={accent} />
                      ) : (
                        <AlertCircle size={18} className={accent} />
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[15px] font-medium ${
                        unread ? theme.text : "text-gray-400"
                      }`}
                    >
                      {n.message}
                    </p>

                    {(n.location || n.issueId?.reason) && (
                      <p
                        className={`mt-1 text-xs ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        } truncate`}
                      >
                        {n.location ? `📍 ${n.location}` : n.issueId?.reason}
                      </p>
                    )}

                    {/* Status */}
                    <div className="mt-2 flex items-center gap-2.5 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
  n.status?.toLowerCase() === "resolved"
    ? "bg-green-100 text-green-700"
    : n.status?.toLowerCase() === "in-progress"
    ? "bg-yellow-100 text-yellow-700"
    : "bg-gray-200 text-gray-700"
}`}
                      >
                        {n.status || "Pending"}
                      </span>

                      <time className="text-gray-400">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </time>
                    </div>
                  </div>

                  {/* Right side: image + unread dot */}
                  <div className="flex flex-col items-end gap-1.5">
                    {image && (
                      <img
                        src={image}
                        alt=""
                        className="w-11 h-11 rounded-lg object-cover border border-gray-200 dark:border-gray-800"
                      />
                    )}

                    {unread && (
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-16" />
    </div>
  );
};

export default Notifications;