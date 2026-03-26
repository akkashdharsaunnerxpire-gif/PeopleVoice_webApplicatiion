import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/admin/issues`;

const Issues = () => {
  const navigate = useNavigate();
  const adminDistrict = localStorage.getItem("adminDistrict");

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ new: 0, ongoing: 0, resolved: 0, closed: 0, total: 0 });

  const [search, setSearch] = useState("");
  const [problemType, setProblemType] = useState("All");
  const [showClosedIssues, setShowClosedIssues] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 7;

  useEffect(() => {
    fetchIssues();
  }, [search, page, showClosedIssues]); // showClosedIssues trigger aagum pothu fetch pannum

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        params: { district: adminDistrict, search, page, limit },
      });

      setIssues(res.data.issues || []);
      setTotalPages(res.data.totalPages || 1);
      
      const issuesList = res.data.issues || [];
      setStats({
        new: issuesList.filter(issue => issue.status === "Sent").length,
        ongoing: issuesList.filter(issue => issue.status === "In Progress").length,
        resolved: issuesList.filter(issue => issue.status === "Resolved").length,
        closed: issuesList.filter(issue => issue.status === "solved").length,
        total: issuesList.length
      });
    } catch (err) {
      console.error("Fetch issues error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = useMemo(() => {
    let baseIssues = showClosedIssues 
      ? issues.filter(i => i.status === "solved" || i.status === "Closed")
      : issues.filter(i => i.status !== "solved" && i.status !== "Closed");

    if (problemType !== "All") {
      baseIssues = baseIssues.filter(i => i.department === problemType);
    }
    return baseIssues;
  }, [issues, problemType, showClosedIssues]);

  const getStatusDisplay = (status) => {
    switch (status) {
      case "In Progress": return { text: "Ongoing", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock size={14} className="mr-1" /> };
      case "Resolved": return { text: "Resolved", color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle size={14} className="mr-1" /> };
      case "solved":
      case "Closed": return { text: "Closed", color: "bg-gray-100 text-gray-800 border-gray-200", icon: <Archive size={14} className="mr-1" /> };
      default: return { text: "New", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <AlertCircle size={14} className="mr-1" /> };
    }
  };

  const getActionButton = (status) => {
    switch (status) {
      case "In Progress": return { text: "Mark Resolved", color: "bg-emerald-600 hover:bg-emerald-700", icon: <CheckCircle size={16} /> };
      case "Resolved":
      case "solved":
      case "Closed": return { text: "View Details", color: "bg-blue-600 hover:bg-blue-700", icon: <Eye size={16} /> };
      default: return { text: "Take Action", color: "bg-purple-600 hover:bg-purple-700", icon: <FileText size={16} /> };
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={32} />
            {showClosedIssues ? "Closed Issues" : "Active Issues"}
          </h1>
          <p className="text-gray-500 mt-1 font-medium">{adminDistrict} Municipality</p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "New", val: stats.new, color: "blue", icon: AlertCircle },
          { label: "Ongoing", val: stats.ongoing, color: "yellow", icon: Clock },
          { label: "Resolved", val: stats.resolved, color: "green", icon: CheckCircle },
          { label: "Closed", val: stats.closed, color: "gray", icon: Archive, active: true }
        ].map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              <s.icon className={`text-${s.color}-500`} size={20} />
            </div>
            <p className="text-2xl font-bold mt-2">{s.val}</p>
          </div>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Search issues..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="bg-gray-50 px-4 py-2 rounded-lg outline-none border-none font-medium"
          value={problemType}
          onChange={(e) => setProblemType(e.target.value)}
        >
          <option value="All">All Departments</option>
          <option value="Garbage">Garbage</option>
          <option value="Road">Road</option>
          <option value="Water">Water Supply</option>
        </select>
        <button 
          onClick={() => setShowClosedIssues(!showClosedIssues)}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${showClosedIssues ? 'bg-gray-800 text-white' : 'bg-white border text-gray-700'}`}
        >
          {showClosedIssues ? "View Active Issues" : "View Closed Issues"}
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Issue</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Area</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Updating List...</p>
                  </div>
                </td>
              </tr>
            ) : filteredIssues.length > 0 ? (
              filteredIssues.map((issue) => {
                const status = getStatusDisplay(issue.status);
                const btn = getActionButton(issue.status);
                return (
                  <tr key={issue._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={issue.images?.[0] || "https://via.placeholder.com/150"} className="w-12 h-12 rounded-lg object-cover" alt="" />
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{issue.reason}</p>
                          <p className="text-xs text-gray-500">{new Date(issue.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{issue.area}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit ${status.color}`}>
                        {status.icon} {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => navigate(`/admin/dashboard/issues/${issue._id}`)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-xs font-bold transition-all ${btn.color}`}
                      >
                        {btn.icon} {btn.text}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="py-20 text-center text-gray-400 font-medium">No issues found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Issues;