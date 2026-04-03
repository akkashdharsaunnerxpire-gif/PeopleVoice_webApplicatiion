import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreHorizontal,
  Heart,
  MessageCircle,
  Send,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
  Share2,
  Flag,
  LinkIcon,
  Image as ImageIcon,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Home,
  Bookmark,
} from "lucide-react";
import { themeColors } from "./constants";
import { useTheme } from "../../Context/ThemeContext";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const Toast = ({ message, type = "success" }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
      type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}
  >
    {type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
    <span>{message}</span>
  </motion.div>
);

const IssueCard = ({
  issue,
  liked = false,
  likeCount = 0,
  commentCount = 0,
  onLike,
  onComment,
  onShare,
  fullWidthMobile = false,
}) => {
  const { isDark } = useTheme();
  const theme = isDark ? themeColors.dark : themeColors.light;

  const citizenId = localStorage.getItem("citizenId");

  const username = issue.district
    ? `${issue.district.toLowerCase().trim().replace(/\s+/g, "")}_citizen`
    : "local_citizen";

  // ========== STATE ==========
  const [showMenu, setShowMenu] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = issue.images_data || [];
  const totalImages = images.length;

  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllHashtags, setShowAllHashtags] = useState(false);

  // ========== REFS ==========
  const lastTapTime = useRef(0);
  const doubleTapTimer = useRef(null);
  const heartAnimationRef = useRef(null);
  const menuRef = useRef(null);
  const savedTimerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDoubleTap = useRef(false);
  const isTransitioning = useRef(false);
  const heartDirectionRef = useRef("left");
  const isAnimatingRef = useRef(false);
  const imageContainerRef = useRef(null);
  const scrollStartY = useRef(0); // 🔥 NEW: track vertical scroll

  // ========== FUNCTIONS ==========
  const showHeartAnimation = useCallback((x, y) => {
    if (isAnimatingRef.current) return;

    isAnimatingRef.current = true;

    if (heartAnimationRef.current) heartAnimationRef.current.remove();

    const heart = document.createElement("div");
    heart.className = "double-tap-heart";

    const tilt = heartDirectionRef.current === "left" ? -25 : 25;
    heartDirectionRef.current =
      heartDirectionRef.current === "left" ? "right" : "left";

    heart.style.setProperty("--tilt", `${tilt}deg`);

    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;

    heart.innerHTML = `
      <svg width="110" height="110" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ff3b5c"/>
            <stop offset="50%" stop-color="#ff2e88"/>
            <stop offset="100%" stop-color="#ff2e88"/>
          </linearGradient>
        </defs>
        <path 
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
          2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09 
          C13.09 3.81 14.76 3 16.5 3 
          19.58 3 22 5.42 22 8.5 
          c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="url(#heartGradient)"
        />
      </svg>
    `;

    document.body.appendChild(heart);
    heartAnimationRef.current = heart;

    setTimeout(() => {
      heart.remove();
      heartAnimationRef.current = null;
      isAnimatingRef.current = false;
    }, 1600);
  }, []);

  const changeImage = useCallback((newIndex) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setCurrentImageIndex(newIndex);
    setTimeout(() => {
      isTransitioning.current = false;
    }, 200);
  }, []);

  // 🔥 FIXED: Double tap handler for BOTH desktop and mobile
  const handleDoubleTap = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Get center position for heart animation
      const rect = e.currentTarget.getBoundingClientRect();
      let centerX, centerY;
      
      if (e.clientX) {
        // Desktop click event
        centerX = e.clientX;
        centerY = e.clientY;
      } else if (e.touches && e.touches[0]) {
        // Mobile touch event
        centerX = e.touches[0].clientX;
        centerY = e.touches[0].clientY;
      } else {
        // Fallback to center of element
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
      }
      
      showHeartAnimation(centerX, centerY);
      if (!liked) onLike?.();
    },
    [liked, onLike, showHeartAnimation]
  );

  // 🔥 FIXED: Touch handlers for mobile (allows vertical scroll)
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    scrollStartY.current = e.touches[0].clientY; // 🔥 Track vertical start
    isDoubleTap.current = false;
    
    // Setup double tap detection
    const now = Date.now();
    const timeDiff = now - lastTapTime.current;
    
    if (timeDiff < 300 && timeDiff > 0) {
      isDoubleTap.current = true;
      handleDoubleTap(e);
      if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
    } else {
      if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
      doubleTapTimer.current = setTimeout(() => {
        isDoubleTap.current = false;
      }, 300);
    }
    
    lastTapTime.current = now;
  }, [handleDoubleTap]);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    // 🔥 CRITICAL: Don't handle swipe if double tap occurred
    if (isDoubleTap.current) {
      isDoubleTap.current = false;
      touchStartX.current = 0;
      touchEndX.current = 0;
      scrollStartY.current = 0;
      return;
    }

    const diffX = touchStartX.current - touchEndX.current;
    const diffY = Math.abs(scrollStartY.current - (touchEndX.current === touchStartX.current ? scrollStartY.current : touchEndX.current));
    
    // 🔥 Only handle horizontal swipe if horizontal movement > vertical movement
    if (Math.abs(diffX) > 60 && Math.abs(diffX) > diffY) {
      if (diffX > 0 && currentImageIndex < totalImages - 1) {
        changeImage(currentImageIndex + 1);
      } else if (diffX < 0 && currentImageIndex > 0) {
        changeImage(currentImageIndex - 1);
      }
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
    scrollStartY.current = 0;
  }, [currentImageIndex, totalImages, changeImage]);

  // ========== EFFECTS ==========
  useEffect(() => {
    images.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [images]);

  useEffect(() => {
    if (!citizenId || !issue._id) return;
    const checkSaved = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/saved/check?citizenId=${citizenId}&issueId=${issue._id}`
        );
        const data = await res.json();
        if (data.success) setIsSaved(data.isSaved);
      } catch (error) {
        console.error("Error checking saved status:", error);
      }
    };
    checkSaved();
  }, [citizenId, issue._id]);

  useEffect(() => {
    return () => {
      if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
      if (heartAnimationRef.current) heartAnimationRef.current.remove();
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // 🔥 FIXED: Attach touch listeners WITHOUT preventDefault (allows scroll)
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    // Use passive: true for touchstart to allow scrolling
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);
    
    // 🔥 Desktop double click support
    container.addEventListener("dblclick", handleDoubleTap);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("dblclick", handleDoubleTap);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleDoubleTap]);

  // ========== MENU & HELPERS ==========
  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/issue/${issue._id}`;
    const shareData = {
      title: "Issue Report",
      text: issue.description_en || "Check out this issue",
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 2000);
        if (onShare) onShare();
      } catch (err) {
        if (err.name !== "AbortError" && err.name !== "CanceledError") {
          setErrorMessage("Share failed");
          setShowErrorToast(true);
          setTimeout(() => setShowErrorToast(false), 2000);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 2000);
      } catch {
        setErrorMessage("Failed to copy link");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 2000);
      }
    }
  };

  const handleSaveClick = async () => {
    if (!citizenId || saving) return;
    setSaving(true);
    const previousSaved = isSaved;
    setIsSaved(!previousSaved);
    setSaveMessage(!previousSaved ? "Saved" : "Removed");
    setShowSavedPopup(true);

    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setShowSavedPopup(false), 1500);

    try {
      const res = await fetch(`${API_BASE}/api/saved/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId, issueId: issue._id }),
      });
      const data = await res.json();

      if (!data.success) {
        setIsSaved(previousSaved);
        setSaveMessage("Failed");
        setErrorMessage(data.message || "Could not save");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 2000);
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      setIsSaved(previousSaved);
      setSaveMessage("Error");
      setErrorMessage("Network error");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    {
      icon: Flag,
      label: "Report",
      action: () => {
        setShowMenu(false);
        alert("Thank you for reporting. We'll review this content.");
      },
    },
    {
      icon: Share2,
      label: "Share to...",
      action: () => {
        setShowMenu(false);
        handleShare();
      },
    },
    {
      icon: LinkIcon,
      label: "Copy link",
      action: () => {
        setShowMenu(false);
        navigator.clipboard.writeText(
          `${window.location.origin}/issue/${issue._id}`
        );
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 2000);
      },
    },
  ];

  const nextImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex < totalImages - 1 && !isTransitioning.current)
      changeImage(currentImageIndex + 1);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex > 0 && !isTransitioning.current)
      changeImage(currentImageIndex - 1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDistrictOnly = (location) => {
    if (!location) return "Unknown";
    if (location.includes(",")) return location.split(",")[0].trim();
    return location;
  };

  const formatFullAddress = () => {
    const parts = [];
    if (issue.area) parts.push(issue.area);
    if (issue.district) parts.push(issue.district);
    if (issue.state) parts.push(issue.state);
    if (issue.pincode) parts.push(issue.pincode);
    return parts.length === 0 ? "Location not specified" : parts.join(", ");
  };

  const needsTruncation = (text, isTamil = false) =>
    !text ? false : text.length > (isTamil ? 50 : 60);

  const truncatedText = (text, isTamil = false) => {
    if (!text) return "";
    if (isExpanded) return text;
    const max = isTamil ? 50 : 60;
    return text.length > max ? text.substring(0, max) + "..." : text;
  };

  const getStatusConfig = (status) => {
    const normalized = (status || "").toLowerCase();
    if (isDark) {
      if (normalized === "resolved" || normalized === "solved")
        return {
          bg: "bg-green-900/40",
          text: "text-green-300",
          border: "border-green-800",
          icon: CheckCircle,
          label: "Solved",
        };
      if (normalized === "in progress")
        return {
          bg: "bg-yellow-900/40",
          text: "text-yellow-300",
          border: "border-yellow-800",
          icon: Clock,
          label: "In Progress",
        };
      return {
        bg: "bg-red-900/40",
        text: "text-red-300",
        border: "border-red-800",
        icon: AlertCircle,
        label: "Pending",
      };
    } else {
      if (normalized === "resolved" || normalized === "solved")
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          border: "border-green-300",
          icon: CheckCircle,
          label: "Solved",
        };
      if (normalized === "in progress")
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          border: "border-yellow-300",
          icon: Clock,
          label: "In Progress",
        };
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-300",
        icon: AlertCircle,
        label: "Pending",
      };
    }
  };

  const statusConfig = getStatusConfig(issue.status);
  const StatusIcon = statusConfig.icon;

  const cardClasses = `
    overflow-hidden transition-all duration-300 
    ${theme.cardBg} ${theme.cardBorder}
    ${
      fullWidthMobile
        ? `rounded-none sm:rounded-2xl border-0 sm:border border-b sm:border-b-0 shadow-none sm:shadow-lg hover:shadow-none sm:hover:shadow-xl`
        : `rounded-2xl border shadow-lg hover:shadow-xl`
    }
  `;

  // ========== RENDER ==========
  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={cardClasses}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md flex-shrink-0"
            >
              {issue.district?.[0]?.toUpperCase() || "?"}
            </motion.div>
            <div className="min-w-0 flex-1">
              <p
                className={`font-semibold flex items-center gap-1 ${theme.text}`}
                style={{ fontSize: "15px" }}
              >
                <span
                  className="min-w-0"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "150px",
                  }}
                >
                  {username}
                </span>
                {issue.official && (
                  <span
                    className="bg-blue-100 text-blue-600 px-1 py-0.5 rounded-full"
                    style={{ fontSize: "0.7em" }}
                  >
                    Off
                  </span>
                )}
              </p>
              <p
                className={`flex items-center gap-0.5 ${theme.textMuted}`}
                style={{ fontSize: "0.85em" }}
              >
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                <span className="truncate">
                  {formatDistrictOnly(issue.district)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border shadow-sm ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
              style={{ fontSize: "0.8em" }}
            >
              <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{statusConfig.label}</span>
            </motion.div>

            <div className="relative" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleMenuToggle}
                className={`p-1 sm:p-1.5 rounded-full transition-colors ${theme.hover}`}
              >
                <MoreHorizontal
                  size={16}
                  className={`sm:w-5 sm:h-5 ${theme.textMuted}`}
                />
              </motion.button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className={`absolute right-0 mt-1 w-40 sm:w-44 border rounded-xl shadow-2xl py-1 z-50 ${theme.cardBg} ${isDark ? "border-zinc-800" : "border-gray-200"}`}
                  >
                    {menuItems.map((item, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ x: 3 }}
                        onClick={item.action}
                        className={`w-full flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 ${isDark ? "hover:bg-zinc-800 text-gray-300" : "hover:bg-gray-50 text-gray-700"}`}
                        style={{ fontSize: "0.85em" }}
                      >
                        <item.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                        {item.label}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* 🔥 FIXED: Image Section - Now scrollable on mobile, double tap works on desktop */}
        <div
          ref={imageContainerRef}
          className={`relative select-none ${isDark ? "bg-zinc-950" : "bg-gray-100"}`}
          style={{ touchAction: "pan-y pinch-zoom" }} // 🔥 Allows vertical scroll
        >
          {images.length > 0 ? (
            <>
              <div className="relative w-full aspect-square lg:h-[500px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    src={images[currentImageIndex]}
                    alt={`Issue ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover lg:object-contain pointer-events-none" // 🔥 pointer-events-none allows scrolling through image
                    draggable={false}
                    loading="lazy"
                  />
                </AnimatePresence>
              </div>

              {totalImages > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <motion.button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm z-10"
                    >
                      <ChevronLeft size={20} />
                    </motion.button>
                  )}
                  {currentImageIndex < totalImages - 1 && (
                    <motion.button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm z-10"
                    >
                      <ChevronRight size={20} />
                    </motion.button>
                  )}
                </>
              )}

              {totalImages > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {images.map((_, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.3 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isTransitioning.current) changeImage(i);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentImageIndex
                          ? "bg-green-500 scale-125"
                          : isDark
                          ? "bg-zinc-600"
                          : "bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              className={`aspect-square flex flex-col items-center justify-center gap-2 ${
                isDark ? "bg-zinc-950 text-gray-600" : "bg-gray-50 text-gray-400"
              }`}
            >
              <ImageIcon
                className={`w-12 h-12 ${isDark ? "text-gray-700" : "text-gray-300"}`}
              />
              <p className="text-sm">No image</p>
            </div>
          )}
        </div>

        {/* Action Bar & Content */}
        <div className="flex justify-between items-center px-3 sm:px-4 py-1.5 sm:py-2 relative">
          <div className="flex gap-4 sm:gap-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onLike?.();
              }}
              className="group flex items-center gap-1"
            >
              <motion.div
                animate={liked ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  size={24}
                  className={`sm:w-7 sm:h-7 transition-all ${
                    liked
                      ? "text-red-500 fill-red-500"
                      : isDark
                      ? "text-gray-300"
                      : theme.textMuted
                  }`}
                />
              </motion.div>
              <span
                className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                style={{ fontSize: "0.85em" }}
              >
                {likeCount}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onComment?.();
              }}
              className="group flex items-center gap-1"
            >
              <MessageCircle
                size={24}
                className={`sm:w-7 sm:h-7 ${
                  isDark
                    ? "text-gray-200 group-hover:text-green-400"
                    : "text-gray-600 group-hover:text-green-600"
                }`}
              />
              <span
                className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                style={{ fontSize: "0.85em" }}
              >
                {commentCount}
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="group"
            >
              <Send
                size={24}
                className={`sm:w-7 sm:h-7 ${
                  isDark
                    ? "text-gray-200 group-hover:text-blue-400"
                    : "text-gray-600 group-hover:text-blue-500"
                }`}
              />
            </motion.button>
          </div>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSaveClick}
              disabled={!citizenId || saving}
              className={`focus:outline-none ${
                !citizenId || saving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Bookmark
                size={24}
                className={`sm:w-7 sm:h-7 transition-all duration-300 ${
                  isSaved
                    ? "fill-green-500 text-green-500"
                    : isDark
                    ? "text-gray-300"
                    : theme.textMuted
                }`}
              />
            </motion.button>

            <AnimatePresence>
              {showSavedPopup && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className={`absolute -bottom-8 right-0 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 ${
                    saveMessage === "Saved"
                      ? "bg-green-500"
                      : saveMessage === "Removed"
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  style={{ fontSize: "0.75rem" }}
                >
                  {saveMessage === "Saved" ? (
                    <CheckCircle size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  <span>{saveMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Description & Footer */}
        <div className="px-3 sm:px-4 pb-4">
          <div className="mt-2 space-y-1.5">
            {issue.description_en && (
              <p
                className={isDark ? "text-gray-300" : "text-gray-800"}
                style={{ fontSize: "1em", lineHeight: "1.5" }}
              >
                <span className={`font-semibold ${theme.text}`}>
                  {username}
                </span>{" "}
                {truncatedText(issue.description_en)}
              </p>
            )}

            {issue.description_ta && (
              <div>
                <p
                  className={`font-tamil leading-relaxed ${
                    isDark ? "text-gray-400" : "text-gray-700"
                  }`}
                  style={{ fontSize: "1em" }}
                >
                  <span className="font-semibold text-green-600">தமிழ்:</span>{" "}
                  {isExpanded
                    ? issue.description_ta
                    : truncatedText(issue.description_ta, true)}
                </p>
                {needsTruncation(issue.description_ta, true) && !isExpanded && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-green-600 dark:text-green-400 flex items-center gap-1 mt-1"
                    style={{ fontSize: "0.85em" }}
                  >
                    <ChevronDown size={14} /> Read more...
                  </button>
                )}
              </div>
            )}

            {isExpanded &&
              (needsTruncation(issue.description_en) ||
                needsTruncation(issue.description_ta, true)) && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-green-600 dark:text-green-400 flex items-center gap-1"
                  style={{ fontSize: "0.85em" }}
                >
                  <ChevronUp size={14} /> Show less
                </button>
              )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${
                isDark ? "bg-zinc-800 text-gray-300" : "bg-gray-100 text-gray-700"
              }`}
              style={{ fontSize: "0.85em" }}
            >
              <Tag size={14} />
              {issue.department || "Unknown"}
            </span>
          </div>

          {issue.hashtags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {(showAllHashtags ? issue.hashtags : issue.hashtags.slice(0, 3)).map(
                (tag, i) => (
                  <span
                    key={i}
                    className={isDark ? "text-blue-400" : "text-blue-600"}
                    style={{ fontSize: "0.85em" }}
                  >
                    #{tag}
                  </span>
                )
              )}
              {issue.hashtags.length > 3 && (
                <button
                  onClick={() => setShowAllHashtags(!showAllHashtags)}
                  className="text-xs text-green-600 dark:text-green-400 hover:underline ml-1"
                >
                  {showAllHashtags ? "less" : "..more"}
                </button>
              )}
            </div>
          )}

          <div
            className={`mt-4 pt-3 border-t ${
              isDark ? "border-zinc-800" : "border-gray-100"
            }`}
          >
            <div className="flex gap-2">
              <Home
                className={`mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                size={16}
              />
              <p
                className={isDark ? "text-gray-400" : "text-gray-600"}
                style={{ fontSize: "0.85em" }}
              >
                {formatFullAddress()}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center mt-3">
            {commentCount > 0 && (
              <motion.button
                onClick={onComment}
                className={`transition-colors ${
                  isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                }`}
                style={{ fontSize: "0.8em" }}
              >
                {commentCount} comments பார்க்க
              </motion.button>
            )}
            <p
              className={`flex items-center gap-1 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
              style={{ fontSize: "0.75em" }}
            >
              <Clock size={14} />
              {formatDate(issue.createdAt)}
            </p>
          </div>
        </div>
      </motion.article>

      <AnimatePresence>
        {showSavedToast && <Toast message="Link copied!" type="success" />}
        {showErrorToast && <Toast message={errorMessage} type="error" />}
      </AnimatePresence>

      <style jsx global>{`
        .double-tap-heart {
          position: fixed;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 9999;
          animation: heartPop 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes heartPop {
          0% {
            transform: translate(-50%, -30%) scale(0.3) rotate(0deg);
            opacity: 0;
          }
          20% {
            transform: translate(-50%, -50%) scale(1.3)
              rotate(calc(var(--tilt) * 0.6));
            opacity: 1;
          }
          40% {
            transform: translate(-50%, -70px) scale(1.1) rotate(var(--tilt));
          }
          55% {
            transform: translate(-50%, -140px) scale(0.95)
              rotate(calc(var(--tilt) * 0.3));
          }
          75% {
            transform: translate(-50%, -220px) scale(0.75) rotate(0deg);
            opacity: 0.7;
          }
          100% {
            transform: translate(-50%, -300px) scale(0.6) rotate(0deg);
            opacity: 0;
          }
        }

        .font-tamil {
          font-family:
            "Noto Sans Tamil", "Latha", "Tamil MN", "Bamini", "Mukta Malar",
            sans-serif;
          line-height: 1.6;
        }
      `}</style>
    </>
  );
};

export default IssueCard;