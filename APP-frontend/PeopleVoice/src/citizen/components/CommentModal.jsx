import React, { useState, useEffect, useRef } from "react";
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

// Helper: Build nested comment tree
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
      if (parent) {
        parent.replies.push(node);
      } else {
        rootComments.push(node);
      }
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
  setDisplayedIssues, // now used to update parent
  isDark: propIsDark,
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const theme = isDark ? themeColors.dark : themeColors.light;

  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [localComments, setLocalComments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [activeMenuCommentId, setActiveMenuCommentId] = useState(null);

  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (open) {
      const tree = buildCommentTree(initialComments);
      setLocalComments(tree);
      setActiveMenuCommentId(null);
    }
  }, [initialComments, open]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

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

  // Add comment
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

    setLocalComments((prev) => {
      if (isReply) {
        const addReplyRecursively = (comments) => {
          return comments.map((c) => {
            if (c._id === replyTo.commentId) {
              return { ...c, replies: [...c.replies, optimisticComment] };
            }
            if (c.replies?.length) {
              return { ...c, replies: addReplyRecursively(c.replies) };
            }
            return c;
          });
        };
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
      if (!data.success) throw new Error("Failed to post");

      setLocalComments((prev) => {
        const replaceIdRecursively = (comments) => {
          return comments.map((c) => {
            if (c._id === tempId) {
              return { ...c, _id: data.newComment?._id || c._id };
            }
            if (c.replies?.length) {
              return { ...c, replies: replaceIdRecursively(c.replies) };
            }
            return c;
          });
        };
        return replaceIdRecursively(prev);
      });

      setReplyTo(null);
      setTimeout(
        () => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        120
      );
    } catch (err) {
      console.error(err);
      setText(currentText);
      alert("Failed to post comment");
    } finally {
      setIsSending(false);
    }
  };

  const startReply = (comment) => {
    setReplyTo({ commentId: comment._id, username: comment.citizenId });
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  // Update parent issue's comment likes (for persistence)
  const updateParentCommentLike = (commentId, newLikes) => {
    if (!setDisplayedIssues) return;

    setDisplayedIssues((prevIssues) =>
      prevIssues.map((issue) => {
        if (issue._id !== issueId) return issue;
        // Update the comment in the flat comments array (assuming backend returns flat list)
        const updatedComments = issue.comments.map((comment) => {
          if (comment._id === commentId) {
            return { ...comment, likes: newLikes };
          }
          return comment;
        });
        return { ...issue, comments: updatedComments };
      })
    );
  };

  // Like/Unlike with revert and parent update
  const toggleLike = async (commentId) => {
    // Find current comment before updating (for revert)
    let previousComment = null;
    const findComment = (comments) => {
      for (let c of comments) {
        if (c._id === commentId) return c;
        if (c.replies?.length) {
          const found = findComment(c.replies);
          if (found) return found;
        }
      }
      return null;
    };
    previousComment = findComment(localComments);

    // Optimistic update
    const updateLike = (comments) => {
      return comments.map((c) => {
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
    };

    setLocalComments((prev) => updateLike(prev));

    try {
      const res = await fetch(`${APIURL}/issues/${issueId}/comment/${commentId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error("Like failed");

      // Update parent with the server's new likes array
      if (data.likes) {
        updateParentCommentLike(commentId, data.likes);
      }

      // Optionally sync local state with server's data (optional, but safe)
      setLocalComments((prev) => {
        const syncLike = (comments) => {
          return comments.map((c) => {
            if (c._id === commentId && data.likes) {
              return { ...c, likes: data.likes };
            }
            if (c.replies?.length) {
              return { ...c, replies: syncLike(c.replies) };
            }
            return c;
          });
        };
        return syncLike(prev);
      });
    } catch (err) {
      console.error(err);
      // Revert optimistic update
      setLocalComments((prev) => {
        const revertLike = (comments) => {
          return comments.map((c) => {
            if (c._id === commentId) {
              // Restore previous state
              return previousComment;
            }
            if (c.replies?.length) {
              return { ...c, replies: revertLike(c.replies) };
            }
            return c;
          });
        };
        return revertLike(prev);
      });
      alert("Failed to like comment");
    }
  };

  // Delete comment (with revert on failure)
  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    const previousComments = localComments;

    const removeCommentRecursively = (comments) => {
      return comments
        .filter((c) => c._id !== commentId)
        .map((c) => {
          if (c.replies?.length) {
            return { ...c, replies: removeCommentRecursively(c.replies) };
          }
          return c;
        });
    };

    setLocalComments((prev) => removeCommentRecursively(prev));
    setActiveMenuCommentId(null);

    try {
      const res = await fetch(`${APIURL}/issues/${issueId}/comment/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Delete failed");
    } catch (err) {
      console.error("Delete failed:", err);
      setLocalComments(previousComments);
      alert("Could not delete comment. Try again.");
    }
  };

  // Render comment with Instagram‑style reply toggle
  const renderComment = (comment, level = 0) => {
    const isLiked = comment.likes?.includes(citizenId);
    const isOwnComment = comment.citizenId === citizenId;
    const isPostOwner = citizenId === postOwnerId;
    const canDelete = isOwnComment || isPostOwner;

    const indent = level * 16;
    const hasReplies = (comment.replies?.length || 0) > 0;
    const isExpanded = expandedReplies[comment._id] ?? false;
    const showMenu = activeMenuCommentId === comment._id;

    const avatarWidth = 36;
    const avatarGap = 12;
    const avatarOffset = avatarWidth + avatarGap;
    const togglePadding = avatarOffset + indent;

    return (
      <div
        key={comment._id}
        style={{ paddingLeft: `${indent}px` }}
        className="relative"
      >
        {/* Main comment block */}
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
                  onClick={() => startReply(comment)}
                  className="hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  <Reply size={14} /> Reply
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => toggleLike(comment._id)}>
              <Heart
                size={18}
                className={`transition-all duration-200 ${
                  isLiked
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

        {/* Toggle when collapsed */}
        {hasReplies && !isExpanded && (
          <div
            style={{ paddingLeft: `${togglePadding}px` }}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1"
          >
            <div className="w-8 h-px bg-gray-600 dark:bg-gray-700"></div>
            <button
              onClick={() =>
                setExpandedReplies((p) => ({
                  ...p,
                  [comment._id]: true,
                }))
              }
              className="flex items-center gap-1 hover:text-blue-500 transition-colors font-medium"
            >
              <ChevronDown size={14} /> View replies{" "}
              {comment.replies.length > 0 && `(${comment.replies.length})`}
            </button>
          </div>
        )}

        {/* Replies when expanded */}
        {hasReplies && isExpanded && (
          <>
            <div className="mt-2">
              {comment.replies.map((reply) => renderComment(reply, level + 1))}
            </div>
            <div
              style={{ paddingLeft: `${togglePadding}px` }}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1"
            >
              <div className="w-8 h-px bg-gray-600 dark:bg-gray-700"></div>
              <button
                onClick={() =>
                  setExpandedReplies((p) => ({
                    ...p,
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

          {/* Comments list */}
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
                  onClick={cancelReply}
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