import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Bookmark,
  Heart,
  MessageCircle,
  MapPin,
  Calendar,
  Tag,
  Share2
} from "lucide-react";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const SavedPostModal = ({ post, citizenId, onClose, onUnsave, isDark }) => {
  const [index, setIndex] = useState(0);
  const [isUnsaving, setIsUnsaving] = useState(false);
  const [error, setError] = useState(null);

  const issue = post.issueData || {};
  const images = issue.images || [];

  /* UNSAVE */
  const handleUnsave = async () => {
    if (isUnsaving || !citizenId) return;
    setIsUnsaving(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/saved/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citizenId,
          issueId: post.issueId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onUnsave(post.issueId);
        onClose();
      } else {
        setError(data.message || "Failed to unsave. Please try again.");
      }
    } catch (err) {
      console.error("Unsave failed", err);
      setError("Network error. Could not unsave.");
    } finally {
      setIsUnsaving(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-0 md:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white dark:bg-gray-900 w-full h-full md:h-[90vh] md:max-w-5xl md:rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT IMAGE SECTION */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex-1 bg-black relative flex items-center justify-center min-h-[300px] md:min-h-full"
        >
          {images.length > 0 ? (
            <>
              <motion.img
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={images[index]}
                alt="saved issue"
                className="max-h-full max-w-full object-contain"
              />

              {/* Navigation Arrows */}
              <AnimatePresence>
                {index > 0 && (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setIndex(index - 1)}
                    className="absolute left-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 backdrop-blur-sm"
                  >
                    <ChevronLeft size={24} />
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {index < images.length - 1 && (
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={() => setIndex(index + 1)}
                    className="absolute right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 backdrop-blur-sm"
                  >
                    <ChevronRight size={24} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs backdrop-blur-sm">
                  {index + 1} / {images.length}
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400">No Image</span>
          )}
        </motion.div>

        {/* RIGHT CONTENT – SCROLLABLE + STICKY UNSAVE BUTTON */}
        <div className="flex flex-col flex-1 md:w-[420px] h-full overflow-hidden">
          {/* HEADER – Sticky */}
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                {issue.district?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {issue.district?.toLowerCase() || "local"}_citizen
              </span>
            </div>
            <motion.button
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </motion.button>
          </div>

          {/* BODY – Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Description */}
            <div className="space-y-2">
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {issue.description_en}
              </p>
              {issue.description_ta && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {issue.description_ta}
                </p>
              )}
            </div>

            {/* Location & Date */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{issue.area || 'Location not specified'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(issue.createdAt)}</span>
              </div>
            </div>

            {/* Department & Status Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                <Tag className="w-3 h-3" />
                {issue.department}
              </span>
              
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                issue.status === "Resolved"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : issue.status === "In Progress"
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {issue.status}
              </span>
            </div>

            {/* Hashtags */}
            {issue.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {issue.hashtags.map((tag, i) => (
                  <span key={i} className="text-blue-600 dark:text-blue-400 text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 pt-4 border-t dark:border-gray-800">
              <div className="flex items-center gap-1.5">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {issue.likes?.length || 0}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {issue.comments?.length || 0}
                </span>
              </div>
            </div>

            {/* Error message inside modal */}
            {error && (
              <div className="p-2 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          {/* ACTIONS – Sticky at bottom */}
          <div className="border-t dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  title="Share"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/issue/${post.issueId}`;
                    if (navigator.share) {
                      navigator.share({
                        title: issue.description_en,
                        text: issue.description_en,
                        url: shareUrl,
                      }).catch(console.log);
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      alert("Link copied!");
                    }
                  }}
                >
                  <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUnsave}
                disabled={isUnsaving || !citizenId}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all
                  ${isUnsaving || !citizenId
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                  }`}
              >
                {isUnsaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 fill-white" />
                    Remove from Saved
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SavedPostModal;