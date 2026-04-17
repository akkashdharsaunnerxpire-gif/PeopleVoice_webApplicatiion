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
  BarChart3,
  Archive,
  RefreshCw,
  Filter,
  XCircle,
  BookOpen,
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

  // Opened issues tracking (stores opened status)
  const [openedIssues, setOpenedIssues] = useState(() => {
    return JSON.parse(localStorage.getItem("openedIssues") || "{}");
  });

  // Fetch Issues
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

  // Fetch Global Stats
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
      // fallback
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
      } catch (e) {}
    }
  }, [adminDistrict]);

  // Auto refresh polling
  useEffect(() => {
    fetchIssues(true);
    fetchGlobalStats();
    const interval = setInterval(() => {
      fetchIssues(false);
      fetchGlobalStats();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchIssues, fetchGlobalStats]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // Client-side filtering
  const filteredIssues = useMemo(() => {
    let base = showClosedIssues
      ? issues.filter((i) => i.status === "solved" || i.status === "Closed")
      : issues.filter((i) => i.status !== "solved" && i.status !== "Closed");
    if (problemType !== "All") {
      base = base.filter((i) => i.department === problemType);
    }
    return base;
  }, [issues, problemType, showClosedIssues]);

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

  // Action button with blinking effect for "Opened"
  const getActionButton = (issue) => {
    const isOpened = openedIssues[issue._id];
    if (isOpened) {
      return {
        text: "Opened",
        color:
          "from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800",
        icon: <BookOpen size={16} />,
        blink: true,
      };
    }
    switch (issue.status) {
      case "In Progress":
        return {
          text: "In Progress",
          color: "from-amber-500 to-amber-700",
          icon: <Clock size={16} />,
          blink: false,
        };
      case "Resolved":
      case "solved":
      case "Closed":
        return {
          text: "View Details",
          color: "from-blue-500 to-blue-700",
          icon: <Eye size={16} />,
          blink: false,
        };
      default:
        return {
          text: "View Issue",
          color: "from-purple-500 to-purple-700",
          icon: <FileText size={16} />,
          blink: false,
        };
    }
  };

  const handleTakeAction = async (issueId) => {
    if (!openedIssues[issueId]) {
      try {
        await axios.post(
          `${API_URL}/api/admin/issues/${issueId}/notify-view`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
          },
        );
        const updated = { ...openedIssues, [issueId]: true };
        setOpenedIssues(updated);
        localStorage.setItem("openedIssues", JSON.stringify(updated));
      } catch (err) {
        console.error("Notification error:", err);
      }
    }
    navigate(`/admin/dashboard/issues/${issueId}`);
  };

  const goToPrevPage = () => setPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

  // Add animation style
  const blinkKeyframes = `
    @keyframes blink-pulse {
      0% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
      50% { opacity: 0.85; transform: scale(1.02); box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
      100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
    }
    .blink-opened {
      animation: blink-pulse 1.2s ease-in-out infinite;
    }
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/20 p-6 md:p-10">
      <style>{blinkKeyframes}</style>
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent flex items-center gap-3">
              <BarChart3 className="text-blue-600 drop-shadow-md" size={36} />
              {showClosedIssues ? "Archived Issues" : "Active Issues Dashboard"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Database size={14} className="text-gray-500" />
              <span className="text-gray-600 font-medium">
                {adminDistrict} Municipality
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-emerald-600 text-sm font-medium">
                Live Updates (8s)
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              fetchIssues(true);
              fetchGlobalStats();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/70 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 text-gray-700 font-semibold hover:bg-white hover:shadow-md transition-all duration-200"
          >
            <RefreshCw
              size={16}
              className="group-hover:rotate-180 transition-transform"
            />{" "}
            Manual Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[
            {
              label: "New Reports",
              val: globalStats.new,
              icon: AlertCircle,
              gradient: "from-blue-500 to-blue-600",
              bg: "from-blue-50 to-blue-100/50",
            },
            {
              label: "In Progress",
              val: globalStats.ongoing,
              icon: Clock,
              gradient: "from-amber-500 to-amber-600",
              bg: "from-amber-50 to-amber-100/50",
            },
            {
              label: "Resolved",
              val: globalStats.resolved,
              icon: CheckCircle,
              gradient: "from-emerald-500 to-emerald-600",
              bg: "from-emerald-50 to-emerald-100/50",
            },
            {
              label: "Closed",
              val: globalStats.closed,
              icon: Archive,
              gradient: "from-gray-500 to-gray-600",
              bg: "from-gray-50 to-gray-100/50",
            },
          ].map((s, i) => (
            <div
              key={i}
              className={`bg-gradient-to-br ${s.bg} backdrop-blur-sm p-5 rounded-2xl shadow-lg border border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer group`}
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
                  className={`p-3 rounded-full bg-gradient-to-br ${s.gradient} shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <s.icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-white/70 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white/50 mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              className="w-full pl-11 pr-5 py-3 bg-white/80 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 transition-all"
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
              className="bg-white/80 pl-9 pr-8 py-3 rounded-xl outline-none border border-gray-200 font-medium appearance-none cursor-pointer hover:bg-white transition"
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
                ? "bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:shadow-md"
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
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-12 text-center border border-white/50">
            <XCircle className="text-gray-300 mx-auto mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-600">
              No issues found
            </h3>
            <p className="text-gray-400 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-white/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 border-b border-gray-200">
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
                          className="hover:bg-white/50 transition-all duration-200 group"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-500">
                            {(page - 1) * limit + idx + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden shadow-md group-hover:scale-105 transition-transform">
                              <img
                                src={
                                  typeof issue?.images?.[0] === "string"
                                    ? issue.images[0]
                                    : issue?.images?.[0]?.url
                                }
                                className="w-full h-full object-cover"
                                alt="issue"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-gray-100/80 rounded-full text-xs font-medium text-gray-700 backdrop-blur-sm">
                              {issue.department}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                            {issue.area || "Not specified"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${statusDisplay.color}`}
                            >
                              {statusDisplay.icon} {statusDisplay.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleTakeAction(issue._id)}
                              className={`bg-gradient-to-r ${action.color} text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center gap-1 mx-auto ${action.blink ? "blink-opened" : ""}`}
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
              <div className="flex justify-between items-center mt-6 bg-white/50 backdrop-blur-sm p-3 rounded-xl border border-white/50">
                <div className="text-sm text-gray-500 font-medium">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={goToPrevPage}
                    disabled={page === 1}
                    className={`p-2 rounded-lg transition-all ${page === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm hover:shadow"}`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={goToNextPage}
                    disabled={page === totalPages}
                    className={`p-2 rounded-lg transition-all ${page === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm hover:shadow"}`}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Issues;
