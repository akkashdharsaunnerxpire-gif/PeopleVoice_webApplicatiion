import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import {
  CheckCircle,
  MapPin,
  ArrowLeft,
  BookmarkPlus,
  CheckCheck,
  Calendar,
  Building2,
  Clock,
  Download,
  Share2,
  ThumbsUp,
  X,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Helper: Convert image URL to base64
const getBase64FromUrl = async (url) => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to convert image:", error);
    return null;
  }
};

// ======================= IMAGE GALLERY COMPONENT =======================
const ImageGallery = ({ images, label, onImageClick }) => {
  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 text-center text-gray-500 dark:text-gray-400">
        No {label.toLowerCase()} images available
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 pb-2">
        <div className="flex gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => onImageClick(img)}
              className="relative flex-shrink-0 w-48 h-48 rounded-xl overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-800 shadow-md hover:scale-105 transition duration-300"
            >
              <img
                src={img}
                alt={`${label} ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                {label} {idx + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
      {images.length > 2 && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-gradient-to-l from-gray-900/50 to-transparent w-12 h-full pointer-events-none flex items-center justify-end pr-2">
          <ChevronRight className="text-white w-5 h-5 opacity-70" />
        </div>
      )}
    </div>
  );
};

// ======================= MAIN PROOFPOP COMPONENT =======================
const Proofpop = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedToProofs, setSavedToProofs] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [copied, setCopied] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIssue();
      checkIfProofSaved();
      checkIfReviewAlreadySubmitted();
    } else {
      setError("No issue ID provided");
      setLoading(false);
    }
  }, [id]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/issues/${id}`);
      if (res.data.success && res.data.issue) setIssue(res.data.issue);
      else setError("Issue not found");
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "Issue not found"
          : "Failed to load issue",
      );
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

  const checkIfReviewAlreadySubmitted = async () => {
    try {
      const citizenId = localStorage.getItem("citizenId");
      if (!citizenId) return;
      const res = await axios.get(
        `${BACKEND_URL}/api/reviews/check/${id}?citizenId=${citizenId}`,
      );
      setReviewSubmitted(res.data.submitted);
    } catch (err) {
      setReviewSubmitted(false);
    }
  };

  const saveProofToCollection = async () => {
    if (saving || !issue || savedToProofs) return;
    setSaving(true);
    try {
      const citizenId = localStorage.getItem("citizenId");
      const proofData = {
        issueId: id,
        citizenId,
        title: `Issue #${id.slice(-6)} - Resolution Report`,
        department: issue.department,
        status: issue.status,
        resolutionDetails: issue.resolution_details,
        beforeImage:
          typeof issue.images?.[0] === "string"
            ? issue.images?.[0]
            : issue.images?.[0]?.url || null,

        afterImage:
          typeof issue.after_images?.[0] === "string"
            ? issue.after_images?.[0]
            : issue.after_images?.[0]?.url || null,
        resolvedAt: issue.updatedAt,
        location: issue.location,
        description: issue.description,
      };
      await axios.post(`${BACKEND_URL}/api/proofs/save`, proofData);
      setSavedToProofs(true);
    } catch (err) {
      alert("Failed to save to proofs");
    } finally {
      setSaving(false);
    }
  };

  const handleAddToMyProofs = () => {
    if (!savedToProofs && !saving) saveProofToCollection();
  };

  const downloadPDF = async () => {
    if (!issue) return;

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      let y = 20;

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxImageWidth = pageWidth - margin * 2;

      // Calculate available space on single page (A4 = 297mm height)
      const maxY = 280; // Max Y position on single page
      let currentY = y;

      // TEXT WRAP function
      const addWrappedText = (text, fontSize, fontStyle = "normal") => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", fontStyle);
        const lines = pdf.splitTextToSize(text, maxImageWidth);
        const spaceNeeded = lines.length * (fontSize * 0.35) + 4;

        // If running out of space, scale down further
        if (currentY + spaceNeeded > maxY) {
          pdf.setFontSize(fontSize - 1);
          const smallerLines = pdf.splitTextToSize(text, maxImageWidth);
          pdf.text(smallerLines, margin, currentY);
          currentY += smallerLines.length * ((fontSize - 1) * 0.35) + 4;
        } else {
          pdf.text(lines, margin, currentY);
          currentY += spaceNeeded;
        }
      };

      // IMAGE ADD - Auto scale based on number of images
      const addHorizontalImages = async (images, label) => {
        try {
          const gap = 5;
          const availableWidth = maxImageWidth;
          const imgWidth = (availableWidth - gap) / 2;
          const maxHeight = 60;

          let x1 = margin;
          let x2 = margin + imgWidth + gap;

          for (let i = 0; i < images.length; i += 2) {
            const img1 = await getBase64FromUrl(images[i]);
            const img2 = images[i + 1]
              ? await getBase64FromUrl(images[i + 1])
              : null;

            let height1 = maxHeight;
            let height2 = maxHeight;

            // PAGE BREAK
            if (currentY + maxHeight > 270) {
              pdf.addPage();
              currentY = 20;
            }

            // IMAGE 1
            if (img1) {
              let format1 = img1.startsWith("data:image/png") ? "PNG" : "JPEG";
              pdf.addImage(img1, format1, x1, currentY, imgWidth, height1);

              pdf.text(
                `${label} ${i + 1}`,
                x1 + imgWidth / 2,
                currentY + height1 + 4,
                {
                  align: "center",
                },
              );
            }

            // IMAGE 2
            if (img2) {
              let format2 = img2.startsWith("data:image/png") ? "PNG" : "JPEG";
              pdf.addImage(img2, format2, x2, currentY, imgWidth, height2);

              pdf.text(
                `${label} ${i + 2}`,
                x2 + imgWidth / 2,
                currentY + height2 + 4,
                {
                  align: "center",
                },
              );
            }

            currentY += maxHeight + 10;
          }
        } catch (err) {
          console.error("Horizontal image error:", err);
        }
      };

      // ================= HEADER =================
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Resolution Report", margin, currentY);
      currentY += 8;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Issue ID: #${id.slice(-6)}`, margin, currentY);
      pdf.text(`Status: RESOLVED`, pageWidth - margin - 30, currentY);
      currentY += 6;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      const titleLines = pdf.splitTextToSize(
        issue.title || "Resolution Report",
        maxImageWidth,
      );
      pdf.text(titleLines, margin, currentY);
      currentY += titleLines.length * 5 + 6;

      // ================= BEFORE SECTION =================
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("📋 BEFORE RESOLUTION", margin, currentY);
      currentY += 6;

      const beforeImages = (issue.images || []).map((img) =>
        typeof img === "string" ? img : img.url,
      );

      const afterImages = (issue.after_images || []).map((img) =>
        typeof img === "string" ? img : img.url,
      );
      const totalImages = beforeImages.length + afterImages.length;

      // Add before images
      if (beforeImages.length > 0) {
        await addHorizontalImages(beforeImages, "Before Image");
      }

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");

      addWrappedText(
        `Description: ${issue.description_en || issue.description_ta || "No description provided"}`,
        9,
      );
      addWrappedText(`Location: ${issue.area || "Not specified"}`, 9);
      addWrappedText(`Department: ${issue.department || "Not specified"}`, 9);
      addWrappedText(
        `Reported Date: ${new Date(issue.createdAt).toLocaleDateString()}`,
        9,
      );

      currentY += 4;

      // ================= AFTER SECTION =================
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("✅ AFTER RESOLUTION", margin, currentY);
      currentY += 6;

      if (afterImages.length > 0) {
        await addHorizontalImages(afterImages, "After Image");
      }

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");

      addWrappedText(
        `Resolution: ${issue.resolution_details || "No resolution details provided"}`,
        9,
      );
      addWrappedText(
        `Resolved Date: ${new Date(issue.updatedAt).toLocaleDateString()}`,
        9,
      );

      // ================= FOOTER =================
      pdf.setFontSize(8);
      pdf.text("Generated by PeopleVoice Proof System", margin, 285);

      pdf.save(`Resolution_${id.slice(-6)}.pdf`);
    } catch (error) {
      console.error("PDF error:", error);
      alert("Failed to generate PDF");
    }
  };

  const shareIssue = () => {
    if (navigator.share) {
      navigator.share({
        title: "Resolution Report",
        text: `Issue #${id?.slice(-6)}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    window.parent.postMessage({ type: "CLOSE_PROOF_POPUP" }, "*");
    navigate("/peopleVoice/proofspage");
  };

  // Handle "Yes, Resolved" – navigate to review page
  const handleYesResolved = () => {
    navigate(`/peopleVoice/resolution-review/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h2 className="text-red-500 text-2xl mb-4">Oops!</h2>
        <p>{error}</p>
        <button
          onClick={handleClose}
          className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-2xl"
        >
          Close
        </button>
      </div>
    );
  }

  const citizenId = localStorage.getItem("citizenId");

  return (
    <div
      className={`min-h-screen pb-24 ${
        isDark ? "dark bg-gray-950 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div
        className={`fixed top-0 left-0 right-0 ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
        } border-b z-50 px-5 py-4 flex items-center justify-between shadow-sm`}
      >
        <button
          onClick={handleClose}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 active:scale-95 transition"
        >
          <ArrowLeft size={24} />
          <span className="font-medium">Back</span>
        </button>
        <h1 className="font-bold text-lg">Resolution Report</h1>
        <div className="w-8"></div>
      </div>

      <div className="pt-20 px-4 max-w-2xl mx-auto">
        {/* Status & ID */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div
            className={`bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-5 py-2 rounded-full flex items-center gap-2 font-semibold text-sm`}
          >
            <CheckCircle size={18} />
            RESOLVED
          </div>
          <div
            onClick={() => navigator.clipboard.writeText(id)}
            className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            #{id?.slice(-6)}
          </div>
          {copied && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 animate-pulse">
              Copied!
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold leading-tight mb-6">
          {issue.title || "Resolution Report"}
        </h2>

        {/* BEFORE & AFTER CARDS */}
        <div className="space-y-6 mb-8">
          {/* BEFORE CARD */}
          <div
            className={`rounded-2xl overflow-hidden shadow-sm ${
              isDark
                ? "bg-gray-900 border border-gray-800"
                : "bg-white border border-gray-100"
            }`}
          >
            <div className="bg-amber-50 dark:bg-amber-950/30 px-5 py-3 border-b border-amber-200 dark:border-amber-800/50">
              <h3 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Clock size={18} /> Before Resolution
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <ImageGallery
                images={(issue.images || []).map((img) =>
                  typeof img === "string" ? img : img.url,
                )}
                label="BEFORE"
              />
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {issue.description_en || "No description provided."}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {issue?.description_ta}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-2">
                  <MapPin size={14} />
                  <span>{issue.area || "Area not specified"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Building2 size={14} />
                  <span>{issue.department || "Department not specified"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar size={14} />
                  <span>
                    Reported: {new Date(issue.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AFTER CARD */}
          <div
            className={`rounded-2xl overflow-hidden shadow-sm ${
              isDark
                ? "bg-gray-900 border border-gray-800"
                : "bg-white border border-gray-100"
            }`}
          >
            <div className="bg-emerald-50 dark:bg-emerald-950/30 px-5 py-3 border-b border-emerald-200 dark:border-emerald-800/50">
              <h3 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle size={18} /> After Resolution
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <ImageGallery
                images={(issue.after_images || []).map((img) =>
                  typeof img === "string" ? img : img.url,
                )}
                label="AFTER"
                onImageClick={setSelectedImage}
              />
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {issue.resolution_details ||
                    "No resolution details provided."}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-2">
                  <Calendar size={14} />
                  <span>
                    Resolved on:{" "}
                    {new Date(issue.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <CheckCheck size={14} />
                  <span>Status: Resolved</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ADD TO PROOFS BUTTON */}
        <button
          onClick={handleAddToMyProofs}
          disabled={savedToProofs || saving}
          className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 mb-5 transition-all shadow-md ${
            savedToProofs
              ? "bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg active:scale-[0.98]"
          }`}
        >
          {saving ? (
            "Saving..."
          ) : savedToProofs ? (
            <>
              <CheckCheck size={22} /> Already in My Proofs
            </>
          ) : (
            <>
              <BookmarkPlus size={22} /> Add to My Proofs
            </>
          )}
        </button>

        {/* DOWNLOAD & SHARE BUTTONS */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={downloadPDF}
            className={`py-3 rounded-2xl border flex items-center justify-center gap-2 font-medium text-sm ${
              isDark
                ? "border-gray-700 bg-gray-900 hover:bg-gray-800 text-white"
                : "border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
            } transition active:scale-95`}
          >
            <Download size={18} /> Download PDF
          </button>
          <button
            onClick={shareIssue}
            className={`py-3 rounded-2xl border flex items-center justify-center gap-2 font-medium text-sm ${
              isDark
                ? "border-gray-700 bg-gray-900 hover:bg-gray-800 text-white"
                : "border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
            } transition active:scale-95`}
          >
            <Share2 size={18} /> Share
          </button>
        </div>

        {/* YES, RESOLVED BUTTON – navigates to review page */}
        {citizenId && !reviewSubmitted && (
          <div className="mt-4">
            <button
              onClick={handleYesResolved}
              className="w-full py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <ThumbsUp size={22} /> Yes, Resolved
            </button>
          </div>
        )}

        {reviewSubmitted && (
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            ✅ You have already reviewed this resolution. Thank you!
          </div>
        )}
      </div>

      {/* FULLSCREEN IMAGE MODAL */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Fullscreen evidence"
                className="max-h-[88vh] w-auto mx-auto rounded-2xl shadow-2xl"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-3 -right-3 bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg hover:bg-red-700 transition"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Proofpop;
