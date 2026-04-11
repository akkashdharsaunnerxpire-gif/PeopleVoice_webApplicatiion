import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  useSearchParams,
  useOutletContext,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  X,
  AlertCircle,
  Users,
  Loader2,
  Bell,
  BellDot,
} from "lucide-react";
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
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const APIURL = `${BACKEND_URL}/api`;
const BASE = "/peopleVoice";



// =============================
// Helper Components
// =============================
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
          className={`h-12 w-12 rounded-full ${isDark ? "bg-violet-800/50" : "bg-gray-200"}`}
        />
        <div className="flex-1">
          <div
            className={`h-5 w-3/4 rounded ${isDark ? "bg-violet-800/50" : "bg-gray-200"} mb-3`}
          />
          <div
            className={`h-4 w-1/2 rounded ${isDark ? "bg-violet-800/50" : "bg-gray-200"} mb-4`}
          />
          <div
            className={`h-20 w-full rounded-lg ${isDark ? "bg-violet-800/50" : "bg-gray-200"}`}
          />
          <div className="flex gap-4 mt-4">
            <div
              className={`h-8 w-16 rounded-full ${isDark ? "bg-violet-800/50" : "bg-gray-200"}`}
            />
            <div
              className={`h-8 w-16 rounded-full ${isDark ? "bg-violet-800/50" : "bg-gray-200"}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const AdvancedLoader = ({ isDark }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-full border-4 border-t-transparent"
          style={{
            borderColor: isDark ? "#a78bfa" : "#10b981",
            borderTopColor: "transparent",
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 w-16 h-16 rounded-full border-4 border-b-transparent"
          style={{
            borderColor: isDark ? "#c4b5fd" : "#34d399",
            borderBottomColor: "transparent",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Users
            size={28}
            className={isDark ? "text-violet-300" : "text-green-600"}
          />
        </div>
      </div>
      <motion.h3
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`mt-6 text-xl font-black ${
          isDark ? "text-white" : "text-gray-800"
        }`}
      >
        Loading Issues
      </motion.h3>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`text-sm mt-2 ${isDark ? "text-violet-300" : "text-gray-500"}`}
      >
        Fetching reports based on your filters...
      </motion.p>
      <div className="flex gap-1 mt-6">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            className={`w-2 h-2 rounded-full ${
              isDark ? "bg-violet-400" : "bg-green-500"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};

// =============================
// Main Component
// =============================
const Feed = () => {
  const { setCommentModalData } = useOutletContext();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const theme = isDark ? themeColors.dark : themeColors.light;

  // Filters state
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [status, setStatus] = useState(STATUSES[0]);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
  const [onlyWithImages, setOnlyWithImages] = useState(false);
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [error, setError] = useState(null);

  // Notification state for mobile
  const [unreadCount, setUnreadCount] = useState(0);

  // Advanced loader for ANY filter change
  const [showAdvancedLoader, setShowAdvancedLoader] = useState(false);

  // Pagination and data
  const { displayedIssues, setDisplayedIssues } = useUserValues();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const filterTimeout = useRef(null);
  const bottomObserverRef = useRef(null);
  const scrollRestoredRef = useRef(false);
  const initialDataLoaded = useRef(false);
  const advancedLoaderTimer = useRef(null);
  const prevFiltersRef = useRef(null);

  const ITEMS_PER_PAGE = 5;
  const citizenId = localStorage.getItem("citizenId") || "CID-XXXX";

  // =============================
  // Notification Functions (Mobile)
  // =============================
  const fetchUnreadCount = useCallback(async () => {
    if (!citizenId) return;
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/notifications?citizenId=${citizenId}`,
      );
      const unread = (res.data || []).filter((n) => n.read === false).length;
      setUnreadCount(unread);
    } catch (err) {
      console.log("Error fetching notifications:", err);
    }
  }, [citizenId]);

  // Initial fetch + polling for notifications
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Listen for notification updates
  useEffect(() => {
    const handleUpdate = () => fetchUnreadCount();
    window.addEventListener("notification_update", handleUpdate);
    return () =>
      window.removeEventListener("notification_update", handleUpdate);
  }, [fetchUnreadCount]);

  // =============================
  // Cache Helpers (with TTL)
  // =============================

  // Expose clearCache globally for post/update/delete event

  // =============================
  // Scroll Restoration Helpers
  // =============================

  // =============================
  // Normalisation & Data Fetching
  // =============================
  const normalizeIssue = (issue) => ({
    ...issue,
    likeCount: issue.likeCount ?? issue.likes?.length ?? 0,
  });

  const fetchIssues = useCallback(
  async (pageNum, append = false) => {
    if (append && isFetchingRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    isFetchingRef.current = true;

    try {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: pageNum,
        limit: ITEMS_PER_PAGE,
      });

      if (district !== DISTRICTS[0]) params.append("district", district);
      if (department !== DEPARTMENTS[0])
        params.append("department", department);
      if (status !== STATUSES[0]) params.append("status", status);
      if (sortBy !== SORT_OPTIONS[0])
        params.append("sortBy", sortBy.toLowerCase().replace(" ", ""));
      if (onlyWithImages) params.append("onlyWithImages", true);
      if (onlyMyIssues) params.append("citizenId", citizenId);

      const res = await fetch(`${APIURL}/issues?${params.toString()}`, {
        signal: controller.signal,
      });

      const data = await res.json();

      console.log("🔥 API RESPONSE:", data);

      if (!data.success) throw new Error(data.message);

      const rawIssues = data.issues || [];
      const newIssues = rawIssues.map(normalizeIssue);

      console.log("🔥 NEW ISSUES:", newIssues);

      // ✅ REMOVE EARLY RETURN
      if (newIssues.length === 0) {
        setHasMore(false);
      }

      if (append) {
        setDisplayedIssues((prev) => {
          const existingIds = new Set(prev.map((i) => i._id));
          const uniqueNew = newIssues.filter((i) => !existingIds.has(i._id));
          return [...prev, ...uniqueNew];
        });

        setHasMore(data.hasMore);
        pageRef.current = pageNum;
        setPage(pageNum);
      } else {
        // 🔥 IMPORTANT: ALWAYS SET DATA
        setDisplayedIssues(newIssues);

        setHasMore(data.hasMore);
        pageRef.current = 1;
        setPage(1);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("❌ Fetch error:", err);
        setError(err.message);

        if (!append) {
          setDisplayedIssues([]);
          setHasMore(false);
        }
      }
    } finally {
      if (!append) setLoading(false);
      else setLoadingMore(false);

      isFetchingRef.current = false;
      abortControllerRef.current = null;
      setShowAdvancedLoader(false);
    }
  },
  [
    district,
    department,
    status,
    sortBy,
    onlyWithImages,
    onlyMyIssues,
    citizenId,
    setDisplayedIssues,
  ],
);

  useEffect(() => {
  if (!initialDataLoaded.current) {
    fetchIssues(1, false);   // 🔥 FIRST API CALL
    initialDataLoaded.current = true;
    console.log(displayedIssues);
  }
}, [fetchIssues]);

  // =============================
  // Initial load & restoration (with TTL)
  // =============================

  // =============================
  // Real-time Updates: New Issue Created
  // =============================
  useEffect(() => {
    const handleNewIssue = () => {
      const currentScroll = window.scrollY;
      fetchIssues(1, false).then(() => {
        window.scrollTo(0, currentScroll);
      });
    };

    window.addEventListener("newIssueCreated", handleNewIssue);
    return () => window.removeEventListener("newIssueCreated", handleNewIssue);
  }, [fetchIssues]);

  // =============================
  // Filter Changes
  // =============================
  useEffect(() => {
    if (!initialDataLoaded.current) return;

    if (prevFiltersRef.current === null) {
      prevFiltersRef.current = JSON.stringify({
        district,
        department,
        status,
        sortBy,
        onlyWithImages,
        onlyMyIssues,
      });
      return;
    }

    const currentFilters = JSON.stringify({
      district,
      department,
      status,
      sortBy,
      onlyWithImages,
      onlyMyIssues,
    });

    if (prevFiltersRef.current === currentFilters) return;
    prevFiltersRef.current = currentFilters;

    if (filterTimeout.current) clearTimeout(filterTimeout.current);
    if (advancedLoaderTimer.current) clearTimeout(advancedLoaderTimer.current);

    setDisplayedIssues([]);
    setShowAdvancedLoader(true);
    setError(null);

    filterTimeout.current = setTimeout(() => {
      pageRef.current = 1;
      setPage(1);
      setHasMore(true);
      scrollRestoredRef.current = false;
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
    setDisplayedIssues,
  ]);

  // =============================
  // Scroll Restoration after Initial Load
  // =============================
  const loadMoreIssues = useCallback(async () => {
    if (isFetchingRef.current || loading || loadingMore || !hasMore) return;
    const nextPage = pageRef.current + 1;
    await fetchIssues(nextPage, true);
  }, [hasMore, loading, loadingMore, fetchIssues]);

  useEffect(() => {
    const current = bottomObserverRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreIssues();
      },
      { rootMargin: "400px" },
    );
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [loadMoreIssues]);

  // =============================
  // Helper Functions
  // =============================
  const clearFilters = () => {
    setDistrict(DISTRICTS[0]);
    setDepartment(DEPARTMENTS[0]);
    setStatus(STATUSES[0]);
    setSortBy(SORT_OPTIONS[0]);
    setOnlyWithImages(false);
    setOnlyMyIssues(false);
  };

  const handleLike = useCallback(
    async (issueId) => {
      if (!citizenId) return;

      let previousState;

      setDisplayedIssues((prev) => {
        previousState = prev;
        return prev.map((issue) => {
          if (issue._id !== issueId) return issue;
          const alreadyLiked = issue.likes?.includes(citizenId);
          let updatedLikes;
          if (alreadyLiked) {
            updatedLikes = issue.likes.filter((id) => id !== citizenId);
          } else {
            updatedLikes = [...(issue.likes || []), citizenId];
          }
          return {
            ...issue,
            likes: updatedLikes,
            likeCount: updatedLikes.length,
          };
        });
      });

      try {
        const res = await fetch(`${APIURL}/issues/${issueId}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citizenId }),
        });

        const data = await res.json();

        if (data.success) {
          setDisplayedIssues((prev) => {
            const updated = prev.map((issue) =>
              issue._id === issueId
                ? {
                    ...issue,
                    likes: data.likes,
                    likeCount: data.likeCount ?? data.likes.length,
                  }
                : issue,
            );
            return updated;
          });
        } else {
          setDisplayedIssues(previousState);
        }
      } catch (err) {
        setDisplayedIssues(previousState);
      }
    },
    [citizenId, setDisplayedIssues],
  );

  // =============================
  // Render
  // =============================
  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${theme.bg} pb-20`}
    >
      {/* Mobile Header with Filter Button and Notification Bell */}
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
              {/* <h1 className={`text-lg font-black tracking-tight ${theme.text}`}>
                PEOPLE VOICE
              </h1> */}
              <p
                className={`text-[10px] uppercase tracking-wider ${
                  isDark ? "text-violet-400" : "text-green-600"
                }`}
              >
                Public Reports
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell - Mobile only */}

              {/* Filter Button */}
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
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(`${BASE}/notifications`)}
                className="relative p-2 rounded-xl"
              >
                <Bell
                  size={22}
                  className={isDark ? "text-violet-300" : "text-gray-700"}
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-start justify-center gap-8 px-0 lg:px-4 pt-20 lg:pt-8">
        {/* Desktop Filter Sidebar */}
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

        {/* Main Feed */}
        <main className="flex-1 max-w-2xl w-full relative">
          <div className="space-y-0 md:space-y-6 pb-16">
            {/* Show Advanced Loader for 4 seconds on ANY filter change */}
            {showAdvancedLoader ? (
              <AdvancedLoader isDark={isDark} />
            ) : loading && displayedIssues.length === 0 ? (
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
            ) : displayedIssues.length === 0 ? (
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
                {displayedIssues.map((issue, index) => (
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
                        setCommentModalData({
                          open: true,
                          issueId: issue._id,
                          comments: issue.comments || [],
                          images: issue.images || [],
                          citizenId: citizenId,
                          postOwnerId: issue.citizenId,
                          district: issue.district,
                          setDisplayedIssues: setDisplayedIssues,
                        })
                      }
                      fullWidthMobile={true}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Infinite Scroll Trigger */}
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
              {!loadingMore && !hasMore && displayedIssues.length > 0 && (
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
