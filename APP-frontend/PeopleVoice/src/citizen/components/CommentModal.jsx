import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Heart,
  MoreHorizontal,
  ArrowLeft,
  Smile,
  Reply,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";
import { themeColors } from "./constants";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const APIURL = `${BACKEND_URL}/api`;

// Helper: Build nested comment tree from flat array
const buildCommentTree = (flatComments) => {
  const commentMap = new Map();
  const rootComments = [];

  flatComments.forEach((comment) => {
    commentMap.set(comment._id, { ...comment, replies: [] });
  });

  flatComments.forEach((comment) => {
    const node = commentMap.get(comment._id);
    if (comment.parentCommentId) {
      const parent = commentMap.get(comment.parentCommentId);
      if (parent) parent.replies.push(node);
    } else {
      rootComments.push(node);
    }
  });

  return rootComments;
};

const CommentModal = ({
  open,
  onClose,
  issueId,
  comments: initialComments = [],
  images = [],
  citizenId,
  postOwnerId,
  district,
  setDisplayedIssues, // optional – used to update parent feed
  isDark: propIsDark,
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const theme = isDark ? themeColors.dark : themeColors.light;

  // State
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [localComments, setLocalComments] = useState([]);
  const [likingMap, setLikingMap] = useState({}); // 🔥 track each comment
  const [replyTo, setReplyTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [activeMenuCommentId, setActiveMenuCommentId] = useState(null);

  // Refs
  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  // Reset local state when modal opens
  useEffect(() => {
    if (open) {
      const tree = buildCommentTree(initialComments);
      setLocalComments(tree);
      setReplyTo(null);
      setActiveMenuCommentId(null);
      setText("");
    }
  }, [initialComments, open]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  // Focus input when replying
  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuCommentId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!open) return null;

  const allImages = images?.length > 0 ? images : [];

  // ----- Helper: Update parent issue's comments and commentCount -----
  const updateParentAfterComment = useCallback(
    (newComment, isDelete = false, deletedCommentId = null) => {
      if (!setDisplayedIssues) return;

      setDisplayedIssues((prevIssues) =>
        prevIssues.map((issue) => {
          if (issue._id !== issueId) return issue;

          let updatedComments = [...issue.comments];
          if (!isDelete && newComment) {
            updatedComments.push(newComment);
          } else if (isDelete && deletedCommentId) {
            updatedComments = updatedComments.filter(
              (c) => c._id !== deletedCommentId,
            );
          }

          return {
            ...issue,
            comments: updatedComments,
            commentCount: updatedComments.length,
          };
        }),
      );
    },
    [issueId, setDisplayedIssues],
  );

  // Helper: Update likes in parent issue
  const updateParentCommentLike = useCallback(
    (commentId, newLikes) => {
      if (!setDisplayedIssues) return;

      const updateRecursive = (comments) =>
        comments.map((c) => {
          if (c._id === commentId) return { ...c, likes: newLikes };
          if (c.replies?.length) {
            return { ...c, replies: updateRecursive(c.replies) };
          }
          return c;
        });

      setDisplayedIssues((prevIssues) =>
        prevIssues.map((issue) => {
          if (issue._id !== issueId) return issue;
          return {
            ...issue,
            comments: updateRecursive(issue.comments),
          };
        }),
      );
    },
    [issueId, setDisplayedIssues],
  );

  // ----- Add comment (root or reply) -----
  const handleSend = async () => {
    if (!text.trim() || isSending) return;

    const currentText = text.trim();
    setText("");
    setIsSending(true);

    const isReply = !!replyTo;
    const payload = {
      citizenId,
      text: currentText,
      ...(isReply && { parentCommentId: replyTo.commentId }),
    };

    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      _id: tempId,
      citizenId,
      text: currentText,
      likes: [],
      createdAt: new Date().toISOString(),
      parentCommentId: isReply ? replyTo.commentId : null,
      replies: [],
    };

    // Optimistic UI update
    setLocalComments((prev) => {
      if (isReply) {
        const addReplyRecursively = (comments) =>
          comments.map((c) => {
            if (c._id === replyTo.commentId) {
              return { ...c, replies: [...c.replies, optimisticComment] };
            }
            if (c.replies?.length) {
              return { ...c, replies: addReplyRecursively(c.replies) };
            }
            return c;
          });
        return addReplyRecursively(prev);
      }
      return [...prev, optimisticComment];
    });

    try {
      const res = await fetch(`${APIURL}/issues/${issueId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to post");

      const serverComment = data.newComment;

      // Replace temp ID with real ID
      setLocalComments((prev) => {
        const replaceIdRecursively = (comments) =>
          comments.map((c) => {
            if (c._id === tempId) return { ...c, _id: serverComment._id };
            if (c.replies?.length) {
              return { ...c, replies: replaceIdRecursively(c.replies) };
            }
            return c;
          });
        return replaceIdRecursively(prev);
      });

      // Update parent feed
      updateParentAfterComment(serverComment);

      // Clear reply state
      setReplyTo(null);
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Comment post error:", err);
      setText(currentText);
      alert(err.message || "Failed to post comment. Please try again.");
      // Revert optimistic update: we could re-fetch, but simplest is to reload comments
      // Alternatively, we could revert state, but for simplicity we'll refresh from initial
      setLocalComments(buildCommentTree(initialComments));
    } finally {
      setIsSending(false);
    }
  };

  // ----- Like / Unlike -----

  const toggleLike = async (commentId) => {
    // 🚫 Prevent multiple clicks on same comment
    if (likingMap[commentId]) return;

    let previousState;

    // lock this comment
    setLikingMap((prev) => ({ ...prev, [commentId]: true }));

    // ✅ Optimistic update
    setLocalComments((prev) => {
      previousState = structuredClone(prev); // 🔥 better than JSON copy

      const updateLike = (comments) =>
        comments.map((c) => {
          if (c._id === commentId) {
            const alreadyLiked = c.likes?.includes(citizenId);
            return {
              ...c,
              likes: alreadyLiked
                ? c.likes.filter((id) => id !== citizenId)
                : [...(c.likes || []), citizenId],
            };
          }
          if (c.replies?.length) {
            return { ...c, replies: updateLike(c.replies) };
          }
          return c;
        });

      return updateLike(prev);
    });

    try {
      const res = await fetch(
        `${APIURL}/issues/${issueId}/comment/${commentId}/like`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citizenId }),
        },
      );

      const data = await res.json();
      if (!data.success) throw new Error("Like request failed");

      // ✅ Sync with backend (source of truth)
      if (data.likes) {
        setLocalComments((prev) => {
          const syncLike = (comments) =>
            comments.map((c) => {
              if (c._id === commentId) {
                return { ...c, likes: data.likes };
              }
              if (c.replies?.length) {
                return { ...c, replies: syncLike(c.replies) };
              }
              return c;
            });

          return syncLike(prev);
        });

        updateParentCommentLike(commentId, data.likes);
      }
    } catch (err) {
      console.error("Like error:", err);

      // 🔥 rollback safely
      if (previousState) {
        setLocalComments(previousState);
      }

      alert("Failed to like comment. Please try again.");
    } finally {
      // 🔓 unlock
      setLikingMap((prev) => {
        const updated = { ...prev };
        delete updated[commentId];
        return updated;
      });
    }
  };
  // ----- Delete comment -----
  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    const previousComments = JSON.parse(JSON.stringify(localComments));

    // Optimistic UI removal
    const removeCommentRecursively = (comments) =>
      comments
        .filter((c) => c._id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies ? removeCommentRecursively(c.replies) : [],
        }));

    setLocalComments(removeCommentRecursively(localComments));
    setActiveMenuCommentId(null);

    // Optimistic parent update
    updateParentAfterComment(null, true, commentId);

    try {
      const res = await fetch(
        `${APIURL}/issues/${issueId}/comment/${commentId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citizenId }),
        },
      );

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Delete failed");
    } catch (err) {
      console.error("Delete error:", err);
      // Rollback
      setLocalComments(previousComments);
      updateParentAfterComment(null, false); // refresh parent with original comments
      alert("Could not delete comment. Try again.");
    }
  };

  // ----- Render a single comment and its replies -----
  const renderComment = (comment, level = 0) => {
    const isLiked = comment.likes?.includes(citizenId);
    const isOwnComment = comment.citizenId === citizenId;
    const isPostOwner = citizenId === postOwnerId;
    const canDelete = isOwnComment || isPostOwner;

    const hasReplies = (comment.replies?.length || 0) > 0;
    const isExpanded = expandedReplies[comment._id] ?? false;
    const showMenu = activeMenuCommentId === comment._id;

    // Indentation: each level adds 16px left padding
    const indent = level * 16;

    return (
      <div
        key={comment._id}
        style={{ paddingLeft: `${indent}px` }}
        className="relative"
      >
        {/* Main comment */}
        <div
          className={`flex items-start justify-between px-4 py-3 relative ${
            level > 0 ? `${theme.replyBg} ${theme.replyBorder}` : ""
          }`}
        >
          <div className="flex gap-3 flex-1">
            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {comment.citizenId?.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className={theme.text}>
                <span className="font-semibold">{comment.citizenId}</span>{" "}
                {comment.text}
              </p>
              <div className={`flex gap-4 mt-1 text-xs ${theme.textMuted}`}>
                <span>
                  {new Date(comment.createdAt).toLocaleString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {comment.likes?.length > 0 && (
                  <span>{comment.likes.length} likes</span>
                )}
                <button
                  onClick={() =>
                    setReplyTo({
                      commentId: comment._id,
                      username: comment.citizenId,
                    })
                  }
                  className="hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  <Reply size={14} /> Reply
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleLike(comment._id)}
              disabled={likingMap[comment._id]}
            >
              <Heart
                size={18}
                className={`transition-all duration-200 ${
                  likingMap[comment._id]
                    ? "opacity-50 cursor-not-allowed scale-95"
                    : isLiked
                      ? "text-red-500 fill-red-500 scale-110"
                      : theme.textMuted
                }`}
              />
            </button>

            {canDelete && (
              <button
                onClick={() => setActiveMenuCommentId(comment._id)}
                className={`${theme.textMuted} hover:${theme.text} p-1 rounded-full`}
              >
                <MoreHorizontal size={20} />
              </button>
            )}
          </div>

          {/* Dropdown menu */}
          {showMenu && canDelete && (
            <div
              ref={menuRef}
              className={`absolute right-2 top-8 ${
                isDark ? "bg-gray-800" : "bg-white"
              } text-sm rounded-lg shadow-xl z-20 min-w-[100px] overflow-hidden border ${theme.border}`}
            >
              <button
                onClick={() => deleteComment(comment._id)}
                className="w-full text-left px-4 py-2.5 hover:bg-red-600/30 transition-colors flex items-center gap-2"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Collapsed replies toggle */}
        {hasReplies && !isExpanded && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1 ml-12">
            <div className="w-8 h-px bg-gray-600 dark:bg-gray-700"></div>
            <button
              onClick={() =>
                setExpandedReplies((prev) => ({ ...prev, [comment._id]: true }))
              }
              className="flex items-center gap-1 hover:text-blue-500 transition-colors font-medium"
            >
              <ChevronDown size={14} /> View replies ({comment.replies.length})
            </button>
          </div>
        )}

        {/* Expanded replies */}
        {hasReplies && isExpanded && (
          <>
            <div className="mt-2">
              {comment.replies.map((reply) => renderComment(reply, level + 1))}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1 ml-12">
              <div className="w-8 h-px bg-gray-600 dark:bg-gray-700"></div>
              <button
                onClick={() =>
                  setExpandedReplies((prev) => ({
                    ...prev,
                    [comment._id]: false,
                  }))
                }
                className="flex items-center gap-1 hover:text-blue-500 transition-colors font-medium"
              >
                <ChevronUp size={14} /> Hide replies
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // ----- Main render -----
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 md:p-4">
      <div
        className={`w-full h-full md:max-w-6xl md:h-[90vh] md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl ${theme.card}`}
      >
        {/* Left side – media preview */}
        <div className="hidden md:flex md:w-3/5 bg-black items-center justify-center border-r border-gray-800">
          {allImages.length > 0 ? (
            <img
              src={allImages[0]}
              className="max-h-full object-contain"
              alt="post"
            />
          ) : (
            <div className={theme.textMuted}>No media available</div>
          )}
        </div>

        {/* Right side – comments */}
        <div className="w-full md:w-2/5 flex flex-col h-full">
          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 border-b sticky top-0 z-20 ${theme.card} ${theme.border}`}
          >
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="mr-4 md:hidden">
                <ArrowLeft size={28} className={theme.text} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                  {postOwnerId?.slice(0, 2).toUpperCase() || "OP"}
                </div>
                <div>
                  <p className={`font-semibold ${theme.text}`}>
                    {postOwnerId || "User"}
                  </p>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {district || "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MoreHorizontal size={22} className={theme.textMuted} />
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
              >
                <X size={22} className={theme.text} />
              </button>
            </div>
          </div>

          {/* Comments scroll area */}
          <div className={`flex-1 overflow-y-auto p-2 ${theme.bg}`}>
            {localComments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <p className={`text-lg font-medium ${theme.text}`}>
                  No comments yet
                </p>
                <p className={`text-sm mt-2 ${theme.textMuted}`}>
                  Be the first to comment!
                </p>
              </div>
            ) : (
              localComments.map((c) => renderComment(c))
            )}
            <div ref={commentsEndRef} className="h-8" />
          </div>

          {/* Input area */}
          <div
            className={`border-t p-4 ${theme.border} sticky bottom-0 ${theme.card}`}
          >
            {replyTo && (
              <div
                className={`flex items-center justify-between text-sm mb-3 px-3 py-1.5 rounded-lg ${theme.replyBg}`}
              >
                <span className={theme.textMuted}>
                  Replying to @{replyTo.username}
                </span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-red-400 hover:text-red-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {citizenId?.slice(0, 2).toUpperCase() || "?"}
              </div>

              <div
                className={`flex-1 flex items-center rounded-full px-4 py-2 border ${theme.inputBg}`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={
                    replyTo
                      ? `Reply to @${replyTo.username}...`
                      : "Add a comment..."
                  }
                  className={`flex-1 bg-transparent focus:outline-none text-base ${theme.text}`}
                  value={text}
                  disabled={isSending}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <div className="flex items-center gap-3">
                  <Smile size={24} className={theme.textMuted} />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || isSending}
                    className={`font-semibold transition-colors ${
                      text.trim() && !isSending
                        ? "text-blue-500 hover:text-blue-400"
                        : "text-blue-600/40 cursor-not-allowed"
                    }`}
                  >
                    {isSending ? "..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
