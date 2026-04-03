import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Bell, CheckCircle2, Info, AlertCircle, Eye, 
  Clock, MapPin, ChevronRight, Volume2, VolumeX
} from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Notifications = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newNotificationCount, setNewNotificationCount] = useState(0);

  const pollingInterval = useRef(null);
  const lastNotificationIds = useRef(new Set());

  const citizenId = localStorage.getItem("citizenId");

  /* ================= SOUND ================= */
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {}
  }, [soundEnabled]);

  /* ================= BROWSER NOTIFICATION ================= */
  const showBrowserNotification = useCallback((title, body) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/logo.png" });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  /* ================= LOAD NOTIFICATIONS ================= */
  const loadNotifications = useCallback(async () => {
    if (!citizenId) return;

    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/notifications?citizenId=${citizenId}`
      );

      const newData = res.data || [];

      const currentIds = lastNotificationIds.current;
      const freshNew = newData.filter(n => !currentIds.has(n._id));

      if (freshNew.length > 0 && currentIds.size > 0) {
        setNewNotificationCount(prev => prev + freshNew.length);
        playNotificationSound();

        freshNew.forEach(n => {
          showBrowserNotification("New Update", n.message);
        });
      }

      lastNotificationIds.current = new Set(newData.map(n => n._id));
      setNotifications(newData);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  }, [citizenId, playNotificationSound, showBrowserNotification]);

  /* ================= INITIAL LOAD + POLLING ================= */
  useEffect(() => {
    loadNotifications();

    pollingInterval.current = setInterval(() => {
      loadNotifications();
    }, 15000);

    return () => {
      clearInterval(pollingInterval.current);
    };
  }, []);

  /* ================= REQUEST PERMISSION ================= */
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ================= MARK AS READ ================= */
  const markAsRead = async (id) => {
    if (!id) return;
    try {
      await axios.put(`${BACKEND_URL}/api/notifications/read/${id}`);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  /* ================= MARK ALL ================= */
  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => markAsRead(n._id)));
    setNewNotificationCount(0);
  };

  /* ================= CLICK ================= */
  const handleNotificationClick = async (id, notification) => {
    if (!notification.read) {
      await markAsRead(id);
    }
    navigate("/peopleVoice/my-issues");
  };

  /* ================= HELPERS ================= */
  const getImage = (n) => n.issueId?.images_data?.[0] || n.image || null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const diff = Date.now() - date;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("solved") || statusLower.includes("resolved")) {
      return { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" };
    }
    if (statusLower.includes("progress")) {
      return { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" };
    }
    if (statusLower.includes("viewed")) {
      return { icon: Eye, color: "text-purple-500", bg: "bg-purple-500/10" };
    }
    return { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" };
  };

  const truncateText = (text, maxLength = 70) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen pb-20 ${isDark ? "bg-black" : "bg-gray-50"}`}>
      
      {/* Floating New Notification Badge */}
      <AnimatePresence>
        {newNotificationCount > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-8 right-4 z-50"
          >
            <button
              onClick={() => {
                setNewNotificationCount(0);
                loadNotifications();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg ${
                isDark ? "bg-emerald-600 text-white" : "bg-emerald-500 text-white"
              }`}
            >
              <Bell size={14} />
              <span className="text-xs font-medium">{newNotificationCount} new</span>
              <ChevronRight size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className={`sticky top-0 z-20 backdrop-blur-xl border-b ${
        isDark ? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-100"
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className={`relative p-1.5 lg:p-2 rounded-full ${isDark ? "bg-emerald-950" : "bg-emerald-100"}`}>
                <Bell size={18} className="lg:w-5 lg:h-5 text-emerald-500" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 lg:w-4 lg:h-4 bg-red-500 text-white text-[8px] lg:text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </div>
              <div>
                <h1 className={`text-base lg:text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  Notifications
                </h1>
                <p className={`text-[10px] lg:text-xs ${isDark ? "text-gray-400" : "text-gray-500"} hidden sm:block`}>
                  Stay updated with your issue status
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 lg:gap-2">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 lg:p-2 rounded-full transition-colors ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                }`}
              >
                {soundEnabled ? (
                  <Volume2 size={16} className="lg:w-4 lg:h-4 text-gray-500" />
                ) : (
                  <VolumeX size={16} className="lg:w-4 lg:h-4 text-gray-400" />
                )}
              </button>

              {/* Mark All Read Button */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className={`text-[10px] lg:text-xs px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg font-medium transition-colors ${
                    isDark 
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 lg:px-4 py-3 lg:py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 lg:py-20">
            <div className="animate-spin h-6 w-6 lg:h-8 lg:w-8 border-2 lg:border-3 border-emerald-500 border-t-transparent rounded-full" />
            <p className={`text-xs lg:text-sm mt-3 lg:mt-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-12 lg:py-20 rounded-xl lg:rounded-2xl ${
              isDark ? "bg-gray-900/50" : "bg-white"
            }`}
          >
            <div className={`inline-flex p-3 lg:p-4 rounded-full mb-3 lg:mb-4 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
              <Bell size={36} className="lg:w-12 lg:h-12 text-gray-400" />
            </div>
            <h3 className={`text-base lg:text-lg font-semibold mb-1 lg:mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              No notifications yet
            </h3>
            <p className={`text-xs lg:text-sm ${isDark ? "text-gray-400" : "text-gray-500"} px-4`}>
              We'll notify you when there are updates on your issues
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2 lg:space-y-3">
            <AnimatePresence mode="popLayout">
              {notifications.map((n, index) => {
                const unread = !n.read;
                const image = getImage(n);
                const { icon: StatusIcon, color, bg } = getStatusIcon(n.status);
                
                let displayMessage = n.message;
                if (n.status?.toLowerCase() === "viewed") {
                  displayMessage = "Officer has viewed your issue";
                }

                return (
                  <motion.div
                    key={n._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleNotificationClick(n._id, n)}
                    className={`
                      cursor-pointer rounded-lg lg:rounded-xl border transition-all duration-200
                      ${unread
                        ? isDark
                          ? "bg-gradient-to-r from-gray-900 to-gray-900/95 border-l-3 lg:border-l-4 border-l-emerald-500 border-gray-800 shadow-lg shadow-emerald-500/10"
                          : "bg-white border-l-3 lg:border-l-4 border-l-emerald-500 border-gray-200 shadow-md"
                        : isDark
                          ? "bg-gray-800/40 border-gray-700 opacity-60"
                          : "bg-gray-100 border-gray-200 opacity-60"
                      }
                      hover:shadow-md active:scale-[0.98]
                    `}
                  >
                    <div className="flex gap-2 lg:gap-3 p-3 lg:p-4">
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        <div className={`p-1.5 lg:p-2 rounded-full ${bg} ${color}`}>
                          <StatusIcon size={14} className="lg:w-4 lg:h-4" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap mb-1">
                          {unread && (
                            <span className="text-[8px] lg:text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500 text-white rounded-full animate-pulse">
                              NEW
                            </span>
                          )}
                          <span className={`text-[8px] lg:text-[9px] font-medium px-1.5 lg:px-2 py-0.5 rounded-full ${bg} ${color}`}>
                            {n.status === "Viewed" ? "Viewed" : (n.status || "Pending")}
                          </span>
                          
                          {/* Read Badge - shows when notification is read */}
                          {!unread && (
                            <span className="text-[8px] font-medium px-1.5 py-0.5 bg-gray-500/20 text-gray-500 rounded-full">
                              Read
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-[12px] lg:text-[13px] leading-relaxed font-medium
                          ${unread
                            ? isDark ? "text-white font-semibold" : "text-gray-900 font-semibold"
                            : isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {displayMessage}
                        </p>

                        {n.location && (
                          <div className="flex items-start gap-1 mt-1.5 lg:mt-2">
                            <MapPin size={10} className={`lg:w-3 lg:h-3 mt-0.5 ${unread ? "text-gray-400" : "text-gray-500"}`} />
                            <p className={`text-[9px] lg:text-[10px] ${unread ? (isDark ? "text-gray-400" : "text-gray-500") : (isDark ? "text-gray-600" : "text-gray-400")} break-words`}>
                              {truncateText(n.location, 80)}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-1 mt-1.5 lg:mt-2">
                          <Clock size={9} className={`lg:w-2.5 lg:h-2.5 ${unread ? "text-gray-400" : "text-gray-500"}`} />
                          <span className={`text-[9px] lg:text-[10px] ${unread ? (isDark ? "text-gray-400" : "text-gray-500") : (isDark ? "text-gray-600" : "text-gray-400")}`}>
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Image */}
                      {image && (
                        <div className="flex-shrink-0">
                          <div className="relative">
                            <img
                              src={image}
                              alt="Issue"
                              className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg object-cover transition-all duration-200
                                ${!unread ? "opacity-60 grayscale-[0.3]" : ""}
                              `}
                            />
                            {unread && (
                              <div className="absolute -top-1 -right-1 w-1.5 h-1.5 lg:w-2 lg:h-2 bg-emerald-500 rounded-full ring-1 lg:ring-2 ring-white dark:ring-gray-900 animate-pulse" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;