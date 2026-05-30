// MyIssues.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Heart,
  MessageCircle,
  MapPin,
  Plus,
  Search,
  Clock,
  MoreVertical,
  Trash2,
  RefreshCw,
  SortAsc,
  Filter,
  X,
  Edit,
  Copy,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import PostModal from "../components/PostModal";
import { useTheme } from "../../Context/ThemeContext";
import { themeColors } from "../components/constants";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const MyIssues = () => {
  const [myIssues, setMyIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssueIndex, setSelectedIssueIndex] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const navigate = useNavigate();
  const citizenId = localStorage.getItem("citizenId");
  const { isDark } = useTheme();

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const getImageUrl = (img) => (typeof img === "string" ? img : img?.url);

  const normalizeStatus = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "closed") return "closed";
    if (s === "resolved") return "resolved";
    if (s === "in progress") return "in progress";
    if (s === "send" || s === "sent") return "send";
    return s;
  };

  const fetchIssues = useCallback(async () => {
    if (!citizenId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${API_BASE}/api/my-issues?citizenId=${citizenId}&limit=100`
      );
      setMyIssues(data.issues || []);
    } catch (err) {
      console.error("Failed to fetch issues:", err);
      showToast("Failed to load reports", "error");
    } finally {
      setLoading(false);
    }
  }, [citizenId]);

  const refreshIssues = async () => {
    setRefreshing(true);
    await fetchIssues();
    setRefreshing(false);
    showToast("Reports refreshed", "success");
  };

  useEffect(() => {
    if (!citizenId) {
      navigate("/login");
      return;
    }
    fetchIssues();
  }, [citizenId, navigate, fetchIssues]);

  useEffect(() => {
    const handleClickOutside = () => setShowSortMenu(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Filter and sort issues
  const filteredAndSortedIssues = (() => {
    let filtered = myIssues.filter((issue) => {
      if (statusFilter !== "All") {
        const status = normalizeStatus(issue.status);
        if (statusFilter === "Pending") return status === "send";
        if (statusFilter === "In Progress") return status === "in progress";
        if (statusFilter === "Resolved") return status === "resolved";
        if (statusFilter === "Closed") return status === "closed";
        return status === normalizeStatus(statusFilter);
      }
      return true;
    });

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.description_en?.toLowerCase().includes(query) ||
          issue.description_ta?.toLowerCase().includes(query) ||
          issue.area?.toLowerCase().includes(query)
      );
    }

    // Sorting
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "mostLiked":
        filtered.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        break;
      case "mostCommented":
        filtered.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
        break;
      default:
        break;
    }
    return filtered;
  })();

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
          return "bg-rose-900/40 text-rose-300";
        case "in progress":
          return "bg-amber-900/40 text-amber-300";
        case "resolved":
          return "bg-emerald-900/40 text-emerald-300";
        case "closed":
          return "bg-purple-900/40 text-purple-300";
        default:
          return "bg-gray-800 text-gray-400";
      }
    } else {
      switch (statusLower) {
        case "send":
          return "bg-rose-100 text-rose-700";
        case "in progress":
          return "bg-amber-100 text-amber-700";
        case "resolved":
          return "bg-emerald-100 text-emerald-700";
        case "closed":
          return "bg-purple-100 text-purple-700";
        default:
          return "bg-gray-100 text-gray-700";
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <div
      className={`min-h-screen pb-20 transition-colors duration-500 ${
        isDark
          ? `${themeColors.dark.bg} ${themeColors.dark.text}`
          : `${themeColors.light.bg} ${themeColors.light.text}`
      }`}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
              toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md ${
          isDark
            ? `${themeColors.dark.card} ${themeColors.dark.border}`
            : `${themeColors.light.card} ${themeColors.light.border}`
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">MY REPORTS</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshIssues}
              disabled={refreshing}
              className="p-2 rounded-full transition-colors hover:bg-white/10"
            >
              <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => navigate("/peoplevoice/post-issue")}
              className="p-2 bg-violet-600 hover:bg-violet-700 text-white rounded-full transition-all shadow-lg active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Search & Sort Bar */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <input
                type="text"
                placeholder="Search by description or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-10 py-2 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  isDark
                    ? "bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSortMenu(!showSortMenu);
                }}
                className={`p-2 rounded-xl border transition-all ${
                  isDark
                    ? "border-gray-700 hover:bg-gray-800"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <SortAsc size={20} />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute right-0 mt-2 w-40 rounded-xl shadow-lg border z-50 ${
                      isDark
                        ? "bg-gray-900 border-gray-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    {[
                      { value: "newest", label: "Newest First" },
                      { value: "oldest", label: "Oldest First" },
                      { value: "mostLiked", label: "Most Liked" },
                      { value: "mostCommented", label: "Most Commented" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                          sortBy === option.value
                            ? "bg-violet-500/20 text-violet-600"
                            : isDark
                            ? "hover:bg-gray-800 text-gray-300"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* FILTER TABS */}
          <div className="flex flex-col gap-2">
            <div className="flex md:hidden gap-2 justify-center flex-wrap">
              {["All", "Pending", "In Progress", "Resolved", "Closed"].map(
                (label) => (
                  <button
                    key={label}
                    onClick={() => setStatusFilter(label === "Closed" ? "Closed" : label)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      statusFilter === (label === "Closed" ? "Closed" : label)
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md"
                        : isDark
                        ? "bg-gray-800 text-gray-400"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
            <div className="hidden md:flex justify-center gap-3 flex-wrap">
              {[
                { label: "All", value: "All" },
                { label: "Pending", value: "Pending" },
                { label: "In Progress", value: "In Progress" },
                { label: "Resolved", value: "Resolved" },
                { label: "Closed", value: "Closed" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    statusFilter === s.value
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg"
                      : isDark
                      ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`h-44 rounded-2xl animate-pulse ${
                  isDark ? "bg-white/5" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        ) : filteredAndSortedIssues.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Search size={40} className="text-white" />
            </div>
            <p className="text-sm opacity-70">No reports match your filters</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
              }}
              className="mt-4 text-violet-500 text-sm font-medium"
            >
              Clear all filters
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
          >
            <AnimatePresence>
              {filteredAndSortedIssues.map((issue, idx) => (
                <motion.div
                  key={issue._id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  onClick={() => setSelectedIssueIndex(idx)}
                  className={`group relative rounded-2xl overflow-hidden border transition-all cursor-pointer ${
                    isDark
                      ? `${themeColors.dark.card} ${themeColors.dark.border}`
                      : `${themeColors.light.card} ${themeColors.light.border}`
                  }`}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={
                        getImageUrl(issue.images?.[0]) ||
                        "https://via.placeholder.com/400"
                      }
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt=""
                    />
                    <div
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold z-10 ${getStatusColor(
                        issue.status
                      )}`}
                    >
                      {getStatusDisplay(issue.status)}
                    </div>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center gap-1 text-gray-500 mb-0.5">
                      <MapPin size={10} />
                      <span className="text-[9px] font-bold uppercase truncate">
                        {issue.area || "City"}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold line-clamp-1 leading-tight mb-1">
                      {issue.description_en}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold opacity-70">
                      <span className="flex items-center gap-0.5">
                        <Heart size={10} /> {issue.likes?.length || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageCircle size={10} /> {issue.comments?.length || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} />{" "}
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* MODAL */}
      <AnimatePresence>
        {selectedIssueIndex !== null && (
          <PostModal
            issue={filteredAndSortedIssues[selectedIssueIndex]}
            onClose={() => setSelectedIssueIndex(null)}
            onPrev={
              selectedIssueIndex > 0
                ? () => setSelectedIssueIndex(selectedIssueIndex - 1)
                : null
            }
            onNext={
              selectedIssueIndex < filteredAndSortedIssues.length - 1
                ? () => setSelectedIssueIndex(selectedIssueIndex + 1)
                : null
            }
            hasPrev={selectedIssueIndex > 0}
            hasNext={selectedIssueIndex < filteredAndSortedIssues.length - 1}
            citizenId={citizenId}
            isDark={isDark}
            setDisplayedIssues={setMyIssues}
            showToast={showToast}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyIssues;