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

// Helper: Build nested comment tree from flat array (if backend returns flat structure)
const buildCommentTree = (flatComments) => {
  if (!flatComments || flatComments.length === 0) return [];
  
  // If comments already have replies array, return as is
  if (flatComments.length > 0 && flatComments[0].replies !== undefined) {
    return flatComments;
  }
  
  // Otherwise build tree from flat structure
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
  setDisplayedIssues,
  isDark: propIsDark,
}) => {
  const { isDark: contextIsDark } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : contextIsDark;
  const theme = isDark ? themeColors.dark : themeColors.light;

  // State
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [localComments, setLocalComments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [activeMenuCommentId, setActiveMenuCommentId] = useState(null);
  
  // Refs for debouncing
  const lastLikeClickTime = useRef({});
  const pendingLikes = useRef(new Map());

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
      pendingLikes.current.clear();
    }
  }, [initialComments, open]);

  // Refresh comments from parent when they change
  useEffect(() => {
    if (open && initialComments) {
      const tree = buildCommentTree(initialComments);
      setLocalComments(tree);
    }
  }, [initialComments, open]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
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

  // Update parent after comment
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

  // Function to update like in nested comments
  const updateLikeInComments = useCallback((comments, commentId, newLikes) => {
    return comments.map(comment => {
      if (comment._id === commentId) {
        return { ...comment, likes: newLikes };
      }
      if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: updateLikeInComments(comment.replies, commentId, newLikes) };
      }
      return comment;
    });
  }, []);

  // Optimized like toggle with proper sync
  const toggleLike = useCallback(async (commentId) => {
    // Prevent rapid successive clicks
    const now = Date.now();
    const lastClick = lastLikeClickTime.current[commentId] || 0;
    if (now - lastClick < 300) {
      return;
    }
    lastLikeClickTime.current[commentId] = now;

    // Check if already processing this comment
    if (pendingLikes.current.get(commentId)) {
      return;
    }

    // Mark as processing
    pendingLikes.current.set(commentId, true);

    // Find current like state
    let currentLiked = false;
    let currentLikes = [];
    
    const findCurrentState = (comments) => {
      for (const comment of comments) {
        if (comment._id === commentId) {
          currentLikes = comment.likes || [];
          currentLiked = currentLikes.includes(citizenId);
          return true;
        }
        if (comment.replies && comment.replies.length > 0) {
          if (findCurrentState(comment.replies)) return true;
        }
      }
      return false;
    };
    
    findCurrentState(localComments);
    
    // Calculate new likes
    const newLikes = currentLiked
      ? currentLikes.filter(id => id !== citizenId)
      : [...currentLikes, citizenId];
    
    // Apply optimistic update immediately
    const updatedComments = updateLikeInComments(localComments, commentId, newLikes);
    setLocalComments(updatedComments);
    
    // Update parent feed optimistically
    if (setDisplayedIssues) {
      setDisplayedIssues((prevIssues) =>
        prevIssues.map((issue) => {
          if (issue._id !== issueId) {
            return issue;
          }
          const updatedIssueComments = updateLikeInComments(issue.comments, commentId, newLikes);
          return {
            ...issue,
            comments: updatedIssueComments,
          };
        })
      );
    }

    // Make API call
    try {
      const res = await fetch(
        `${APIURL}/issues/${issueId}/comment/${commentId}/like`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citizenId }),
        }
      );

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "Like request failed");
      }

      // Sync with backend's actual state
      if (data.likes) {
        // Update local comments with backend state
        const syncedComments = updateLikeInComments(localComments, commentId, data.likes);
        setLocalComments(syncedComments);
        
        // Update parent feed with backend state
        if (setDisplayedIssues) {
          setDisplayedIssues((prevIssues) =>
            prevIssues.map((issue) => {
              if (issue._id !== issueId) {
                return issue;
              }
              const syncedIssueComments = updateLikeInComments(issue.comments, commentId, data.likes);
              return {
                ...issue,
                comments: syncedIssueComments,
              };
            })
          );
        }
      }
    } catch (err) {
      console.error("Like error:", err);
      
      // Rollback to previous state on error
      const rollbackComments = updateLikeInComments(localComments, commentId, currentLikes);
      setLocalComments(rollbackComments);
      
      // Rollback parent feed
      if (setDisplayedIssues) {
        setDisplayedIssues((prevIssues) =>
          prevIssues.map((issue) => {
            if (issue._id !== issueId) {
              return issue;
            }
            const rollbackIssueComments = updateLikeInComments(issue.comments, commentId, currentLikes);
            return {
              ...issue,
              comments: rollbackIssueComments,
            };
          })
        );
      }
    } finally {
      // Remove processing flag
      setTimeout(() => {
        pendingLikes.current.delete(commentId);
      }, 100);
    }
  }, [citizenId, issueId, setDisplayedIssues, localComments, updateLikeInComments]);

  // Add comment (root or reply)
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

    const tempId = `temp-${Date.now()}-${Math.random()}`;
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

    // Auto-scroll to new comment
    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const res = await fetch(`${APIURL}/issues/${issueId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to post");

      const serverComment = data.newComment;

      // Replace optimistic comment with server comment
      setLocalComments((prev) => {
        const replaceIdRecursively = (comments) =>
          comments.map((c) => {
            if (c._id === tempId) {
              return { ...serverComment, replies: c.replies || [] };
            }
            if (c.replies?.length) {
              return { ...c, replies: replaceIdRecursively(c.replies) };
            }
            return c;
          });
        return replaceIdRecursively(prev);
      });

      // Update parent feed
      updateParentAfterComment(serverComment);
      setReplyTo(null);
    } catch (err) {
      console.error("Comment post error:", err);
      setText(currentText);
      
      // Remove optimistic comment on error
      setLocalComments((prev) => {
        const removeOptimistic = (comments) =>
          comments
            .filter((c) => c._id !== tempId)
            .map((c) => ({
              ...c,
              replies: c.replies ? removeOptimistic(c.replies) : [],
            }));
        return removeOptimistic(prev);
      });
      
      alert(err.message || "Failed to post comment. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Delete comment
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
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Delete failed");
    } catch (err) {
      console.error("Delete error:", err);
      // Rollback
      setLocalComments(previousComments);
      updateParentAfterComment(null, false);
      alert("Could not delete comment. Try again.");
    }
  };

  // Render comment with optimized like button
  const renderComment = (comment, level = 0) => {
    const isLiked = comment.likes?.includes(citizenId);
    const isOwnComment = comment.citizenId === citizenId;
    const isPostOwner = citizenId === postOwnerId;
    const canDelete = isOwnComment || isPostOwner;
    const isOptimistic = comment.isOptimistic;
    const isPending = pendingLikes.current.get(comment._id);

    const hasReplies = (comment.replies?.length || 0) > 0;
    const isExpanded = expandedReplies[comment._id] ?? false;
    const showMenu = activeMenuCommentId === comment._id;

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
          } ${isOptimistic ? 'opacity-70' : ''}`}
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
                {(comment.likes?.length || 0) > 0 && (
                  <span>{comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}</span>
                )}
                {!isOptimistic && (
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
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isOptimistic && (
              <button
                onClick={() => toggleLike(comment._id)}
                className="relative transition-transform hover:scale-110 active:scale-95"
                disabled={isPending}
              >
                <Heart
                  size={18}
                  className={`transition-all duration-150 ${
                    isLiked
                      ? "text-red-500 fill-red-500"
                      : theme.textMuted
                  } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </button>
            )}

            {canDelete && !isOptimistic && (
              <button
                onClick={() => setActiveMenuCommentId(comment._id)}
                className={`${theme.textMuted} hover:${theme.text} p-1 rounded-full`}
              >
                <MoreHorizontal size={20} />
              </button>
            )}
          </div>

          {/* Dropdown menu */}
          {showMenu && canDelete && !isOptimistic && (
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

  // Main render
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