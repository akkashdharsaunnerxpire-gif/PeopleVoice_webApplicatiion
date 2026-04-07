import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import axios from "axios";
import {
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Bookmark,
  Share2,
  Check,
  MapPin,
  Clock,
} from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";
import { themeColors } from "./constants";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const APIURL = `${BACKEND_URL}/api`;

const PostModal = ({
  issue,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  citizenId,
  setDisplayedIssues,
  isDark: propIsDark,
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const theme = isDark ? themeColors.dark : themeColors.light;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [localIssue, setLocalIssue] = useState(issue);
  const { setCommentModalData } = useOutletContext();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);




  const allImages = localIssue?.images_data || [];
  const totalImages = allImages.length;
  const comments = localIssue?.comments || [];

  const nextImage = useCallback(
    (e) => {
      e?.stopPropagation();
      if (currentImageIndex < totalImages - 1)
        setCurrentImageIndex((prev) => prev + 1);
    },
    [currentImageIndex, totalImages],
  );

  const prevImage = useCallback(
    (e) => {
      e?.stopPropagation();
      if (currentImageIndex > 0) setCurrentImageIndex((prev) => prev - 1);
    },
    [currentImageIndex],
  );
  const handleDeleteClick = (issueId, e) => {
    e.stopPropagation();
    setDeleteModal(issueId); // open popup
  };
const confirmDelete = async () => {
  if (!deleteModal) return;

  try {
    await axios.delete(`${APIURL}/issues/${deleteModal}`, {
      data: { citizenId },
    });

    setDisplayedIssues?.((prev) =>
      prev.filter((issue) => issue._id !== deleteModal)
    );

    onClose(); // modal close
  } catch (err) {
    console.error("Delete failed:", err);
  } finally {
    setDeleteModal(null);
    setOpenMenuId(null);
  }
};

  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.touches[0].clientX);
  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) nextImage();
    else if (distance < -50) prevImage();
  };

  const toggleLike = async () => {
    if (!citizenId || isLiking) return;
    setIsLiking(true);

    const wasLiked = localIssue.likes?.includes(citizenId);
    const updatedLikes = wasLiked
      ? localIssue.likes.filter((id) => id !== citizenId)
      : [...(localIssue.likes || []), citizenId];

    setLocalIssue((prev) => ({ ...prev, likes: updatedLikes }));

    try {
      const res = await fetch(`${APIURL}/issues/${issue._id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId }),
      });
      const data = await res.json();
      if (data.success) {
        setDisplayedIssues?.((prev) =>
          prev.map((i) =>
            i._id === issue._id ? { ...i, likes: data.likes } : i,
          ),
        );
      }
    } catch (err) {
      setLocalIssue((prev) => ({ ...prev, likes: issue.likes }));
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "Community Issue Report",
      text: localIssue.description_en,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `${shareData.text}\n\nView this issue at: ${shareData.url}`,
        );
        // Optional: Show toast notification
      } catch (err) {
        console.error("Copy failed", err);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    const diff = (new Date() - date) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const normalizeStatus = (status) => {
    const s = status?.toLowerCase() || "send";
    if (s === "closed") return "closed";
    if (s === "resolved") return "resolved";
    if (s === "in progress") return "in progress";
    return "send";
  };

  const getStatusDisplay = (status) => {
    const statusLower = normalizeStatus(status);
    switch (statusLower) {
      case "send":
        return "SENT";
      case "in progress":
        return "IN PROGRESS";
      case "resolved":
        return "RESOLVED";
      case "closed":
        return "CLOSED";
      default:
        return status?.toUpperCase() || "SENT";
    }
  };

  const getStatusColor = (status) => {
    const statusLower = normalizeStatus(status);
    if (isDark) {
      switch (statusLower) {
        case "send":
          return "bg-rose-900/40 text-rose-300 border border-rose-800";
        case "in progress":
          return "bg-amber-900/40 text-amber-300 border border-amber-800";
        case "resolved":
          return "bg-emerald-900/40 text-emerald-300 border border-emerald-800";
        case "closed":
          return "bg-purple-900/40 text-purple-300 border border-purple-800";
        default:
          return "bg-gray-800 text-gray-400 border border-gray-700";
      }
    } else {
      switch (statusLower) {
        case "send":
          return "bg-rose-100 text-rose-700 border border-rose-200";
        case "in progress":
          return "bg-amber-100 text-amber-700 border border-amber-200";
        case "resolved":
          return "bg-emerald-100 text-emerald-700 border border-emerald-200";
        case "closed":
          return "bg-purple-100 text-purple-700 border border-purple-200";
        default:
          return "bg-gray-100 text-gray-700 border border-gray-200";
      }
    }
  };

  const getProgressPercentage = (status) => {
    const statusLower = normalizeStatus(status);
    switch (statusLower) {
      case "closed":
        return 100;
      case "resolved":
        return 75;
      case "in progress":
        return 50;
      case "send":
        return 25;
      default:
        return 25;
    }
  };

  const getStageColor = (stage, isActive) => {
    if (!isActive)
      return isDark
        ? "bg-gray-800 border-gray-700"
        : "bg-white border-gray-200";

    if (isDark) {
      switch (stage) {
        case "send":
          return "bg-rose-600 border-rose-500";
        case "in progress":
          return "bg-amber-600 border-amber-500";
        case "resolved":
          return "bg-emerald-600 border-emerald-500";
        case "closed":
          return "bg-purple-600 border-purple-500";
        default:
          return theme.accentBg;
      }
    } else {
      switch (stage) {
        case "send":
          return "bg-rose-500 border-rose-400";
        case "in progress":
          return "bg-amber-500 border-amber-400";
        case "resolved":
          return "bg-emerald-500 border-emerald-400";
        case "closed":
          return "bg-purple-500 border-purple-400";
        default:
          return "bg-green-500 border-green-400";
      }
    }
  };

  const getStageTextColor = (stage, isActive) => {
    if (!isActive) return isDark ? "text-gray-600" : "text-gray-400";

    if (isDark) {
      switch (stage) {
        case "send":
          return "text-rose-400";
        case "in progress":
          return "text-amber-400";
        case "resolved":
          return "text-emerald-400";
        case "closed":
          return "text-purple-400";
        default:
          return theme.accent;
      }
    } else {
      switch (stage) {
        case "send":
          return "text-rose-600";
        case "in progress":
          return "text-amber-600";
        case "resolved":
          return "text-emerald-600";
        case "closed":
          return "text-purple-600";
        default:
          return "text-green-600";
      }
    }
  };

  if (!issue) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-0 md:p-10"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`w-full max-w-6xl h-full md:h-fit md:max-h-[90vh] md:rounded-xl overflow-hidden flex flex-col md:flex-row relative shadow-2xl ${
              isDark ? theme.card : "bg-white"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* LEFT: MEDIA SECTION */}
            <div className="relative w-full md:w-[60%] h-[40vh] md:h-auto bg-black flex items-center justify-center">
              {allImages.length > 0 ? (
                <div
                  className="w-full h-full relative flex items-center justify-center"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <img
                    src={allImages[currentImageIndex]}
                    className="max-w-full max-h-full object-contain"
                    alt="Issue"
                  />
                  {totalImages > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className={`absolute left-4 p-2 bg-black/50 rounded-full text-white backdrop-blur-sm transition hover:bg-black/70 ${
                          currentImageIndex === 0 ? "hidden" : "flex"
                        }`}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={nextImage}
                        className={`absolute right-4 p-2 bg-black/50 rounded-full text-white backdrop-blur-sm transition hover:bg-black/70 ${
                          currentImageIndex === totalImages - 1
                            ? "hidden"
                            : "flex"
                        }`}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  {totalImages > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                      {currentImageIndex + 1} / {totalImages}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No media available</div>
              )}

              {/* Navigation arrows for posts */}
              <div className="absolute top-4 left-4 flex gap-2">
                {hasPrev && (
                  <button
                    onClick={onPrev}
                    className="bg-black/50 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm hover:bg-black/70"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                )}
                {hasNext && (
                  <button
                    onClick={onNext}
                    className="bg-black/50 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm hover:bg-black/70"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                )}
              </div>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 md:hidden bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* RIGHT: CONTENT SECTION */}
            <div
              className={`flex flex-col w-full md:w-[40%] h-[60vh] md:h-auto ${
                isDark ? theme.card : "bg-white"
              }`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between p-4 border-b ${theme.border}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      isDark ? "bg-purple-600" : "bg-green-600"
                    }`}
                  >
                    {localIssue.citizenId?.slice(0, 2).toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${theme.text}`}>
                        {localIssue.citizenId || "Anonymous"}
                      </span>
                      {citizenId === localIssue.citizenId && (
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                            isDark
                              ? "bg-purple-900/50 text-purple-300"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={10} className={theme.textMuted} />
                      <span className={`text-[10px] ${theme.textMuted}`}>
                        {formatDate(localIssue.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`hidden md:block p-2 rounded-full transition ${
                    isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                  }`}
                >
                  <X size={20} className={theme.textMuted} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Description */}
                <div
                  className={`p-4 ${isDark ? "bg-white/5" : "bg-gray-50/50"}`}
                >
                  <p className={`text-sm leading-relaxed ${theme.text}`}>
                    {localIssue.description_en}
                  </p>
                  {localIssue.description_ta && (
                    <p
                      className={`text-sm mt-2 font-tamil leading-relaxed ${theme.textMuted}`}
                    >
                      {localIssue.description_ta}
                    </p>
                  )}

                  {/* Location */}
                  {localIssue.area && (
                    <div className="flex items-center gap-1 mt-3">
                      <MapPin size={12} className={theme.textMuted} />
                      <span className={`text-[10px] ${theme.textMuted}`}>
                        {localIssue.area}
                      </span>
                    </div>
                  )}

                  {/* Department Tag */}
                  <div
                    className={`mt-3 inline-block text-[10px] font-medium px-2 py-1 rounded ${
                      isDark
                        ? "bg-white/10 text-gray-300"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {localIssue.department || "General"}
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className={`p-6 border-b ${theme.border}`}>
                  <div className="flex justify-between items-center mb-6">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-widest ${theme.textMuted}`}
                    >
                      Progress Status
                    </span>
                    <span
                      className={`text-[9px] font-bold px-3 py-1 rounded-md ${getStatusColor(
                        localIssue.status,
                      )}`}
                    >
                      {getStatusDisplay(localIssue.status)}
                    </span>
                  </div>

                  <div className="relative flex justify-between px-2">
                    {/* Background line */}
                    <div
                      className={`absolute top-3.5 left-0 w-full h-0.5 ${
                        isDark ? "bg-gray-800" : "bg-gray-100"
                      } z-0`}
                    />

                    {/* Progress line */}
                    <motion.div
                      initial={false}
                      animate={{
                        width: `${getProgressPercentage(localIssue.status)}%`,
                      }}
                      className={`absolute top-3.5 left-0 h-0.5 z-0 transition-all duration-700 ${
                        isDark ? "bg-purple-500" : "bg-green-500"
                      }`}
                    />

                    {/* 4 Stages */}
                    {["send", "in progress", "resolved", "closed"].map(
                      (stage, idx) => {
                        const statusOrder = {
                          send: 0,
                          "in progress": 1,
                          resolved: 2,
                          closed: 3,
                        };
                        const currentStatus = normalizeStatus(
                          localIssue.status,
                        );
                        const currentOrder = statusOrder[currentStatus] || 0;
                        const isActive = idx <= currentOrder;

                        return (
                          <div
                            key={idx}
                            className="relative z-10 flex flex-col items-center gap-3"
                          >
                            <div
                              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${getStageColor(
                                stage,
                                isActive,
                              )} ${isActive ? "shadow-lg" : ""}`}
                            >
                              {isActive ? (
                                <Check size={14} strokeWidth={3} />
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              )}
                            </div>
                            <span
                              className={`text-[9px] font-medium lowercase ${getStageTextColor(
                                stage,
                                isActive,
                              )}`}
                            >
                              {stage === "in progress" ? "in progress" : stage}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className={`p-4 border-t ${theme.border}`}>
                <div className="flex items-center justify-between">
                  {/* LEFT SIDE */}
                  <div className="flex items-center gap-5">
                    {/* ❤️ LIKE */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={toggleLike}
                        className="transition hover:scale-110"
                      >
                        <Heart
                          size={22}
                          className={
                            localIssue.likes?.includes(citizenId)
                              ? "fill-red-500 text-red-500"
                              : theme.textMuted
                          }
                        />
                      </button>

                      <span className={`text-sm font-semibold ${theme.text}`}>
                        {localIssue.likes?.length || 0}
                      </span>
                    </div>

                    {/* 💬 COMMENT */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setCommentModalData({
                            ...localIssue,
                            setDisplayedIssues,
                            hideImage: true,
                          })
                        }
                        className="transition hover:scale-110"
                      >
                        <MessageCircle size={22} className={theme.textMuted} />
                      </button>

                      <span className={`text-sm font-semibold ${theme.text}`}>
                        {comments.length}
                      </span>
                    </div>
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="flex items-center gap-2 relative">
                    {/* 🔗 SHARE */}
                    <button
                      onClick={handleShare}
                      className={`p-2 rounded-full transition ${
                        isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                      }`}
                    >
                      <Share2 size={20} className={theme.textMuted} />
                    </button>

                    {/* ⋮ MENU */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === issue._id ? null : issue._id,
                        );
                      }}
                      className={`p-2 rounded-full transition ${
                        isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                      }`}
                    >
                      <MoreVertical size={20} className={theme.textMuted} />
                    </button>

                    {/* 🗑 DELETE POPUP */}
                    <AnimatePresence>
                      {openMenuId === issue._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 5 }}
                          className={`absolute right-0 bottom-12 rounded-xl border z-50 min-w-[130px] shadow-xl ${
                            isDark
                              ? "bg-gray-900 border-gray-700"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <button
                            onClick={(e) => handleDeleteClick(issue._id, e)}
                            className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 text-sm"
                          >
                            🗑 Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {deleteModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className={`w-[90%] max-w-sm p-6 rounded-2xl shadow-2xl ${
                isDark ? "bg-gray-900 text-white" : "bg-white text-black"
              }`}
            >
              <h2 className="text-lg font-bold mb-2">Delete Report</h2>

              <p className="text-sm opacity-70 mb-5">
                Are you sure you want to delete this report?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PostModal;
