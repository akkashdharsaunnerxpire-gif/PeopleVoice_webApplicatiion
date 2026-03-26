import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

/**
 * Reusable save button that shows filled/outline bookmark icon.
 * Fetches initial saved state from /api/saved/check and toggles via /api/saved/toggle.
 */
const SaveButton = ({ issueId, className = "" }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const citizenId = localStorage.getItem("citizenId");

  useEffect(() => {
    if (!citizenId || !issueId) {
      setInitialLoading(false);
      return;
    }

    const checkSaved = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/saved/check?citizenId=${citizenId}&issueId=${issueId}`
        );
        const data = await res.json();
        if (data.success) {
          setIsSaved(data.isSaved);
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    checkSaved();
  }, [citizenId, issueId]);

  const handleToggle = async () => {
    if (loading || !citizenId) return;

    setLoading(true);
    const previousState = isSaved;
    setIsSaved(!previousState); // optimistic update

    try {
      const res = await fetch(`${API_BASE}/api/saved/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citizenId, issueId }),
      });
      const data = await res.json();
      if (!data.success) {
        setIsSaved(previousState); // revert on failure
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      setIsSaved(previousState);
    } finally {
      setLoading(false);
    }
  };

  // Show a placeholder while checking initial status
  if (initialLoading) {
    return (
      <button
        disabled
        className={`p-1 sm:p-1.5 rounded-full text-gray-400 animate-pulse ${className}`}
        aria-label="Loading save status"
      >
        <Bookmark className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    );
  }

  // If no citizenId (user not logged in), optionally hide or show disabled
  if (!citizenId) {
    return null; // or a disabled button with a tooltip
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-1 sm:p-1.5 rounded-full transition-all ${
        loading
          ? "opacity-70 cursor-not-allowed"
          : "hover:bg-gray-100 dark:hover:bg-gray-700"
      } ${className}`}
      aria-label={isSaved ? "Unsave post" : "Save post"}
    >
      <Bookmark
        className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${
          isSaved
            ? "fill-green-600 text-green-600"
            : "text-gray-600 dark:text-gray-300"
        }`}
      />
    </button>
  );
};

export default SaveButton;