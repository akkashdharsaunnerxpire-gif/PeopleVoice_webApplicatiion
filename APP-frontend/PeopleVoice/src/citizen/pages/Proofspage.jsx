// ProofsPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Download,
  Eye,
  Trash2,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  X,
  ZoomIn,
  Clock,
  Archive,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Copy,
  Check,
  Sparkles,
  Award,
  Calendar,
  Filter,
  TrendingUp,
  Heart,
  Share2,
  Search,
} from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";
import { motion, AnimatePresence, useScroll, useTransform} from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ProofsPage = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [proofs, setProofs] = useState([]);
  const [filteredProofs, setFilteredProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [sortType, setSortType] = useState("latest");
  const [selectedProofId, setSelectedProofId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [showStats, setShowStats] = useState(false);

  const itemsPerPage = 12;
  const citizenId = localStorage.getItem("citizenId");
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.8]);

  // Listen for close messages from iframe (Proofpop)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "CLOSE_PROOF_POPUP") {
        setSelectedProofId(null);
      } else if (event.data?.type === "CLOSE_PROOF_POPUP_AND_NAVIGATE") {
        setSelectedProofId(null);
        if (event.data.path) {
          navigate(event.data.path);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  useEffect(() => {
    fetchProofs();
  }, []);

  useEffect(() => {
    filterAndSortProofs();
  }, [proofs, sortType, searchTerm]);

  const fetchProofs = async () => {
    if (!citizenId) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/proofs?citizenId=${citizenId}`);
      const newProofs = res.data.proofs || [];

      const oldCount = parseInt(localStorage.getItem("proofCount") || "0");
      if (newProofs.length > oldCount && !window.location.pathname.includes("/proofspage")) {
        localStorage.setItem("hasNewProof", "true");
      } else {
        localStorage.setItem("hasNewProof", "false");
      }
      localStorage.setItem("proofCount", newProofs.length);
      window.dispatchEvent(new Event("proof_update"));

      setProofs(newProofs);
    } catch (err) {
      console.error("Fetch proofs error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProofs = () => {
    let filtered = [...proofs];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(term) ||
          p.resolutionDetails?.toLowerCase().includes(term) ||
          p.location?.toLowerCase().includes(term) ||
          p.department?.toLowerCase().includes(term)
      );
    }
    if (sortType === "latest") {
      filtered.sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt));
    } else if (sortType === "oldest") {
      filtered.sort((a, b) => new Date(a.resolvedAt) - new Date(b.resolvedAt));
    } else if (sortType === "department") {
      filtered.sort((a, b) => (a.department || "").localeCompare(b.department || ""));
    }
    setFilteredProofs(filtered);
    setCurrentPage(1);
  };

  const deleteProof = async (proofId) => {
    try {
      await axios.delete(`${BACKEND_URL}/api/proofs/${proofId}`);
      setProofs((prev) => prev.filter((p) => p._id !== proofId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Delete proof error:", err);
      alert("Failed to delete achievement");
    }
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const totalPages = Math.ceil(filteredProofs.length / itemsPerPage);
  const paginatedProofs = filteredProofs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 20, stiffness: 300 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
    hover: { y: -8, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 15 } },
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-black" : "bg-gray-50"}`}>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="relative"
          >
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full" />
            <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500" />
          </motion.div>
          <p className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Loading achievements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-screen pb-24 overflow-y-auto ${isDark ? "bg-gradient-to-b from-gray-950 to-black" : "bg-gradient-to-b from-gray-50 to-white"}`}
    >
      {/* Animated Header with Parallax */}
      <motion.div
        style={{ opacity: headerOpacity }}
        className={`sticky top-0 z-30 backdrop-blur-xl border-b ${isDark ? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-100"}`}
      >
        <div className="px-4 py-4 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate("/peopleVoice/my-issues")}
                className={`p-2 rounded-full transition-all ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
              >
                <ArrowLeft size={22} className={isDark ? "text-gray-400" : "text-gray-600"} />
              </motion.button>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent`}
                >
                  Achievements Gallery
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Your resolved issues & impact moments
                </motion.p>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className={`px-5 py-2 rounded-full ${isDark ? "bg-emerald-950/50" : "bg-emerald-100"} flex items-center gap-2 shadow-md self-start sm:self-auto`}
            >
              <Trophy size={18} className="text-emerald-500" />
              <span className={`text-sm font-bold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                {proofs.length} {proofs.length === 1 ? "Achievement" : "Achievements"}
              </span>
            </motion.div>
          </div>

          {/* Search & Filters Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4 flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by title, department or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDark
                    ? "bg-gray-900/80 border-gray-700 text-white placeholder-gray-400"
                    : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
                }`}
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowStats(!showStats)}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                  showStats
                    ? "bg-emerald-500 text-white"
                    : isDark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <TrendingUp size={16} /> Stats
              </motion.button>
              <div className={`flex rounded-xl overflow-hidden border ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 text-sm ${viewMode === "grid" ? (isDark ? "bg-gray-700" : "bg-gray-200") : ""}`}
                >
                  <span className="hidden sm:inline">Grid</span> 📱
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 text-sm ${viewMode === "list" ? (isDark ? "bg-gray-700" : "bg-gray-200") : ""}`}
                >
                  <span className="hidden sm:inline">List</span> 📋
                </button>
              </div>
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                className={`px-3 py-2 rounded-xl text-sm border ${
                  isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"
                }`}
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
                <option value="department">By Department</option>
              </select>
            </div>
          </motion.div>

          {/* Stats Panel */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className={`rounded-xl p-4 ${isDark ? "bg-gray-900/50" : "bg-white/80"} border ${isDark ? "border-gray-800" : "border-gray-200"}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-emerald-500">{proofs.length}</p>
                      <p className="text-xs text-gray-500">Total Resolved</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-500">
                        {new Set(proofs.map(p => p.department)).size}
                      </p>
                      <p className="text-xs text-gray-500">Departments</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-500">
                        {proofs.reduce((acc, p) => acc + (p.beforeImage ? 1 : 0) + (p.afterImage ? 1 : 0), 0)}
                      </p>
                      <p className="text-xs text-gray-500">Total Images</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-500">
                        {Math.floor(proofs.reduce((acc, p) => acc + (new Date() - new Date(p.resolvedAt)), 0) / (86400000 * proofs.length) || 0)}
                      </p>
                      <p className="text-xs text-gray-500">Avg Days to Resolve</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 py-6 max-w-7xl mx-auto">
        {proofs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-20 rounded-3xl ${isDark ? "bg-gray-900/50 border border-gray-800" : "bg-white border border-gray-100"} shadow-xl`}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className={`inline-flex p-5 rounded-full mb-5 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Archive size={48} className="text-gray-400" />
            </motion.div>
            <h3 className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
              No Achievements Yet
            </h3>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"} px-6 max-w-sm mx-auto mb-8`}>
              When you verify an issue as resolved, it will appear here as an achievement
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/peopleVoice/my-issues")}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              View My Issues
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Results count */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-between items-center mb-4"
            >
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Showing {paginatedProofs.length} of {filteredProofs.length} achievements
              </p>
            </motion.div>

            {/* Cards Grid / List */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" : "space-y-4"}
            >
              <AnimatePresence mode="popLayout">
                {paginatedProofs.map((proof, index) =>
                  viewMode === "grid" ? (
                    <motion.div
                      key={proof._id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      whileHover="hover"
                      layout
                      onHoverStart={() => setHoveredCard(proof._id)}
                      onHoverEnd={() => setHoveredCard(null)}
                      className={`rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer group ${
                        isDark
                          ? "bg-gray-900/80 border-gray-800 hover:border-emerald-500/50"
                          : "bg-white/80 border-gray-200 hover:border-emerald-300"
                      } shadow-lg hover:shadow-2xl backdrop-blur-sm`}
                      onClick={() => setSelectedProofId(proof.issueId)}
                    >
                      {/* Image Row - Before/After */}
                      <div className="flex h-40 sm:h-44">
                        <div className="flex-1 relative bg-gray-900 overflow-hidden">
                          {proof.beforeImage ? (
                            <>
                              <img
                                src={proof.beforeImage}
                                alt="Before"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImage(proof.beforeImage);
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start p-2">
                                <span className="text-white text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded-full">BEFORE</span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <span className="text-xs text-gray-500">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 relative bg-gray-900 overflow-hidden">
                          {proof.afterImage ? (
                            <>
                              <img
                                src={proof.afterImage}
                                alt="After"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImage(proof.afterImage);
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-2">
                                <span className="text-white text-[10px] font-bold bg-emerald-600/80 px-2 py-0.5 rounded-full">AFTER</span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <span className="text-xs text-gray-500">No image</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyId(proof.issueId);
                              }}
                              className="text-[10px] font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg flex items-center gap-1 transition hover:bg-emerald-500/30"
                            >
                              #{proof.issueId?.slice(-6) || proof._id?.slice(-6)}
                              {copiedId === proof.issueId ? <Check size={10} /> : <Copy size={10} />}
                            </button>
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                              <CheckCircle2 size={10} />
                              <span className="text-[9px] font-semibold uppercase">Resolved</span>
                            </div>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(proof._id);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>

                        <h3 className={`text-sm font-bold mb-1.5 line-clamp-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                          {proof.title || `Resolution - ${proof.department || "Issue"}`}
                        </h3>

                        <p className={`text-[11px] line-clamp-2 mb-3 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          {proof.resolutionDetails || "No details provided"}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              <span>{formatDate(proof.resolvedAt)}</span>
                            </div>
                            {proof.location && (
                              <div className="flex items-center gap-1">
                                <MapPin size={10} />
                                <span className="truncate max-w-[80px]">{proof.location}</span>
                              </div>
                            )}
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.02 }}
                          >
                            <Award size={12} className="text-emerald-500" />
                          </motion.div>
                        </div>
                      </div>

                      {/* Hover overlay gradient */}
                      <motion.div
                        className="absolute inset-0 pointer-events-none rounded-2xl"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          background: isDark
                            ? "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)"
                            : "linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(5,150,105,0.02) 100%)",
                        }}
                      />
                    </motion.div>
                  ) : (
                    // List View
                    <motion.div
                      key={proof._id}
                      variants={listItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      whileHover={{ x: 8, backgroundColor: isDark ? "#1f2937" : "#f9fafb" }}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                        isDark ? "bg-gray-900/50 border-gray-800" : "bg-white border-gray-200"
                      }`}
                      onClick={() => setSelectedProofId(proof.issueId)}
                    >
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-800">
                        <img
                          src={proof.afterImage || proof.beforeImage || "https://via.placeholder.com/64"}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-emerald-500">#{proof.issueId?.slice(-6)}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Resolved</span>
                        </div>
                        <p className="text-sm font-medium truncate">{proof.title || proof.resolutionDetails?.slice(0, 60)}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(proof.resolvedAt)}</span>
                          {proof.department && <span className="flex items-center gap-1"><Building2 size={10} /> {proof.department}</span>}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(proof._id);
                        }}
                        className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-950/30 transition"
                      >
                        <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                      </button>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </motion.div>

            {/* Pagination with animated buttons */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 mt-10"
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl transition-all ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                >
                  <ChevronLeft size={20} />
                </motion.button>
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <motion.button
                        key={pageNum}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                            : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-xl transition-all ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                >
                  <ChevronRight size={20} />
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden ${isDark ? "bg-gray-900" : "bg-white"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Trash2 size={20} className="text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold">Delete Achievement</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete this achievement? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteProof(deleteConfirmId)}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImage} alt="Zoomed" className="max-h-[85vh] w-auto mx-auto rounded-2xl shadow-2xl" />
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="absolute -top-4 -right-4 bg-gradient-to-r from-red-600 to-rose-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                onClick={() => setSelectedImage(null)}
              >
                <X size={18} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proofpop Modal */}
      <AnimatePresence>
        {selectedProofId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[999] flex items-center justify-center p-2"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-900"
            >
              <button
                onClick={() => setSelectedProofId(null)}
                className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
              >
                <X size={18} />
              </button>
              <iframe src={`/peopleVoice/proofpop/${selectedProofId}`} className="w-full h-full border-0" title="Proof Details" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        * {
          scrollbar-width: thin;
        }
        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        *::-webkit-scrollbar-thumb {
          background-color: ${isDark ? "#4b5563" : "#cbd5e1"};
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default ProofsPage;