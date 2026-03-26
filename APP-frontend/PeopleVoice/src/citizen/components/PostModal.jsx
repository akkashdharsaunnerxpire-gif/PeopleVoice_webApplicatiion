import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import CommentModal from "./CommentModal";
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
  setSelectedPost,
  isDark: propIsDark,
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const theme = isDark ? themeColors.dark : themeColors.light;

  const [text, setText] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [localIssue, setLocalIssue] = useState(issue);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (issue) {
      setLocalIssue(issue);
      setCurrentImageIndex(0);
      setText("");
    }
  }, [issue]);

  useEffect(() => {
    const savedIssues = JSON.parse(localStorage.getItem("savedIssues") || "[]");
    setIsSaved(savedIssues.includes(issue?._id));
  }, [issue?._id]);

  const allImages = localIssue?.images_data || [];
  const totalImages = allImages.length;
  const comments = localIssue?.comments || [];

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
    } finally {
      setIsLiking(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !citizenId || isSending) return;
    setIsSending(true);

    try {
      const res = await fetch(`${APIURL}/issues/${issue._id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId, text }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalIssue((prev) => ({ ...prev, comments: data.comments }));
        setText("");
      }
    } catch (err) {
      console.error("Comment failed", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSave = () => {
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);

    const savedIssues = JSON.parse(localStorage.getItem("savedIssues") || "[]");
    if (newSavedState) {
      if (!savedIssues.includes(issue._id)) {
        savedIssues.push(issue._id);
      }
    } else {
      const index = savedIssues.indexOf(issue._id);
      if (index > -1) savedIssues.splice(index, 1);
    }
    localStorage.setItem("savedIssues", JSON.stringify(savedIssues));
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

  const getStatusDisplay = (status) => {
    const statusLower = status?.toLowerCase() || "send";
    switch (statusLower) {
      case "send":
        return "SENT";
      case "in progress":
        return "IN PROGRESS";
      case "resolved":
        return "RESOLVED";
      case "solved":
        return "SOLVED";
      default:
        return status?.toUpperCase() || "SENT";
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || "send";
    if (isDark) {
      switch (statusLower) {
        case "send":
          return "bg-rose-900/40 text-rose-300 border border-rose-800";
        case "in progress":
          return "bg-amber-900/40 text-amber-300 border border-amber-800";
        case "resolved":
          return "bg-emerald-900/40 text-emerald-300 border border-emerald-800";
        case "solved":
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
        case "solved":
          return "bg-purple-100 text-purple-700 border border-purple-200";
        default:
          return "bg-gray-100 text-gray-700 border border-gray-200";
      }
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
        case "solved":
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
        case "solved":
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
        case "solved":
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
        case "solved":
          return "text-purple-600";
        default:
          return "text-green-600";
      }
    }
  };

  if (!issue) return null;

  return (
    <>
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
                    isDark ? "bg-white/10 text-gray-300" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {localIssue.department || "General"}
                </div>
              </div>

              {/* Progress Tracker */}
              <div className={`p-6 border-b ${theme.border}`}>
                <div className="flex justify-between items-center mb-6">
                  <span className={`text-[10px] font-semibold uppercase tracking-widest ${theme.textMuted}`}>
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
                      width: (() => {
                        const status = localIssue.status?.toLowerCase() || "send";
                        if (status === "solved") return "100%";
                        if (status === "resolved") return "75%";
                        if (status === "in progress") return "50%";
                        return "25%";
                      })(),
                    }}
                    className={`absolute top-3.5 left-0 h-0.5 z-0 transition-all duration-700 ${
                      isDark ? "bg-purple-500" : "bg-green-500"
                    }`}
                  />

                  {/* 4 Stages */}
                  {["send", "in progress", "resolved", "solved"].map((stage, idx) => {
                    const statusOrder = { send: 0, "in progress": 1, resolved: 2, solved: 3 };
                    const currentStatus = localIssue.status?.toLowerCase() || "send";
                    const currentOrder = statusOrder[currentStatus] || 0;
                    const isActive = idx <= currentOrder;

                    return (
                      <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                            getStageColor(stage, isActive)
                          } ${isActive ? "shadow-lg" : ""}`}
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
                            isActive
                          )}`}
                        >
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comments (Desktop) */}
              {!isMobile && (
                <div className="p-4 space-y-4">
                  <h3 className={`text-xs font-semibold ${theme.text}`}>
                    Comments ({comments.length})
                  </h3>
                  {comments.length > 0 ? (
                    comments.map((c) => (
                      <div key={c._id} className="flex gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-medium ${
                            isDark
                              ? "bg-purple-900/50 text-purple-300"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {c.citizenId?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium text-xs ${theme.text}`}>
                              {c.citizenId}
                            </span>
                            <span className={`text-[8px] ${theme.textMuted}`}>
                              {formatDate(c.createdAt)}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 leading-relaxed ${theme.textMuted}`}>
                            {c.text}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`py-8 text-center text-xs ${theme.textMuted}`}>
                      No comments yet
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className={`p-4 border-t ${theme.border}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-5">
                  <button onClick={toggleLike} className="transition hover:scale-110">
                    <Heart
                      size={24}
                      className={
                        localIssue.likes?.includes(citizenId)
                          ? "fill-red-500 text-red-500"
                          : theme.textMuted
                      }
                    />
                  </button>
                  <button
                    onClick={() => (isMobile ? setShowCommentModal(true) : inputRef.current?.focus())}
                    className="transition hover:scale-110"
                  >
                    <MessageCircle size={24} className={theme.textMuted} />
                  </button>
                  <button
                    onClick={() =>
                      navigator.share?.({
                        title: "Issue Report",
                        text: localIssue.description_en,
                        url: window.location.href,
                      })
                    }
                    className="transition hover:scale-110"
                  >
                    <Share2 size={22} className={theme.textMuted} />
                  </button>
                </div>
                <button onClick={handleSave} className="transition hover:scale-110">
                  <Bookmark
                    size={24}
                    className={isSaved ? "fill-green-500 text-green-500" : theme.textMuted}
                  />
                </button>
              </div>

              <div className={`font-semibold text-sm ${theme.text}`}>
                {localIssue.likes?.length || 0} likes
              </div>

              {isMobile && (
                <button
                  onClick={() => setShowCommentModal(true)}
                  className={`text-xs font-medium mt-1 ${
                    isDark ? "text-purple-400" : "text-green-600"
                  }`}
                >
                  View all {comments.length} comments
                </button>
              )}
            </div>

            {/* Comment Input (Desktop) */}
            {!isMobile && (
              <div className={`p-4 border-t ${theme.border} flex items-center gap-3`}>
                <input
                  ref={inputRef}
                  className={`flex-1 text-sm outline-none bg-transparent ${theme.text}`}
                  placeholder="Add a comment..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  disabled={!text.trim() || isSending}
                  onClick={handleSend}
                  className={`font-semibold text-sm disabled:opacity-30 ${
                    isDark ? "text-purple-400" : "text-green-600"
                  }`}
                >
                  {isSending ? "..." : "Post"}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <CommentModal
        open={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        issueId={issue._id}
        comments={comments}
        images={allImages}
        citizenId={citizenId}
        isDark={isDark}
        setDisplayedIssues={setDisplayedIssues}
        setSelectedPost={setSelectedPost}
        setLocalIssue={setLocalIssue}
      />
    </>
  );
};

export default PostModal;