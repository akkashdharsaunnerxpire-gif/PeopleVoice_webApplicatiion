import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [sortType, setSortType] = useState("latest");
  const [selectedProofId, setSelectedProofId] = useState(null);

  const itemsPerPage = 10;
  const citizenId = localStorage.getItem("citizenId");

  // ✅ Listen for close messages from iframe (Proofpop)
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
    localStorage.setItem("hasNewProof", "false");
    window.dispatchEvent(new Event("proof_update"));
  }, []);

  useEffect(() => {
    sortProofs();
  }, [proofs, sortType]);

  useEffect(() => {
    if (proofs.length > 0) {
      const oldCount = parseInt(localStorage.getItem("proofCount") || "0");
      if (proofs.length > oldCount) {
        localStorage.setItem("hasNewProof", "true");
      }
      localStorage.setItem("proofCount", proofs.length);
    }
  }, [proofs]);

  const fetchProofs = async () => {
    if (!citizenId) return;
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/proofs?citizenId=${citizenId}`,
      );
      setProofs(res.data.proofs || []);
    } catch (err) {
      console.error("Fetch proofs error:", err);
    } finally {
      setLoading(false);
    }
  };

  const sortProofs = () => {
    const sorted = [...proofs];
    if (sortType === "latest") {
      sorted.sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt));
    } else {
      sorted.sort((a, b) => new Date(a.resolvedAt) - new Date(b.resolvedAt));
    }
    setFilteredProofs(sorted);
    setCurrentPage(1);
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
    if (window.confirm("Are you sure you want to delete this achievement?")) {
      try {
        await axios.delete(`${BACKEND_URL}/api/proofs/${proofId}`);
        setProofs((prev) => prev.filter((p) => p._id !== proofId));
      } catch (err) {
        console.error("Delete proof error:", err);
        alert("Failed to delete achievement");
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
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const totalPages = Math.ceil(filteredProofs.length / itemsPerPage);
  const paginatedProofs = filteredProofs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${isDark ? "bg-black" : "bg-gray-50"}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin h-12 w-12 border-3 border-emerald-500 border-t-transparent rounded-full" />
            <Sparkles
              size={18}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 animate-pulse"
            />
          </div>
          <p
            className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            Loading achievements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${isDark ? "bg-black" : "bg-gray-50"}`}>
      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`sticky top-0 z-20 backdrop-blur-xl border-b ${isDark ? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-100"}`}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/peopleVoice/my-issues")}
                className={`p-2 rounded-full transition-all ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
              >
                <ArrowLeft
                  size={22}
                  className={isDark ? "text-gray-400" : "text-gray-600"}
                />
              </motion.button>
              <div>
                <h1
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent`}
                >
                  Achievements
                </h1>
                <p
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Your resolved issues gallery
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={`px-4 py-2 rounded-full ${isDark ? "bg-emerald-950/50" : "bg-emerald-100"} flex items-center gap-2 shadow-md`}
            >
              <Trophy size={18} className="text-emerald-500" />
              <span
                className={`text-sm font-bold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
              >
                {proofs.length}
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="px-4 py-4 pb-32 max-w-7xl mx-auto">
        {proofs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-20 rounded-3xl ${isDark ? "bg-gray-900/50 border border-gray-800" : "bg-white border border-gray-100"} shadow-xl`}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`inline-flex p-5 rounded-full mb-5 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Archive size={48} className="text-gray-400" />
            </motion.div>
            <h3
              className={`text-xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              No Achievements Yet
            </h3>
            <p
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"} px-6 max-w-sm mx-auto mb-8`}
            >
              When you verify an issue as resolved, it will appear here as an
              achievement
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/peopleVoice/my-issues")}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              View My Issues
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Sort & Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5"
            >
              <p
                className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"} flex items-center gap-2`}
              >
                <Sparkles size={14} className="text-emerald-500" />
                {filteredProofs.length} achievement
                {filteredProofs.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shadow-inner">
                <button
                  onClick={() => setSortType("latest")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortType === "latest"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                      : isDark
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Latest First
                </button>
                <button
                  onClick={() => setSortType("oldest")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    sortType === "oldest"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                      : isDark
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Oldest First
                </button>
              </div>
            </motion.div>

            {/* Responsive Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence mode="popLayout">
                {paginatedProofs.map((proof, index) => (
                  <motion.div
                    key={proof._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                    className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                      isDark
                        ? "bg-gray-900 border-gray-800 hover:border-emerald-500/50"
                        : "bg-white border-gray-200 hover:border-emerald-300"
                    } shadow-lg hover:shadow-2xl cursor-pointer group`}
                    onClick={() => setSelectedProofId(proof.issueId)}
                  >
                    {/* Image Row */}
                    <div className="flex h-36 sm:h-40">
                      {/* Before Image */}
                      <div className="flex-1 relative bg-gray-900 overflow-hidden">
                        {proof.beforeImage ? (
                          <>
                            <img
                              src={proof.beforeImage}
                              alt="Before"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(proof.beforeImage);
                              }}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                              <ZoomIn size={20} className="text-white" />
                            </div>
                            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-lg text-white text-[9px] font-bold uppercase tracking-wide">
                              BEFORE
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <span className="text-xs text-gray-500">
                              No image
                            </span>
                          </div>
                        )}
                      </div>

                      {/* After Image */}
                      <div className="flex-1 relative bg-gray-900 overflow-hidden">
                        {proof.afterImage ? (
                          <>
                            <img
                              src={proof.afterImage}
                              alt="After"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(proof.afterImage);
                              }}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                              <ZoomIn size={20} className="text-white" />
                            </div>
                            <div className="absolute top-2 right-2 bg-emerald-600/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-white text-[9px] font-bold uppercase tracking-wide">
                              AFTER
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <span className="text-xs text-gray-500">
                              No image
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
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
                            {copiedId === proof.issueId ? (
                              <Check size={10} />
                            ) : (
                              <Copy size={10} />
                            )}
                          </button>
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                            <CheckCircle2 size={10} />
                            <span className="text-[9px] font-semibold uppercase">
                              Resolved
                            </span>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProof(proof._id);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                          title="Delete achievement"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>

                      <h3
                        className={`text-sm font-bold mb-1.5 line-clamp-1 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {proof.title ||
                          `Resolution - ${proof.department || "Issue"}`}
                      </h3>

                      <p
                        className={`text-[11px] line-clamp-2 mb-3 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
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
                              <span className="truncate max-w-[100px]">
                                {proof.location}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 mt-8"
              >
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl transition-all ${
                    currentPage === 1
                      ? "opacity-50 cursor-not-allowed"
                      : isDark
                        ? "hover:bg-gray-800"
                        : "hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft size={18} />
                </motion.button>
                <div className="flex gap-1.5">
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
                      <motion.button
                        key={pageNum}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                            : isDark
                              ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {pageNum}
                      </motion.button>
                    );
                  })}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-xl transition-all ${
                    currentPage === totalPages
                      ? "opacity-50 cursor-not-allowed"
                      : isDark
                        ? "hover:bg-gray-800"
                        : "hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight size={18} />
                </motion.button>
              </motion.div>
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
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Full size evidence"
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="absolute -top-4 -right-4 bg-gradient-to-r from-red-600 to-rose-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-xl hover:shadow-2xl transition"
                onClick={() => setSelectedImage(null)}
              >
                <X size={18} />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proofpop Modal - with message listener support */}
      <AnimatePresence>
        {selectedProofId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-3xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-900"
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={() => setSelectedProofId(null)}
                className="absolute top-4 right-4 z-50 bg-black/70 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center"
              >
                ✕
              </button>

              {/* CONTENT */}
              <iframe
                src={`/peopleVoice/proofpop/${selectedProofId}`}
                className="w-full h-full border-0"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProofsPage;
