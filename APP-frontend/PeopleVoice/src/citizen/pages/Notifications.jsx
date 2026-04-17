import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Bell,
  CheckCircle2,
  Info,
  AlertCircle,
  Eye,
  Clock,
  MapPin,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const Notifications = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [selectedProofId, setSelectedProofId] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [clickedProofs, setClickedProofs] = useState({});
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

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
  const showBrowserNotification = useCallback((title, body, imageUrl) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: imageUrl || "/logo.png",
        image: imageUrl,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  /* ================= GET NOTIFICATION IMAGE ================= */
  const getNotificationImage = (notification) => {
    const getUrl = (img) => (typeof img === "string" ? img : img?.url);

    // ✅ AFTER image first (resolved proof)
    if (notification.issueId?.after_images?.[0]) {
      return getUrl(notification.issueId.after_images[0]);
    }

    // ✅ BEFORE image
    if (notification.issueId?.images?.[0]) {
      return getUrl(notification.issueId.images[0]);
    }

    // ✅ fallback
    if (notification.image) {
      return notification.image;
    }

    return null;
  };
  /* ================= LOAD NOTIFICATIONS ================= */
  const loadNotifications = useCallback(async () => {
    if (!citizenId) return;

    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/notifications?citizenId=${citizenId}`,
      );

      const newData = res.data || [];

      const currentIds = lastNotificationIds.current;
      const freshNew = newData.filter((n) => !currentIds.has(n._id));

      if (freshNew.length > 0 && currentIds.size > 0) {
        setNewNotificationCount((prev) => prev + freshNew.length);
        playNotificationSound();

        freshNew.forEach((n) => {
          const notificationImage = getNotificationImage(n);
          showBrowserNotification(
            "PeopleVoice Update",
            n.message,
            notificationImage,
          );
        });
      }

      lastNotificationIds.current = new Set(newData.map((n) => n._id));
      setNotifications(newData);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  }, [
    citizenId,
    playNotificationSound,
    showBrowserNotification,
    getNotificationImage,
  ]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "CLOSE_PROOF_POPUP") {
        setSelectedProofId(null);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  /* ================= INITIAL LOAD + POLLING ================= */
  useEffect(() => {
    loadNotifications();

    pollingInterval.current = setInterval(() => {
      loadNotifications();
    }, 15000);

    return () => {
      clearInterval(pollingInterval.current);
    };
  }, [loadNotifications]);

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
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setNewNotificationCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  /* ================= MARK ALL ================= */
  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markAsRead(n._id)));
    setNewNotificationCount(0);
  };

  /* ================= DELETE NOTIFICATION ================= */
  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${BACKEND_URL}/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      lastNotificationIds.current.delete(id);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  /* ================= GET STATUS STYLE ================= */
  const getStatusStyle = (status) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower.includes("resolved") || statusLower.includes("solved")) {
      return {
        icon: CheckCircle2,
        color: "text-green-500",
        bg: "bg-green-500/10",
        label: "Resolved",
      };
    }
    if (
      statusLower.includes("progress") ||
      statusLower.includes("processing")
    ) {
      return {
        icon: Info,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        label: "In Progress",
      };
    }
    if (statusLower.includes("viewed")) {
      return {
        icon: Eye,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        label: "Viewed",
      };
    }
    if (statusLower.includes("pending")) {
      return {
        icon: Clock,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        label: "Pending",
      };
    }
    return {
      icon: AlertCircle,
      color: "text-gray-500",
      bg: "bg-gray-500/10",
      label: status || "Update",
    };
  };

  /* ================= FORMAT DATE ================= */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* ================= CLICK HANDLER ================= */
  const handleNotificationClick = async (id, notification) => {
    try {
      if (!notification.read) {
        await markAsRead(id);
      }

      if (notification.issueId) {
        const status = notification.status?.toLowerCase();
        if (status === "resolved" && notification.issueId) {
          navigate(`/peopleVoice/proofpop/${notification.issueId}`);
        } else {
          navigate(`/peopleVoice/my-issues`);
        }
      } else {
        navigate("/peopleVoice/my-issues");
      }
    } catch (err) {
      console.error("Navigation error:", err);
    }
  };

  /* ================= GET MESSAGE PREVIEW ================= */
  const getMessagePreview = (message, maxLength = 70) => {
    if (!message) return "";
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={`min-h-screen pb-10 ${isDark ? "bg-black" : "bg-gray-50"}`}>
      {/* Floating New Notification Badge */}
      <AnimatePresence>
        {newNotificationCount > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-4 z-50"
          >
            <button
              onClick={() => {
                setNewNotificationCount(0);
                loadNotifications();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              <Bell size={14} />
              <span className="text-xs font-medium">
                {newNotificationCount} new
              </span>
              <ChevronRight size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div
        className={`sticky top-0 z-20 backdrop-blur-xl border-b ${
          isDark ? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-100"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`relative p-1.5 rounded-full ${isDark ? "bg-emerald-950" : "bg-emerald-100"}`}
              >
                <Bell size={18} className="text-emerald-500" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </div>
              <div>
                <h1
                  className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Notifications
                </h1>
                <p
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} hidden sm:block`}
                >
                  Stay updated with your issue status
                </p>
              </div>
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-emerald-500 font-medium px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
            <p
              className={`text-sm mt-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-16 rounded-2xl ${
              isDark ? "bg-gray-900/50" : "bg-white"
            }`}
          >
            <div
              className={`inline-flex p-4 rounded-full mb-4 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Bell size={40} className="text-gray-400" />
            </div>
            <h3
              className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              No notifications yet
            </h3>
            <p
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"} px-4`}
            >
              We'll notify you when there are updates on your issues
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {notifications.map((n, index) => {
                const unread = !n.read;
                const notificationImage = getNotificationImage(n);
                const statusStyle = getStatusStyle(n.status);
                const StatusIcon = statusStyle.icon;

                return (
                  <motion.div
                    key={n._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNotificationClick(n._id, n)}
                    className={`
                      cursor-pointer rounded-xl border transition-all duration-200
                      ${
                        unread
                          ? isDark
                            ? "bg-gradient-to-r from-gray-900 to-gray-900/95 border-l-4 border-l-emerald-500 border-gray-800 shadow-lg shadow-emerald-500/10"
                            : "bg-white border-l-4 border-l-emerald-500 border-gray-200 shadow-md"
                          : isDark
                            ? "bg-gray-800/40 border-gray-700 opacity-70"
                            : "bg-gray-50 border-gray-200 opacity-70"
                      }
                      hover:shadow-md active:scale-[0.98]
                    `}
                  >
                    <div className="flex gap-3 p-3">
                      {/* Status Icon / Image Section */}
                      <div className="flex-shrink-0">
                        {notificationImage ? (
                          <div
                            className={`
                              w-12 h-12 rounded-xl overflow-hidden
                              border ${isDark ? "border-gray-700" : "border-gray-200"}
                              cursor-zoom-in
                              ${!unread ? "opacity-60 grayscale-[0.3]" : ""}
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(notificationImage);
                            }}
                          >
                            <img
                              src={notificationImage}
                              alt="Issue"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={`p-2 rounded-full ${statusStyle.bg} ${statusStyle.color}`}
                          >
                            <StatusIcon size={16} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {unread && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500 text-white rounded-full animate-pulse">
                              NEW
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.color}`}
                          >
                            {statusStyle.label}
                          </span>

                          {/* Read Badge - shows when notification is read */}
                          {!unread && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-500/20 text-gray-500 rounded-full">
                              Read
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-sm leading-relaxed font-medium
                          ${
                            unread
                              ? isDark
                                ? "text-white font-semibold"
                                : "text-gray-900 font-semibold"
                              : isDark
                                ? "text-gray-400"
                                : "text-gray-500"
                          }`}
                        >
                          {getMessagePreview(n.message)}

                          {n.issueId &&
                            n.status?.toLowerCase().includes("resolved") && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();

                                  const issueId =
                                    typeof n.issueId === "string"
                                      ? n.issueId
                                      : n.issueId?._id;

                                  setClickedProofs((prev) => ({
                                    ...prev,
                                    [issueId]: true,
                                  }));

                                  setSelectedProofId(issueId);
                                }}
                                className={`ml-2 cursor-pointer font-semibold underline-offset-2 hover:underline transition inline-flex items-center gap-1 text-xs
                                ${
                                  !clickedProofs[
                                    typeof n.issueId === "string"
                                      ? n.issueId
                                      : n.issueId?._id
                                  ]
                                    ? "text-red-500 animate-pulse"
                                    : "text-emerald-500"
                                }
                              `}
                              >
                                <Eye size={12} />
                                View Proof
                              </span>
                            )}
                        </p>

                        {n.location && (
                          <div className="flex items-start gap-1 mt-1.5">
                            <MapPin
                              size={12}
                              className={`mt-0.5 ${unread ? "text-gray-400" : "text-gray-500"}`}
                            />
                            <p
                              className={`text-xs ${unread ? (isDark ? "text-gray-400" : "text-gray-500") : isDark ? "text-gray-600" : "text-gray-400"} break-words`}
                            >
                              {getMessagePreview(n.location, 60)}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                          <div className="flex items-center gap-1">
                            <Clock
                              size={10}
                              className={
                                unread ? "text-gray-400" : "text-gray-500"
                              }
                            />
                            <span
                              className={`text-xs ${unread ? (isDark ? "text-gray-400" : "text-gray-500") : isDark ? "text-gray-600" : "text-gray-400"}`}
                            >
                              {formatDate(n.createdAt)}
                            </span>
                          </div>

                          {n.issueId && (
                            <>
                              <span
                                className={`text-[10px] ${unread ? "text-gray-500" : "text-gray-600"}`}
                              >
                                •
                              </span>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-xs ${unread ? (isDark ? "text-gray-400" : "text-gray-500") : isDark ? "text-gray-600" : "text-gray-400"}`}
                                >
                                  ID: #
                                  {typeof n.issueId === "string"
                                    ? n.issueId.slice(-6)
                                    : n.issueId?._id?.slice(-6)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => deleteNotification(n._id, e)}
                        className={`
                          p-1.5 rounded-lg flex-shrink-0 self-start
                          ${isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-400"}
                          hover:text-red-500 transition
                        `}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-black/70 transition"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proof Popup Modal */}
      <AnimatePresence>
        {selectedProofId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedProofId(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-3xl h-[85vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setSelectedProofId(null)}
                className="absolute top-4 right-4 z-50 bg-black/70 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center text-lg transition"
              >
                ✕
              </button>

              {/* PROOF CONTENT */}
              <iframe
                src={`/peopleVoice/proofpop/${selectedProofId}`}
                className="w-full h-full"
                title="Proof Details"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
