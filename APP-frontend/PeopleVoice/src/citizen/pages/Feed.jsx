import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, AlertCircle } from "lucide-react";
import { useUserValues } from "../../Context/UserValuesContext";
import IssueCard from "../components/IssueCard";
import FilterBar from "../components/FilterBar";
import {
  DISTRICTS,
  DEPARTMENTS,
  STATUSES,
  SORT_OPTIONS,
  themeColors,
} from "../components/constants";
import { useTheme } from "../../Context/ThemeContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const APIURL = `${BACKEND_URL}/api`;

const SmallSpinner = ({ size = "md", isDark }) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
  };
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`rounded-full ${sizeClasses[size]} ${
        isDark
          ? "border-violet-800 border-t-violet-400"
          : "border-gray-300 border-t-green-500"
      }`}
    />
  );
};

// Skeleton card component for initial loading
const SkeletonIssueCard = ({ isDark }) => {
  return (
    <div
      className={`rounded-2xl p-5 border ${
        isDark
          ? "bg-violet-950/30 border-violet-500/20"
          : "bg-white/80 border-green-100"
      } animate-pulse`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`h-12 w-12 rounded-full ${
            isDark ? "bg-violet-800/50" : "bg-gray-200"
          }`}
        />
        <div className="flex-1">
          <div
            className={`h-5 w-3/4 rounded ${
              isDark ? "bg-violet-800/50" : "bg-gray-200"
            } mb-3`}
          />
          <div
            className={`h-4 w-1/2 rounded ${
              isDark ? "bg-violet-800/50" : "bg-gray-200"
            } mb-4`}
          />
          <div
            className={`h-20 w-full rounded-lg ${
              isDark ? "bg-violet-800/50" : "bg-gray-200"
            }`}
          />
          <div className="flex gap-4 mt-4">
            <div
              className={`h-8 w-16 rounded-full ${
                isDark ? "bg-violet-800/50" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-8 w-16 rounded-full ${
                isDark ? "bg-violet-800/50" : "bg-gray-200"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Feed = () => {
  const { setCommentModalData } = useOutletContext();
  const [searchParams] = useSearchParams();
  const { setDisplayedIssues } = useUserValues();
  const { isDark } = useTheme();
  const theme = isDark ? themeColors.dark : themeColors.light;

  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [status, setStatus] = useState(STATUSES[0]);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);

  const [issues, setIssues] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1);

  const ITEMS_PER_PAGE = 5;
  const bottomObserverRef = useRef(null);
  const abortControllerRef = useRef(null);
  const filterTimeout = useRef(null);
  const citizenId = localStorage.getItem("citizenId") || "CID-XXXX";

  // Helper to ensure every issue has a numeric likeCount
  const normalizeIssue = (issue) => ({
    ...issue,
    likeCount: issue.likeCount ?? issue.likes?.length ?? 0,
  });

  const fetchIssues = useCallback(
    async (pageNum, append = false) => {
      try {
        if (!append) setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: pageNum,
          limit: ITEMS_PER_PAGE,
        });

        if (district !== DISTRICTS[0]) params.append("district", district);
        if (department !== DEPARTMENTS[0]) params.append("department", department);
        if (status !== STATUSES[0]) params.append("status", status);
        if (sortBy !== SORT_OPTIONS[0]) params.append("sortBy", sortBy);
        if (onlyWithImages) params.append("onlyWithImages", true);
        if (onlyMyIssues) params.append("citizenId", citizenId);

        const res = await fetch(`${APIURL}/issues?${params.toString()}`);
        const data = await res.json();

        if (!data.success) throw new Error(data.message);

        const rawIssues = data.issues || [];
        const newIssues = rawIssues.map(normalizeIssue);

        if (append) {
          setIssues((prev) => {
            const existingIds = new Set(prev.map((i) => i._id));
            return [...prev, ...newIssues.filter((i) => !existingIds.has(i._id))];
          });
        } else {
          setIssues(newIssues);
          pageRef.current = 1;
          setPage(1);
        }

        setHasMore(data.hasMore);
      } catch (err) {
        setError(err.message);
        if (!append) {
          setIssues([]);
          setHasMore(false);
        }
      } finally {
        if (!append) setLoading(false);
      }
    },
    [district, department, status, sortBy, onlyWithImages, onlyMyIssues, citizenId]
  );

  useEffect(() => {
    if (filterTimeout.current) clearTimeout(filterTimeout.current);

    filterTimeout.current = setTimeout(() => {
      pageRef.current = 1;
      setPage(1);
      setHasMore(true);
      fetchIssues(1, false);
    }, 300);

    return () => {
      if (filterTimeout.current) clearTimeout(filterTimeout.current);
    };
  }, [
    district,
    department,
    status,
    sortBy,
    onlyWithImages,
    onlyMyIssues,
    fetchIssues,
  ]);

  const loadMoreIssues = useCallback(async () => {
    if (isFetchingRef.current || loading || loadingMore || !hasMore) return;

    isFetchingRef.current = true;
    setLoadingMore(true);

    const nextPage = pageRef.current + 1;

    await fetchIssues(nextPage, true);

    pageRef.current = nextPage;
    setPage(nextPage);

    setLoadingMore(false);
    isFetchingRef.current = false;
  }, [hasMore, loading, loadingMore, fetchIssues]);

  useEffect(() => {
    const current = bottomObserverRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreIssues();
        }
      },
      {
        rootMargin: "400px",
      }
    );

    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [loadMoreIssues]);

  const clearFilters = () => {
    setDistrict(DISTRICTS[0]);
    setDepartment(DEPARTMENTS[0]);
    setStatus(STATUSES[0]);
    setSortBy(SORT_OPTIONS[0]);
    setOnlyWithImages(false);
    setOnlyMyIssues(false);
  };

  // Robust like handler with correct count calculation
  const handleLike = useCallback(
    async (issueId) => {
      if (!citizenId) return;

      // Get current issue before any updates
      const currentIssue = issues.find((issue) => issue._id === issueId);
      if (!currentIssue) return;

      const wasLiked = currentIssue.likes?.includes(citizenId);
      // Always use likes array length as the source of truth for count
      const currentLikeCount = currentIssue.likes?.length ?? 0;
      const newLikeCount = wasLiked ? currentLikeCount - 1 : currentLikeCount + 1;

      // Optimistic update
      setIssues((prev) =>
        prev.map((issue) => {
          if (issue._id !== issueId) return issue;

          const wasLiked = issue.likes?.includes(citizenId);

          const updatedLikes = wasLiked
            ? (issue.likes || []).filter((id) => id !== citizenId)
            : [...(issue.likes || []), citizenId];

          return {
            ...issue,
            likes: updatedLikes,
            likeCount: updatedLikes.length, // 🔥 always derive
          };
        })
      );

      // Make API call
      try {
        const res = await fetch(`${APIURL}/issues/${issueId}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citizenId }),
        });
        const data = await res.json();

        if (data.success) {
          // Sync with server response
          setIssues((prev) =>
            prev.map((issue) =>
              issue._id === issueId
                ? {
                    ...issue,
                    likes: data.likes,
                    likeCount: data.likeCount ?? data.likes.length,
                  }
                : issue
            )
          );
        } else {
          // Revert optimistic update
          setIssues((prev) =>
            prev.map((issue) =>
              issue._id === issueId ? currentIssue : issue
            )
          );
          console.error("Like API failed:", data.message);
        }
      } catch (err) {
        // Revert on network error
        setIssues((prev) =>
          prev.map((issue) =>
            issue._id === issueId ? currentIssue : issue
          )
        );
        console.error("Like network error:", err);
      }
    },
    [citizenId, issues]
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${theme.bg} pb-20`}
    >
      {/* Mobile Fixed Filter Bar - always visible on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30">
        <div
          className={`backdrop-blur-xl border-b ${
            isDark
              ? "bg-violet-950/85 border-violet-500/30"
              : "bg-white/90 border-green-100/60"
          }`}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className={`text-lg font-black tracking-tight ${theme.text}`}>
                Feed
              </h1>
              <p
                className={`text-[10px] uppercase tracking-wider ${
                  isDark ? "text-violet-400" : "text-green-600"
                }`}
              >
                Public Reports
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsMobileFilterOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium shadow-md ${
                isDark
                  ? "bg-violet-700/80 text-violet-100 hover:bg-violet-600"
                  : "bg-green-600 text-white hover:bg-green-700"
              } transition-colors`}
            >
              <Filter size={18} />
              <span className="text-sm">Filter</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main content with top padding for fixed filter bar */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-start justify-center gap-8 px-4 lg:pt-8 pt-20">
        {/* Desktop Sidebar - sticky */}
        <aside className="hidden lg:block w-[340px] shrink-0 sticky top-8 z-20">
          <div
            className={`backdrop-blur-2xl border rounded-[2.5rem] p-6 shadow-xl transition-all duration-500 ${
              isDark
                ? "bg-violet-950/40 border-violet-500/20 shadow-violet-900/20"
                : "bg-white/80 border-green-100 shadow-green-500/10"
            }`}
          >
            <FilterBar
              isDark={isDark}
              district={district}
              setDistrict={setDistrict}
              department={department}
              setDepartment={setDepartment}
              status={status}
              setStatus={setStatus}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onlyWithImages={onlyWithImages}
              setOnlyWithImages={setOnlyWithImages}
              onlyMyIssues={onlyMyIssues}
              setOnlyMyIssues={setOnlyMyIssues}
              clearFilters={clearFilters}
            />
          </div>
        </aside>

        <main className="flex-1 max-w-2xl w-full relative">
          <div className="space-y-6 pb-16">
            {/* Initial loading with skeleton cards */}
            {loading && issues.length === 0 ? (
              <div className="space-y-6">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
                  <SkeletonIssueCard key={idx} isDark={isDark} />
                ))}
              </div>
            ) : error ? (
              <div
                className={`text-center py-16 rounded-[2.5rem] border ${
                  isDark
                    ? "bg-violet-950/20 border-violet-500/20"
                    : "bg-red-50 border-red-100"
                }`}
              >
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <p
                  className={`font-bold mb-4 ${
                    isDark ? "text-violet-200" : "text-red-800"
                  }`}
                >
                  {error}
                </p>
                <button
                  onClick={() => fetchIssues(1, false)}
                  className="px-6 py-2 bg-red-500 text-white rounded-full font-bold"
                >
                  Try Again
                </button>
              </div>
            ) : issues.length === 0 ? (
              <div
                className={`text-center py-16 rounded-[2.5rem] border-2 border-dashed ${
                  isDark
                    ? "bg-violet-900/10 border-violet-500/20"
                    : "bg-white/50 border-green-200"
                }`}
              >
                <p className={theme.textMuted}>Empty horizon here.</p>
                <button
                  onClick={clearFilters}
                  className={`mt-4 font-black text-xs uppercase hover:underline tracking-widest ${
                    isDark ? "text-violet-400" : "text-green-500"
                  }`}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {issues.map((issue, index) => (
                  <motion.div
                    key={issue._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <IssueCard
                      isDark={isDark}
                      issue={issue}
                      liked={(issue.likes || []).includes(citizenId)}
                      likeCount={issue.likeCount}
                      commentCount={issue.comments?.length || 0}
                      onLike={() => handleLike(issue._id)}
                      onComment={() =>
                        setCommentModalData({ ...issue, setDisplayedIssues })
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Pagination loading indicator */}
            <div
              ref={bottomObserverRef}
              className="py-12 flex flex-col items-center justify-center gap-3"
            >
              {loadingMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <SmallSpinner size="md" isDark={isDark} />
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                      isDark ? "text-violet-400" : "text-green-400"
                    }`}
                  >
                    Fetching More
                  </span>
                </motion.div>
              )}
              {!loadingMore && !hasMore && issues.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  className="flex items-center gap-4"
                >
                  <div
                    className={`h-[1px] w-16 ${
                      isDark ? "bg-violet-500" : "bg-slate-400"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold uppercase tracking-[0.3em] ${
                      isDark ? "text-violet-200" : "text-slate-500"
                    }`}
                  >
                    End of Road
                  </span>
                  <div
                    className={`h-[1px] w-16 ${
                      isDark ? "bg-violet-500" : "bg-slate-400"
                    }`}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 left-0 w-[85%] max-w-[360px] z-[70] shadow-2xl flex flex-col overflow-hidden lg:hidden ${
                isDark ? theme.bg : "bg-white"
              }`}
            >
              <div
                className={`p-5 flex justify-between items-center border-b ${
                  isDark ? "border-violet-500/20" : "border-green-100"
                }`}
              >
                <h2
                  className={`text-xl font-black uppercase tracking-tighter ${theme.text}`}
                >
                  Filters
                </h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ rotate: 90 }}
                  onClick={() => setIsMobileFilterOpen(false)}
                  className={`p-3 rounded-xl ${
                    isDark ? "hover:bg-violet-900/50" : "hover:bg-green-50"
                  }`}
                >
                  <X
                    size={22}
                    className={isDark ? "text-violet-300" : "text-green-600"}
                  />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <FilterBar
                  isDark={isDark}
                  district={district}
                  setDistrict={setDistrict}
                  department={department}
                  setDepartment={setDepartment}
                  status={status}
                  setStatus={setStatus}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  onlyWithImages={onlyWithImages}
                  setOnlyWithImages={setOnlyWithImages}
                  onlyMyIssues={onlyMyIssues}
                  setOnlyMyIssues={setOnlyMyIssues}
                  clearFilters={clearFilters}
                  compact={true}
                />
              </div>

              <div
                className={`p-5 border-t ${
                  isDark ? "border-violet-500/20" : "border-green-100"
                }`}
              >
                <button
                  onClick={() => {
                    clearFilters();
                    setIsMobileFilterOpen(false);
                  }}
                  className={`w-full py-3 rounded-xl font-bold ${
                    isDark
                      ? "bg-violet-700 hover:bg-violet-600 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  } transition-colors`}
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Feed;