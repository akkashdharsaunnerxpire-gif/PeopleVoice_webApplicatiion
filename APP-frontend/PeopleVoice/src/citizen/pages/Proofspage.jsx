import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle,
  ArrowLeft,
  X,
  ZoomIn,
  Award,
  Clock,
  Archive,
  Filter,
  Grid3x3,
  LayoutList,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trophy,
  Medal,
  Star,
  ExternalLink,
  Copy,
  Check,
  Share2,
} from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ProofsPage = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [proofs, setProofs] = useState([]);
  const [filteredProofs, setFilteredProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);

  const itemsPerPage = 6;
  const citizenId = localStorage.getItem("citizenId");

  useEffect(() => {
    fetchProofs();
  }, []);

  useEffect(() => {
    filterAndSearchProofs();
  }, [proofs, filterType, searchQuery]);

  const fetchProofs = async () => {
    if (!citizenId) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/proofs?citizenId=${citizenId}`);
      setProofs(res.data.proofs || []);
    } catch (err) {
      console.error("Fetch proofs error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSearchProofs = () => {
    let filtered = [...proofs];

    // Apply filter
    if (filterType === "recent") {
      filtered.sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt));
    } else {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.department?.toLowerCase().includes(query) ||
          p.resolutionDetails?.toLowerCase().includes(query) ||
          p.issueId?.toLowerCase().includes(query)
      );
    }

    setFilteredProofs(filtered);
    setCurrentPage(1);
  };

  const downloadProofPDF = async (proof) => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      let y = 10;

      pdf.setFillColor(34, 197, 94);
      pdf.rect(0, 0, 210, 40, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text("RESOLUTION REPORT", 105, 25, { align: "center" });

      y = 50;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);

      pdf.setFillColor(245, 245, 245);
      pdf.rect(10, y, 190, 35, "F");
      pdf.text(`Issue ID: ${proof.issueId}`, 15, y + 8);
      pdf.text(`Department: ${proof.department || "-"}`, 15, y + 18);
      pdf.text(`Status: ${proof.status}`, 15, y + 28);
      pdf.text(`Date: ${new Date(proof.resolvedAt).toLocaleString()}`, 120, y + 8);
      y += 45;

      pdf.setFontSize(12);
      pdf.setTextColor(34, 197, 94);
      pdf.text("RESOLUTION DETAILS", 10, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const splitDetails = pdf.splitTextToSize(proof.resolutionDetails || "", 180);
      pdf.text(splitDetails, 10, y);
      y += splitDetails.length * 5 + 10;

      if (proof.beforeImage) {
        const beforeImg = await getBase64FromUrl(proof.beforeImage);
        pdf.setTextColor(34, 197, 94);
        pdf.text("BEFORE IMAGE", 10, y);
        y += 5;
        pdf.addImage(beforeImg, "JPEG", 10, y, 85, 60);
        y += 65;
      }

      if (proof.afterImage) {
        const afterImg = await getBase64FromUrl(proof.afterImage);
        pdf.setTextColor(34, 197, 94);
        pdf.text("AFTER IMAGE", 105, y);
        y += 5;
        pdf.addImage(afterImg, "JPEG", 105, y, 85, 60);
        y += 65;
      }

      pdf.setFillColor(34, 197, 94);
      pdf.rect(0, 280, 210, 10, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text("Official Resolution Document", 105, 286, { align: "center" });

      pdf.save(`Proof_${proof.issueId.slice(-6)}.pdf`);
    } catch (error) {
      console.error(error);
      alert("PDF Download Failed");
    }
  };

  const getBase64FromUrl = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
    });
  };

  const deleteProof = async (proofId) => {
    if (window.confirm("Are you sure you want to delete this proof?")) {
      try {
        await axios.delete(`${BACKEND_URL}/api/proofs/${proofId}`);
        setProofs((prev) => prev.filter((p) => p._id !== proofId));
      } catch (err) {
        console.error("Delete proof error:", err);
        alert("Failed to delete proof");
      }
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
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const stats = {
    total: proofs.length,
    thisMonth: proofs.filter((p) => new Date(p.resolvedAt).getMonth() === new Date().getMonth()).length,
    thisWeek: proofs.filter((p) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(p.resolvedAt) >= weekAgo;
    }).length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredProofs.length / itemsPerPage);
  const paginatedProofs = filteredProofs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gradient-to-br from-gray-950 to-black" : "bg-gradient-to-br from-gray-50 to-white"}`}>
        <div className="relative">
          <div className="animate-spin h-16 w-16 border-4 border-emerald-500 border-t-transparent rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-gradient-to-br from-gray-950 via-gray-900 to-black" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`sticky top-0 z-30 backdrop-blur-xl border-b ${isDark ? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-100"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/peopleVoice/my-issues")}
                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
              >
                <ArrowLeft size={20} className={isDark ? "text-gray-400" : "text-gray-600"} />
              </button>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  My Achievements
                </h1>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Track your resolved issues and success stories
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full ${isDark ? "bg-emerald-950/50 border border-emerald-500/30" : "bg-emerald-100"} flex items-center gap-2 w-fit`}>
              <Trophy size={18} className="text-emerald-500" />
              <span className={`text-sm font-semibold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                {stats.total} Achievement{stats.total !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {proofs.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl ${isDark ? "bg-gray-900/50 border border-gray-800" : "bg-white border border-gray-100"} shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Total Resolved</p>
                  <p className={`text-3xl font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>{stats.total}</p>
                </div>
                <div className={`p-3 rounded-full ${isDark ? "bg-emerald-950" : "bg-emerald-100"}`}>
                  <Medal size={24} className="text-emerald-500" />
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-5 rounded-2xl ${isDark ? "bg-gray-900/50 border border-gray-800" : "bg-white border border-gray-100"} shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>This Month</p>
                  <p className={`text-3xl font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>{stats.thisMonth}</p>
                </div>
                <div className={`p-3 rounded-full ${isDark ? "bg-blue-950" : "bg-blue-100"}`}>
                  <TrendingUp size={24} className="text-blue-500" />
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-5 rounded-2xl ${isDark ? "bg-gray-900/50 border border-gray-800" : "bg-white border border-gray-100"} shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>This Week</p>
                  <p className={`text-3xl font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>{stats.thisWeek}</p>
                </div>
                <div className={`p-3 rounded-full ${isDark ? "bg-purple-950" : "bg-purple-100"}`}>
                  <Sparkles size={24} className="text-purple-500" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-32">
        {proofs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-16 sm:py-20 rounded-3xl ${isDark ? "bg-gray-900/50 backdrop-blur-sm border border-gray-800" : "bg-white/80 backdrop-blur-sm border border-gray-200"} shadow-xl`}
          >
            <div className={`inline-flex p-6 rounded-full mb-6 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
              <Archive size={48} className="text-gray-400" />
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
              No Achievements Yet
            </h3>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"} px-6 max-w-sm mx-auto mb-8`}>
              When you verify an issue as resolved, it will appear here as your achievement proof
            </p>
            <button
              onClick={() => navigate("/peopleVoice/my-issues")}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium hover:shadow-xl transition-all duration-200"
            >
              View My Issues
            </button>
          </motion.div>
        ) : (
          <>
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter size={16} className={isDark ? "text-gray-400" : "text-gray-500"} />
                  <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Sort:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterType("all")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        filterType === "all"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                          : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Latest
                    </button>
                    <button
                      onClick={() => setFilterType("recent")}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        filterType === "recent"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                          : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Oldest
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"} flex-1 sm:flex-none`}>
                  <Search size={16} className={isDark ? "text-gray-400" : "text-gray-400"} />
                  <input
                    type="text"
                    placeholder="Search proofs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`bg-transparent text-sm outline-none w-40 ${isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"}`}
                  />
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
                        : isDark ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Grid3x3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === "list"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
                        : isDark ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <LayoutList size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Showing {paginatedProofs.length} of {filteredProofs.length} achievement{paginatedProofs.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Proofs Grid/List */}
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-4"}>
              <AnimatePresence mode="popLayout">
                {paginatedProofs.map((proof, index) => (
                  <motion.div
                    key={proof._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: viewMode === "grid" ? -6 : 0 }}
                    className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                      isDark
                        ? "bg-gray-900/50 border border-gray-800"
                        : "bg-white border border-gray-200"
                    } shadow-lg hover:shadow-2xl ${viewMode === "list" ? "sm:flex" : ""}`}
                  >
                    {/* Image Preview */}
                    {viewMode === "grid" && (proof.beforeImage || proof.afterImage) && (
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
                        <div className="absolute inset-0 bg-black/30 z-10" />
                        <div className="flex h-full">
                          {proof.beforeImage && (
                            <div className="flex-1 relative group cursor-pointer" onClick={() => setSelectedImage(proof.beforeImage)}>
                              <img src={proof.beforeImage} alt="Before" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                                <ZoomIn size={24} className="text-white" />
                              </div>
                              <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded-lg text-white text-[10px] font-medium z-20 backdrop-blur-sm">
                                BEFORE
                              </div>
                            </div>
                          )}
                          {proof.afterImage && (
                            <div className="flex-1 relative group cursor-pointer" onClick={() => setSelectedImage(proof.afterImage)}>
                              <img src={proof.afterImage} alt="After" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                                <ZoomIn size={24} className="text-white" />
                              </div>
                              <div className="absolute bottom-3 right-3 bg-emerald-600/90 px-2 py-1 rounded-lg text-white text-[10px] font-medium z-20 backdrop-blur-sm">
                                AFTER
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className={viewMode === "list" ? "flex-1 p-5" : "p-5"}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => copyId(proof.issueId)}
                            className="text-[10px] font-mono bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-emerald-500/30 transition"
                          >
                            #{proof.issueId?.slice(-6) || proof._id?.slice(-6)}
                            {copiedId === proof.issueId ? <Check size={10} /> : <Copy size={10} />}
                          </button>
                          <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-1 rounded-lg flex items-center gap-1">
                            <CheckCircle size={10} />
                            Resolved
                          </span>
                        </div>
                        <button
                          onClick={() => deleteProof(proof._id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-all duration-200"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <h3 className={`font-semibold text-base mb-2 line-clamp-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                        {proof.title || `Resolution Report - ${proof.department || "Issue"}`}
                      </h3>

                      <p className={`text-xs line-clamp-2 mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {proof.resolutionDetails}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-3 text-[11px]">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Calendar size={11} />
                            <span>{formatDate(proof.resolvedAt)}</span>
                          </div>
                          {proof.location && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <MapPin size={11} />
                              <span className="truncate max-w-[100px]">{proof.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => downloadProofPDF(proof)}
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-all duration-200"
                            title="Download PDF"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => navigate(`/peopleVoice/proofpop/${proof.issueId}`)}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-all duration-200"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl transition-all duration-200 ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-medium transition-all duration-200 ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                            : isDark ? "bg-gray-800 text-gray-400 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-xl transition-all duration-200 ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedImage} alt="Full size" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  className="bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition"
                  onClick={() => window.open(selectedImage, "_blank")}
                >
                  <ExternalLink size={18} />
                </button>
              </div>
              <button
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2.5 text-white hover:bg-black/70 transition"
                onClick={() => setSelectedImage(null)}
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProofsPage;