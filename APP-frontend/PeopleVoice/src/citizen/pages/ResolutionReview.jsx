import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  Send,
  ThumbsUp,
  AlertCircle,
  MessageCircle,
  Award,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Confetti function
const runConfetti = () => {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "10000";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = [
    "#fbbf24",
    "#f59e0b",
    "#ef4444",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
  ];

  for (let i = 0; i < 200; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 6 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 8 + 5,
      speedX: (Math.random() - 0.5) * 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    });
  }

  let animationId;
  let startTime = Date.now();

  const animate = () => {
    if (Date.now() - startTime > 2500) {
      cancelAnimationFrame(animationId);
      document.body.removeChild(canvas);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    animationId = requestAnimationFrame(animate);
  };

  animate();
};

const ResolutionReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [showCongrats, setShowCongrats] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState("");
  const [showFinalProgress, setShowFinalProgress] = useState(false);

  useEffect(() => {
    // Show congratulations with confetti
    runConfetti();

    // Auto close congratulations and show review form after 3 seconds
    const timer = setTimeout(() => {
      setShowCongrats(false);
      setShowReview(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Submit review
  const handleSubmitReview = async () => {
    if (rating === 0) {
      setError("Please select a star rating to continue.");
      return;
    }
    if (!feedback.trim()) {
      setError("Please share your valuable feedback.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const citizenId = localStorage.getItem("citizenId");
      await axios.post(`${BACKEND_URL}/api/reviews`, {
        issueId: id,
        citizenId,
        rating,
        feedback,
      });

      setSubmitted(true);
      setThankYouMessage("Thank you for your valuable feedback! 🎉");
      setShowFinalProgress(true);

      setTimeout(() => {
        navigate("/peopleVoice/feed");
      }, 3000);
    } catch (err) {
      setError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Go back
  const handleBack = () => {
    navigate(-1);
  };

  // If submitted, show thank you message
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-950 dark:to-gray-900 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center max-w-md shadow-xl"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
            {thankYouMessage}
          </p>
          {showFinalProgress && (
            <div className="mt-6">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-gray-500 mt-2">Redirecting...</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header - Only show when review form is visible */}
      {showReview && (
        <div className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-50 px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition active:scale-95"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="font-semibold text-gray-800 dark:text-gray-200">
            Resolution Feedback
          </h1>
        </div>
      )}

      <div
        className={`${showReview ? "pt-16 px-4 pb-8 max-w-md mx-auto" : ""}`}
      >
        {/* FULL SCREEN CONGRATULATIONS MODAL */}
        <AnimatePresence>
          {showCongrats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", damping: 15, duration: 0.6 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", duration: 0.8 }}
                  className="text-8xl mb-6"
                >
                  🎉
                </motion.div>

                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4"
                >
                  Congratulations!
                </motion.h1>

                <motion.p
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-xl sm:text-2xl text-emerald-100 mb-8"
                >
                  Your issue has been successfully resolved!
                </motion.p>

                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="flex justify-center gap-2"
                >
                  <div
                    className="w-3 h-3 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-white rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="text-emerald-100 text-sm mt-8"
                >
                  Redirecting to feedback form...
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* REVIEW FORM - Only shows after congratulations closes */}
        <AnimatePresence>
          {showReview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6"
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award
                    size={28}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  Rate Your Experience
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  How satisfied are you with the resolution?
                </p>
              </div>

              {/* Star Rating */}
              <div className="flex justify-center gap-1 sm:gap-2 mb-5 py-2 flex-wrap">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={36}
                      className={`transition-all duration-200 ${
                        (hoverRating || rating) >= star
                          ? "fill-yellow-400 text-yellow-400 drop-shadow-md"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Rating Labels */}
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-4 px-2">
                <span>Very Poor</span>
                <span>Poor</span>
                <span>Average</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>

              {/* Feedback Textarea */}
              <div className="relative">
                <textarea
                  rows={4}
                  placeholder="Share your feedback (response time, quality of resolution, communication, etc.)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
                <MessageCircle
                  size={16}
                  className="absolute bottom-3 right-3 text-gray-400"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm mt-3 flex items-center gap-1">
                  <AlertCircle size={14} /> {error}
                </p>
              )}

              <button
                onClick={handleSubmitReview}
                disabled={submitting}
                className="w-full mt-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Submitting Review...
                  </>
                ) : (
                  <>
                    <Send size={18} /> Submit Review
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                Your feedback helps us serve you better
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ResolutionReview;
