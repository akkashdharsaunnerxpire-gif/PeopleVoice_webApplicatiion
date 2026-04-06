import { useEffect, useState } from "react";
import {
  Heart,
  MessageCircle,
  MapPin,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Trash2,
  Archive,
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

  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();
  const citizenId = localStorage.getItem("citizenId");
  const { isDark } = useTheme();

  useEffect(() => {
    if (!citizenId) {
      navigate("/login");
      return;
    }

    const fetchIssues = async () => {
      try {
        setLoading(true);

        const { data } = await axios.get(
          `${API_BASE}/api/my-issues?citizenId=${citizenId}&limit=100`,
        );

        setMyIssues(data.issues || []);
      } catch (err) {
        console.error("Failed to fetch issues:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [citizenId, navigate]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const filteredIssues = myIssues.filter((issue) => {
    if (statusFilter === "All") return true;

    const status = issue.status;

    if (statusFilter === "Pending")
      return status === "send" || status === "Sent";
    if (statusFilter === "In Progress") return status === "In Progress";
    if (statusFilter === "Resolved")
      return status === "resolved" || status === "Resolved";
    if (statusFilter === "Solved")
      return status === "solved" || status === "Solved";

    return status === statusFilter;
  });

const handleDelete = async (issueId, e) => {
  e.stopPropagation();

  if (!window.confirm("Are you sure you want to delete this report?")) return;
  if (!citizenId) return;

  setDeletingId(issueId);

  let previousIssues;

  // ✅ OPTIMISTIC UPDATE
  setMyIssues((prevIssues) => {
    previousIssues = prevIssues;

    const updated = prevIssues.filter(
      (issue) => issue._id !== issueId
    );

    // ✅ FIX selected index (NO BUG)
    if (
      selectedIssueIndex !== null &&
      prevIssues[selectedIssueIndex]?._id === issueId
    ) {
      setSelectedIssueIndex(null);
    }

    return updated;
  });

  try {
    const { data } = await axios.delete(
      `${API_BASE}/api/issues/${issueId}`,
      {
        data: { citizenId },
      }
    );

    if (!data.success) {
      throw new Error("Delete failed");
    }

    // ✅ CACHE UPDATE (ONLY REMOVE DELETED ITEM)
    const saved = JSON.parse(sessionStorage.getItem("feedData"));

    if (saved) {
      const updatedCache = saved.issues.filter(
        (issue) => issue._id !== issueId
      );

      sessionStorage.setItem(
        "feedData",
        JSON.stringify({
          ...saved,
          issues: updatedCache,
          timestamp: Date.now(),
        })
      );
    }

    // ✅ GLOBAL SYNC
    window.dispatchEvent(new Event("clearFeedCache"));

  } catch (err) {
    console.error("Delete failed:", err);

    // 🔁 ROLLBACK
    setMyIssues(previousIssues);

    alert("Failed to delete report. Please try again.");
  } finally {
    setDeletingId(null);
    setOpenMenuId(null);
  }
};

  return (
    <div
      className={`min-h-screen pb-20 transition-colors duration-500 ${
        isDark
          ? `${themeColors.dark.bg} ${themeColors.dark.text}`
          : `${themeColors.light.bg} ${themeColors.light.text}`
      }`}
    >
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

          <button
            onClick={() => navigate("/report")}
            className="p-2 bg-violet-600 hover:bg-violet-700 text-white rounded-full transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* FILTER TABS - now wrapped, no horizontal scroll */}
        <div className="flex flex-wrap gap-2 px-4 pb-4 max-w-4xl mx-auto">
          {[
            { label: "All", value: "All" },
            { label: "Pending", value: "Pending" },
            { label: "In Progress", value: "In Progress" },
            { label: "Resolved", value: "Resolved" },
            { label: "Closed", value: "Solved" },
          ].map((s) => {
            const count =
              s.value === "All"
                ? myIssues.length
                : filteredIssues.filter((i) => i.status === s.value).length;

            return (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
                  statusFilter === s.value
                    ? "bg-violet-600 text-white shadow-md"
                    : isDark
                      ? "bg-white/5 text-gray-400"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {s.label}

                {count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${
                      statusFilter === s.value
                        ? "bg-white/20 text-white"
                        : isDark
                          ? "bg-gray-600 text-gray-300"
                          : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
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
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Search className="mx-auto mb-4" size={40} />
            <p className="text-sm">No reports to show</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredIssues.map((issue, idx) => {
              const isMenuOpen = openMenuId === issue._id;
              const isDeleting = deletingId === issue._id;

              return (
                <motion.div
                  key={issue._id}
                  whileHover={{ y: -4 }}
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
                        issue.images_data?.[0] ||
                        "https://via.placeholder.com/400"
                      }
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt=""
                    />

                    {/* MENU BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : issue._id);
                      }}
                      className={`absolute top-2 right-2 p-1.5 rounded-full z-20 ${
                        isDark
                          ? "bg-black/70 text-white"
                          : "bg-white/90 text-gray-800"
                      }`}
                    >
                      <MoreVertical size={16} />
                    </button>

                    <AnimatePresence>
                      {isMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute top-10 right-2 w-36 rounded-xl shadow-xl border ${
                            isDark
                              ? "bg-gray-900 border-white/10"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <button
                            onClick={(e) => handleDelete(issue._id, e)}
                            disabled={isDeleting}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs ${
                              isDark
                                ? "hover:bg-white/10 text-red-400"
                                : "hover:bg-gray-100 text-red-600"
                            }`}
                          >
                            {isDeleting ? (
                              <>
                                <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 size={14} />
                                Delete
                              </>
                            )}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* CARD INFO - more compact */}
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

                    <div className="flex items-center gap-1 text-[10px] font-bold opacity-70">
                      <span className="flex items-center gap-0.5">
                        <Heart size={10} /> {issue.likes?.length || 0}
                      </span>

                      <span className="flex items-center gap-0.5">
                        <MessageCircle size={10} />{" "}
                        {issue.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL */}
      <AnimatePresence>
        {selectedIssueIndex !== null && (
          <PostModal
            issue={filteredIssues[selectedIssueIndex]}
            onClose={() => setSelectedIssueIndex(null)}
            citizenId={citizenId}
            isDark={isDark}
            setDisplayedIssues={setMyIssues}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyIssues;
