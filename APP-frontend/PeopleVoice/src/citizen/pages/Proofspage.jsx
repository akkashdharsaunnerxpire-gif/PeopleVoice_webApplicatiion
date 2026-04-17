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
  const [sortType, setSortType] = useState("latest"); // "latest" or "oldest"

  const itemsPerPage = 10;
  const citizenId = localStorage.getItem("citizenId");

  useEffect(() => {
    fetchProofs();
  }, []);

  useEffect(() => {
    sortProofs();
  }, [proofs, sortType]);

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
      pdf.text(`Status: Resolved`, 15, y + 28);
      pdf.text(
        `Date: ${new Date(proof.resolvedAt).toLocaleString()}`,
        120,
        y + 8,
      );
      y += 45;

      pdf.setFontSize(12);
      pdf.setTextColor(34, 197, 94);
      pdf.text("RESOLUTION DETAILS", 10, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const splitDetails = pdf.splitTextToSize(
        proof.resolutionDetails || "",
        180,
      );
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
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
          <p
            className={`text-sm mt-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            Loading achievements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${isDark ? "bg-black" : "bg-gray-50"}`}>
      {/* Header */}
      <div
        className={`sticky top-0 z-20 backdrop-blur-xl border-b ${isDark ? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-100"}`}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/peopleVoice/my-issues")}
                className={`p-2 rounded-full transition-all ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
              >
                <ArrowLeft
                  size={20}
                  className={isDark ? "text-gray-400" : "text-gray-600"}
                />
              </button>
              <div>
                <h1
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Achievements
                </h1>
                <p
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Your resolved issues
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1.5 rounded-full ${isDark ? "bg-emerald-950/50" : "bg-emerald-100"} flex items-center gap-2`}
            >
              <Trophy size={16} className="text-emerald-500" />
              <span
                className={`text-sm font-semibold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}
              >
                {proofs.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-3 pb-32">
        {proofs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-16 rounded-2xl ${isDark ? "bg-gray-900/50 border border-gray-800" : "bg-white border border-gray-100"} shadow-sm`}
          >
            <div
              className={`inline-flex p-4 rounded-full mb-4 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
            >
              <Archive size={40} className="text-gray-400" />
            </div>
            <h3
              className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              No Achievements Yet
            </h3>
            <p
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"} px-6 max-w-sm mx-auto mb-6`}
            >
              When you verify an issue as resolved, it will appear here
            </p>
            <button
              onClick={() => navigate("/peopleVoice/my-issues")}
              className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              View My Issues
            </button>
          </motion.div>
        ) : (
          <>
            {/* Sort Buttons - Latest & Oldest */}
            <div className="flex items-center justify-between mb-3">
              <p
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                {filteredProofs.length} achievement
                {filteredProofs.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <button
                  onClick={() => setSortType("latest")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    sortType === "latest"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : isDark
                        ? "text-gray-400"
                        : "text-gray-600"
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => setSortType("oldest")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    sortType === "oldest"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : isDark
                        ? "text-gray-400"
                        : "text-gray-600"
                  }`}
                >
                  Oldest
                </button>
              </div>
            </div>

            {/* Proofs List - Compact Cards */}
           <div className="flex flex-wrap gap-4">
              <AnimatePresence mode="popLayout">
                {paginatedProofs.map((proof, index) => (
                  <motion.div
                    key={proof._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.03 }}
                    className={`w-72 h-60 rounded-xl border overflow-hidden transition-all duration-200 ${
                      isDark
                        ? "bg-gray-900 border-gray-800"
                        : "bg-white border-gray-200"
                    } shadow-sm active:scale-[0.98] cursor-pointer`}
                    onClick={() =>
                      navigate(`/peopleVoice/proofpop/${proof.issueId}`)
                    }
                  >
                    {/* Image Row - Before/After side by side */}
                    <div className="flex h-28">
                      {/* Before Image */}
                      <div className="flex-1 relative bg-gray-900">
                        {proof.beforeImage ? (
                          <>
                            <img
                              src={proof.beforeImage}
                              alt="Before"
                              className="w-full h-full object-cover"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(proof.beforeImage);
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <ZoomIn size={16} className="text-white" />
                            </div>
                            <div className="absolute top-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-white text-[8px] font-bold">
                              BEFORE
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <span className="text-[10px] text-gray-500">
                              No image
                            </span>
                          </div>
                        )}
                      </div>

                      {/* After Image */}
                      <div className="flex-1 relative bg-gray-900">
                        {proof.afterImage ? (
                          <>
                            <img
                              src={proof.afterImage}
                              alt="After"
                              className="w-full h-full object-cover"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(proof.afterImage);
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <ZoomIn size={16} className="text-white" />
                            </div>
                            <div className="absolute top-1 right-1 bg-emerald-600/90 px-1.5 py-0.5 rounded text-white text-[8px] font-bold">
                              AFTER
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <span className="text-[10px] text-gray-500">
                              No image
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content - Compact */}
                    <div className="p-2.5">
                      {/* Header Row - ID and Status */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyId(proof.issueId);
                            }}
                            className="text-[9px] font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded flex items-center gap-0.5"
                          >
                            #{proof.issueId?.slice(-6) || proof._id?.slice(-6)}
                            {copiedId === proof.issueId ? (
                              <Check size={8} />
                            ) : (
                              <Copy size={8} />
                            )}
                          </button>
                          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-600 dark:text-green-400">
                            <CheckCircle2 size={8} />
                            <span className="text-[8px] font-medium">
                              Resolved
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProof(proof._id);
                          }}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* Title */}
                      <h3
                        className={`text-xs font-semibold mb-0.5 line-clamp-1 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {proof.title ||
                          `Resolution - ${proof.department || "Issue"}`}
                      </h3>

                      {/* Description - Single line */}
                      <p
                        className={`text-[9px] line-clamp-1 mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {proof.resolutionDetails}
                      </p>

                      {/* Footer - Date, Location, Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 text-[9px]">
                          <div className="flex items-center gap-0.5 text-gray-500">
                            <Clock size={8} />
                            <span>{formatDate(proof.resolvedAt)}</span>
                          </div>
                          {proof.location && (
                            <div className="flex items-center gap-0.5 text-gray-500">
                              <MapPin size={8} />
                              <span className="truncate max-w-[100px] text-[9px]">
                                {proof.location}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadProofPDF(proof);
                            }}
                            className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition"
                            title="Download PDF"
                          >
                            <Download size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/peopleVoice/proofpop/${proof.issueId}`,
                              );
                            }}
                            className="p-1 rounded-lg text-blue-500 hover:bg-blue-500/10 transition"
                            title="View Details"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination - Small */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-1.5 rounded-lg transition ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="flex gap-1">
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
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition ${
                          currentPage === pageNum
                            ? "bg-emerald-500 text-white shadow-md"
                            : isDark
                              ? "bg-gray-800 text-gray-400"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`p-1.5 rounded-lg transition ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
                >
                  <ChevronRight size={14} />
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
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-9 h-9 flex items-center justify-center text-lg hover:bg-black/70 transition"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProofsPage;
