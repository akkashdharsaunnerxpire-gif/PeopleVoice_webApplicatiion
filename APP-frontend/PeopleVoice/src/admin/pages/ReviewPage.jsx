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
    const adminDistrict = localStorage.getItem("adminDistrict");

    const res = await axios.get(
      `http://localhost:5000/api/reviews?district=${adminDistrict}`
    );

    setReviews(res.data.reviews || []);
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
    return <div className="p-6 text-center text-lg">Loading reviews...</div>;
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">📊 User Reviews</h1>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow">
          <p className="text-gray-500 text-lg">No reviews found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Citizen ID
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700">
                    Feedback
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                    Rating
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {review.citizenId}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-md">
                      {review.feedback}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {review.isResolved ? (
                        <span className="text-2xl">
                          {renderStars(review.rating)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-4 py-1 text-xs font-medium rounded-full ${
                          review.isResolved
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {review.isResolved ? "Resolved" : "Not Resolved"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewPage;
