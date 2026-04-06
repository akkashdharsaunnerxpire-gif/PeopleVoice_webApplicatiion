import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  useSearchParams,
  useOutletContext,
  useLocation,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, AlertCircle, Users, Loader2 } from "lucide-react";
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

// Cache TTL: 5 minutes
const CACHE_TTL_MS = 30 * 1000;

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
  const prevFiltersRef = useRef(null); // Track previous filters to detect real changes

  const ITEMS_PER_PAGE = 5;
  const citizenId = localStorage.getItem("citizenId") || "CID-XXXX";

  // =============================
  // Cache Helpers (with TTL)
  // =============================
  const saveFeedState = useCallback(
    (issuesData, pageNum = 1) => {
      if (!issuesData || issuesData.length === 0) return;

      const stateToSave = {
        issues: issuesData,
        page: pageNum,
        filters: {
          district,
          department,
          status,
          sortBy,
          onlyWithImages,
          onlyMyIssues,
        },
        timestamp: Date.now(),
      };

      sessionStorage.setItem("feedData", JSON.stringify(stateToSave));
    },
    [district, department, status, sortBy, onlyWithImages, onlyMyIssues],
  );

  const clearCache = useCallback(() => {
    sessionStorage.removeItem("feedData");
  }, []);

  // Expose clearCache globally for post/update/delete events
  useEffect(() => {
    const handleClearCache = () => clearCache();
    window.addEventListener("clearFeedCache", handleClearCache);
    return () => window.removeEventListener("clearFeedCache", handleClearCache);
  }, [clearCache]);

  // =============================
  // Scroll Restoration Helpers
  // =============================
  const saveScrollPosition = useCallback(() => {
    const scrollKey = `feedScroll_${location.pathname}`;
    sessionStorage.setItem(scrollKey, window.scrollY);
  }, [location.pathname]);

  const restoreScrollPosition = useCallback(() => {
    const scrollKey = `feedScroll_${location.pathname}`;
    const saved = sessionStorage.getItem(scrollKey);
    if (saved) {
      window.scrollTo(0, parseInt(saved, 10));
    }
  }, [location.pathname]);

  // Save scroll on unmount
  useEffect(() => {
    return () => {
      saveScrollPosition();
    };
  }, [saveScrollPosition]);

  // Debounced scroll saving
  useEffect(() => {
    let timeoutId;
    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveScrollPosition();
      }, 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [saveScrollPosition]);

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
      if (abortControllerRef.current) abortControllerRef.current.abort();
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

        if (!data.success) throw new Error(data.message);

        const rawIssues = data.issues || [];
        const newIssues = rawIssues.map(normalizeIssue);

        if (newIssues.length === 0) {
          setHasMore(false);
          return;
        }

        if (append) {
          setDisplayedIssues((prev) => {
            const existingIds = new Set(prev.map((i) => i._id));
            const uniqueNew = newIssues.filter((i) => !existingIds.has(i._id));
            const updated = [...prev, ...uniqueNew];

            saveFeedState(updated, pageNum);

            return updated;
          });

          // ✅ ADD THIS
          setHasMore(data.hasMore);

          // ✅ ADD THIS
          pageRef.current = pageNum;
          setPage(pageNum);
        } else {
          setDisplayedIssues(newIssues);
          setHasMore(data.hasMore);
          pageRef.current = 1;
          setPage(1);
          // Save fresh data to cache
          saveFeedState(newIssues, 1);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
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
        // Turn off the advanced loader when done
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
      saveFeedState,
    ],
  );
  useEffect(() => {
    let startY = 0;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = async (e) => {
      const endY = e.changedTouches[0].clientY;

      if (endY - startY > 100 && window.scrollY === 0 && !refreshing) {
        console.log("🔄 Pull to refresh");

        await refreshFeed();
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [fetchIssues, refreshing]);
  const refreshFeed = async () => {
    if (refreshing) return;

    setRefreshing(true);
    sessionStorage.removeItem("feedData");
    await fetchIssues(1, false);
    setRefreshing(false);
  };
  useEffect(() => {
  const handleFocus = async () => {
    await refreshFeed();
  };

  window.addEventListener("focus", handleFocus);

  return () => window.removeEventListener("focus", handleFocus);
}, [refreshFeed]);

  useEffect(() => {
    const savedStateStr = sessionStorage.getItem("feedData");
    if (savedStateStr) {
      try {
        const savedState = JSON.parse(savedStateStr);
        const savedFilters = savedState.filters;
        const currentFilters = {
          district,
          department,
          status,
          sortBy,
          onlyWithImages,
          onlyMyIssues,
        };
        const filtersMatch =
          JSON.stringify(savedFilters) === JSON.stringify(currentFilters);
        const isCacheValid =
          Date.now() - (savedState.timestamp || 0) < CACHE_TTL_MS;

        if (filtersMatch && isCacheValid && savedState.issues?.length) {
          setDisplayedIssues(savedState.issues);
          setPage(savedState.page);
          pageRef.current = savedState.page;
          setHasMore(true);
          scrollRestoredRef.current = false;

          initialDataLoaded.current = true;

          // 🔥 IMPORTANT FIX
          prevFiltersRef.current = JSON.stringify(savedState.filters);

          console.log("⚡ Loaded from cache (TTL valid)");
          return;
        } else {
          sessionStorage.removeItem("feedData");
        }
      } catch (e) {
        console.error("Failed to parse saved feed data", e);
      }
    }
    // No cached data or cache expired / filters mismatch – fetch fresh
    fetchIssues(1, false).then(() => {
      initialDataLoaded.current = true;
    });
  }, []); // runs only once on mount

  // =============================
  // Real-time Updates: New Issue Created
  // =============================
  useEffect(() => {
    const handleNewIssue = (event) => {
      clearCache(); // Invalidate cache on new issue
      const currentScroll = window.scrollY;
      fetchIssues(1, false).then(() => {
        window.scrollTo(0, currentScroll);
      });
    };

    window.addEventListener("newIssueCreated", handleNewIssue);
    return () => window.removeEventListener("newIssueCreated", handleNewIssue);
  }, [fetchIssues, clearCache]);

  // =============================
  // Filter Changes – show Advanced Loader and fetch (only if filters actually changed)
  // =============================
  useEffect(() => {
    if (!initialDataLoaded.current) return;

    // 🔥 NEW FIX (IMPORTANT)
    if (prevFiltersRef.current === null) {
      prevFiltersRef.current = JSON.stringify({
        district,
        department,
        status,
        sortBy,
        onlyWithImages,
        onlyMyIssues,
      });
      return; // ❌ STOP first execution
    }

    // Get current filter values as a string for comparison
    const currentFilters = JSON.stringify({
      district,
      department,
      status,
      sortBy,
      onlyWithImages,
      onlyMyIssues,
    });

    // Skip if filters haven't changed from previous render
    if (prevFiltersRef.current === currentFilters) return;
    prevFiltersRef.current = currentFilters;

    // Clear any pending timer
    if (filterTimeout.current) clearTimeout(filterTimeout.current);
    if (advancedLoaderTimer.current) clearTimeout(advancedLoaderTimer.current);

    // Clear existing data and show loader
    setDisplayedIssues([]);
    setShowAdvancedLoader(true);
    setError(null);

    // Debounce filter changes (300ms)
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
  useEffect(() => {
    if (!loading && displayedIssues.length > 0 && !scrollRestoredRef.current) {
      setTimeout(() => {
        restoreScrollPosition();
        scrollRestoredRef.current = true;
      }, 100);
    }
  }, [loading, displayedIssues, restoreScrollPosition]);

  const loadMoreIssues = useCallback(async () => {
    if (isFetchingRef.current || loading || loadingMore || !hasMore) return;

    const nextPage = pageRef.current + 1;

    console.log("👉 Fetching page:", nextPage);

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

      // 🔥 OPTIMISTIC UPDATE
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

            // 🔥🔥 IMPORTANT: UPDATE CACHE (NOT DELETE)
            const saved = JSON.parse(sessionStorage.getItem("feedData"));

            if (saved) {
              const updatedCacheIssues = saved.issues.map((issue) =>
                issue._id === issueId
                  ? {
                      ...issue,
                      likes: data.likes,
                      likeCount: data.likeCount ?? data.likes.length,
                    }
                  : issue,
              );

              sessionStorage.setItem(
                "feedData",
                JSON.stringify({
                  ...saved,
                  issues: updatedCacheIssues,
                  timestamp: Date.now(),
                }),
              );
            }

            return updated;
          });
        } else {
          // 🔁 rollback
          setDisplayedIssues(previousState);
        }
      } catch (err) {
        // 🔁 rollback
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
      {/* Mobile Header */}
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
                PEOPLE VOICE
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
                        setCommentModalData({ ...issue, setDisplayedIssues })
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
