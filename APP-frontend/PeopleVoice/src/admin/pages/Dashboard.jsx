import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Sector,
  AreaChart,
  Area,
} from "recharts";
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  Landmark,
  FileText,
  MapPin,
  Briefcase,
  Archive,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  BarChart3,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Star,
  Award,
  Crown,
  Medal,
} from "lucide-react";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/admin/issues`;

// Tamil Nadu 38 Districts List
const TAMIL_NADU_DISTRICTS = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
];

// Color schemes
const COLOR_SCHEMES = {
  districts: [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#6366F1",
    "#8B5CF6",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#6366F1",
    "#8B5CF6",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#6366F1",
    "#8B5CF6",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
  ],
  departments: {
    Road: "#F59E0B",
    Water: "#3B82F6",
    Electricity: "#EF4444",
    Garbage: "#10B981",
    Other: "#8B5CF6",
  },
  status: {
    pending: "#F59E0B",
    inProgress: "#3B82F6",
    resolved: "#10B981",
    closed: "#6366F1",
    rejected: "#EF4444",
  },
};

// Helper functions moved outside component
const calculateEfficiencyScore = (
  resolutionRate,
  avgTime,
  pendingIssues,
  recentActivity,
) => {
  let score = resolutionRate;

  if (avgTime > 0) {
    const timePenalty = Math.min(avgTime / 10, 30);
    score -= timePenalty;
  }

  score += Math.min(recentActivity * 2, 20);
  const pendingPenalty = Math.min(pendingIssues * 0.5, 25);
  score -= pendingPenalty;

  return Math.max(0, Math.min(score, 100));
};

const calculateSafetyScore = (resolutionRate, pendingIssues, totalIssues) => {
  let score = resolutionRate;

  if (totalIssues > 0) {
    const pendingRate = (pendingIssues / totalIssues) * 100;
    score -= pendingRate * 0.5;
  }

  if (resolutionRate > 80) {
    score += 10;
  } else if (resolutionRate > 60) {
    score += 5;
  }

  return Math.max(0, Math.min(score, 100));
};

const normalizeStatus = (status) => {
  const statusMap = {
    pending: "pending",
    "in-progress": "inProgress",
    in_progress: "inProgress",
    resolved: "resolved",
    solved: "resolved",
    closed: "closed",
    rejected: "rejected",
    completed: "resolved",
  };

  return statusMap[status?.toLowerCase()] || status || "pending";
};

const Dashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("30days");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [districtPoints, setDistrictPoints] = useState([]);
  const [showAllDistricts, setShowAllDistricts] = useState(false);
  const adminDistrict = localStorage.getItem("adminDistrict");
  /* ================= FETCH DATA WITH NORMALIZATION ================= */
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
        params: {
          includeAllDistricts: true,
        },
      });

      // Normalize backend fields
      const normalizedIssues = (res.data.issues || []).map((issue) => ({
        ...issue,
        status: normalizeStatus(issue.status),
        createdAt: issue.createdAt || issue.created_date || issue.date_reported,
        resolvedAt:
          issue.resolvedAt ||
          issue.resolved_date ||
          issue.closed_date ||
          issue.date_resolved,
        updatedAt: issue.updatedAt || issue.updated_date,
        department: issue.department || issue.dept || "Other",
        district: issue.district || issue.location_district || "Unknown",
        priority: issue.priority || issue.severity || "medium",
        title:
          issue.title ||
          issue.description?.substring(0, 50) ||
          "Untitled Issue",
        description: issue.description || "",
        category: issue.category || issue.type || "general",
      }));

      setIssues(normalizedIssues);

      // Calculate points for all 38 districts
      const points = calculateDistrictPoints(normalizedIssues);
      setDistrictPoints(points);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= POINTS CALCULATION LOGIC FOR 38 DISTRICTS ================= */
  const calculateDistrictPoints = (issuesData) => {
    const districtPointsMap = {};

    // Initialize all 38 districts with zero points
    TAMIL_NADU_DISTRICTS.forEach((district) => {
      districtPointsMap[district] = {
        district,
        points: 0,
        resolvedCount: 0,
        pendingCount: 0,
        totalCount: 0,
        avgResolutionTime: 0,
        efficiencyScore: 0,
        safetyScore: 0,
        rank: 0,
      };
    });

    // Calculate points from actual issues
    issuesData.forEach((issue) => {
      const districtName = issue.district;
      if (districtPointsMap[districtName]) {
        districtPointsMap[districtName].totalCount++;

        if (issue.status === "resolved" || issue.status === "closed") {
          districtPointsMap[districtName].resolvedCount++;

          // Base points for resolution
          districtPointsMap[districtName].points += 10;

          // Bonus for quick resolution
          if (issue.createdAt && issue.resolvedAt) {
            const resolutionDays = Math.ceil(
              (new Date(issue.resolvedAt) - new Date(issue.createdAt)) /
                (1000 * 60 * 60 * 24),
            );
            if (resolutionDays <= 1) {
              districtPointsMap[districtName].points += 20; // Extra bonus for same-day resolution
            } else if (resolutionDays <= 3) {
              districtPointsMap[districtName].points += 10;
            } else if (resolutionDays <= 7) {
              districtPointsMap[districtName].points += 5;
            }
          }

          // Bonus for high priority issues
          if (issue.priority === "high" || issue.severity === "high") {
            districtPointsMap[districtName].points += 15;
          } else if (
            issue.priority === "medium" ||
            issue.severity === "medium"
          ) {
            districtPointsMap[districtName].points += 10;
          } else {
            districtPointsMap[districtName].points += 5;
          }
        } else if (issue.status === "pending") {
          districtPointsMap[districtName].pendingCount++;
          // No points for pending issues
        }
      }
    });

    // Calculate efficiency and safety scores
    const pointsArray = Object.values(districtPointsMap).map((district) => {
      const resolutionRate =
        district.totalCount > 0
          ? (district.resolvedCount / district.totalCount) * 100
          : 0;

      const efficiencyScore = calculateEfficiencyScore(
        resolutionRate,
        district.avgResolutionTime,
        district.pendingCount,
        district.resolvedCount,
      );

      const safetyScore = calculateSafetyScore(
        resolutionRate,
        district.pendingCount,
        district.totalCount,
      );

      // Bonus points based on scores
      district.points += Math.round(efficiencyScore / 10);
      district.points += Math.round(safetyScore / 10);

      return {
        ...district,
        resolutionRate: Math.round(resolutionRate * 10) / 10,
        efficiencyScore: Math.round(efficiencyScore * 10) / 10,
        safetyScore: Math.round(safetyScore * 10) / 10,
      };
    });

    // Sort by points and assign ranks
    const sortedPoints = pointsArray
      .sort((a, b) => b.points - a.points)
      .map((district, index) => ({
        ...district,
        rank: index + 1,
        color: COLOR_SCHEMES.districts[index % COLOR_SCHEMES.districts.length],
      }));

    localStorage.setItem("districtPoints", JSON.stringify(sortedPoints));
    return sortedPoints;
  };

  /* ================= FILTER ISSUES BY TIME RANGE ================= */
  const filteredIssues = useMemo(() => {
    if (!issues.length) return [];

    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case "7days":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "30days":
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case "90days":
        cutoffDate.setDate(now.getDate() - 90);
        break;
      case "year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return issues;
    }

    return issues.filter((issue) => {
      const issueDate = new Date(issue.createdAt || issue.updatedAt || now);
      return issueDate >= cutoffDate;
    });
  }, [issues, timeRange]);

  /* ================= DISTRICT PERFORMANCE RANKING WITH POINTS ================= */
  const districtRankings = useMemo(() => {
    // Use points from calculation
    return districtPoints.map((district, index) => {
      // Get issues for this district
      const districtIssues = filteredIssues.filter(
        (issue) => issue.district === district.district,
      );
      const totalIssues = districtIssues.length;
      const resolvedIssues = districtIssues.filter(
        (issue) => issue.status === "resolved" || issue.status === "closed",
      ).length;
      const pendingIssues = districtIssues.filter(
        (issue) => issue.status === "pending",
      ).length;

      // Calculate average resolution time
      const resolvedWithTime = districtIssues.filter(
        (issue) =>
          (issue.status === "resolved" || issue.status === "closed") &&
          issue.createdAt &&
          issue.resolvedAt,
      );

      const avgResolutionTime =
        resolvedWithTime.length > 0
          ? resolvedWithTime.reduce((sum, issue) => {
              const days = Math.ceil(
                (new Date(issue.resolvedAt) - new Date(issue.createdAt)) /
                  (1000 * 60 * 60 * 24),
              );
              return sum + days;
            }, 0) / resolvedWithTime.length
          : 0;

      // Recent activity (last 7 days)
      const recentActivity = districtIssues.filter((issue) => {
        if (!issue.createdAt) return false;
        const createdDate = new Date(issue.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdDate > weekAgo;
      }).length;

      return {
        ...district,
        name: district.district,
        totalIssues,
        resolvedIssues,
        pendingIssues,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        recentActivity,
        points: district.points || 0,
        color:
          district.color ||
          COLOR_SCHEMES.districts[index % COLOR_SCHEMES.districts.length],
      };
    });
  }, [districtPoints, filteredIssues]);

  /* ================= TOP DISTRICTS BY POINTS (TOP 10) ================= */
  const topDistrictsByPoints = useMemo(() => {
    return districtRankings.slice(0, 10);
  }, [districtRankings]);

  /* ================= ISSUE TREND ANALYSIS ================= */
  const issueTrends = useMemo(() => {
    const days = [];
    const today = new Date();
    const daysCount =
      timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90;

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      days.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        fullDate: dateStr,
        reported: 0,
        resolved: 0,
      });
    }

    filteredIssues.forEach((issue) => {
      if (issue.createdAt) {
        const issueDate = issue.createdAt.split("T")[0];
        const dayIndex = days.findIndex((d) => d.fullDate === issueDate);
        if (dayIndex !== -1) {
          days[dayIndex].reported++;
        }
      }

      if (
        issue.resolvedAt &&
        (issue.status === "resolved" || issue.status === "closed")
      ) {
        const resolvedDate = issue.resolvedAt.split("T")[0];
        const dayIndex = days.findIndex((d) => d.fullDate === resolvedDate);
        if (dayIndex !== -1) {
          days[dayIndex].resolved++;
        }
      }
    });

    return days;
  }, [filteredIssues, timeRange]);

  /* ================= DEPARTMENT PERFORMANCE ================= */
  const deptPerformance = useMemo(() => {
    const departments = [
      {
        name: "Road Safety",
        key: "Road",
        icon: "🛣️",
        color: COLOR_SCHEMES.departments.Road,
      },
      {
        name: "Water Supply",
        key: "Water",
        icon: "💧",
        color: COLOR_SCHEMES.departments.Water,
      },
      {
        name: "Electricity",
        key: "Electricity",
        icon: "⚡",
        color: COLOR_SCHEMES.departments.Electricity,
      },
      {
        name: "Sanitation",
        key: "Garbage",
        icon: "🗑️",
        color: COLOR_SCHEMES.departments.Garbage,
      },
      {
        name: "Public Works",
        key: "Other",
        icon: "🏗️",
        color: COLOR_SCHEMES.departments.Other,
      },
    ];

    return departments
      .map((dept) => {
        const deptIssues = filteredIssues.filter(
          (i) => i.department === dept.key,
        );
        const total = deptIssues.length;
        const resolved = deptIssues.filter(
          (i) => i.status === "resolved" || i.status === "closed",
        ).length;

        const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

        return {
          ...dept,
          resolved,
          total,
          resolutionRate: Math.round(resolutionRate * 10) / 10,
        };
      })
      .sort((a, b) => b.resolutionRate - a.resolutionRate);
  }, [filteredIssues]);

  /* ================= STATUS DISTRIBUTION ================= */
  const statusDistribution = useMemo(() => {
    const statusCounts = {
      pending: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      rejected: 0,
    };

    filteredIssues.forEach((issue) => {
      const status = issue.status || "pending";
      if (statusCounts[status] !== undefined) {
        statusCounts[status]++;
      } else {
        statusCounts.pending++;
      }
    });

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        color: COLOR_SCHEMES.status[status],
      }));
  }, [filteredIssues]);

  /* ================= HANDLERS ================= */
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleExport = () => {
    const data = {
      districtRankings,
      deptPerformance,
      issueTrends,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">
          Loading Government Dashboard...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Fetching latest performance data
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center p-6">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Error Loading Dashboard
        </h2>
        <p className="text-gray-600 mb-4 text-center">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="inline mr-2 w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      {/* HEADER WITH CONTROLS */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Landmark className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                 {adminDistrict} District Administration
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Monitoring performance of 38 districts across Tamil Nadu
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
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

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            title="Total Districts"
            value="38"
            icon={<MapPin className="w-5 h-5" />}
            change="Tamil Nadu"
            color="blue"
          />
          <SummaryCard
            title="Top District"
            value={districtRankings[0]?.name || "N/A"}
            icon={<Trophy className="w-5 h-5" />}
            change={`${districtRankings[0]?.points || 0} points`}
            color="green"
          />
          <SummaryCard
            title="Total Points"
            value={districtRankings.reduce((sum, d) => sum + d.points, 0)}
            icon={<Award className="w-5 h-5" />}
            change="All districts"
            color="purple"
          />
          <SummaryCard
            title="Avg Resolution Rate"
            value={`${districtRankings.length > 0 ? Math.round(districtRankings.reduce((sum, d) => sum + d.resolutionRate, 0) / districtRankings.length) : 0}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            change="State average"
            color="orange"
          />
        </div>
      </motion.div>

      {/* MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* DISTRICT POINTS LEADERBOARD */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  District Points Leaderboard
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Top performing districts by points system
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                  {districtRankings.length} Districts
                </span>
                <button
                  onClick={() => setShowAllDistricts(!showAllDistricts)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200"
                >
                  {showAllDistricts ? "Show Top 10" : "Show All"}
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {(showAllDistricts
                ? districtRankings
                : districtRankings.slice(0, 10)
              ).map((district, index) => (
                <motion.div
                  key={district.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center p-4 rounded-xl transition-all hover:shadow-md ${
                    index === 0
                      ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200"
                      : index === 1
                        ? "bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200"
                        : index === 2
                          ? "bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200"
                          : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                            ? "bg-gray-500 text-white"
                            : index === 2
                              ? "bg-orange-500 text-white"
                              : "bg-blue-100 text-blue-600"
                      } font-bold`}
                    >
                      {district.rank}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {district.name}
                        </h3>
                        {index < 3 && (
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              index === 0
                                ? "bg-yellow-100 text-yellow-800"
                                : index === 1
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-600">
                          {district.resolvedIssues} resolved •{" "}
                          {district.pendingIssues} pending
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">
                          {district.resolutionRate}% rate
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="text-2xl font-bold text-gray-900">
                        {district.points}
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          district.points >= 500
                            ? "bg-green-500"
                            : district.points >= 300
                              ? "bg-yellow-500"
                              : district.points >= 100
                                ? "bg-orange-500"
                                : "bg-red-500"
                        }`}
                      />
                    </div>
                    <div className="text-sm text-gray-500">Points</div>
                  </div>

                  <div className="ml-6 text-right hidden md:block">
                    <div className="text-lg font-semibold text-gray-900">
                      {district.efficiencyScore}%
                    </div>
                    <div className="text-xs text-gray-500">Efficiency</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {!showAllDistricts && districtRankings.length > 10 && (
              <button
                onClick={() => setShowAllDistricts(true)}
                className="w-full mt-6 py-3 text-center text-blue-600 hover:text-blue-700 font-medium rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors"
              >
                View all 38 districts with points
              </button>
            )}
          </div>
        </div>

        {/* POINTS DISTRIBUTION CHART */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Medal className="w-5 h-5 text-blue-500" />
            Points Distribution
          </h2>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDistrictsByPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "points") return [value, "Points"];
                    if (name === "resolutionRate")
                      return [value + "%", "Resolution Rate"];
                    return [value, name];
                  }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar dataKey="points" name="Points" radius={[4, 4, 0, 0]}>
                  {topDistrictsByPoints.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-700">Top 3 Districts</span>
              </div>
              <span className="font-bold text-gray-900">
                {topDistrictsByPoints
                  .slice(0, 3)
                  .reduce((sum, d) => sum + d.points, 0)}{" "}
                points
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-700">Top 10 Districts</span>
              </div>
              <span className="font-bold text-gray-900">
                {topDistrictsByPoints
                  .slice(0, 10)
                  .reduce((sum, d) => sum + d.points, 0)}{" "}
                points
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-700">All Districts</span>
              </div>
              <span className="font-bold text-gray-900">
                {districtRankings.reduce((sum, d) => sum + d.points, 0)} points
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* POINTS BREAKDOWN SECTION */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Points System Breakdown
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Resolved Issues</h3>
                <p className="text-sm text-gray-600">10 points each</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Base points for every resolved citizen issue
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Quick Resolution</h3>
                <p className="text-sm text-gray-600">5-20 bonus points</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Bonus for resolving within 1-7 days
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Priority Issues</h3>
                <p className="text-sm text-gray-600">5-15 bonus points</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Extra points for high/medium priority issues
            </p>
          </div>

          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Performance Bonus</h3>
                <p className="text-sm text-gray-600">Based on scores</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Points for efficiency & safety scores
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-bold text-gray-900 mb-4">
            Top 5 Districts by Category
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 text-sm">Most Points</h4>
              {districtRankings.slice(0, 5).map((district, index) => (
                <div
                  key={district.name}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-gray-600">{district.name}</span>
                  <span className="font-bold text-gray-900">
                    {district.points}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 text-sm">
                Highest Efficiency
              </h4>
              {[...districtRankings]
                .sort((a, b) => b.efficiencyScore - a.efficiencyScore)
                .slice(0, 5)
                .map((district, index) => (
                  <div
                    key={district.name}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-gray-600">
                      {district.name}
                    </span>
                    <span className="font-bold text-gray-900">
                      {district.efficiencyScore}%
                    </span>
                  </div>
                ))}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-700 text-sm">
                Best Resolution Rate
              </h4>
              {[...districtRankings]
                .sort((a, b) => b.resolutionRate - a.resolutionRate)
                .slice(0, 5)
                .map((district, index) => (
                  <div
                    key={district.name}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-gray-600">
                      {district.name}
                    </span>
                    <span className="font-bold text-gray-900">
                      {district.resolutionRate}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ISSUE TRENDS CHART */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Issue Trend Analysis
          </h2>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={issueTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  formatter={(value) => [value, "Count"]}
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="reported"
                  name="Reported"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">
                {issueTrends.reduce((sum, day) => sum + day.reported, 0)}
              </div>
              <div className="text-sm text-blue-800">Total Reported</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">
                {issueTrends.reduce((sum, day) => sum + day.resolved, 0)}
              </div>
              <div className="text-sm text-green-800">Total Resolved</div>
            </div>
          </div>
        </div>

        {/* STATUS DISTRIBUTION CHART */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-pink-500" />
            Issue Status Distribution
          </h2>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activePieIndex}
                  activeShape={renderActiveShape}
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} issues`,
                    props.payload.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {statusDistribution.map((status, index) => (
                <div key={status.name} className="flex items-center gap-2 p-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-sm text-gray-700">{status.name}</span>
                  <span className="ml-auto font-semibold">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DEPARTMENT COMPARISON CHART */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-green-500" />
          Department Performance Comparison
        </h2>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "resolutionRate")
                    return [value + "%", "Resolution Rate"];
                  return [value, name];
                }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar
                dataKey="resolutionRate"
                name="Resolution Rate %"
                radius={[4, 4, 0, 0]}
              >
                {deptPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

/* ================= COMPONENTS ================= */

const SummaryCard = ({ title, value, icon, change, color = "gray" }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    gray: "bg-gray-100 text-gray-600",
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

const renderActiveShape = (props) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * ((startAngle + endAngle) / 2));
  const cos = Math.cos(-RADIAN * ((startAngle + endAngle) / 2));
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      <text
        x={cx}
        y={cy}
        dy={8}
        textAnchor="middle"
        fill={fill}
        className="font-bold"
      >
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#333"
        className="font-medium"
      >
        {`${payload.name}: ${value}`}
      </text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#999"
      >
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

export default Dashboard;
