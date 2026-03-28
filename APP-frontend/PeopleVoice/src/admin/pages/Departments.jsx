import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets,
  Construction,
  Zap,
  Trash2,
  ShieldCheck,
  MoreVertical,
  ArrowUpRight,
  AlertCircle,
  Calendar,
  RefreshCw,
  BarChart3,
  FileText,
  Eye,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/admin/issues`;

// Department icons mapping
const departmentIcons = {
  Road: <Construction className="w-6 h-6" />,
  Water: <Droplets className="w-6 h-6" />,
  Electricity: <Zap className="w-6 h-6" />,
  Garbage: <Trash2 className="w-6 h-6" />,
  Other: <ShieldCheck className="w-6 h-6" />,
};

const departmentColors = {
  Road: "text-orange-600 bg-orange-50",
  Water: "text-blue-600 bg-blue-50",
  Electricity: "text-amber-500 bg-amber-50",
  Garbage: "text-emerald-600 bg-emerald-50",
  Other: "text-purple-600 bg-purple-50",
};

const Departments = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("30days");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDept, setSelectedDept] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);

  useEffect(() => {
    fetchIssues();
  }, [refreshKey]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      // Normalize issues (same as dashboard)
      const normalized = (res.data.issues || []).map((issue) => ({
        ...issue,
        status: normalizeStatus(issue.status),
        createdAt: issue.createdAt || issue.created_date || issue.date_reported,
        department: issue.department || issue.dept || "Other",
        district: issue.district || issue.location_district || "Unknown",
        title: issue.title || issue.description?.substring(0, 50) || "Untitled Issue",
      }));

      setIssues(normalized);
    } catch (err) {
      console.error("Failed to fetch issues:", err);
      setError("Failed to load department data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const normalizeStatus = (status) => {
    const map = {
      pending: "pending",
      "in-progress": "inProgress",
      in_progress: "inProgress",
      resolved: "resolved",
      solved: "resolved",
      closed: "closed",
      rejected: "rejected",
    };
    return map[status?.toLowerCase()] || status || "pending";
  };

  // Filter issues by time range
  const filteredIssues = useMemo(() => {
    if (!issues.length) return [];

    const now = new Date();
    const cutoff = new Date();
    switch (timeRange) {
      case "7days":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "30days":
        cutoff.setDate(now.getDate() - 30);
        break;
      case "90days":
        cutoff.setDate(now.getDate() - 90);
        break;
      case "year":
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return issues;
    }
    return issues.filter((issue) => {
      const issueDate = new Date(issue.createdAt || issue.updatedAt || now);
      return issueDate >= cutoff;
    });
  }, [issues, timeRange]);

  // Department performance data
  const departments = useMemo(() => {
    const deptMap = new Map();

    filteredIssues.forEach((issue) => {
      const dept = issue.department;
      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          name: dept,
          total: 0,
          resolved: 0,
          pending: 0,
          inProgress: 0,
          issues: [],
        });
      }
      const record = deptMap.get(dept);
      record.total++;
      if (issue.status === "resolved" || issue.status === "closed") {
        record.resolved++;
      } else if (issue.status === "pending") {
        record.pending++;
      } else if (issue.status === "inProgress") {
        record.inProgress++;
      }
      // Store recent issues for quick view
      if (record.issues.length < 5) record.issues.push(issue);
    });

    const deptArray = Array.from(deptMap.values()).map((dept) => ({
      ...dept,
      resolutionRate:
        dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0,
      icon: departmentIcons[dept.name] || <ShieldCheck className="w-6 h-6" />,
      colorClass:
        departmentColors[dept.name] || "text-gray-600 bg-gray-50",
    }));

    // Sort by total issues (most active first)
    return deptArray.sort((a, b) => b.total - a.total);
  }, [filteredIssues]);

  // Bar chart data
  const chartData = useMemo(() => {
    return departments.map((dept) => ({
      name: dept.name,
      resolutionRate: dept.resolutionRate,
      total: dept.total,
      resolved: dept.resolved,
    }));
  }, [departments]);

  const handleViewIssues = (dept) => {
    setSelectedDept(dept);
    setRecentIssues(dept.issues);
  };

  const handleRefresh = () => setRefreshKey((prev) => prev + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            className="ml-4 px-3 py-1 bg-red-100 rounded-md text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Department Performance
          </h2>
          <p className="text-slate-500 font-medium">
            Monitor resolution efficiency across all administrative departments
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent border-none outline-none text-sm"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Total Departments"
          value={departments.length}
          icon={<BarChart3 className="w-5 h-5" />}
          change="Active"
          color="blue"
        />
        <SummaryCard
          title="Total Issues"
          value={filteredIssues.length}
          icon={<FileText className="w-5 h-5" />}
          change={`in ${timeRange}`}
          color="purple"
        />
        <SummaryCard
          title="Resolved Issues"
          value={filteredIssues.filter((i) => i.status === "resolved" || i.status === "closed").length}
          icon={<TrendingUp className="w-5 h-5" />}
          change={`${Math.round(
            (filteredIssues.filter((i) => i.status === "resolved" || i.status === "closed").length /
              filteredIssues.length) *
              100
          )}% resolved`}
          color="green"
        />
        <SummaryCard
          title="Pending Issues"
          value={filteredIssues.filter((i) => i.status === "pending").length}
          icon={<TrendingDown className="w-5 h-5" />}
          change="Needs attention"
          color="orange"
        />
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {departments.map((dept, index) => (
          <DepartmentCard
            key={dept.name}
            dept={dept}
            index={index}
            onViewIssues={() => handleViewIssues(dept)}
          />
        ))}
      </div>

      {/* Department Performance Chart */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          Resolution Rate by Department
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
              <Tooltip
                formatter={(value) => [`${value}%`, "Resolution Rate"]}
                labelFormatter={(label) => `Department: ${label}`}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar dataKey="resolutionRate" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.resolutionRate >= 80 ? "#10b981" : entry.resolutionRate >= 50 ? "#f59e0b" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal for viewing department issues */}
      {selectedDept && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedDept.colorClass}`}>
                  {selectedDept.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedDept.name} Department
                </h3>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-blue-600 font-medium">Total Issues</p>
                  <p className="text-2xl font-bold">{selectedDept.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-sm text-green-600 font-medium">Resolved</p>
                  <p className="text-2xl font-bold">{selectedDept.resolved}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl">
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-2xl font-bold">{selectedDept.pending}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <p className="text-sm text-purple-600 font-medium">In Progress</p>
                  <p className="text-2xl font-bold">{selectedDept.inProgress}</p>
                </div>
              </div>
              <h4 className="font-bold text-gray-800 mb-3">Recent Issues</h4>
              <div className="space-y-3">
                {recentIssues.length > 0 ? (
                  recentIssues.map((issue) => (
                    <div
                      key={issue._id}
                      className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{issue.title}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            issue.status === "resolved"
                              ? "bg-green-100 text-green-700"
                              : issue.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {issue.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent issues</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Summary Card
const SummaryCard = ({ title, value, icon, change, color }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-600 mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-2">{change}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

// Department Card Component
const DepartmentCard = ({ dept, index, onViewIssues }) => {
  const { name, total, resolved, resolutionRate, icon, colorClass } = dept;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${colorClass} transition-transform group-hover:scale-110 duration-300`}>
          {icon}
        </div>
        <button
          onClick={onViewIssues}
          className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
          title="View Issues"
        >
          <Eye size={18} />
        </button>
      </div>

      <div className="space-y-1 mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          {name}
          <ArrowUpRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-xs text-slate-400 uppercase">Total Issues</p>
          <p className="text-lg font-bold text-slate-800">{total}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Resolved</p>
          <p className="text-lg font-bold text-green-600">{resolved}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Resolution Rate
          </span>
          <span className={`text-sm font-bold ${resolutionRate >= 80 ? "text-emerald-600" : resolutionRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
            {resolutionRate}%
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${resolutionRate}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`h-full rounded-full ${
              resolutionRate >= 80 ? "bg-emerald-500" : resolutionRate >= 50 ? "bg-amber-500" : "bg-red-500"
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Departments;