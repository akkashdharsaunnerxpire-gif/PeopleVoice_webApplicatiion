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
  X,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  Trophy,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "../../Context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Image Gallery Component
const ImageGallery = ({ images, label, onImageClick }) => {
  const galleryRef = React.useRef(null);
  const [touchStart, setTouchStart] = React.useState(null);

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-6 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 transition-all">
        <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No {label.toLowerCase()} images available</p>
      </div>
    );
  }

  const scroll = (direction) => {
    if (galleryRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200;
      galleryRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      scroll(diff > 0 ? "right" : "left");
    }
    setTouchStart(null);
  };

  const getImageSize = () => {
    if (images.length === 1) return "w-full h-[220px] sm:h-[260px]";
    return "w-[140px] sm:w-[160px] h-[140px] sm:h-[160px]";
  };

  return (
    <div className="relative group">
      {images.length > 2 && (
        <>
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center shadow-lg"
            aria-label="Previous image"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center shadow-lg"
            aria-label="Next image"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      <div
        ref={galleryRef}
        className="flex gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 pb-3 px-0.5 snap-x snap-mandatory"
        style={{
          scrollbarWidth: "thin",
          scrollBehavior: "smooth",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.map((img, idx) => (
          <motion.div
            key={idx}
            whileTap={{ scale: 0.95 }}
            onClick={() => onImageClick(img)}
            className={`relative flex-shrink-0 ${getImageSize()} rounded-xl overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 snap-start group/image`}
          >
            <img
              src={img}
              alt={`${label} ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm font-medium">
              {idx + 1}/{images.length}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-all duration-300 flex items-center justify-center">
              <ExternalLink size={20} className="text-white drop-shadow-lg" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Info Card Component
const InfoCard = ({ icon: Icon, title, children, color = "emerald" }) => {
  const colorClasses = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800/50",
      text: "text-emerald-700 dark:text-emerald-400",
      gradient: "from-emerald-500 to-teal-500",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800/50",
      text: "text-amber-700 dark:text-amber-400",
      gradient: "from-amber-500 to-orange-500",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300"
    >
      <div
        className={`px-5 py-3.5 border-b ${colorClasses[color].bg} ${colorClasses[color].border}`}
      >
        <h3 className="font-bold flex items-center gap-2 text-base sm:text-lg">
          <div
            className={`p-1 rounded-lg bg-gradient-to-r ${colorClasses[color].gradient} bg-opacity-10`}
          >
            <Icon size={18} className={colorClasses[color].text} />
          </div>
          {title}
        </h3>
      </div>
      <div className="p-3 space-y-4">{children}</div>
    </motion.div>
  );
};

// Regular Resolution Confirmation Modal (for normal issues)
const ResolutionConfirmationModal = ({
  isOpen,
  onClose,
  issueId,
  onConfirm,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [validReason, setValidReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    if (option === "NO") {
      setShowReasonInput(true);
    } else {
      setShowReasonInput(false);
      setValidReason("");
    }
  };

  const handleConfirm = async () => {
    const citizenId = localStorage.getItem("citizenId");

    if (selectedOption === "YES") {
      onClose();
      onConfirm(issueId, "YES");
    }

    if (selectedOption === "NO") {
      if (!validReason.trim()) {
        alert("Please provide a valid reason");
        return;
      }

      setIsSubmitting(true);

      try {
        await axios.post(`${BACKEND_URL}/api/reviews`, {
          issueId,
          citizenId,
          isResolved: false,
          feedback: validReason,
        });
        onClose();
        window.parent.postMessage(
          {
            type: "CLOSE_PROOF_POPUP_AND_NAVIGATE",
            path: "/peopleVoice/feed",
          },
          "*",
        );
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to submit feedback");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-3">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Confirm Resolution
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Please confirm if the resolution meets your expectations
          </p>

          <div className="space-y-3 mb-6">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionSelect("YES")}
              className={`w-full py-3.5 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-medium ${
                selectedOption === "YES"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 shadow-md"
                  : "border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
              }`}
            >
              <CheckCircle size={20} />
              <span>✅ YES – Properly Resolved</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionSelect("NO")}
              className={`w-full py-3.5 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-medium ${
                selectedOption === "NO"
                  ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 shadow-md"
                  : "border-gray-200 dark:border-gray-700 hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20"
              }`}
            >
              <X size={20} />
              <span>❌ NO – Not Properly Resolved</span>
            </motion.button>
          </div>

          <AnimatePresence>
            {showReasonInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-6 overflow-hidden"
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valid Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={validReason}
                  onChange={(e) => setValidReason(e.target.value)}
                  placeholder="Please provide a valid reason why the issue is not properly resolved..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows="4"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-95"
            >
              Cancel
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              disabled={
                !selectedOption ||
                (selectedOption === "NO" && !validReason.trim()) ||
                isSubmitting
              }
              className={`flex-1 py-3.5 rounded-xl font-medium transition shadow-lg ${
                selectedOption === "YES"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl"
                  : selectedOption === "NO" && validReason.trim()
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-xl"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Submitting...
                </div>
              ) : (
                "Submit"
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Re-Confirmation Modal for Improperly Resolved Issues
const ReconfirmationModal = ({
  isOpen,
  onClose,
  issueId,
  onConfirm,
  previousFeedback,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [validReason, setValidReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    if (option === "NO") {
      setShowReasonInput(true);
    } else {
      setShowReasonInput(false);
      setValidReason("");
    }
  };

  const handleConfirm = async () => {
    const citizenId = localStorage.getItem("citizenId");

    if (selectedOption === "YES") {
      setIsSubmitting(true);
      try {
        await axios.post(`${BACKEND_URL}/api/reviews`, {
          issueId,
          citizenId,
          isResolved: true,
          rating: 5,
          feedback: "The issue has been properly resolved now.",
        });
        onClose();
        onConfirm(issueId, "YES");
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to submit confirmation");
      } finally {
        setIsSubmitting(false);
      }
    }

    if (selectedOption === "NO") {
      if (!validReason.trim()) {
        alert("Please provide a valid reason");
        return;
      }

      setIsSubmitting(true);

      try {
        await axios.post(`${BACKEND_URL}/api/reviews`, {
          issueId,
          citizenId,
          isResolved: false,
          feedback: validReason,
        });
        onClose();
        window.parent.postMessage(
          {
            type: "CLOSE_PROOF_POPUP_AND_NAVIGATE",
            path: "/peopleVoice/feed",
          },
          "*",
        );
      } catch (error) {
        console.error("Error:", error);
        alert("Failed to submit feedback");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={24} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Re-Confirm Resolution
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl mb-4 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              ⚠️ This issue was previously reported as improperly resolved. The
              municipality has made a new resolution attempt.
            </p>
            {previousFeedback && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                <strong>Your previous feedback:</strong> {previousFeedback}
              </p>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Please review the new resolution and confirm if it now meets your
            expectations.
          </p>

          <div className="space-y-3 mb-6">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionSelect("YES")}
              className={`w-full py-3.5 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-medium ${
                selectedOption === "YES"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 shadow-md"
                  : "border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
              }`}
            >
              <CheckCircle size={20} />
              <span>✅ YES – Now Properly Resolved</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOptionSelect("NO")}
              className={`w-full py-3.5 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-medium ${
                selectedOption === "NO"
                  ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 shadow-md"
                  : "border-gray-200 dark:border-gray-700 hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/20"
              }`}
            >
              <X size={20} />
              <span>❌ NO – Still Not Properly Resolved</span>
            </motion.button>
          </div>

          <AnimatePresence>
            {showReasonInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-6 overflow-hidden"
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valid Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={validReason}
                  onChange={(e) => setValidReason(e.target.value)}
                  placeholder="Please provide a valid reason why the issue is still not properly resolved..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows="4"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-95"
            >
              Later
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              disabled={
                !selectedOption ||
                (selectedOption === "NO" && !validReason.trim()) ||
                isSubmitting
              }
              className={`flex-1 py-3.5 rounded-xl font-medium transition shadow-lg ${
                selectedOption === "YES"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl"
                  : selectedOption === "NO" && validReason.trim()
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-xl"
                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Submitting...
                </div>
              ) : (
                "Confirm"
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Main Proofpop Component
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
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showReconfirmationModal, setShowReconfirmationModal] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [allowResubmit, setAllowResubmit] = useState(false);
  const [previousFeedback, setPreviousFeedback] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchIssue();
      checkIfProofSaved();
      checkReviewStatus();
    } else {
      setError("No issue ID provided");
      setLoading(false);
    }
  }, [id]);

  const extractAdminDetails = (statement) => {
    if (!statement) return { name: "", district: "" };

    const match = statement.match(/I,\s*(.*?)\s*\((.*?)\)/);

    return {
      name: match?.[1]?.trim() || "",
      district:
        match?.[2]?.replace(/Administration|Administrator/i, "").trim() || "",
    };
  };
  const { name: extractedName, district: extractedDistrict } =
    extractAdminDetails(issue?.resolutionConfirmationStatement);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/issues/${id}`);
      if (res.data.success && res.data.issue) {
        setIssue(res.data.issue);
      } else {
        setError("Issue not found");
      }
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

  const checkReviewStatus = async () => {
    try {
      const citizenId = localStorage.getItem("citizenId");
      if (!citizenId) return;

      const res = await axios.get(
        `${BACKEND_URL}/api/reviews/check/${id}?citizenId=${citizenId}`,
      );

      setHasSubmitted(res.data.submitted);
      setAllowResubmit(res.data.allowResubmit);

      if (res.data.allowResubmit) {
        try {
          const prevRes = await axios.get(
            `${BACKEND_URL}/api/reviews/previous/${id}?citizenId=${citizenId}`,
          );
          if (prevRes.data.feedback) {
            setPreviousFeedback(prevRes.data.feedback);
          }
        } catch (err) {
          console.error("Error fetching previous feedback:", err);
        }
      }
    } catch (err) {
      console.error("Check review error:", err);
    }
  };

  const handleResolutionConfirm = async (issueId, response) => {
    if (response !== "YES" || confirmLoading) return;

    setConfirmLoading(true);

    try {
      const citizenId = localStorage.getItem("citizenId");

      if (!citizenId) {
        alert("User not logged in");
        return;
      }

      let alreadyReviewed = false;

      try {
        const checkRes = await axios.get(
          `${BACKEND_URL}/api/reviews/check/${issueId}?citizenId=${citizenId}`,
        );

        if (checkRes.data.submitted) {
          console.log("Already reviewed → skipping");
          alreadyReviewed = true;
        }
      } catch (checkErr) {
        console.warn("Check review failed, continuing...");
      }

      if (!alreadyReviewed) {
        await axios.post(`${BACKEND_URL}/api/reviews`, {
          issueId,
          citizenId,
          isResolved: true,
        });
      }

      try {
        await saveProofToCollection();
      } catch (proofErr) {
        console.warn("Proof save failed, continuing...");
      }

      const closeRes = await axios.post(
        `${BACKEND_URL}/api/issues/verify/${issueId}`,
        {
          response: "yes",
          citizenId: citizenId,
        },
      );

      if (!closeRes.data?.success) {
        throw new Error("Issue closing failed");
      }

      console.log("✅ Issue closed:", closeRes.data);

      window.top.location.href = `/peopleVoice/resolution-review/${issueId}`;
    } catch (err) {
      console.error("Resolution confirm error:", err);
      alert("Failed to confirm resolution. Please try again.");
    } finally {
      setConfirmLoading(false);
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
      const res = await axios.post(`${BACKEND_URL}/api/proofs/save`, proofData);
      if (res.data?.proof) {
        setIssue((prev) => ({
          ...prev,
          adminName: res.data.proof.adminName,
          adminDistrict: res.data.proof.adminDistrict,
          municipality: res.data.proof.municipality,
          officerName: res.data.proof.officerName,
          resolutionConfirmationStatement:
            res.data.proof.resolutionConfirmationStatement,
        }));
      }
      localStorage.setItem("hasNewProof", "true");
      window.dispatchEvent(new Event("proof_update"));
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
  if (!issue || isGeneratingPDF) return;

  setIsGeneratingPDF(true);

  try {
    // Show loading toast
    const loadingToast = document.createElement("div");
    loadingToast.id = "pdf-loading-toast";
    loadingToast.innerHTML = `
      <div style="position: fixed; bottom: 80px; right: 20px; background: #1f2937; color: white; padding: 10px 16px; border-radius: 30px; z-index: 99999; display: flex; align-items: center; gap: 8px; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
        <div style="width: 14px; height: 14px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <span>Generating PDF...</span>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
    document.body.appendChild(loadingToast);

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    let yPos = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;

    const cleanText = (text) => {
      if (!text) return "";
      let cleaned = String(text);
      cleaned = cleaned.replace(/<[^>]*>/g, "");
      cleaned = cleaned.replace(/[^\w\s\u0B80-\u0BFF.,!?()\-:;'"/]/g, "");
      cleaned = cleaned.replace(/\s+/g, " ");
      return cleaned.trim();
    };

    const addWrappedText = (text, y, size = 10, isBold = false) => {
      if (!text) return y;
      const cleanTxt = cleanText(text);
      if (!cleanTxt || cleanTxt.length === 0) return y;
      pdf.setFontSize(size);
      pdf.setFont("helvetica", isBold ? "bold" : "normal");
      pdf.setTextColor(0, 0, 0);
      const lines = pdf.splitTextToSize(cleanTxt, maxWidth);
      pdf.text(lines, margin, y);
      return y + lines.length * (size * 0.35);
    };

    const addImageToPDF = async (imgUrl, y, maxHeight = 60) => {
      try {
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
        if (base64) {
          pdf.addImage(base64, "JPEG", margin, y, maxWidth, maxHeight);
          return y + maxHeight + 5;
        }
        return y;
      } catch (err) {
        console.warn("Image failed to load:", imgUrl);
        return y;
      }
    };

    // ---------- HEADER ----------
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(6, 95, 70);
    pdf.text("RESOLUTION REPORT", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    pdf.text("Official Resolution Document - PeopleVoice System", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // ---------- INFO CARD (ID, Status, Dept, Location) ----------
    pdf.setFillColor(240, 253, 244);
    pdf.rect(margin, yPos - 5, maxWidth, 45, "F");
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(6, 95, 70);
    pdf.text("Issue ID:", margin + 5, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(75, 85, 99);
    pdf.text(`#${id.slice(-8)}`, margin + 35, yPos);
    yPos += 7;

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(6, 95, 70);
    pdf.text("Status:", margin + 5, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(5, 150, 105);
    pdf.text("RESOLVED", margin + 35, yPos);
    yPos += 7;

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(6, 95, 70);
    pdf.text("Department:", margin + 5, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(75, 85, 99);
    const deptText = (issue.department || "Not Specified").substring(0, 40);
    pdf.text(deptText, margin + 35, yPos);
    yPos += 7;

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(6, 95, 70);
    pdf.text("Location:", margin + 5, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(75, 85, 99);
    const locationText = (issue.area || issue.district || issue.location || "Not Specified").substring(0, 55);
    pdf.text(locationText, margin + 35, yPos);
    yPos += 10;

    // ---------- TITLE ----------
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(31, 41, 55);
    const titleText = (issue.title || "Issue Resolution Report").substring(0, 60);
    pdf.text(titleText, margin, yPos);
    yPos += 12;

    // ---------- BEFORE RESOLUTION ----------
    pdf.setFillColor(255, 251, 235);
    pdf.rect(margin, yPos - 4, maxWidth, 8, "F");
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(180, 83, 9);
    pdf.text("BEFORE RESOLUTION", margin + 5, yPos);
    yPos += 10;

    const beforeImages = (issue.images || []).map(img => typeof img === "string" ? img : img.url).filter(Boolean);
    if (beforeImages.length > 0) {
      const imgHeight = beforeImages.length === 1 ? 70 : 50;
      for (let i = 0; i < Math.min(beforeImages.length, 3); i++) {
        if (yPos > 250) { pdf.addPage(); yPos = 20; }
        yPos = await addImageToPDF(beforeImages[i], yPos, imgHeight);
      }
    } else {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(156, 163, 175);
      pdf.text("No before images available", margin, yPos);
      yPos += 6;
    }
    yPos += 3;

    if (yPos > 250) { pdf.addPage(); yPos = 20; }
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Issue Description:", margin, yPos);
    yPos += 5;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    const descText = issue.description_en || issue.description || "No description provided.";
    const descLines = pdf.splitTextToSize(cleanText(descText), maxWidth);
    pdf.text(descLines, margin, yPos);
    yPos += descLines.length * 4 + 5;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    const reportedDate = new Date(issue.createdAt).toLocaleDateString();
    const reportedTime = new Date(issue.createdAt).toLocaleTimeString();
    pdf.text(`Reported: ${reportedDate} at ${reportedTime}`, margin, yPos);
    yPos += 15;

    // ---------- AFTER RESOLUTION (with full details) ----------
    if (yPos > 250) { pdf.addPage(); yPos = 20; }
    pdf.setFillColor(236, 253, 245);
    pdf.rect(margin, yPos - 4, maxWidth, 8, "F");
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(6, 95, 70);
    pdf.text("AFTER RESOLUTION", margin + 5, yPos);
    yPos += 10;

    // After Images
    const afterImages = (issue.after_images || []).map(img => typeof img === "string" ? img : img.url).filter(Boolean);
    if (afterImages.length > 0) {
      const imgHeight = afterImages.length === 1 ? 70 : 50;
      for (let i = 0; i < Math.min(afterImages.length, 3); i++) {
        if (yPos > 250) { pdf.addPage(); yPos = 20; }
        yPos = await addImageToPDF(afterImages[i], yPos, imgHeight);
      }
    } else {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(156, 163, 175);
      pdf.text("No after resolution images available", margin, yPos);
      yPos += 6;
    }
    yPos += 3;

    if (yPos > 250) { pdf.addPage(); yPos = 20; }
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Resolution Details:", margin, yPos);
    yPos += 5;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    const resText = issue.resolution_details || "No resolution details provided.";
    const resLines = pdf.splitTextToSize(cleanText(resText), maxWidth);
    pdf.text(resLines, margin, yPos);
    yPos += resLines.length * 4 + 5;

    // Resolved by (officer, municipality, department)
    if (issue.officerName || issue.municipality || issue.department) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Resolved by:", margin, yPos);
      yPos += 4;
      pdf.setFont("helvetica", "normal");
      let resolvedByText = "";
      if (issue.officerName) resolvedByText += `${issue.officerName}`;
      if (issue.municipality) resolvedByText += ` (${issue.municipality} Municipality`;
      if (issue.department) resolvedByText += ` - ${issue.department}`;
      if (issue.municipality) resolvedByText += `)`;
      if (resolvedByText) {
        const resolvedLines = pdf.splitTextToSize(cleanText(resolvedByText), maxWidth);
        pdf.text(resolvedLines, margin, yPos);
        yPos += resolvedLines.length * 4 + 3;
      }
    }

    // Viewed and verified by (admin name, district)
    const { name: extractedName, district: extractedDistrict } = extractAdminDetails(issue?.resolutionConfirmationStatement);
    if (extractedName || extractedDistrict) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Viewed and verified by:", margin, yPos);
      yPos += 4;
      pdf.setFont("helvetica", "normal");
      let verifiedText = "";
      if (extractedName) verifiedText += extractedName;
      if (extractedDistrict) verifiedText += ` (${extractedDistrict})`;
      if (verifiedText) {
        const verifiedLines = pdf.splitTextToSize(cleanText(verifiedText), maxWidth);
        pdf.text(verifiedLines, margin, yPos);
        yPos += verifiedLines.length * 4 + 3;
      }
    }

    // Resolution confirmation statement (quote)
    if (issue.resolutionConfirmationStatement) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(75, 85, 99);
      const statementLines = pdf.splitTextToSize(cleanText(`“${issue.resolutionConfirmationStatement}”`), maxWidth);
      pdf.text(statementLines, margin, yPos);
      yPos += statementLines.length * 4 + 5;
    }

    // Resolution date
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(107, 114, 128);
    const resolvedDate = new Date(issue.updatedAt).toLocaleDateString();
    const resolvedTime = new Date(issue.updatedAt).toLocaleTimeString();
    pdf.text(`Resolved on: ${resolvedDate} at ${resolvedTime}`, margin, yPos);
    yPos += 12;

    // ---------- FOOTER ----------
    if (yPos > 270) { pdf.addPage(); yPos = 20; }
    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(156, 163, 175);
    pdf.text("This is an official resolution report from PeopleVoice", pageWidth / 2, yPos, { align: "center" });
    yPos += 4;
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: "center" });

    // Save PDF
    const blob = pdf.output("blob");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Resolution_Report_${id.slice(-8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    if (loadingToast && loadingToast.parentNode) {
      document.body.removeChild(loadingToast);
    }
  } catch (error) {
    console.error("PDF error:", error);
    const toast = document.getElementById("pdf-loading-toast");
    if (toast) toast.remove();
    alert("Failed to generate PDF. Please try again.");
  } finally {
    setIsGeneratingPDF(false);
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
    if (window.self !== window.top) {
      window.parent.postMessage({ type: "CLOSE_PROOF_POPUP" }, "*");
    } else {
      navigate("/peopleVoice/proofspage");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={20} className="text-emerald-500 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Loading resolution report...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <X size={40} className="text-red-500" />
          </div>
          <h2 className="text-red-500 text-2xl font-bold mb-3">Oops!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
          <button
            onClick={handleClose}
            className="px-8 py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-700 text-white rounded-2xl font-medium shadow-lg active:scale-95 transition"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-white"} p-3`}
      style={{ scrollBehavior: "smooth" }}
    >
      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 ${
          isDark
            ? "bg-gray-900/95 border-gray-800"
            : "bg-white/95 border-gray-200"
        } backdrop-blur-xl border-b z-50 px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between shadow-lg`}
      >
        <button
          onClick={handleClose}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 active:scale-95 transition font-medium p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={22} />
          <span className="font-medium hidden sm:inline">Back</span>
        </button>
        <h1 className="font-bold text-base sm:text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Resolution Report
        </h1>
        <div className="w-8"></div>
      </motion.div>

      {/* Main Content */}
      <div
        className="pt-20 sm:pt-24 sm:px-6 w-full max-w-2xl mx-auto pb-12 overflow-y-auto"
        style={{ scrollBehavior: "smooth" }}
      >
        {/* Warning Banner - ONLY for improperly resolved issues */}
        {allowResubmit && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-amber-50 to-red-50 dark:from-amber-950/30 dark:to-red-950/30 border-l-4 border-amber-500 rounded-xl p-4 shadow-md"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="text-amber-500 flex-shrink-0 mt-0.5"
                size={20}
              />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-400">
                  Previously Reported as Improperly Resolved
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                  The municipality has made a new resolution attempt. Please
                  review the updated resolution and confirm if it now meets your
                  expectations.
                </p>
                {previousFeedback && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 italic">
                    Your previous feedback: "{previousFeedback}"
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Status & ID */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          <div
            className={`px-5 py-2 rounded-full flex items-center gap-2 font-semibold text-sm shadow-md ${
              allowResubmit
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            }`}
          >
            {allowResubmit ? (
              <>
                <AlertTriangle size={16} />
                <span>RE-RESOLVED - AWAITING CONFIRMATION</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>RESOLVED</span>
              </>
            )}
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(id)}
            className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <FileText size={12} className="opacity-50" />#{id?.slice(-6)}
          </button>
          {copied && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full font-medium"
            >
              Copied!
            </motion.span>
          )}
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-8 ${
            isDark
              ? "text-white"
              : "bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
          }`}
        >
          {issue?.title || "Resolution Report"}
        </motion.h2>

        {/* BEFORE & AFTER CARDS */}
        <div className="space-y-6 sm:space-y-8 mb-10">
          <InfoCard icon={Clock} title="Before Resolution" color="amber">
            <ImageGallery
              images={(issue?.images || []).map((img) =>
                typeof img === "string" ? img : img.url,
              )}
              label="BEFORE"
              onImageClick={setSelectedImage}
            />
            <div className="space-y-3">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {issue?.description_en || "No description provided."}
              </p>
              {issue?.description_ta && (
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-l-2 border-amber-300 pl-3">
                  {issue.description_ta}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <MapPin size={14} className="text-amber-600" />
                  <span className="truncate">
                    {issue?.area || "Area not specified"}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <Building2 size={14} className="text-amber-600" />
                  <span className="truncate">
                    {issue?.department || "Department not specified"}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <Calendar size={14} className="text-amber-600" />
                  <span>
                    Reported:{" "}
                    {issue?.createdAt
                      ? new Date(issue.createdAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </InfoCard>

          <InfoCard icon={CheckCircle} title="After Resolution" color="emerald">
            <ImageGallery
              images={(issue?.after_images || []).map((img) =>
                typeof img === "string" ? img : img.url,
              )}
              label="AFTER"
              onImageClick={setSelectedImage}
            />
            <div className="space-y-3">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {issue?.resolution_details || "No resolution details provided."}
              </p>
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                <p className="text-sm">
                  <strong>Resolved by:</strong> {issue.officerName} (
                  {issue.municipality} Municipality - {issue.department})
                </p>

                <p className="text-sm mt-1">
                  <strong>Viewed and verified by:</strong> {extractedName} (
                  {extractedDistrict})
                </p>
              </div>
              {issue.resolutionConfirmationStatement && (
                <p className="text-sm mt-2 italic text-gray-600 dark:text-gray-300">
                  “{issue.resolutionConfirmationStatement}”
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <Calendar size={14} className="text-emerald-600" />
                  <span>
                    Resolved on:{" "}
                    {issue?.updatedAt
                      ? new Date(issue.updatedAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                  <CheckCheck size={14} className="text-emerald-600" />
                  <span>Status: Resolved</span>
                </div>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {allowResubmit && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowReconfirmationModal(true)}
              className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:shadow-xl hover:from-amber-700 hover:to-orange-700"
            >
              <AlertTriangle size={22} />
              Re-Confirm Resolution Status
            </motion.button>
          )}

          {!hasSubmitted && !allowResubmit && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowResolutionModal(true)}
              className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:from-blue-700 hover:to-indigo-700"
            >
              <CheckCircle size={22} />
              Confirm Resolution Status
            </motion.button>
          )}

          {hasSubmitted && !allowResubmit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-4 text-center border border-emerald-200 dark:border-emerald-800"
            >
              <p className="text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
                <CheckCircle size={20} className="text-emerald-600" />
                <span className="font-medium">
                  You have already submitted feedback for this issue
                </span>
              </p>
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToMyProofs}
            disabled={savedToProofs || saving}
            className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98] ${
              savedToProofs
                ? "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-xl hover:from-emerald-700 hover:to-teal-700"
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : savedToProofs ? (
              <>
                <Trophy size={22} /> Already in Achievements
              </>
            ) : (
              <>
                <BookmarkPlus size={22} /> Add to Achievements
              </>
            )}
          </motion.button>

          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={downloadPDF}
              disabled={isGeneratingPDF}
              className={`download-pdf-btn py-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 font-medium text-sm sm:text-base transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? "border-gray-700 bg-gray-900 hover:bg-gray-800 text-white"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
              }`}
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>PDF</span>
                </>
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={shareIssue}
              className={`py-3.5 rounded-2xl border-2 flex items-center justify-center gap-2 font-medium text-sm sm:text-base transition-all shadow-md ${
                isDark
                  ? "border-gray-700 bg-gray-900 hover:bg-gray-800 text-white"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
              } active:scale-95`}
            >
              <Share2 size={18} />
              <span>Share</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Regular Resolution Confirmation Modal */}
      <ResolutionConfirmationModal
        isOpen={showResolutionModal}
        onClose={() => setShowResolutionModal(false)}
        issueId={id}
        onConfirm={handleResolutionConfirm}
      />

      {/* Re-Confirmation Modal for Improper Issues */}
      <ReconfirmationModal
        isOpen={showReconfirmationModal}
        onClose={() => setShowReconfirmationModal(false)}
        issueId={id}
        onConfirm={handleResolutionConfirm}
        previousFeedback={previousFeedback}
      />

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
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Fullscreen evidence"
                className="max-h-[85vh] sm:max-h-[90vh] w-auto mx-auto rounded-2xl shadow-2xl"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-4 -right-4 bg-gradient-to-r from-red-600 to-rose-600 text-white w-11 h-11 rounded-full flex items-center justify-center text-lg shadow-xl hover:shadow-2xl transition active:scale-95"
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        * {
          scrollbar-width: thin;
        }
        *::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        *::-webkit-scrollbar-thumb {
          background-color: ${isDark ? "#4b5563" : "#cbd5e1"};
          border-radius: 20px;
        }
        *::-webkit-scrollbar-thumb:hover {
          background-color: ${isDark ? "#6b7280" : "#94a3b8"};
        }
      `}</style>
    </div>
  );
};

export default Proofpop;
