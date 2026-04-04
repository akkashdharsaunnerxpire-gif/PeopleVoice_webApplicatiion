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
  if (!flatComments || flatComments.length === 0) return [];

  if (flatComments.length > 0 && flatComments[0].replies !== undefined) {
    return flatComments;
  }

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

// Helper: Add a reply to a specific parent in the comment tree
const addReplyToTree = (comments, parentId, newReply) => {
  return comments.map((comment) => {
    if (comment._id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), newReply],
      };
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToTree(comment.replies, parentId, newReply),
      };
    }
    return comment;
  });
};

// Helper: Replace an optimistic comment (by tempId) in the tree
const replaceCommentInTree = (comments, tempId, serverComment) => {
  return comments.map((comment) => {
    if (comment._id === tempId) {
      return serverComment;
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: replaceCommentInTree(comment.replies, tempId, serverComment),
      };
    }
    return comment;
  });
};

// Helper: Delete a comment from tree (any depth)
const deleteCommentFromTree = (comments, commentId) => {
  return comments
    .filter((comment) => comment._id !== commentId)
    .map((comment) => {
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: deleteCommentFromTree(comment.replies, commentId),
        };
      }
      return comment;
    });
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
  setDisplayedIssues,
  isDark: propIsDark,
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  // Instagram uses light background for comments, but we respect theme
  const bgColor = isDark ? "bg-black" : "bg-white";
  const textColor = isDark ? "text-white" : "text-gray-900";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";
  const borderColor = isDark ? "border-gray-800" : "border-gray-200";

  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [localComments, setLocalComments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [activeMenuCommentId, setActiveMenuCommentId] = useState(null);

  const lastLikeClickTime = useRef({});
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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
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

  const updateLikeInComments = useCallback((comments, commentId, newLikes) => {
    return comments.map((comment) => {
      if (comment._id === commentId) {
        return { ...comment, likes: newLikes };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateLikeInComments(comment.replies, commentId, newLikes),
        };
      }
      return comment;
    });
  }, []);

  const toggleLike = useCallback(
    async (commentId) => {
      const now = Date.now();
      const lastClick = lastLikeClickTime.current[commentId] || 0;
      if (now - lastClick < 300) return;
      lastLikeClickTime.current[commentId] = now;

      let currentLiked = false;
      let currentLikes = [];

      const findCurrentState = (comments) => {
        for (const comment of comments) {
          if (comment._id === commentId) {
            currentLikes = comment.likes || [];
            currentLiked = currentLikes.includes(citizenId);
            return true;
          }
          if (comment.replies?.length) {
            if (findCurrentState(comment.replies)) return true;
          }
        }
        return false;
      };

      findCurrentState(localComments);

      const newLikes = currentLiked
        ? currentLikes.filter((id) => id !== citizenId)
        : [...currentLikes, citizenId];

      setLocalComments((prev) =>
        updateLikeInComments(prev, commentId, newLikes),
      );

      if (setDisplayedIssues) {
        setDisplayedIssues((prevIssues) =>
          prevIssues.map((issue) =>
            issue._id === issueId
              ? {
                  ...issue,
                  comments: updateLikeInComments(
                    issue.comments,
                    commentId,
                    newLikes,
                  ),
                }
              : issue,
          ),
        );
      }

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
        if (!data.success) throw new Error();

        if (data.likes !== undefined) {
          const saved = JSON.parse(sessionStorage.getItem("feedData"));
          if (saved) {
            const updatedIssues = saved.issues.map((issue) =>
              issue._id === issueId
                ? {
                    ...issue,
                    comments: updateLikeInComments(
                      issue.comments,
                      commentId,
                      data.likes,
                    ),
                  }
                : issue,
            );
            sessionStorage.setItem(
              "feedData",
              JSON.stringify({
                ...saved,
                issues: updatedIssues,
                timestamp: Date.now(),
              }),
            );
          }
          setLocalComments((prev) =>
            updateLikeInComments(prev, commentId, data.likes),
          );
        }
      } catch (err) {
        setLocalComments((prev) =>
          updateLikeInComments(prev, commentId, currentLikes),
        );
      }
    },
    [citizenId, issueId, setDisplayedIssues, updateLikeInComments, localComments],
  );

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
      isOptimistic: true,
    };

    if (isReply) {
      setLocalComments((prev) =>
        addReplyToTree(prev, replyTo.commentId, optimisticComment)
      );
    } else {
      setLocalComments((prev) => [...prev, optimisticComment]);
    }

    try {
      const res = await fetch(`${APIURL}/issues/${issueId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error();

      const serverComment = data.newComment;

      setLocalComments((prev) =>
        replaceCommentInTree(prev, tempId, serverComment)
      );

      updateParentAfterComment(serverComment);

      const saved = JSON.parse(sessionStorage.getItem("feedData"));
      if (saved) {
        const updatedIssues = saved.issues.map((issue) =>
          issue._id === issueId
            ? {
                ...issue,
                comments: [...issue.comments, serverComment],
              }
            : issue,
        );
        sessionStorage.setItem(
          "feedData",
          JSON.stringify({
            ...saved,
            issues: updatedIssues,
            timestamp: Date.now(),
          }),
        );
      }

      setReplyTo(null);
    } catch (err) {
      if (isReply) {
        setLocalComments((prev) => deleteCommentFromTree(prev, tempId));
      } else {
        setLocalComments((prev) => prev.filter((c) => c._id !== tempId));
      }
      setText(currentText);
    } finally {
      setIsSending(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    const previousComments = [...localComments];

    setLocalComments((prev) => deleteCommentFromTree(prev, commentId));

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
      if (!data.success) throw new Error();

      const saved = JSON.parse(sessionStorage.getItem("feedData"));
      if (saved) {
        const updatedIssues = saved.issues.map((issue) =>
          issue._id === issueId
            ? {
                ...issue,
                comments: issue.comments.filter((c) => c._id !== commentId),
              }
            : issue,
        );
        sessionStorage.setItem(
          "feedData",
          JSON.stringify({
            ...saved,
            issues: updatedIssues,
            timestamp: Date.now(),
          }),
        );
      }
    } catch (err) {
      setLocalComments(previousComments);
    }
  };

  const renderComment = (comment, level = 0) => {
    const isLiked = comment.likes?.includes(citizenId);
    const isOwnComment = comment.citizenId === citizenId;
    const isPostOwner = citizenId === postOwnerId;
    const canDelete = isOwnComment || isPostOwner;
    const isOptimistic = comment.isOptimistic;

    const hasReplies = (comment.replies?.length || 0) > 0;
    const isExpanded = expandedReplies[comment._id] ?? false;
    const showMenu = activeMenuCommentId === comment._id;

    // Instagram indentation: 48px per level
    const indent = Math.min(level * 48, 96);

    return (
      <div
        key={comment._id}
        className="relative"
      >
        <div className={`flex items-start space-x-3 py-2 ${isOptimistic ? "opacity-60" : ""}`}>
          {/* Avatar */}
          <div className="shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              {comment.citizenId?.slice(0, 2).toUpperCase()}
            </div>
          </div>

          {/* Comment content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-1">
              <span className={`font-semibold text-sm ${textColor}`}>
                {comment.citizenId}
              </span>
              <span className={`text-sm ${textColor} break-words`}>
                {comment.text}
              </span>
            </div>
            <div className={`flex items-center gap-3 mt-1 text-xs ${textMuted}`}>
              <span>
                {new Date(comment.createdAt).toLocaleString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {(comment.likes?.length || 0) > 0 && (
                <span>{comment.likes.length} likes</span>
              )}
              {!isOptimistic && (
                <button
                  onClick={() =>
                    setReplyTo({
                      commentId: comment._id,
                      username: comment.citizenId,
                    })
                  }
                  className="font-semibold hover:text-gray-500 transition"
                >
                  Reply
                </button>
              )}
            </div>
          </div>

          {/* Like button + menu */}
          <div className="shrink-0 flex items-center gap-1">
            {!isOptimistic && (
              <button
                onClick={() => toggleLike(comment._id)}
                className="p-1 transition-transform active:scale-90"
              >
                <Heart
                  size={18}
                  className={`transition-all ${
                    isLiked ? "text-red-500 fill-red-500" : textMuted
                  }`}
                />
              </button>
            )}
            {canDelete && !isOptimistic && (
              <div className="relative">
                <button
                  onClick={() => setActiveMenuCommentId(comment._id)}
                  className={`p-1 ${textMuted}`}
                >
                  <MoreHorizontal size={16} />
                </button>
                {showMenu && (
                  <div
                    ref={menuRef}
                    className={`absolute right-0 top-6 z-20 min-w-[100px] rounded-md shadow-lg py-1 ${
                      isDark ? "bg-gray-800" : "bg-white"
                    } border ${borderColor}`}
                  >
                    <button
                      onClick={() => deleteComment(comment._id)}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Replies section */}
        {hasReplies && (
          <div className="ml-8 mt-1">
            {!isExpanded ? (
              <button
                onClick={() =>
                  setExpandedReplies((prev) => ({ ...prev, [comment._id]: true }))
                }
                className={`text-xs font-semibold ${textMuted} hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1`}
              >
                <ChevronDown size={14} /> View replies ({comment.replies.length})
              </button>
            ) : (
              <>
                <div className="space-y-1">
                  {comment.replies.map((reply) => renderComment(reply, level + 1))}
                </div>
                <button
                  onClick={() =>
                    setExpandedReplies((prev) => ({
                      ...prev,
                      [comment._id]: false,
                    }))
                  }
                  className={`text-xs font-semibold ${textMuted} hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 mt-1`}
                >
                  <ChevronUp size={14} /> Hide replies
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 md:p-4">
      <div
        className={`w-full h-full md:max-w-5xl md:h-[90vh] md:rounded-2xl overflow-hidden flex flex-col md:flex-row ${bgColor}`}
      >
        {/* Left side: Image (Instagram style) */}
        <div className="hidden md:flex md:w-3/5 bg-black items-center justify-center">
          {allImages.length > 0 ? (
            <img
              src={allImages[0]}
              className="max-h-full max-w-full object-contain"
              alt="post"
            />
          ) : (
            <div className={textMuted}>No media</div>
          )}
        </div>

        {/* Right side: Comments */}
        <div className="w-full md:w-2/5 flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between px-4 py-3 border-b ${borderColor}`}>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="md:hidden">
                <ArrowLeft size={24} className={textColor} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  {postOwnerId?.slice(0, 2).toUpperCase() || "OP"}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${textColor}`}>
                    {postOwnerId || "User"}
                  </p>
                  <p className={`text-xs ${textMuted}`}>{district || "—"}</p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1">
              <X size={20} className={textColor} />
            </button>
          </div>

          {/* Comments list */}
          <div className={`flex-1 overflow-y-auto px-4 py-2 space-y-3 ${bgColor}`}>
            {localComments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className={`text-sm ${textMuted}`}>No comments yet.</p>
                <p className={`text-xs ${textMuted} mt-1`}>Be the first to comment.</p>
              </div>
            ) : (
              localComments.map((c) => renderComment(c))
            )}
            <div ref={commentsEndRef} className="h-4" />
          </div>

          {/* Reply indicator & Input bar */}
          <div className={`border-t ${borderColor} p-4`}>
            {replyTo && (
              <div className={`flex items-center justify-between text-xs mb-3 px-2 py-1 rounded-md ${isDark ? "bg-gray-900" : "bg-gray-100"}`}>
                <span className={textMuted}>
                  Replying to <span className="font-semibold">@{replyTo.username}</span>
                </span>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-red-500 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  {citizenId?.slice(0, 2).toUpperCase() || "?"}
                </div>
              </div>
              <div className="flex-1 flex items-center bg-transparent border-0">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
                  className={`flex-1 bg-transparent focus:outline-none text-sm ${textColor} placeholder:${textMuted}`}
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
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || isSending}
                  className={`text-sm font-semibold ml-2 ${
                    text.trim() && !isSending
                      ? "text-blue-500"
                      : "text-blue-500/40 cursor-not-allowed"
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
  );
};

export default CommentModal;