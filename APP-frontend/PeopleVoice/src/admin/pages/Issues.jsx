import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Database,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  BarChart3,
  Archive,
  RefreshCw,
  Filter,
  XCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const Issues = () => {
  const navigate = useNavigate();
  const adminDistrict = localStorage.getItem("adminDistrict");

  // Data states
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    new: 0,
    ongoing: 0,
    resolved: 0,
    closed: 0,
    total: 0,
  });

  // Filter states
  const [search, setSearch] = useState("");
  const [problemType, setProblemType] = useState("All");
  const [showClosedIssues, setShowClosedIssues] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;

  // Viewed issues tracking
  const [viewedIssues, setViewedIssues] = useState(() => {
    return JSON.parse(localStorage.getItem("viewedIssues") || "{}");
  });

  // ----- Fetch Issues with AJAX (No Reload) -----
  const fetchIssues = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);

      try {
        const res = await axios.get(`${API_URL}/api/admin/issues`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          params: { district: adminDistrict, search, page, limit },
        });

        setIssues(res.data.issues || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error("Fetch issues error:", err);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [adminDistrict, search, page, limit],
  );

  // ----- Fetch Global Stats -----
  const fetchGlobalStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/issues/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        params: { district: adminDistrict },
      });
      setGlobalStats(res.data);
    } catch (err) {
      console.warn("Stats endpoint failed – using fallback");
      // Fallback calculation
      try {
        const fallbackRes = await axios.get(`${API_URL}/api/admin/issues`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          params: { district: adminDistrict, limit: 2000 },
        });
        const allIssues = fallbackRes.data.issues || [];
        setGlobalStats({
          new: allIssues.filter((i) => i.status === "Sent").length,
          ongoing: allIssues.filter((i) => i.status === "In Progress").length,
          resolved: allIssues.filter((i) => i.status === "Resolved").length,
          closed: allIssues.filter(
            (i) => i.status === "solved" || i.status === "Closed",
          ).length,
          total: allIssues.length,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, [adminDistrict]);

  // ----- Auto Refresh using Polling (AJAX - No Page Reload) -----
  useEffect(() => {
    // Initial fetch with loading indicator
    fetchIssues(true);
    fetchGlobalStats();

    // Start polling every 8 seconds for live updates without reloading
    const interval = setInterval(() => {
      fetchIssues(false); // silent fetch (no loading spinner)
      fetchGlobalStats();
    }, 8000);

    // Cleanup on unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchIssues, fetchGlobalStats]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Client-side filtering (based on fetched data)
  const filteredIssues = useMemo(() => {
    let base = showClosedIssues
      ? issues.filter((i) => i.status === "solved" || i.status === "Closed")
      : issues.filter((i) => i.status !== "solved" && i.status !== "Closed");

    if (problemType !== "All") {
      base = base.filter((i) => i.department === problemType);
    }
    return base;
  }, [issues, problemType, showClosedIssues]);

  // Status & Button helpers
  const getStatusDisplay = (status) => {
    switch (status) {
      case "In Progress":
        return {
          text: "Ongoing",
          color: "bg-amber-100 text-amber-800 border-amber-200",
          icon: <Clock size={14} className="mr-1" />,
        };
      case "Resolved":
        return {
          text: "Resolved",
          color: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: <CheckCircle size={14} className="mr-1" />,
        };
      case "solved":
      case "Closed":
        return {
          text: "Closed",
          color: "bg-gray-100 text-gray-700 border-gray-200",
          icon: <Archive size={14} className="mr-1" />,
        };
      default:
        return {
          text: "New",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <AlertCircle size={14} className="mr-1" />,
        };
    }
  };

  const getActionButton = (issue) => {
  if (viewedIssues[issue._id]) {
    return {
      text: "Viewed",
      color: "from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800",
      icon: <CheckCircle size={16} />,
    };
  }

  switch (issue.status) {
    case "In Progress":
      return {
        text: "In Progress",
        color:
          "from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800",
        icon: <Clock size={16} />,
      };

    case "Resolved":
    case "solved":
    case "Closed":
      return {
        text: "View Details",
        color:
          "from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800",
        icon: <Eye size={16} />,
      };

    default:
      return {
        text: "View Issue",
        color:
          "from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800",
        icon: <FileText size={16} />,
      };
  }
};

 const handleTakeAction = async (issueId) => {
  try {
    if (!viewedIssues[issueId]) {
      await axios.post(
        `${API_URL}/api/admin/issues/${issueId}/notify-view`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      const updated = {
        ...viewedIssues,
        [issueId]: true,
      };

      setViewedIssues(updated);
      localStorage.setItem("viewedIssues", JSON.stringify(updated));
    }
  } catch (err) {
    console.error("Notification error:", err);
  }

  navigate(`/admin/dashboard/issues/${issueId}`);
};

  const goToPrevPage = () => setPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* HEADER */}
      <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent flex items-center gap-3">
            <BarChart3 className="text-blue-600 drop-shadow-md" size={36} />
            {showClosedIssues ? "Archived Issues" : "Active Issues Dashboard"}
          </h1>
          <p className="text-gray-500 mt-1 font-medium flex items-center gap-1">
            <Database size={14} /> {adminDistrict} Municipality ·{" "}
            <span className="text-emerald-600">
              Live Updates (Auto-refresh every 8s)
            </span>
          </p>
        </div>

        <button
          onClick={() => {
            fetchIssues(true);
            fetchGlobalStats();
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 text-gray-700 font-semibold hover:bg-white transition-all"
        >
          <RefreshCw size={16} /> Manual Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[
          {
            label: "New Reports",
            val: globalStats.new,
            color: "blue",
            icon: AlertCircle,
            bg: "from-blue-50 to-blue-100",
            border: "border-blue-200",
          },
          {
            label: "In Progress",
            val: globalStats.ongoing,
            color: "amber",
            icon: Clock,
            bg: "from-amber-50 to-amber-100",
            border: "border-amber-200",
          },
          {
            label: "Resolved",
            val: globalStats.resolved,
            color: "emerald",
            icon: CheckCircle,
            bg: "from-emerald-50 to-emerald-100",
            border: "border-emerald-200",
          },
          {
            label: "Closed",
            val: globalStats.closed,
            color: "gray",
            icon: Archive,
            bg: "from-gray-50 to-gray-100",
            border: "border-gray-200",
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`bg-gradient-to-br ${s.bg} p-5 rounded-2xl shadow-md border ${s.border} transition-all duration-300 hover:scale-105 hover:shadow-lg`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {s.label}
                </p>
                <p className="text-3xl font-black mt-2 text-gray-800">
                  {s.val}
                </p>
              </div>
              <div
                className={`p-3 rounded-full bg-white/60 backdrop-blur-sm shadow-sm`}
              >
                <s.icon className={`text-${s.color}-600`} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            className="w-full pl-11 pr-5 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 transition-all"
            placeholder="Search by reason, area or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <select
            className="bg-gray-50 pl-9 pr-8 py-3 rounded-xl outline-none border border-gray-200 font-medium appearance-none cursor-pointer hover:bg-gray-100 transition"
            value={problemType}
            onChange={(e) => setProblemType(e.target.value)}
          >
            <option value="All">All Departments</option>
            <option value="Garbage">🗑️ Garbage</option>
            <option value="Road">🛣️ Road</option>
            <option value="Water">💧 Water Supply</option>
          </select>
        </div>

        <button
          onClick={() => setShowClosedIssues(!showClosedIssues)}
          className={`px-5 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 shadow-sm ${
            showClosedIssues
              ? "bg-slate-800 text-white hover:bg-slate-900"
              : "bg-white text-slate-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          {showClosedIssues ? <Eye size={16} /> : <Archive size={16} />}
          {showClosedIssues ? "View Active Issues" : "View Closed Issues"}
        </button>
      </div>

      {/* Issues Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-gray-100">
          <div className="flex flex-col items-center">
            <XCircle className="text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-600">
              No issues found
            </h3>
            <p className="text-gray-400 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Issue
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredIssues.map((issue, idx) => {
                    const statusDisplay = getStatusDisplay(issue.status);
                    const action = getActionButton(issue);
                    return (
                      <tr
                        key={issue._id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-500">
                          {(page - 1) * limit + idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <img
                            src={
                              issue.images?.[0] ||
                              "https://via.placeholder.com/150"
                            }
                            className="w-12 h-12 rounded-lg object-cover"
                            alt=""
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                            {issue.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {issue.area || "Not specified"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusDisplay.color}`}
                          >
                            {statusDisplay.icon} {statusDisplay.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleTakeAction(issue._id)}
                            disabled={viewedIssues[issue._id]}
                            className={`bg-gradient-to-r ${action.color} text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-md transition-all duration-200 hover:scale-105 flex items-center gap-1 mx-auto ${
                              viewedIssues[issue._id]
                                ? "cursor-not-allowed opacity-80"
                                : ""
                            }`}
                          >
                            {action.icon} {action.text}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 bg-white/70 backdrop-blur-sm p-3 rounded-xl">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={goToPrevPage}
                  disabled={page === 1}
                  className={`p-2 rounded-lg transition-all ${page === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"}`}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={page === totalPages}
                  className={`p-2 rounded-lg transition-all ${page === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"}`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Issues;
