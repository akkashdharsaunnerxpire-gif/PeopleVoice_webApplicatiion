import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import {
  CheckCircle,
  XCircle,
  MapPin,
  FileText,
  ArrowLeft,
  BookmarkPlus,
  CheckCheck,
  Calendar,
  Building2,
  AlertTriangle,
  ZoomIn,
  Clock,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Printer,
  Download,
  Share2,
  Heart,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Proofpop = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedToProofs, setSavedToProofs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    original: false,
  });

  useEffect(() => {
    if (id) {
      fetchIssue();
      checkIfProofSaved();
    } else {
      setError("No issue ID provided");
      setLoading(false);
    }
  }, [id]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${BACKEND_URL}/api/issues/${id}`);
      if (res.data.success && res.data.issue) {
        setIssue(res.data.issue);
      } else {
        setError("Issue not found");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setError("Issue not found. It may have been deleted.");
      } else {
        setError("Failed to load issue details");
      }
    } finally {
      setLoading(false);
    }
  };

  const checkIfProofSaved = async () => {
    try {
      const citizenId = localStorage.getItem("citizenId");
      if (!citizenId) return;
      const res = await axios.get(
        `${BACKEND_URL}/api/proofs/check/${id}?citizenId=${citizenId}`,
      );
      setSavedToProofs(res.data.saved);
    } catch (err) {
      console.error(err);
    }
  };

  const saveProofToCollection = async () => {
    if (saving || !issue) return;
    setSaving(true);
    try {
      const citizenId = localStorage.getItem("citizenId");
      const proofData = {
        issueId: id,
        citizenId: citizenId,
        title: `Issue #${id.slice(-6)} - Resolution Report`,
        department: issue.department,
        status: issue.status,
        resolutionDetails: issue.resolution_details,
        beforeImage: issue.images?.[0] || null,
        afterImage: issue.after_images?.[0] || null,
        resolvedAt: issue.updatedAt,
        location: issue.location,
        description: issue.description,
      };
      await axios.post(`${BACKEND_URL}/api/proofs/save`, proofData);
      setSavedToProofs(true);
    } catch (err) {
      console.error(err);
      alert("Failed to save proof");
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = async () => {
    if (!issue) return;
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
      pdf.text(`Issue ID: ${id}`, 15, y + 8);
      pdf.text(`Department: ${issue.department || "-"}`, 15, y + 18);
      pdf.text(`Status: ${issue.status}`, 15, y + 28);
      pdf.text(`Date: ${new Date(issue.updatedAt).toLocaleString()}`, 120, y + 8);
      y += 45;

      pdf.setFontSize(12);
      pdf.setTextColor(34, 197, 94);
      pdf.text("RESOLUTION DETAILS", 10, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const splitDetails = pdf.splitTextToSize(issue.resolution_details || "", 180);
      pdf.text(splitDetails, 10, y);
      y += splitDetails.length * 5 + 10;

      if (issue.images?.[0]) {
        const beforeImg = await getBase64FromUrl(issue.images[0]);
        pdf.setTextColor(34, 197, 94);
        pdf.text("BEFORE IMAGE", 10, y);
        y += 5;
        pdf.addImage(beforeImg, "JPEG", 10, y, 85, 60);
        y += 65;
      }

      if (issue.after_images?.[0]) {
        const afterImg = await getBase64FromUrl(issue.after_images[0]);
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

      pdf.save(`Issue_${id.slice(-6)}_Report.pdf`);
    } catch (error) {
      console.error(error);
      alert("PDF Download Failed");
    }
  };

  const getBase64FromUrl = async (url) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => resolve(reader.result);
    });
  };

  const handleVerify = async (type) => {
    if (!issue) return;
    setSubmitting(true);
    try {
      await axios.post(`${BACKEND_URL}/api/issues/verify/${id}`, {
        response: type,
        citizenId: localStorage.getItem("citizenId"),
      });

      if (type === "yes") {
        await saveProofToCollection();
      }

      window.parent.postMessage({ type: "CLOSE_PROOF_POPUP" }, "*");
      navigate("/peopleVoice/my-issues");
    } catch (err) {
      console.error(err);
      alert("Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const copyIssueId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareIssue = () => {
    if (navigator.share) {
      navigator.share({
        title: issue?.title || "Resolution Report",
        text: `Check out this resolution report for issue #${id?.slice(-6)}`,
        url: window.location.href,
      });
    } else {
      copyIssueId();
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? "bg-gradient-to-br from-gray-950 to-black" : "bg-gradient-to-br from-gray-50 to-white"}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? "bg-red-950/50" : "bg-red-100"}`}>
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>Oops! Something went wrong</h2>
          <p className={`mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/peopleVoice/proofspage")}
              className="px-6 py-3 rounded-xl bg-gray-500 text-white font-medium hover:bg-gray-600 transition"
            >
              Go Back
            </button>
            <button
              onClick={fetchIssue}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:shadow-lg transition"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!issue) return null;

  return (
    <div className={`min-h-screen ${isDark ? "bg-gradient-to-br from-gray-950 via-gray-900 to-black" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`sticky top-0 z-30 backdrop-blur-xl border-b ${isDark ? "bg-black/80 border-gray-800" : "bg-white/80 border-gray-100"}`}
      >
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className={`text-base sm:text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              Resolution Report
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={shareIssue}
                className={`p-2 rounded-xl transition-all duration-200 ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={downloadPDF}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isDark ? "bg-emerald-950 text-emerald-400 hover:bg-emerald-900" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
              >
                <Printer size={14} />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-32">
        {/* Main Report Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`rounded-2xl sm:rounded-3xl overflow-hidden border ${isDark ? "border-gray-800 bg-gray-900/50 backdrop-blur-sm" : "border-gray-200 bg-white/80 backdrop-blur-sm"} shadow-xl`}
        >
          {/* Hero Section */}
          <div className={`relative p-5 sm:p-6 ${isDark ? "bg-gradient-to-r from-emerald-950/30 to-transparent" : "bg-gradient-to-r from-emerald-50 to-transparent"}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${issue.status === "resolved" ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-blue-500/20 text-blue-500 border border-blue-500/30"}`}>
                    {issue.status?.toUpperCase()}
                  </span>
                  <button
                    onClick={copyIssueId}
                    className={`px-2.5 py-1 rounded-full text-xs font-mono flex items-center gap-1 transition-all ${isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    #{id?.slice(-6)}
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <h2 className={`text-xl sm:text-2xl font-bold leading-tight mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                  {issue.title || "Resolution Report"}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Building2 size={14} className="text-emerald-500" />
                    <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {issue.department || "General Department"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-emerald-500" />
                    <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {new Date(issue.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-full w-fit ${isDark ? "bg-emerald-950/50" : "bg-emerald-100"}`}>
                <ShieldCheck size={28} className="text-emerald-500" />
              </div>
            </div>
          </div>

          {/* Images Section */}
          {(issue.images?.[0] || issue.after_images?.[0]) && (
            <div className="p-5 sm:p-6 border-t border-b border-gray-200 dark:border-gray-800">
              <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                <FileText size={16} />
                Evidence Documentation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {issue.images?.[0] && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="group">
                    <div className={`rounded-xl overflow-hidden border-2 ${isDark ? "border-gray-700 hover:border-emerald-500" : "border-gray-200 hover:border-emerald-400"} transition-all duration-300 cursor-pointer bg-gray-50 dark:bg-gray-800/50`}>
                      <div className="relative aspect-video">
                        <img
                          src={issue.images[0]}
                          alt="Before"
                          className="w-full h-full object-cover"
                          onClick={() => setSelectedImage(issue.images[0])}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center" onClick={() => setSelectedImage(issue.images[0])}>
                          <ZoomIn size={28} className="text-white" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <p className="text-white text-sm font-medium">BEFORE</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {issue.after_images?.[0] && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="group">
                    <div className={`rounded-xl overflow-hidden border-2 ${isDark ? "border-gray-700 hover:border-emerald-500" : "border-gray-200 hover:border-emerald-400"} transition-all duration-300 cursor-pointer bg-gray-50 dark:bg-gray-800/50`}>
                      <div className="relative aspect-video">
                        <img
                          src={issue.after_images[0]}
                          alt="After"
                          className="w-full h-full object-cover"
                          onClick={() => setSelectedImage(issue.after_images[0])}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center" onClick={() => setSelectedImage(issue.after_images[0])}>
                          <ZoomIn size={28} className="text-white" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <p className="text-white text-sm font-medium">AFTER</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Resolution Details */}
          {issue.resolution_details && (
            <div className="border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => toggleSection("details")}
                className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCheck size={18} className="text-emerald-500" />
                  <h3 className={`text-base font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Resolution Details
                  </h3>
                </div>
                <motion.div animate={{ rotate: expandedSections.details ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={20} className={isDark ? "text-gray-400" : "text-gray-500"} />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedSections.details && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden px-5 sm:px-6 pb-5 sm:pb-6"
                  >
                    <div className={`p-4 rounded-xl ${isDark ? "bg-gray-800/50 border border-gray-700" : "bg-gray-50 border border-gray-100"}`}>
                      <p className={`text-base leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {issue.resolution_details}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Original Complaint */}
          {issue.description && (
            <div className="border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => toggleSection("original")}
                className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-emerald-500" />
                  <h3 className={`text-base font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Original Complaint
                  </h3>
                </div>
                <motion.div animate={{ rotate: expandedSections.original ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={20} className={isDark ? "text-gray-400" : "text-gray-500"} />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedSections.original && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden px-5 sm:px-6 pb-5 sm:pb-6"
                  >
                    <div className={`p-4 rounded-xl ${isDark ? "bg-gray-800/50 border border-gray-700" : "bg-gray-50 border border-gray-100"}`}>
                      <p className={`text-base leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                        {issue.description}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Location & Date */}
          <div className="p-5 sm:p-6 space-y-4">
            {issue.location && (
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                  <MapPin size={18} className="text-emerald-500" />
                </div>
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    Incident Location
                  </p>
                  <p className={`text-base ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {issue.location}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
                <Clock size={18} className="text-emerald-500" />
              </div>
              <div>
                <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  Resolution Date & Time
                </p>
                <p className={`text-base font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                  {new Date(issue.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Verification Section */}
        {issue.status?.toLowerCase() !== "resolved" && issue.status?.toLowerCase() !== "closed" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`mt-5 p-5 sm:p-6 rounded-2xl border ${isDark ? "border-gray-800 bg-gray-900/50 backdrop-blur-sm" : "border-gray-200 bg-white/80 backdrop-blur-sm"}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <UserCheck size={18} className="text-emerald-500" />
              <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                Confirm Resolution Status
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVerify("yes")}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                <CheckCircle size={18} />
                Yes, Resolved
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVerify("no")}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                <XCircle size={18} />
                Not Resolved
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleVerify("not_here")}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                <MapPin size={18} />
                Wrong Location
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Save Button */}
        {!savedToProofs && issue.status === "resolved" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-5"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveProofToCollection}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium hover:shadow-xl transition-all duration-200"
            >
              {saving ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <BookmarkPlus size={18} />
                  Save to My Proofs Collection
                </>
              )}
            </motion.button>
          </motion.div>
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
            onClick={() => {
              setSelectedImage(null);
              setIsImageFullscreen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Full size"
                className={`max-w-full ${isImageFullscreen ? "max-h-screen" : "max-h-[80vh]"} rounded-xl shadow-2xl object-contain cursor-pointer`}
                onClick={() => setIsImageFullscreen(!isImageFullscreen)}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  className="bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition"
                  onClick={() => setIsImageFullscreen(!isImageFullscreen)}
                >
                  {isImageFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button
                  className="bg-black/50 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/70 transition"
                  onClick={() => window.open(selectedImage, "_blank")}
                >
                  <ExternalLink size={20} />
                </button>
              </div>
              <button
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2.5 text-white hover:bg-black/70 transition"
                onClick={() => {
                  setSelectedImage(null);
                  setIsImageFullscreen(false);
                }}
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Proofpop;