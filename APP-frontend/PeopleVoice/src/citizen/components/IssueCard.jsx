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
  Calendar,
  Tag,
  Share2,
  Flag,
  Link as LinkIcon,
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

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const Toast = ({ message, type = "success", onClose }) => (
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
  isDark,
}) => {
  const theme = isDark ? themeColors.dark : themeColors.light;
  const citizenId = localStorage.getItem("citizenId");
  const username = `${issue.district?.toLowerCase() || "local"}_citizen`;

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

  // Refs for touch and double-tap handling
  const lastTapTime = useRef(0);
  const doubleTapTimer = useRef(null);
  const heartAnimationRef = useRef(null);
  const cardRef = useRef(null);
  const menuRef = useRef(null);
  const savedTimerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDoubleTap = useRef(false);

  // Debounce image transitions
  const isTransitioning = useRef(false);

  // Preload all images to avoid loading delays during transitions
  useEffect(() => {
    images.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [images]);

  // Fetch saved status
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

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
      if (heartAnimationRef.current) heartAnimationRef.current.remove();
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  // Share handler – no count increment, just share
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/issue/${issue._id}`;
    const shareData = {
      title: 'Issue Report',
      text: issue.description_en || 'Check out this issue',
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 2000);
        if (onShare) onShare();
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
          setErrorMessage('Share failed');
          setShowErrorToast(true);
          setTimeout(() => setShowErrorToast(false), 2000);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 2000);
      } catch (clipboardErr) {
        setErrorMessage('Failed to copy link');
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

  const showHeartAnimation = useCallback((x, y) => {
    if (heartAnimationRef.current) heartAnimationRef.current.remove();
    const heart = document.createElement("div");
    heart.className = "double-tap-heart";
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.innerHTML = `
      <svg width="80" height="80" viewBox="0 0 24 24" fill="#FF3040" stroke="#FF3040">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    `;
    document.body.appendChild(heart);
    heartAnimationRef.current = heart;
    setTimeout(() => {
      heart.remove();
      heartAnimationRef.current = null;
    }, 1000);
  }, []);

  const handleTap = useCallback(
    (e) => {
      e.preventDefault();
      const now = Date.now();
      const timeDiff = now - lastTapTime.current;
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

      if (timeDiff < 300 && timeDiff > 0) {
        // Double tap detected
        isDoubleTap.current = true;
        showHeartAnimation(clientX, clientY);
        if (!liked) {
          onLike?.();
        }
        if (doubleTapTimer.current) {
          clearTimeout(doubleTapTimer.current);
          doubleTapTimer.current = null;
        }
      } else {
        doubleTapTimer.current = setTimeout(() => {
          isDoubleTap.current = false;
        }, 300);
      }
      lastTapTime.current = now;
    },
    [liked, onLike, showHeartAnimation]
  );

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    handleTap(e);
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (isDoubleTap.current) {
      isDoubleTap.current = false;
      touchStartX.current = 0;
      touchEndX.current = 0;
      return;
    }

    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 60) {
      if (diff > 0 && currentImageIndex < totalImages - 1) {
        changeImage(currentImageIndex + 1);
      } else if (diff < 0 && currentImageIndex > 0) {
        changeImage(currentImageIndex - 1);
      }
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Debounced image change
  const changeImage = (newIndex) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setCurrentImageIndex(newIndex);
    setTimeout(() => {
      isTransitioning.current = false;
    }, 200); // slightly longer than animation duration
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex < totalImages - 1 && !isTransitioning.current) {
      changeImage(currentImageIndex + 1);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (currentImageIndex > 0 && !isTransitioning.current) {
      changeImage(currentImageIndex - 1);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
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
    if (parts.length === 0) return "Location not specified";
    return parts.join(", ");
  };

  const needsTruncation = (text, isTamil = false) => {
    if (!text) return false;
    const threshold = isTamil ? 50 : 60;
    return text.length > threshold;
  };

  const truncatedText = (text, isTamil = false) => {
    if (!text) return "";
    if (isExpanded) return text;
    const maxLength = isTamil ? 50 : 60;
    if (text.length > maxLength) return text.substring(0, maxLength) + "...";
    return text;
  };

  const getStatusConfig = (status) => {
    if (isDark) {
      switch (status) {
        case "Resolved":
        case "solved":
          return {
            bg: "bg-green-900/40",
            text: "text-green-300",
            border: "border-green-800",
            icon: CheckCircle,
            label: status === "solved" ? "Solved" : "Resolved",
          };
        case "In Progress":
          return {
            bg: "bg-yellow-900/40",
            text: "text-yellow-300",
            border: "border-yellow-800",
            icon: Clock,
            label: "In Progress",
          };
        default:
          return {
            bg: "bg-red-900/40",
            text: "text-red-300",
            border: "border-red-800",
            icon: AlertCircle,
            label: "Pending",
          };
      }
    } else {
      switch (status) {
        case "Resolved":
        case "solved":
          return {
            bg: "bg-green-100",
            text: "text-green-700",
            border: "border-green-300",
            icon: CheckCircle,
            label: status === "solved" ? "Solved" : "Resolved",
          };
        case "In Progress":
          return {
            bg: "bg-yellow-100",
            text: "text-yellow-700",
            border: "border-yellow-300",
            icon: Clock,
            label: "In Progress",
          };
        default:
          return {
            bg: "bg-red-100",
            text: "text-red-700",
            border: "border-red-300",
            icon: AlertCircle,
            label: "Pending",
          };
      }
    }
  };

  const statusConfig = getStatusConfig(issue.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <motion.article
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={`rounded-2xl shadow-lg border mb-3 overflow-hidden hover:shadow-xl transition-all duration-300 ${isDark ? theme.cardBg : "bg-white"} ${isDark ? "border-gray-800" : "border-gray-200"}`}
      >
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md flex-shrink-0"
            >
              {issue.district?.[0]?.toUpperCase() || "?"}
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className={`font-semibold text-xs sm:text-sm flex items-center gap-1 truncate ${theme.text}`}>
                <span className="truncate">{username}</span>
                {issue.official && (
                  <span className="text-[9px] sm:text-[10px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded-full flex-shrink-0">
                    Off
                  </span>
                )}
              </p>
              <p className={`text-[10px] sm:text-xs flex items-center gap-0.5 ${theme.textMuted}`}>
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                <span className="truncate">{formatDistrictOnly(issue.district)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 
                rounded-full text-[10px] sm:text-xs border shadow-sm
                ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
            >
              <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{statusConfig.label}</span>
            </motion.div>

            <div className="relative" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleMenuToggle}
                className={`p-1 sm:p-1.5 rounded-full transition-colors ${isDark ? theme.hover : "hover:bg-gray-100"}`}
                aria-label="More options"
              >
                <MoreHorizontal size={16} className={`sm:w-5 sm:h-5 ${theme.textMuted}`} />
              </motion.button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className={`absolute right-0 mt-1 w-40 sm:w-44 border rounded-xl shadow-2xl py-1 z-50 ${isDark ? theme.cardBg : "bg-white"} ${isDark ? "border-gray-800" : "border-gray-200"}`}
                  >
                    {menuItems.map((item, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ x: 3 }}
                        onClick={item.action}
                        className={`w-full flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ${isDark ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-50 text-gray-700"}`}
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

        {/* Image section with fixed height on large screens to prevent layout shift */}
        <div
          className={`relative select-none ${isDark ? "bg-gray-900" : "bg-gray-100"}`}
          style={{ touchAction: "pan-y" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleTap}
          onDoubleClick={handleTap}
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
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                    src={images[currentImageIndex]}
                    alt={`Issue ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover lg:object-contain"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    loading="lazy"
                  />
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {totalImages > 1 && currentImageIndex > 0 && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 sm:p-2 rounded-full backdrop-blur-sm"
                  >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {totalImages > 1 && currentImageIndex < totalImages - 1 && (
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 sm:p-2 rounded-full backdrop-blur-sm"
                  >
                    <ChevronRight size={18} className="sm:w-5 sm:h-5" />
                  </motion.button>
                )}
              </AnimatePresence>

              {totalImages > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5">
                  {images.map((_, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isTransitioning.current) changeImage(i);
                      }}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                        i === currentImageIndex
                          ? "bg-green-600 w-3 sm:w-3"
                          : isDark
                            ? "bg-gray-600 hover:bg-gray-500"
                            : "bg-gray-400/70 hover:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              )}

              {totalImages > 1 && (
                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full backdrop-blur-sm">
                  {currentImageIndex + 1}/{totalImages}
                </div>
              )}
            </>
          ) : (
            <div className={`aspect-square flex flex-col items-center justify-center gap-1 sm:gap-2 ${isDark ? "bg-gray-900 text-gray-600" : "bg-gray-50 text-gray-400"}`}>
              <ImageIcon className={`w-8 h-8 sm:w-12 sm:h-12 ${isDark ? "text-gray-700" : "text-gray-300"}`} />
              <p className={`text-xs sm:text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}>No image</p>
            </div>
          )}
        </div>

        {/* ACTION BAR WITHOUT SHARE COUNT */}
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
              aria-label={liked ? "Unlike" : "Like"}
            >
              <motion.div animate={liked ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}>
                <Heart
                  size={24}
                  className={`sm:w-7 sm:h-7 transition-all duration-300 ${
                    liked ? "text-red-500 fill-red-500" : isDark ? "text-gray-300" : theme.textMuted
                  }`}
                />
              </motion.div>
              <span className={`text-xs sm:text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
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
              aria-label="Comment"
            >
              <MessageCircle
                size={24}
                className={`sm:w-7 sm:h-7 transition-colors ${
                  isDark ? "text-gray-200 group-hover:text-green-400" : "text-gray-600 group-hover:text-green-600"
                }`}
              />
              <span className={`text-xs sm:text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
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
              aria-label="Share"
            >
              <Send
                size={24}
                className={`sm:w-7 sm:h-7 transition-colors ${
                  isDark ? "text-gray-200 group-hover:text-blue-400" : "text-gray-600 group-hover:text-blue-500"
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
              className={`focus:outline-none ${!citizenId || saving ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Bookmark
                size={24}
                className={`sm:w-7 sm:h-7 transition-all duration-300 ${
                  isSaved ? "fill-green-500 text-green-500" : isDark ? "text-gray-300" : theme.textMuted
                }`}
              />
            </motion.button>

            <AnimatePresence>
              {showSavedPopup && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`absolute -bottom-8 right-0 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap ${
                    saveMessage === "Saved" ? "bg-green-500" : saveMessage === "Removed" ? "bg-orange-500" : "bg-red-500"
                  }`}
                >
                  {saveMessage === "Saved" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  <span>{saveMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="mt-1 sm:mt-2 space-y-1 sm:space-y-1.5">
            {issue.description_en && (
              <p className={`text-xs sm:text-sm ${isDark ? "text-gray-300" : "text-gray-800"}`}>
                <span className={`font-semibold ${theme.text}`}>{username}</span>{" "}
                {truncatedText(issue.description_en, false)}
              </p>
            )}

            {issue.description_ta && (
              <div className="mt-1.5 sm:mt-2">
                <p className={`text-xs sm:text-sm font-tamil leading-relaxed ${isDark ? "text-gray-400" : "text-gray-700"}`}>
                  <span className="font-semibold text-green-600 dark:text-green-400">தமிழ்:</span>{" "}
                  {isExpanded ? issue.description_ta : truncatedText(issue.description_ta, true)}
                </p>
                {needsTruncation(issue.description_ta, true) && !isExpanded && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className={`text-[10px] sm:text-xs font-medium hover:underline mt-0.5 flex items-center gap-0.5 ${
                      isDark ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    <ChevronDown size={12} className="sm:w-4 sm:h-4" />
                    Read more...
                  </button>
                )}
              </div>
            )}

            {(needsTruncation(issue.description_en) || needsTruncation(issue.description_ta, true)) && isExpanded && (
              <button
                onClick={() => setIsExpanded(false)}
                className={`text-[10px] sm:text-xs font-medium hover:underline mt-1 flex items-center gap-0.5 ${
                  isDark ? "text-green-400" : "text-green-600"
                }`}
              >
                <ChevronUp size={12} className="sm:w-4 sm:h-4" />
                show less
              </button>
            )}
          </div>

          <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs ${
                isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
              }`}
            >
              <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {issue.department || "Unknown"}
            </span>
          </div>

          {issue.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
              {issue.hashtags.map((tag, i) => (
                <span
                  key={i}
                  className={`text-[10px] sm:text-xs hover:underline cursor-pointer ${
                    isDark ? "text-blue-400" : "text-blue-600"
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className={`mt-2 sm:mt-3 pt-2 sm:pt-3 border-t ${isDark ? "border-gray-800" : "border-gray-100"}`}>
            <div className="flex items-start gap-1.5 sm:gap-2">
              <Home
                className={`w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 ${
                  isDark ? "text-gray-500" : "text-gray-400"
                }`}
              />
              <p className={`text-[10px] sm:text-xs leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {formatFullAddress()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 sm:mt-3">
            {commentCount > 0 && (
              <motion.button
                whileHover={{ x: 2 }}
                onClick={onComment}
                className={`text-[10px] sm:text-xs transition-colors ${
                  isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {commentCount} {commentCount === 1 ? "comment" : "comments"} பார்க்க
              </motion.button>
            )}
            <p
              className={`text-[8px] sm:text-[10px] flex items-center gap-0.5 sm:gap-1 ${
                isDark ? "text-gray-600" : "text-gray-400"
              } ${commentCount > 0 ? "" : "ml-auto"}`}
            >
              <Clock className="w-2 h-2 sm:w-3 sm:h-3" />
              {formatDate(issue.createdAt)}
            </p>
          </div>
        </div>
      </motion.article>

      <AnimatePresence>
        {showSavedToast && (
          <Toast message="Link copied!" type="success" onClose={() => setShowSavedToast(false)} />
        )}
        {showErrorToast && (
          <Toast message={errorMessage} type="error" onClose={() => setShowErrorToast(false)} />
        )}
      </AnimatePresence>

      <style jsx global>{`
        .double-tap-heart {
          position: fixed;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 9999;
          animation: heartPop 1s ease-out forwards;
        }
        @keyframes heartPop {
          0% {
            transform: translate(-50%, -50%) scale(0.3);
            opacity: 0;
          }
          20% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }
          80% {
            transform: translate(-50%, -150px) scale(0.8);
            opacity: 0.5;
          }
          100% {
            transform: translate(-50%, -200px) scale(0.5);
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