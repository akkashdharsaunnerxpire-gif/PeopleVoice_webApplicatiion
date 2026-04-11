import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  AlertCircle,
  MapPin,
  Building2,
  Tag,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Check,
  XCircle,
  Upload,
  X,
  Image as ImageIcon,
  Award,
  Download,
  AlertTriangle,
  ChevronRight,
  ImageUp,
  Trash2,
} from "lucide-react";

// Material UI Components
import {
  LinearProgress,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Tooltip,
  TextField,
  IconButton,
  Divider,
  Skeleton,
  Fade,
  CircularProgress,
  Paper,
  Container,
  Stack,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: "24px",
  backgroundColor: "#ffffff",
  boxShadow: "0 20px 35px -12px rgba(0, 0, 0, 0.08)",
  border: "1px solid #eef2f6",
  transition: "all 0.3s ease",
}));

const GradientButton = styled(Button)(({ theme, colorType = "primary" }) => ({
  background:
    colorType === "success"
      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
      : colorType === "warning"
      ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
      : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  color: "white",
  borderRadius: "16px",
  padding: "12px 28px",
  fontWeight: 600,
  fontSize: "0.95rem",
  textTransform: "none",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
  },
  "&:disabled": {
    background: theme.palette.grey[400],
  },
}));

const StatusChip = styled(Chip)(({ status, theme }) => {
  const displayStatus = status === "solved" ? "Closed" : status;
  const colors = {
    Sent: { bg: "#e6f0ff", color: "#1e4bd2", border: "#b8d1ff" },
    "In Progress": { bg: "#fff4e5", color: "#b85e00", border: "#ffd8b0" },
    Resolved: { bg: "#e3f7ec", color: "#0b6e4f", border: "#a8e6c0" },
    Closed: { bg: "#e8eaff", color: "#3949ab", border: "#c5cae9" },
    solved: { bg: "#e8eaff", color: "#3949ab", border: "#c5cae9" },
  };
  const color = colors[status] || colors[displayStatus] || colors.Sent;
  return {
    backgroundColor: color.bg,
    color: color.color,
    border: `1px solid ${color.border}`,
    borderRadius: "20px",
    fontWeight: 600,
    fontSize: "0.85rem",
    height: "32px",
  };
});

const InfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
  backgroundColor: "#f8fafc",
  borderRadius: "16px",
  marginBottom: theme.spacing(1.5),
}));

const DropZone = styled(Paper)(({ theme, isdragactive }) => ({
  border: `2px dashed ${isdragactive ? "#10b981" : "#cbd5e1"}`,
  borderRadius: "20px",
  padding: theme.spacing(4),
  textAlign: "center",
  cursor: "pointer",
  backgroundColor: isdragactive ? "#f0fdf4" : "#fafafa",
  transition: "all 0.2s ease",
  "&:hover": {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
    transform: "scale(1.01)",
  },
}));

const ImagePreviewCard = styled(Box)(({ theme }) => ({
  position: "relative",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
  transition: "all 0.2s ease",
  "&:hover": {
    transform: "scale(1.02)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
    "& .delete-btn": {
      opacity: 1,
    },
  },
}));

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const formatShortDate = (dateString) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

export default function IssueDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const modalDescriptionRef = useRef(null);
  const fileInputRef = useRef(null);

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [afterImages, setAfterImages] = useState([]);
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [detailsError, setDetailsError] = useState("");

  // Cleanup object URLs on unmount or when images change
  useEffect(() => {
    return () => {
      afterImages.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [afterImages]);

  useEffect(() => {
    if (showResolveModal && modalDescriptionRef.current) {
      setTimeout(() => modalDescriptionRef.current.focus(), 100);
    }
  }, [showResolveModal]);

  const updateStatus = async (status, extraData = {}) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("adminToken");
      const payload = { status, ...extraData };
      await axios.put(`${API_BASE}/api/admin/issues/${id}/status`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("success", `Status updated to ${status}`);
      fetchIssue();
      setShowResolveModal(false);
      // Cleanup preview URLs
      afterImages.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      setAfterImages([]);
      setResolutionDetails("");
      setUploadError("");
      setDetailsError("");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const filesToBase64 = async (files) => {
    const promises = files.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
    });
    return Promise.all(promises);
  };

  const fetchIssue = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("No authentication token found");
      const res = await axios.get(`${API_BASE}/api/admin/issues/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIssue(res.data.issue || res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load issue details",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  const normalized = useMemo(() => {
    if (!issue) return null;
    let displayStatus = issue.status;
    if (issue.status === "solved") displayStatus = "Closed";
    return {
      ...issue,
      beforeImages: (issue.images_data || issue.images || issue.before_images || [])
        .map((item) => (typeof item === "string" ? item : item?.url || ""))
        .filter(Boolean),
      afterImages: (issue.after_images || [])
        .map((item) => (typeof item === "string" ? item : item?.url || ""))
        .filter(Boolean),
      status: issue.status || "Sent",
      displayStatus,
      reportedDate: issue.createdAt || issue.reported_date,
      municipalityInformedDate: issue.municipalityInformedDate,
      resolvedDate: issue.resolved_date || issue.resolvedAt,
      closedDate: issue.closedDate,
    };
  }, [issue]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleImageUpload = (files) => {
    setUploadError("");
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    for (const file of fileArray) {
      if (afterImages.length + validFiles.length >= 4) {
        errors.push("Maximum 4 images allowed");
        break;
      }
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name} exceeds 5MB limit`);
        continue;
      }
      // Create preview URL and store it on the file object
      const fileWithPreview = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });
      validFiles.push(fileWithPreview);
    }

    if (errors.length > 0) {
      setUploadError(errors[0]);
      setTimeout(() => setUploadError(""), 3000);
    }
    if (validFiles.length > 0) {
      setAfterImages((prev) => [...prev, ...validFiles].slice(0, 4));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeAfterImage = (index) => {
    const removed = afterImages[index];
    if (removed && removed.preview) URL.revokeObjectURL(removed.preview);
    setAfterImages((prev) => prev.filter((_, i) => i !== index));
  };

  const openImagePreview = (src) => {
    setImagePreview(src);
  };

  const progressValue = useMemo(() => {
    if (!normalized) return 0;
    if (normalized.status === "Closed" || normalized.status === "solved") return 100;
    if (normalized.status === "Resolved") return 80;
    if (normalized.status === "In Progress") return 50;
    return 25;
  }, [normalized?.status]);

  const getProgressColor = () => {
    if (!normalized) return "primary";
    if (normalized.status === "Closed" || normalized.status === "solved") return "success";
    if (normalized.status === "Resolved") return "success";
    if (normalized.status === "In Progress") return "warning";
    return "info";
  };

  const timelineSteps = [
    { label: "Reported", status: "Sent", date: normalized?.reportedDate, icon: AlertCircle },
    { label: "In Progress", status: "In Progress", date: normalized?.municipalityInformedDate, icon: Clock },
    { label: "Resolved", status: "Resolved", date: normalized?.resolvedDate, icon: CheckCircle },
    { label: "Closed", status: "Closed", date: normalized?.closedDate || (normalized?.status === "solved" ? normalized?.updatedAt : null), icon: Award },
  ];

  const getStepState = (stepStatus) => {
    const currentRawStatus = normalized?.status || "Sent";
    let currentIdx;
    if (currentRawStatus === "solved") currentIdx = 3;
    else {
      const order = ["Sent", "In Progress", "Resolved", "Closed"];
      currentIdx = order.indexOf(currentRawStatus);
    }
    const stepOrder = ["Sent", "In Progress", "Resolved", "Closed"];
    const stepIdx = stepOrder.indexOf(stepStatus);
    if (stepIdx < currentIdx) return "completed";
    if (stepIdx === currentIdx) return "active";
    return "pending";
  };

  const getActionConfig = () => {
    if (!normalized) return null;
    if (normalized.status === "Closed" || normalized.status === "solved") return null;
    switch (normalized.status) {
      case "Sent":
        return { label: "Start Progress", colorType: "primary", onClick: () => updateStatus("In Progress"), loading: "Notifying..." };
      case "In Progress":
        return { label: "Mark Resolved", colorType: "success", onClick: () => setShowResolveModal(true), loading: "Processing..." };
      case "Resolved":
        return { label: "Close Issue", colorType: "warning", onClick: () => updateStatus("Closed"), loading: "Closing..." };
      default:
        return null;
    }
  };

  const action = getActionConfig();

 const handleResolveSubmit = async () => {
  setDetailsError("");
  setUploadError("");

  if (afterImages.length === 0) {
    setUploadError("Please upload at least one after-resolution image");
    return;
  }

  const trimmedDetails = resolutionDetails.trim();
  if (trimmedDetails.length < 10) {
    setDetailsError("Please provide at least 10 characters describing the resolution");
    modalDescriptionRef.current?.focus();
    return;
  }

  setActionLoading(true);

  try {
    const uploadedUrls = [];

    for (let file of afterImages) {
      // convert to base64 (for API send only)
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });

      // 🔥 upload to backend → cloudinary
      const res = await fetch(`${API_BASE}/api/upload/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await res.json();

      if (data.success) {
        uploadedUrls.push(data.url);
      }
    }

    // ✅ save only URLs
    await updateStatus("Resolved", {
      afterImages: uploadedUrls,
      resolutionDetails: trimmedDetails,
    });

  } catch (err) {
    console.error(err);
    showToast("error", "Failed to submit resolution");
  } finally {
    setActionLoading(false);
  }
};

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3 }} />
          <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 3 }} />
        </Stack>
      </Container>
    );
  }

  if (!normalized) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 5, textAlign: "center", borderRadius: 4 }}>
          <AlertTriangle size={60} color="#ef4444" style={{ marginBottom: 16 }} />
          <Typography variant="h5" fontWeight="bold" color="error" gutterBottom>Issue Not Found</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>The issue could not be found or you don't have permission.</Typography>
          <Button variant="contained" startIcon={<ArrowLeft />} onClick={() => navigate(-1)}>Go Back</Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f9fafc", py: 4 }}>
      {toast && (
        <Fade in>
          <Paper sx={{ position: "fixed", top: 24, right: 24, zIndex: 9999, minWidth: 300, p: 2, borderRadius: 2, bgcolor: toast.type === "success" ? "#10b981" : "#ef4444", color: "white", display: "flex", alignItems: "center", gap: 1.5, boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}>
            {toast.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
            <Typography sx={{ flex: 1 }}>{toast.message}</Typography>
            <IconButton size="small" onClick={() => setToast(null)} sx={{ color: "white" }}><X size={18} /></IconButton>
          </Paper>
        </Fade>
      )}

      <Container maxWidth="xl">
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: "white", boxShadow: 1 }}><ArrowLeft size={20} /></IconButton>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                <Typography variant="h5" fontWeight="bold">Issue #{id?.slice(-8)}</Typography>
                <StatusChip label={normalized.displayStatus || normalized.status} status={normalized.status} size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Calendar size={14} /> Reported: {formatDate(normalized.reportedDate)}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Download Report"><IconButton sx={{ bgcolor: "white", boxShadow: 1 }}><Download size={20} /></IconButton></Tooltip>
        </Box>

        <StyledCard>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>Progress Status</Typography>
              <LinearProgress variant="determinate" value={progressValue} color={getProgressColor()} sx={{ height: 8, borderRadius: 4, mb: 3, backgroundColor: "#e9ecef" }} />
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                {timelineSteps.map((step, index) => {
                  const state = getStepState(step.status);
                  const Icon = step.icon;
                  return (
                    <React.Fragment key={step.label}>
                      <Box sx={{ textAlign: "center", minWidth: 90 }}>
                        <Avatar sx={{ width: 40, height: 40, mx: "auto", mb: 0.5, bgcolor: state === "completed" ? "#10b981" : state === "active" ? "#f59e0b" : "#e9ecef", color: state === "pending" ? "#9ca3af" : "white" }}>
                          {state === "completed" ? <Check size={20} /> : <Icon size={20} />}
                        </Avatar>
                        <Typography variant="caption" fontWeight={state === "active" ? 600 : 400}>{step.label}</Typography>
                        {step.date && <Typography variant="caption" display="block" color="text.secondary">{formatShortDate(step.date)}</Typography>}
                      </Box>
                      {index < 3 && <ChevronRight size={20} color="#d1d5db" style={{ flexShrink: 0 }} />}
                    </React.Fragment>
                  );
                })}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}><AlertCircle size={18} /> Issue Details</Typography>
                <InfoRow><MapPin size={18} color="#6b7280" /><Box><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body2">{normalized.area || "—"}, {normalized.district || "—"}</Typography></Box></InfoRow>
                <InfoRow><Tag size={18} color="#6b7280" /><Box><Typography variant="caption" color="text.secondary">Category</Typography><Typography variant="body2">{normalized.category || "General"}</Typography></Box></InfoRow>
                <InfoRow><Building2 size={18} color="#6b7280" /><Box><Typography variant="caption" color="text.secondary">Department</Typography><Typography variant="body2">{normalized.department || "Unassigned"}</Typography></Box></InfoRow>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}><FileText size={18} /> Description</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f9f9fc", borderRadius: 2, mb: 2 }}><Typography variant="caption" color="primary" fontWeight={600}>ENGLISH</Typography><Typography variant="body2">{normalized.description_en || "No description"}</Typography></Paper>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f9f9fc", borderRadius: 2 }}><Typography variant="caption" color="success" fontWeight={600}>தமிழ்</Typography><Typography variant="body2">{normalized.description_ta || "விளக்கம் இல்லை"}</Typography></Paper>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}><ImageIcon size={18} /> Images</Typography>
                {normalized.beforeImages.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 2 }}>BEFORE IMAGES</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 2 }}>
                      {normalized.beforeImages.map((src, i) => (
                        <Box key={i} onClick={() => openImagePreview(src)} sx={{ borderRadius: 2, overflow: "hidden", cursor: "pointer", border: "1px solid #e5e7eb", transition: "all 0.2s", "&:hover": { opacity: 0.9, transform: "scale(1.02)" } }}>
                          <img src={src} alt={`Before ${i + 1}`} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>

            {(normalized.afterImages.length > 0 || normalized.resolution_details || normalized.status === "Resolved" || normalized.status === "Closed" || normalized.status === "solved") && (
              <>
                <Divider sx={{ my: 4 }} />
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><CheckCircle size={20} color="#059669" /><Typography variant="subtitle1" fontWeight="600" sx={{ color: "#059669" }}>Proof of Completion</Typography></Box>
                    <Typography variant="subtitle2" fontWeight="600" sx={{ color: "#059669" }}>After Resolution Images</Typography>
                  </Box>
                  <Box sx={{ mb: 4 }}>
                    {normalized.afterImages.length > 0 ? (
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 2 }}>
                        {normalized.afterImages.map((src, i) => (
                          <Box key={i} onClick={() => openImagePreview(src)} sx={{ borderRadius: 2, overflow: "hidden", cursor: "pointer", border: "2px solid #10b981", transition: "all 0.2s", "&:hover": { opacity: 0.9, transform: "scale(1.02)" } }}>
                            <img src={src} alt={`After ${i + 1}`} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#f9fafc", borderRadius: 2 }}><ImageIcon size={32} color="#9ca3af" /><Typography color="text.secondary">No after images uploaded</Typography></Paper>
                    )}
                  </Box>
                  <Box sx={{ bgcolor: "#f0fdf4", borderRadius: 3, p: 3, border: "1px solid #a7f3d0" }}>
                    <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1, color: "#059669" }}><FileText size={18} /> Resolution Details</Typography>
                    {normalized.resolution_details ? (
                      <>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, mb: 2 }}>{normalized.resolution_details}</Typography>
                        {normalized.resolvedDate && (<Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 2, borderTop: "1px dashed #a7f3d0" }}><Calendar size={14} color="#059669" /><Typography variant="caption" color="text.secondary">Resolved on: {formatDate(normalized.resolvedDate)}</Typography></Box>)}
                      </>
                    ) : (<Typography color="text.secondary">No resolution details added</Typography>)}
                  </Box>
                </Box>
              </>
            )}

            {action && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <GradientButton colorType={action.colorType} disabled={actionLoading} onClick={action.onClick} startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : null} endIcon={!actionLoading && <ChevronRight size={18} />} sx={{ minWidth: 200 }}>
                  {actionLoading ? action.loading : action.label}
                </GradientButton>
              </Box>
            )}

            {(normalized.status === "Closed" || normalized.status === "solved") && (
              <Paper sx={{ p: 4, textAlign: "center", bgcolor: "#f0fdf4", borderRadius: 3, mt: 4 }}>
                <CheckCircle size={48} color="#10b981" style={{ marginBottom: 12 }} />
                <Typography variant="h6" fontWeight="bold" color="success.dark">Issue Closed Successfully</Typography>
                <Typography variant="body2" color="text.secondary">{normalized.status === "solved" ? "Issue has been solved and closed" : "Thank you message sent to citizen"}</Typography>
                {normalized.closedDate && (<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>Closed on: {formatDate(normalized.closedDate)}</Typography>)}
              </Paper>
            )}
          </CardContent>
        </StyledCard>
      </Container>

      {/* ==================== RESOLVE MODAL (FIXED) ==================== */}
      {showResolveModal && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9998,
            p: 2,
          }}
          onClick={() => !actionLoading && setShowResolveModal(false)}
        >
          <Paper
            sx={{
              maxWidth: 1000,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              borderRadius: 4,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Header */}
            <Box sx={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", p: 3, color: "white" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircle size={28} /> Resolve Issue
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>Provide proof of completion to mark this issue as resolved</Typography>
                </Box>
                <IconButton onClick={() => !actionLoading && setShowResolveModal(false)} disabled={actionLoading} sx={{ color: "white" }}><X size={24} /></IconButton>
              </Box>
            </Box>

            <Box sx={{ p: 4 }}>
              {/* Upload Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  After-Resolution Images <span style={{ color: "#ef4444" }}>*</span>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Maximum 4 images · JPG, PNG, WebP · Max 5MB each
                </Typography>
                <DropZone
                  isdragactive={dragActive}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} hidden disabled={actionLoading} />
                  <ImageUp size={48} color="#94a3b8" style={{ marginBottom: 12 }} />
                  <Typography variant="body1" fontWeight={500}>Drag & drop images here or click to browse</Typography>
                  <Typography variant="caption" color="text.secondary">Supports JPG, PNG, WebP (Max 5MB each) · Max 4 images</Typography>
                </DropZone>
                {uploadError && <Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>}
              </Box>

              {/* Image Previews */}
              {afterImages.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>Uploaded Images ({afterImages.length}/4)</Typography>
                    <Chip label={`${afterImages.length} of 4 used`} size="small" color={afterImages.length === 4 ? "warning" : "success"} />
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 2 }}>
                    {afterImages.map((file, idx) => (
                      <ImagePreviewCard key={idx}>
                        <img src={file.preview} alt="preview" style={{ width: "100%", height: 140, objectFit: "cover" }} />
                        <IconButton
                          className="delete-btn"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            bgcolor: "rgba(0,0,0,0.6)",
                            color: "white",
                            opacity: { xs: 1, sm: 0 },
                            transition: "opacity 0.2s",
                            "&:hover": { bgcolor: "error.main" },
                          }}
                          onClick={() => removeAfterImage(idx)}
                          disabled={actionLoading}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                        <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, bgcolor: "rgba(0,0,0,0.5)", p: 0.5, textAlign: "center" }}>
                          <Typography variant="caption" sx={{ color: "white" }}>{file.name.length > 20 ? file.name.slice(0, 17) + "..." : file.name}</Typography>
                        </Box>
                      </ImagePreviewCard>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Resolution Details Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  Resolution Details <span style={{ color: "#ef4444" }}>*</span>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  Minimum 10 characters describing the action taken
                </Typography>
                <TextField
                  inputRef={modalDescriptionRef}
                  fullWidth
                  multiline
                  rows={5}
                  value={resolutionDetails}
                  onChange={(e) => {
                    setResolutionDetails(e.target.value);
                    if (detailsError) setDetailsError("");
                  }}
                  placeholder="Example: Collected 3 tons of garbage from the site, cleaned the area, and installed new bins..."
                  variant="outlined"
                  disabled={actionLoading}
                  error={!!detailsError}
                  helperText={detailsError}
                />
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button variant="outlined" onClick={() => setShowResolveModal(false)} disabled={actionLoading}>Cancel</Button>
                <GradientButton
                  colorType="success"
                  onClick={handleResolveSubmit}
                  disabled={actionLoading || afterImages.length === 0 || resolutionDetails.trim().length < 10}
                  startIcon={actionLoading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />}
                >
                  {actionLoading ? "Submitting Resolution..." : "Confirm & Mark Resolved"}
                </GradientButton>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.95)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", p: 2 }} onClick={() => setImagePreview(null)}>
          <Box sx={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img src={imagePreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }} />
            <IconButton onClick={() => setImagePreview(null)} sx={{ position: "absolute", top: 8, right: 8, bgcolor: "error.main", color: "white", "&:hover": { bgcolor: "error.dark" } }}><X size={20} /></IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}