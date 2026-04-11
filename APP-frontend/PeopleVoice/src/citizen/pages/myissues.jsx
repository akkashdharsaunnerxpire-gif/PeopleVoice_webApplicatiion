import { useEffect, useState } from "react";
import {
  Heart,
  MessageCircle,
  MapPin,
  Plus,
  Search,
  Clock,
  MoreVertical,
  Trash2,
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

  // FIXED: Normalize status function to handle all statuses correctly
  const normalizeStatus = (status) => {
    const s = (status || "").toLowerCase().trim();
    if (s === "closed") return "closed";
    if (s === "resolved") return "resolved";
    if (s === "in progress") return "in progress";
    if (s === "send" || s === "sent") return "send";
    return s;
  };

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

    const status = normalizeStatus(issue.status);

    if (statusFilter === "Pending") return status === "send";

    if (statusFilter === "In Progress") return status === "in progress";

    if (statusFilter === "Resolved") return status === "resolved";

    if (statusFilter === "closed") return status === "closed";

    return status === normalizeStatus(statusFilter);
  });

  // FIXED: Get status display text
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

  // FIXED: Get status color for card
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

        {/* FILTER TABS */}
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <div className="flex flex-col gap-2">
            {/* MOBILE ONLY (2 ROW) */}
            <div className="flex flex-col gap-2 md:hidden">
              {/* TOP 3 */}
              <div className="flex gap-2 justify-center">
                {["All", "Pending", "In Progress"].map((label) => (
                  <button
                    key={label}
                    onClick={() => setStatusFilter(label)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      statusFilter === label
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* BOTTOM 2 */}
              <div className="flex gap-2 justify-center">
                {["Resolved", "closed"].map((label) => (
                  <button
                    key={label}
                    onClick={() => setStatusFilter(label)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      statusFilter === label
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* DESKTOP ONLY (1 ROW CENTERED) */}
            <div className="hidden md:flex justify-center gap-3 flex-wrap">
              {[
                { label: "All", value: "All" },
                { label: "Pending", value: "Pending" },
                { label: "In Progress", value: "In Progress" },
                { label: "Resolved", value: "Resolved" },
                { label: "Closed", value: "closed" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    statusFilter === s.value
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg"
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
                        issue.images?.[0] || "https://via.placeholder.com/400"
                      }
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt=""
                    />

                    {/* Status Badge */}
                    <div
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold z-10 ${getStatusColor(
                        issue.status,
                      )}`}
                    >
                      {getStatusDisplay(issue.status)}
                    </div>
                  </div>

                  {/* CARD INFO */}
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
                        <MessageCircle size={10} />{" "}
                        {issue.comments?.length || 0}
                      </span>

                      <span className="flex items-center gap-0.5">
                        <Clock size={10} />{" "}
                        {new Date(issue.createdAt).toLocaleDateString()}
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
