import React, { useEffect, useState } from "react";
import axios from "axios";

const ReviewPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/reviews");
      setReviews(res.data.reviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return "⭐".repeat(rating || 0);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading reviews...</div>;
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">📊 User Reviews</h1>

      {reviews.length === 0 ? (
        <p>No reviews found</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  {review.citizenId}
                </span>

                <span
                  className={`text-xs px-2 py-1 rounded ${
                    review.isResolved
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {review.isResolved ? "Resolved" : "Not Resolved"}
                </span>
              </div>

              {/* Rating */}
              {review.isResolved && (
                <div className="mb-2 text-yellow-500 text-lg">
                  {renderStars(review.rating)}
                </div>
              )}

              {/* Feedback */}
              <p className="text-gray-600 text-sm mb-3">
                {review.feedback}
              </p>

              {/* Footer */}
              <div className="text-xs text-gray-400">
                Issue ID: {review.issueId?._id || review.issueId}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewPage;