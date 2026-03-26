import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Image as ImageIcon,
  Grid,
  List,
  Search,
  Filter,
} from "lucide-react";
import SavedGridCard from "../components/SavedGridCard";
import SavedPostModal from "../components/SavedPostModal";
import { useTheme } from "../../Context/ThemeContext";
import { themeColors } from "../components/constants";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const SavedIssues = () => {
  const citizenId = localStorage.getItem("citizenId");

  const [saved, setSaved] = useState([]);
  const [activePost, setActivePost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [error, setError] = useState(null); // <-- added error state

  const { isDark } = useTheme();

  /* ================= FETCH SAVED ================= */
  const fetchSaved = async () => {
    if (!citizenId) {
      setLoading(false);
      setError("Please log in to see saved issues.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/saved/${citizenId}`);
      const data = await res.json();
      if (data.success) {
        setSaved(data.data || []);
      } else {
        setError(data.message || "Failed to load saved issues.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [citizenId]);

  /* ================= UNSAVE ================= */
  const handleUnsave = (issueId) => {
    setSaved((prev) => prev.filter((p) => p.issueId !== issueId));
    setActivePost(null);
    // Optionally refresh from server to be safe
    // fetchSaved();
  };

  /* ================= FILTER SAVED ITEMS ================= */
  const filteredSaved = saved.filter((item) => {
    const issue = item.issueData || {};
    const matchesSearch =
      issue.description_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.area?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      filterDepartment === "all" || issue.department === filterDepartment;

    return matchesSearch && matchesDept;
  });

  const departments = [
    "all",
    ...new Set(saved.map((item) => item.issueData?.department).filter(Boolean)),
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 200 },
    },
  };

  const SkeletonLoader = () => (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-1">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className={`aspect-square animate-pulse rounded-lg ${
            isDark
              ? "bg-gradient-to-r from-gray-700 to-gray-600"
              : "bg-gradient-to-r from-gray-200 to-gray-300"
          }`}
        />
      ))}
    </div>
  );

  // If not logged in
  if (!citizenId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`min-h-screen px-4 py-6 transition-colors ${
          isDark ? themeColors.dark.bg : themeColors.light.card
        }`}
      >
        <div className="text-center py-16">
          <Bookmark className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className={`text-xl font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Please log in
          </h3>
          <p className={isDark ? "text-gray-400" : "text-gray-500"}>
            You need to be logged in to view saved issues.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen px-4 py-6 transition-colors ${
        isDark
          ? `${themeColors.dark.bg} ${themeColors.dark.border}`
          : `${themeColors.light.card} ${themeColors.light.border}`
      }`}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 0.5 }}
              className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl"
            >
              <Bookmark className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Saved Issues
              </h1>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {filteredSaved.length} saved{" "}
                {filteredSaved.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>

          {/* View Toggle & Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search saved..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full sm:w-64 pl-9 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-gray-100"
                    : "bg-white border-gray-200"
                }`}
              />
            </div>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:outline-none ${
                isDark
                  ? "bg-gray-800 border-gray-700 text-gray-100"
                  : "bg-white border-gray-200"
              }`}
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "all" ? "All Departments" : dept}
                </option>
              ))}
            </select>

            <div
              className={`flex border rounded-xl p-1 ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-green-600 text-white"
                    : isDark
                      ? "text-gray-400 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Grid className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-green-600 text-white"
                    : isDark
                      ? "text-gray-400 hover:bg-gray-700"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <List className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        <SkeletonLoader />
      ) : filteredSaved.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-6"
          >
            <Bookmark className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto" />
          </motion.div>
          <h3
            className={`text-xl font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            No saved items found
          </h3>
          <p className={isDark ? "text-gray-400" : "text-gray-500"}>
            {searchTerm || filterDepartment !== "all"
              ? "Try adjusting your filters"
              : "Save issues to see them here"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`${
            viewMode === "grid"
              ? "grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1"
              : "space-y-3 max-w-3xl mx-auto"
          }`}
        >
          <AnimatePresence>
            {filteredSaved.map((item) => {
              if (!item?.issueData) return null;

              return (
                <motion.div
                  key={item.issueId}
                  variants={itemVariants}
                  whileHover={{ scale: viewMode === "grid" ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  <SavedGridCard
                    post={item.issueData}
                    viewMode={viewMode}
                    onClick={() => setActivePost(item)}
                    isDark={isDark}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {activePost && (
          <SavedPostModal
            post={activePost}
            citizenId={citizenId}
            onClose={() => setActivePost(null)}
            onUnsave={handleUnsave}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SavedIssues;