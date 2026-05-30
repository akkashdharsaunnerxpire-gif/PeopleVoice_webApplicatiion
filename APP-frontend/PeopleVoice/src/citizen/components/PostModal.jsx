// PostModal.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import {
  X,
  Heart,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Share2,
  Check,
  MapPin,
  Clock,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  CheckCheck,
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
  showToast,
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    description_en: "",
    description_ta: "",
    area: "",
    department: "",
  });
  const [copiedLink, setCopiedLink] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const allImages = (localIssue?.images || []).map((img) =>
    typeof img === "string" ? img : img.url
  );
  const totalImages = allImages.length;
  const comments = localIssue?.comments || [];
  const canEdit = localIssue?.status === "send" && citizenId === localIssue?.citizenId;

  useEffect(() => {
    setLocalIssue(issue);
    setCurrentImageIndex(0);
  }, [issue]);

  useEffect(() => {
    if (editModal && localIssue) {
      setEditForm({
        description_en: localIssue.description_en || "",
        description_ta: localIssue.description_ta || "",
        area: localIssue.area || "",
        department: localIssue.department || "",
      });
    }
  }, [editModal, localIssue]);

  const nextImage = useCallback(
    (e) => {
      e?.stopPropagation();
      if (currentImageIndex < totalImages - 1)
        setCurrentImageIndex((prev) => prev + 1);
    },
    [currentImageIndex, totalImages]
  );

  const prevImage = useCallback(
    (e) => {
      e?.stopPropagation();
      if (currentImageIndex > 0) setCurrentImageIndex((prev) => prev - 1);
    },
    [currentImageIndex]
  );

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
          prev.map((i) => (i._id === issue._id ? { ...i, likes: data.likes } : i))
        );
      }
    } catch (err) {
      setLocalIssue((prev) => ({ ...prev, likes: issue.likes }));
      showToast?.(err.message || "Failed to like", "error");
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/issue/${localIssue._id}`;
    const shareData = {
      title: "Community Issue Report",
      text: localIssue.description_en,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast?.("Shared successfully!", "success");
      } catch (err) {
        if (err.name !== "AbortError") showToast?.("Share cancelled", "error");
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text}\n\nView this issue at: ${shareUrl}`);
        setCopiedLink(true);
        showToast?.("Link copied to clipboard!", "success");
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        showToast?.("Failed to copy link", "error");
      }
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${APIURL}/issues/${deleteModal}`, {
        data: { citizenId },
      });
      setDisplayedIssues?.((prev) => prev.filter((issue) => issue._id !== deleteModal));
      showToast?.("Report deleted successfully", "success");
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
      showToast?.("Failed to delete report", "error");
    } finally {
      setIsDeleting(false);
      setDeleteModal(null);
      setOpenMenuId(null);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModal || !citizenId) return;
    setIsEditing(true);
    try {
      const response = await axios.patch(`${APIURL}/issues/${editModal}`, {
        ...editForm,
        citizenId,
      });
      if (response.data.success) {
        const updatedIssue = response.data.issue;
        setLocalIssue(updatedIssue);
        setDisplayedIssues?.((prev) =>
          prev.map((i) => (i._id === updatedIssue._id ? updatedIssue : i))
        );
        showToast?.("Report updated successfully", "success");
        setEditModal(null);
      }
    } catch (err) {
      console.error("Edit failed:", err);
      showToast?.("Failed to update report", "error");
    } finally {
      setIsEditing(false);
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
    if (!isActive) return isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
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

  if (!issue || !issue._id) return null;

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
                          currentImageIndex === totalImages - 1 ? "hidden" : "flex"
                        }`}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                  {totalImages > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                      {currentImageIndex + 1} / {totalImages}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-sm">No media available</div>
              )}

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
              <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
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
                <div className={`p-4 ${isDark ? "bg-white/5" : "bg-gray-50/50"}`}>
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
                  {localIssue.area && (
                    <div className="flex items-center gap-1 mt-3">
                      <MapPin size={12} className={theme.textMuted} />
                      <span className={`text-[10px] ${theme.textMuted}`}>
                        {localIssue.area}
                      </span>
                    </div>
                  )}
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
                        localIssue.status
                      )}`}
                    >
                      {getStatusDisplay(localIssue.status)}
                    </span>
                  </div>

                  <div className="relative flex justify-between px-2">
                    <div
                      className={`absolute top-3.5 left-0 w-full h-0.5 ${
                        isDark ? "bg-gray-800" : "bg-gray-100"
                      } z-0`}
                    />
                    <motion.div
                      initial={false}
                      animate={{
                        width: `${getProgressPercentage(localIssue.status)}%`,
                      }}
                      className={`absolute top-3.5 left-0 h-0.5 z-0 transition-all duration-700 ${
                        isDark ? "bg-purple-500" : "bg-green-500"
                      }`}
                    />
                    {["send", "in progress", "resolved", "closed"].map((stage, idx) => {
                      const statusOrder = { send: 0, "in progress": 1, resolved: 2, closed: 3 };
                      const currentStatus = normalizeStatus(localIssue.status);
                      const currentOrder = statusOrder[currentStatus] || 0;
                      const isActive = idx <= currentOrder;
                      return (
                        <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${getStageColor(
                              stage,
                              isActive
                            )} ${isActive ? "shadow-lg" : ""}`}
                          >
                            {isActive ? <Check size={14} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                          </div>
                          <span
                            className={`text-[9px] font-medium lowercase ${getStageTextColor(
                              stage,
                              isActive
                            )}`}
                          >
                            {stage === "in progress" ? "in progress" : stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className={`p-4 border-t ${theme.border}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={toggleLike}
                        className="transition hover:scale-110"
                        disabled={isLiking}
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

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setCommentModalData({
                            open: true,
                            issueId: localIssue?._id,
                            comments: localIssue.comments || [],
                            images: localIssue.images?.length
                              ? localIssue.images
                              : localIssue.images_data || [],
                            citizenId: citizenId,
                            postOwnerId: localIssue.citizenId,
                            district: localIssue.district,
                            setDisplayedIssues: setDisplayedIssues,
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

                    <button
                      onClick={handleShare}
                      className="transition hover:scale-110"
                    >
                      {copiedLink ? (
                        <CheckCheck size={20} className="text-green-500" />
                      ) : (
                        <Share2 size={20} className={theme.textMuted} />
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === issue._id ? null : issue._id);
                      }}
                      className={`p-2 rounded-full transition ${
                        isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                      }`}
                    >
                      <MoreVertical size={20} className={theme.textMuted} />
                    </button>

                    <AnimatePresence>
                      {openMenuId === issue._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 5 }}
                          className={`absolute right-0 bottom-12 rounded-xl border z-50 min-w-[140px] shadow-xl ${
                            isDark
                              ? "bg-gray-900 border-gray-700"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditModal(issue._id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <Edit size={14} /> Edit Report
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              setDeleteModal(issue._id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Trash2 size={14} /> Delete
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

      {/* Delete Confirmation Modal */}
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
                Are you sure you want to delete this report? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white disabled:opacity-70 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
                isDark ? "bg-gray-900 text-white" : "bg-white text-black"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                <h2 className="text-lg font-bold">Edit Report</h2>
                <p className="text-xs opacity-70 mt-1">Update your report details</p>
              </div>
              <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Description (English)</label>
                  <textarea
                    value={editForm.description_en}
                    onChange={(e) => setEditForm({ ...editForm, description_en: e.target.value })}
                    className={`w-full p-2 rounded-lg border text-sm ${
                      isDark
                        ? "bg-gray-800 border-gray-700 focus:border-purple-500"
                        : "bg-gray-50 border-gray-200 focus:border-purple-500"
                    } focus:outline-none focus:ring-1 focus:ring-purple-500`}
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (Tamil)</label>
                  <textarea
                    value={editForm.description_ta}
                    onChange={(e) => setEditForm({ ...editForm, description_ta: e.target.value })}
                    className={`w-full p-2 rounded-lg border text-sm ${
                      isDark
                        ? "bg-gray-800 border-gray-700 focus:border-purple-500"
                        : "bg-gray-50 border-gray-200 focus:border-purple-500"
                    } focus:outline-none focus:ring-1 focus:ring-purple-500`}
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Area / Location</label>
                  <input
                    type="text"
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    className={`w-full p-2 rounded-lg border text-sm ${
                      isDark
                        ? "bg-gray-800 border-gray-700 focus:border-purple-500"
                        : "bg-gray-50 border-gray-200 focus:border-purple-500"
                    } focus:outline-none focus:ring-1 focus:ring-purple-500`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className={`w-full p-2 rounded-lg border text-sm ${
                      isDark
                        ? "bg-gray-800 border-gray-700 focus:border-purple-500"
                        : "bg-gray-50 border-gray-200 focus:border-purple-500"
                    } focus:outline-none focus:ring-1 focus:ring-purple-500`}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditModal(null)}
                    className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditing}
                    className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isEditing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PostModal;