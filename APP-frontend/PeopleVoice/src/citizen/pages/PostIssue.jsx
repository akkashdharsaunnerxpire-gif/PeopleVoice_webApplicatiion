import React, { useState, useRef, useEffect } from "react";
import {
  Hash,
  Camera,
  MapPin,
  Loader2,
  X,
  Circle,
  AlertCircle,
  Globe,
  AlertTriangle,
  Crosshair,
  Navigation2,
  Edit,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../Context/ThemeContext";
import { DISTRICTS } from "../components/constants";
import { themeColors } from "../components/constants";
import { useUserValues } from "../../Context/UserValuesContext";

/* ================= CONFIG ================= */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const APIURL = `${BACKEND_URL}/api`;

/* ================= CONSTANTS ================= */
const DEPARTMENTS = [
  {
    id: "Road",
    name: "Road",
    minImages: 1,
    maxImages: 4,
    description: "Potholes, road damage, accidents",
  },
  {
    id: "Garbage",
    name: "Garbage",
    minImages: 1,
    maxImages: 4,
    description: "Garbage dumping, waste issues",
  },
  {
    id: "Water",
    name: "Water",
    minImages: 1,
    maxImages: 4,
    description: "Leakage, pipeline, drainage",
  },
  {
    id: "Electricity",
    name: "Electricity",
    minImages: 1,
    maxImages: 3,
    description: "Pole, wire, transformer issues",
  },
  {
    id: "Drainage",
    name: "Drainage",
    minImages: 1,
    maxImages: 4,
    description: "Blockage, sewage overflow",
  },
  {
    id: "Other",
    name: "Other",
    minImages: 1,
    maxImages: 4,
    description: "Other public complaints",
  },
];

const REASONS = [
  "Public Safety Risk",
  "Health Hazard",
  "Traffic Issue",
  "Environmental Issue",
  "Public Convenience",
  "Other",
];

// Comprehensive hashtags collection
const ALL_TAGS = [
  "#RoadIssue", "#RoadDamage", "#Pothole", "#RoadSafety", "#RoadAccident",
  "#Garbage", "#WasteManagement", "#GarbageDumping", "#CleanCity", "#SwachhBharat",
  "#WaterProblem", "#WaterLeakage", "#PipelineIssue", "#Drainage", "#SewageOverflow",
  "#Electricity", "#PowerCut", "#TransformerIssue", "#WireSnapping", "#PoleDamage",
  "#DrainageBlockage", "#SewageProblem", "#Flooding", "#StagnantWater",
  "#PublicIssue", "#PeopleVoice", "#CitizenReport", "#CivicIssue",
  "#Urgent", "#Emergency", "#HighPriority", "#Dangerous", "#SafetyHazard",
  "#Chennai", "#Nagercoil", "#Coimbatore", "#Madurai", "#Tirunelveli", "#Salem",
  "#HealthHazard", "#EnvironmentalIssue", "#TrafficIssue", "#PublicSafety",
  "#IllegalDumping", "#NoisePollution", "#AirPollution", "#StreetLightOutage",
  "#FootpathIssue", "#PedestrianSafety", "#WaterLogging", "#MosquitoBreeding",
];

/* ================= LANGUAGE CONSTANTS (Static Tamil) ================= */
const TEXTS = {
  en: {
    title: "Register Public Complaint",
    department: "Department",
    selectDepartment: "Select Department",
    photos: "Photos",
    takePhoto: "Take Photo",
    selectDeptFirst: "Select Dept First",
    location: "Location",
    clickToEnterLocation: "Click to enter location manually",
    district: "District",
    selectDistrict: "Select District",
    reason: "Reason",
    selectReason: "Select Reason",
    description: "Description",
    describeIssue: "Describe the issue clearly...",
    descriptionTamil: "Description (Tamil)",
    hashtags: "Hashtags",
    addHashtags: "Add hashtags (#Urgent #Chennai ...)",
    agreement: "I confirm this complaint is genuine and based on facts. False information may lead to legal action.",
    proceed: "Proceed to Final Verification",
    finalConfirmation: "Final Confirmation – Mandatory",
    falseComplaints: "False complaints are punishable offences",
    importantLegalNotice: "Important Legal Notice",
    legalText: "Submitting false, misleading or irrelevant information / photographs is a serious offence. Government authorities may impose fines and take legal action under Section 177 IPC and other applicable laws.",
    complaintSummary: "Complaint Summary",
    departmentLabel: "Department",
    locationLabel: "Location",
    photosLabel: "Photos",
    attached: "attached",
    iHerebyDeclare: "I hereby solemnly declare:",
    confirmImages: "All photos genuinely show the reported issue.",
    confirmImagesDesc: "No old, irrelevant or unrelated images used.",
    confirmLocation: "The location is correct & accurate.",
    confirmLocationDesc: "Issue location:",
    acceptTerms: "THIS COMPLAINT IS TRUE AND GENUINE",
    acceptTermsDesc: "I understand that providing false information may result in government fines and legal action.",
    goBackEdit: "Go Back & Edit",
    iConfirmSubmit: "I Confirm → Submit Complaint",
    submitting: "Submitting...",
    capturingLocation: "Capturing precise location...",
    cameraDenied: "Camera access denied or not available",
    duplicatePhoto: "Duplicate photo detected",
    fillAllFields: "Please fill all required fields",
    minPhotosRequired: "Minimum {minImages} photo(s) required for {department}",
    confirmAllPoints: "Please confirm all required points",
    complaintRegistered: "Complaint registered successfully! Authorities will review it soon.",
    networkError: "Network error. Please try again.",
    yesThisIsIssue: "✓ Yes, this is a {department} issue",
    save: "Save",
    cancel: "Cancel",
    english: "English",
    tamil: "தமிழ்",
    both: "Both",
    enterValidLocation: "Please enter valid location",
    pleaseLogin: "Please login first",
    searchHashtags: "Search hashtags...",
  },
  ta: {
    title: "பொது புகார் பதிவு",
    department: "துறை",
    selectDepartment: "துறையைத் தேர்ந்தெடுக்கவும்",
    photos: "புகைப்படங்கள்",
    takePhoto: "புகைப்படம் எடுக்கவும்",
    selectDeptFirst: "முதலில் துறையைத் தேர்ந்தெடுக்கவும்",
    location: "இடம்",
    clickToEnterLocation: "கைமுறையாக இடத்தை உள்ளிட கிளிக் செய்யவும்",
    district: "மாவட்டம்",
    selectDistrict: "மாவட்டத்தைத் தேர்ந்தெடுக்கவும்",
    reason: "காரணம்",
    selectReason: "காரணத்தைத் தேர்ந்தெடுக்கவும்",
    description: "விளக்கம்",
    describeIssue: "பிரச்சினையை தெளிவாக விளக்கவும்...",
    descriptionTamil: "விளக்கம் (தமிழ்)",
    hashtags: "ஹேஷ்டேக்கள்",
    addHashtags: "ஹேஷ்டேக்களை சேர்க்கவும் (#அவசர #சென்னை ...)",
    agreement: "இந்தப் புகார் உண்மை மற்றும் உண்மையானது என உறுதிப்படுத்துகிறேன். பொய்த் தகவல்கள் சட்ட நடவடிக்கைக்கு வழிவகுக்கும்.",
    proceed: "இறுதி சரிபார்ப்புக்குச் செல்லவும்",
    finalConfirmation: "இறுதி உறுதிப்படுத்தல் – கட்டாயம்",
    falseComplaints: "பொய் புகார்கள் தண்டனைக்குரிய குற்றங்கள்",
    importantLegalNotice: "முக்கிய சட்ட அறிவிப்பு",
    legalText: "பொய், தவறான அல்லது தொடர்பில்லாத தகவல்/புகைப்படங்களை சமர்ப்பிப்பது கடுமையான குற்றமாகும். அரசு அதிகாரிகள் பிரிவு 177 IPC மற்றும் பிற சட்டங்களின் கீழ் அபராதம் விதிக்கலாம் மற்றும் சட்ட நடவடிக்கை எடுக்கலாம்.",
    complaintSummary: "புகார் சுருக்கம்",
    departmentLabel: "துறை",
    locationLabel: "இடம்",
    photosLabel: "புகைப்படங்கள்",
    attached: "இணைக்கப்பட்டது",
    iHerebyDeclare: "நான் இதன்மூலம் உறுதியளிக்கிறேன்:",
    confirmImages: "அனைத்து புகைப்படங்களும் புகாரளிக்கப்பட்ட பிரச்சினையை உண்மையாகக் காட்டுகின்றன.",
    confirmImagesDesc: "பழைய, தொடர்பில்லாத அல்லது தொடர்பில்லாத படங்கள் பயன்படுத்தப்படவில்லை.",
    confirmLocation: "இடம் சரியானது & துல்லியமானது.",
    confirmLocationDesc: "பிரச்சினை இடம்:",
    acceptTerms: "இந்த புகார் உண்மை மற்றும் உண்மையானது",
    acceptTermsDesc: "பொய்த் தகவலை வழங்குவது அரசு அபராதம் மற்றும் சட்ட நடவடிக்கைக்கு வழிவகுக்கும் என்பதை நான் புரிந்துகொள்கிறேன்.",
    goBackEdit: "திரும்பிச் சென்று திருத்தவும்",
    iConfirmSubmit: "நான் உறுதிப்படுத்துகிறேன் → புகாரைச் சமர்ப்பிக்கவும்",
    submitting: "சமர்ப்பிக்கிறது...",
    capturingLocation: "துல்லியமான இடத்தைப் பிடிக்கிறது...",
    cameraDenied: "கேமரா அணுகல் மறுக்கப்பட்டது அல்லது இல்லை",
    duplicatePhoto: "நகல் புகைப்படம் கண்டறியப்பட்டது",
    fillAllFields: "தேவையான அனைத்து புலங்களையும் பூர்த்தி செய்யவும்",
    minPhotosRequired: "{department} க்கு குறைந்தபட்ச {minImages} புகைப்பட(ங்கள்) தேவை",
    confirmAllPoints: "அனைத்து தேவையான புள்ளிகளையும் உறுதிப்படுத்தவும்",
    complaintRegistered: "புகார் வெற்றிகரமாக பதிவு செய்யப்பட்டது! அதிகாரிகள் விரைவில் மதிப்பாய்வு செய்வார்கள்.",
    networkError: "பிணையப் பிழை. மீண்டும் முயற்சிக்கவும்.",
    yesThisIsIssue: "✓ ஆம், இது ஒரு {department} பிரச்சினை",
    save: "சேமிக்கவும்",
    cancel: "ரத்து செய்யவும்",
    english: "ஆங்கிலம்",
    tamil: "தமிழ்",
    both: "இரண்டும்",
    enterValidLocation: "சரியான இடத்தை உள்ளிடவும்",
    pleaseLogin: "முதலில் உள்நுழையவும்",
    searchHashtags: "ஹேஷ்டேக்களைத் தேடுங்கள்...",
  },
};

/* ================= MAIN COMPONENT ================= */
const PostIssue = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modalRef = useRef(null);

  // Form states
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [department, setDepartment] = useState("");
  const [reason, setReason] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descTa, setDescTa] = useState(""); // Static Tamil - user can edit directly
  const [hashtags, setHashtags] = useState("#peoplevoice ");
  const [images, setImages] = useState([]);
  const [agree, setAgree] = useState(false);

  // UI states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const { addNewIssue } = useUserValues();

  // Description view toggle
  const [descView, setDescView] = useState("both");

  // Verification modal
  const [showVerification, setShowVerification] = useState(false);
  const [verificationChecks, setVerificationChecks] = useState({
    confirmImages: false,
    confirmLocation: false,
    confirmDepartment: false,
    confirmDescription: false,
    acceptTerms: false,
  });
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  // Language state
  const [language, setLanguage] = useState("en");

  const t = (key, params = {}) => {
    let text = TEXTS[language][key] || key;
    Object.keys(params).forEach((param) => {
      text = text.replace(`{${param}}`, params[param]);
    });
    return text;
  };

  const citizenId = localStorage.getItem("citizenId");
  const device_fingerprint = navigator.userAgent;
  const navigateToLogin = () => navigate("/login");

  useEffect(() => {
    if (!citizenId) {
      alert(t("pleaseLogin"));
      navigateToLogin();
    }
  }, [citizenId]);

  useEffect(() => {
    if (department) {
      setCameraAllowed(false);
      setValidationMessage(
        t("readyToCapture", { department: getDepartmentName(department) }),
      );
    }
  }, [department]);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowVerification(false);
      }
    };
    if (showVerification) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showVerification]);

  const getDepartmentDetails = (id) =>
    DEPARTMENTS.find((d) => d.id === id) || DEPARTMENTS[5];

  const getDepartmentName = (id) => getDepartmentDetails(id).name;

  const getCurrentLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation)
        return reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(
        async ({ coords: { latitude, longitude } }) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { "User-Agent": "CivicIssueApp/1.0" } },
            );
            const data = await res.json();
            const address =
              data?.display_name ||
              `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            resolve({
              latitude,
              longitude,
              address,
              coordinates: `${latitude},${longitude}`,
              timestamp: new Date().toISOString(),
            });
          } catch {
            resolve({
              latitude,
              longitude,
              address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              coordinates: `${latitude},${longitude}`,
              timestamp: new Date().toISOString(),
            });
          }
        },
        (err) => {
          const msg =
            err.code === 1
              ? "Location permission denied"
              : "Could not get location";
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });

  const compressImage = (base64) =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(800 / img.width, 800 / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas
          .getContext("2d")
          .drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.68));
      };
    });

  const hashImage = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  };

  const startCamera = async () => {
    if (!department) return setError(t("selectDepartment"));
    if (!cameraAllowed) return setError(t("selectDeptFirst"));
    if (images.length >= getDepartmentDetails(department).maxImages) {
      return setError(
        `Max ${getDepartmentDetails(department).maxImages} photos allowed`,
      );
    }

    setIsCameraOpen(true);
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err.name, err.message, err);
      let friendlyMsg = t("cameraDenied");
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        friendlyMsg = language === "en"
          ? "Camera permission denied. Please allow camera access in your browser settings and try again."
          : "கேமரா அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்புகளில் கேமரா அனுமதியை அனுமதித்து மீண்டும் முயற்சிக்கவும்.";
      } else if (err.name === "NotFoundError" || err.name === "OverconstrainedError") {
        friendlyMsg = language === "en"
          ? "No suitable camera found on this device."
          : "இந்த சாதனத்தில் பொருத்தமான கேமரா இல்லை.";
      } else if (err.name === "NotReadableError") {
        friendlyMsg = language === "en"
          ? "Camera is in use by another app or permission issue."
          : "கேமரா வேறு செயலியால் பயன்படுத்தப்படுகிறது அல்லது அனுமதி பிரச்சினை.";
      }
      setError(friendlyMsg + ` (${err.name})`);
      setIsCameraOpen(false);
    }
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const raw = canvas.toDataURL("image/jpeg", 0.92);
    const compressed = await compressImage(raw);
    const imgHash = hashImage(compressed);

    if (images.some((i) => i.hash === imgHash)) {
      setError(t("duplicatePhoto"));
      stopCamera();
      return;
    }

    setIsValidatingImage(true);
    try {
      const location = await getCurrentLocation();
      const newImage = {
        data: compressed,
        hash: imgHash,
        location,
        timestamp: new Date().toISOString(),
      };
      setImages((prev) => [...prev, newImage]);

      if (location?.address) {
        setArea(location.address);
        if (!district) {
          const found = DISTRICTS.find((d) =>
            location.address.toLowerCase().includes(d.toLowerCase()),
          );
          if (found) setDistrict(found);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to capture location");
    } finally {
      setIsValidatingImage(false);
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState("");

  const saveManualLocation = () => {
    if (manualLocation.trim()) {
      setArea(manualLocation.trim());
      setIsEditingLocation(false);
      setError("");
    } else {
      setError(t("enterValidLocation"));
    }
  };

  const confirmDepartmentSelection = () => {
    if (!department) return;
    setCameraAllowed(true);
    setValidationMessage(
      t("readyToCapture", { department: getDepartmentName(department) }),
    );
  };

  // Enhanced hashtag search
  const handleHashtagChange = (e) => {
    const value = e.target.value;
    setHashtags(value);

    const words = value.split(/\s+/);
    const lastWord = words[words.length - 1];

    if (lastWord?.startsWith("#") && lastWord.length > 1) {
      const searchTerm = lastWord.toLowerCase();
      const filtered = ALL_TAGS.filter(
        (tag) => tag.toLowerCase().includes(searchTerm) && !value.includes(tag),
      ).slice(0, 10);
      setSuggestions(filtered);
    } else {
      if (!lastWord?.startsWith("#") && words.length > 0) {
        const usedTags = words.filter((w) => w.startsWith("#"));
        const popularTags = ALL_TAGS.filter(
          (tag) => !usedTags.includes(tag),
        ).slice(0, 8);
        setSuggestions(popularTags);
      } else {
        setSuggestions([]);
      }
    }
  };

  const applySuggestion = (tag) => {
    const words = hashtags.split(/\s+/).filter(Boolean);
    if (words.length > 0 && words[words.length - 1].startsWith("#")) {
      words.pop();
    }
    const newHashtags = [...words, tag].join(" ") + " ";
    setHashtags(newHashtags);
    setSuggestions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dept = getDepartmentDetails(department);
    if (
      !district ||
      !area.trim() ||
      !department ||
      !reason ||
      !agree ||
      images.length === 0 ||
      !descEn.trim() ||
      !descTa.trim()
    ) {
      return setError(t("fillAllFields"));
    }
    if (images.length < dept.minImages) {
      return setError(
        t("minPhotosRequired", {
          minImages: dept.minImages,
          department: dept.name,
        }),
      );
    }

    setVerificationChecks({
      confirmImages: false,
      confirmLocation: false,
      confirmDepartment: false,
      confirmDescription: false,
      acceptTerms: false,
    });
    setShowVerification(true);
  };

  const handleVerificationSubmit = async () => {
    const requiredChecks = ["confirmImages", "confirmLocation", "acceptTerms"];
    const allRequiredChecked = requiredChecks.every(
      (check) => verificationChecks[check],
    );
    if (!allRequiredChecked) {
      return setError(t("confirmAllPoints"));
    }

    setIsSubmittingVerification(true);
    const payload = {
      citizenId,
      district,
      area: area.trim(),
      department,
      reason,
      description_en: descEn.trim(),
      description_ta: descTa.trim(),
      hashtags: hashtags.split(" ").filter((h) => h.startsWith("#")),
      images_data: images.map((i) => i.data),
      device_fingerprint,
      photo_locations: images.map((i) => i.location),
      verification_metadata: {
        verified_by_user: true,
        verification_timestamp: new Date().toISOString(),
        verification_checks: verificationChecks,
      },
    };

    try {
      const res = await fetch(`${APIURL}/post-issue-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        localStorage.setItem("lastCheck", Date.now());
        addNewIssue(result.issue);
        setDistrict("");
        setArea("");
        setDepartment("");
        setReason("");
        setDescEn("");
        setDescTa("");
        setHashtags("#peoplevoice ");
        setImages([]);
        setAgree(false);
        setCameraAllowed(false);
        setShowVerification(false);
        setVerificationChecks({
          confirmImages: false,
          confirmLocation: false,
          confirmDepartment: false,
          confirmDescription: false,
          acceptTerms: false,
        });
        alert(t("complaintRegistered"));
        navigate("/feed");
      } else {
        setError(result.message || "Submission failed");
      }
    } catch {
      setError(t("networkError"));
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ta" : "en");
  };

  const checkVerificationComplete = () => {
    const requiredChecks = ["confirmImages", "confirmLocation", "acceptTerms"];
    return requiredChecks.every((check) => verificationChecks[check]);
  };

  /* ================= RENDER ================= */
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? `${themeColors.dark.bg} ${themeColors.dark.border}`
          : `${themeColors.light.card} ${themeColors.light.border}`
      }`}
    >
      <div className="w-full max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 sm:pb-32">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1
            className={`text-xl sm:text-2xl md:text-3xl font-bold text-center sm:text-left ${
              isDark ? "text-green-400" : "text-green-700"
            }`}
          >
            {t("title")}
          </h1>
          <button
            type="button"
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition text-sm sm:text-base w-full sm:w-auto justify-center ${
              isDark
                ? "bg-green-900 text-green-300 hover:bg-green-800"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            <Globe size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="font-medium">
              {language === "en" ? "தமிழ்" : "English"}
            </span>
          </button>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
            <AlertCircle
              className="text-red-600 dark:text-red-400 flex-shrink-0"
              size={18}
            />
            <span className="text-red-700 dark:text-red-300 flex-1">
              {error}
            </span>
            <X
              className="cursor-pointer flex-shrink-0 text-red-600 dark:text-red-400"
              onClick={() => setError("")}
              size={18}
            />
          </div>
        )}

        {showVerification && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div
              ref={modalRef}
              className={`rounded-xl sm:rounded-2xl w-full max-w-[95%] sm:max-w-lg md:max-w-xl mx-auto shadow-2xl border max-h-[90vh] overflow-y-auto ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-4 sm:p-6 rounded-t-xl sm:rounded-t-2xl">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-bold">
                      {t("finalConfirmation")}
                    </h2>
                    <p className="text-xs sm:text-sm mt-1 opacity-90">
                      {t("falseComplaints")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={toggleLanguage}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 rounded-lg text-xs sm:text-sm hover:bg-white/30 whitespace-nowrap"
                    >
                      {language === "en" ? "தமிழ்" : "English"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVerification(false)}
                      className="p-1"
                    >
                      <X size={20} className="sm:w-7 sm:h-7" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <div className="flex gap-2 sm:gap-3">
                    <AlertTriangle
                      className="text-red-600 dark:text-red-400 mt-1 flex-shrink-0"
                      size={16}
                    />
                    <div
                      className={`text-xs sm:text-sm ${
                        isDark ? "text-red-300" : "text-red-800"
                      }`}
                    >
                      <strong>{t("importantLegalNotice")}</strong>
                      <br />
                      {t("legalText")}
                    </div>
                  </div>
                </div>

                <div
                  className={`border rounded-lg sm:rounded-xl p-3 sm:p-4 text-xs sm:text-sm ${
                    isDark
                      ? "bg-gray-700 border-gray-600"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <h3
                    className={`font-semibold mb-2 sm:mb-3 ${
                      isDark ? "text-gray-200" : "text-gray-800"
                    }`}
                  >
                    {t("complaintSummary")}
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                        {t("departmentLabel")}
                      </span>
                      <span className={`font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                        {getDepartmentName(department)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                        {t("locationLabel")}
                      </span>
                      <span className={`font-medium break-words ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                        {area}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                        {t("photosLabel")}
                      </span>
                      <span className={`font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                        {images.length} {t("attached")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className={`font-semibold text-sm sm:text-base ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                    {t("iHerebyDeclare")}
                  </h3>

                  <label className="flex items-start gap-2 sm:gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={verificationChecks.confirmImages}
                      onChange={(e) =>
                        setVerificationChecks((p) => ({
                          ...p,
                          confirmImages: e.target.checked,
                        }))
                      }
                      className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-red-600 rounded border-gray-300 focus:ring-red-500 flex-shrink-0"
                    />
                    <span className={`text-xs sm:text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      <strong>{t("confirmImages")}</strong>
                      <br />
                      <span className={`${isDark ? "text-gray-400" : "text-gray-600"} text-[10px] sm:text-xs`}>
                        {t("confirmImagesDesc")}
                      </span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2 sm:gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={verificationChecks.confirmLocation}
                      onChange={(e) =>
                        setVerificationChecks((p) => ({
                          ...p,
                          confirmLocation: e.target.checked,
                        }))
                      }
                      className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-red-600 rounded border-gray-300 focus:ring-red-500 flex-shrink-0"
                    />
                    <span className={`text-xs sm:text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      <strong>{t("confirmLocation")}</strong>
                      <br />
                      <span className={`${isDark ? "text-gray-400" : "text-gray-600"} text-[10px] sm:text-xs break-words`}>
                        {t("confirmLocationDesc")} <strong>{area}</strong>
                      </span>
                    </span>
                  </label>

                  <label
                    className={`flex items-start gap-2 sm:gap-3 cursor-pointer select-none border-t pt-3 sm:pt-4
                      ${isDark ? "border-gray-700" : "border-gray-200"}`}
                  >
                    <input
                      type="checkbox"
                      checked={verificationChecks.acceptTerms}
                      onChange={(e) =>
                        setVerificationChecks((p) => ({
                          ...p,
                          acceptTerms: e.target.checked,
                        }))
                      }
                      className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-red-600 rounded border-gray-300 focus:ring-red-500 flex-shrink-0"
                    />
                    <span className={`text-xs sm:text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      <strong className={`block text-sm sm:text-base ${isDark ? "text-red-400" : "text-red-700"}`}>
                        {t("acceptTerms")}
                      </strong>
                      <span className={`mt-1 block text-[10px] sm:text-xs ${isDark ? "text-red-400/80" : "text-red-700"}`}>
                        {t("acceptTermsDesc")}
                      </span>
                    </span>
                  </label>
                </div>

                <div className={`flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                  <button
                    type="button"
                    onClick={() => setShowVerification(false)}
                    className={`w-full sm:flex-1 py-3 sm:py-3.5 font-medium rounded-lg sm:rounded-xl transition text-sm sm:text-base ${
                      isDark
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    {t("goBackEdit")}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerificationSubmit}
                    disabled={isSubmittingVerification || !checkVerificationComplete()}
                    className={`w-full sm:flex-1 py-3 sm:py-3.5 rounded-lg sm:rounded-xl font-bold text-white transition text-sm sm:text-base ${
                      checkVerificationComplete()
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isSubmittingVerification ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={16} />
                        {t("submitting")}
                      </span>
                    ) : (
                      t("iConfirmSubmit")
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isCameraOpen && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="flex-1 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              {isValidatingImage && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="text-white text-center px-4">
                    <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 animate-spin mx-auto mb-2 sm:mb-4" />
                    <p className="text-sm sm:text-lg font-medium">
                      {t("capturingLocation")}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-gradient-to-t from-black/90 to-transparent p-4 sm:p-6 pb-[env(safe-area-inset-bottom)]">
              <div className="flex flex-col items-center gap-4 sm:gap-6">
                <button
                  type="button"
                  onClick={takePhoto}
                  className="bg-white p-6 sm:p-8 rounded-full border-4 border-gray-200 shadow-2xl active:scale-95"
                >
                  <Circle size={60} className="sm:w-20 sm:h-20 text-black fill-white" />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="bg-red-600 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full font-medium shadow-lg active:scale-95 text-sm sm:text-base"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6 border ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <div>
            <label className={`block text-xs sm:text-sm font-bold uppercase tracking-wide mb-1 sm:mb-1.5 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}>
              {t("department")} <span className="text-red-600">*</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={`w-full border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 focus:ring-2 focus:ring-green-500 text-sm sm:text-base ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-200"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="">{t("selectDepartment")}</option>
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} – {d.description}
                </option>
              ))}
            </select>

            {department && !cameraAllowed && (
              <div className={`mt-3 sm:mt-4 p-3 sm:p-4 border rounded-lg sm:rounded-xl ${
                isDark
                  ? "bg-blue-900/20 border-blue-800"
                  : "bg-blue-50 border-blue-200"
              }`}>
                <p className={`font-medium text-sm sm:text-base ${isDark ? "text-blue-300" : "text-blue-800"}`}>
                  {getDepartmentName(department)} {t("department")}{" "}
                  {language === "en" ? "selected" : "தேர்ந்தெடுக்கப்பட்டது"}
                </p>
                <button
                  type="button"
                  onClick={confirmDepartmentSelection}
                  className="mt-2 sm:mt-3 px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto"
                >
                  {t("yesThisIsIssue", { department: getDepartmentName(department) })}
                </button>
              </div>
            )}

            {validationMessage && (
              <p className={`mt-1.5 sm:mt-2 text-xs sm:text-sm ${
                cameraAllowed
                  ? isDark ? "text-green-400" : "text-green-600"
                  : isDark ? "text-amber-400" : "text-amber-600"
              }`}>
                {validationMessage}
              </p>
            )}
          </div>

          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
              <label className={`text-xs sm:text-sm font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {t("photos")} <span className="text-red-600">*</span>
              </label>
              <span className={`text-[10px] sm:text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {images.length} / {getDepartmentDetails(department)?.maxImages || 4}
              </span>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={startCamera}
                disabled={!cameraAllowed || images.length >= (getDepartmentDetails(department)?.maxImages || 4)}
                className={`aspect-square border-2 border-dashed rounded-lg sm:rounded-xl flex flex-col items-center justify-center p-2
                  ${
                    cameraAllowed
                      ? isDark ? "border-green-700 hover:bg-green-900/20" : "border-green-400 hover:bg-green-50"
                      : isDark ? "border-gray-700 bg-gray-800 opacity-60" : "border-gray-300 bg-gray-50 opacity-60"
                  }`}
              >
                <Camera className={cameraAllowed ? (isDark ? "text-green-400" : "text-green-600") : (isDark ? "text-gray-500" : "text-gray-400")} size={24} />
                <span className={`text-[10px] sm:text-xs mt-1 font-medium text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  {cameraAllowed ? t("takePhoto") : t("selectDeptFirst")}
                </span>
              </button>

              {images.map((img, idx) => (
                <div key={idx} className={`relative aspect-square rounded-lg sm:rounded-xl overflow-hidden border ${isDark ? "border-gray-700" : "border-gray-200"}`}>
                  <img src={img.data} alt="Complaint" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-600 text-white rounded-full p-1 shadow"
                  >
                    <X size={12} className="sm:w-4 sm:h-4" />
                  </button>
                  {img.location?.address && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[8px] sm:text-xs p-1 truncate">
                      <MapPin size={10} className="inline mr-0.5" />
                      {img.location.address.split(",").slice(0, 2).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-bold mb-1 sm:mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {t("location")} <span className="text-red-600">*</span>
            </label>
            {isEditingLocation ? (
              <div className="space-y-2 sm:space-y-3">
                <textarea
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  placeholder={t("describeIssue")}
                  rows={3}
                  className={`w-full border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={saveManualLocation}
                    className="w-full sm:flex-1 bg-green-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base"
                  >
                    {t("save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingLocation(false)}
                    className={`w-full sm:flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base ${
                      isDark
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    }`}
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingLocation(true)}
                className={`border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer flex items-center gap-2 sm:gap-3 ${
                  isDark
                    ? "border-gray-600 bg-gray-700 hover:bg-gray-600"
                    : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <MapPin className={`flex-shrink-0 ${isDark ? "text-green-400" : "text-green-600"}`} size={16} />
                <span className={`text-sm sm:text-base truncate ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  {area || t("clickToEnterLocation")}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-bold mb-1 sm:mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {t("district")} <span className="text-red-600">*</span>
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={`w-full border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-200"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="">{t("selectDistrict")}</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-bold mb-1 sm:mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {t("reason")} <span className="text-red-600">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-200"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="">{t("selectReason")}</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
              <label className={`block text-xs sm:text-sm font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {t("description")} <span className="text-red-600">*</span>
              </label>
              <div className={`flex rounded-lg p-1 text-xs sm:text-sm w-full sm:w-auto ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                <button
                  type="button"
                  onClick={() => setDescView("english")}
                  className={`flex-1 sm:flex-none px-2 sm:px-4 py-1.5 rounded-md transition ${
                    descView === "english"
                      ? isDark ? "bg-gray-600 text-white shadow" : "bg-white shadow font-medium"
                      : isDark ? "text-gray-400 hover:bg-gray-600" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t("english")}
                </button>
                <button
                  type="button"
                  onClick={() => setDescView("tamil")}
                  className={`flex-1 sm:flex-none px-2 sm:px-4 py-1.5 rounded-md transition ${
                    descView === "tamil"
                      ? isDark ? "bg-gray-600 text-white shadow" : "bg-white shadow font-medium"
                      : isDark ? "text-gray-400 hover:bg-gray-600" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t("tamil")}
                </button>
                <button
                  type="button"
                  onClick={() => setDescView("both")}
                  className={`flex-1 sm:flex-none px-2 sm:px-4 py-1.5 rounded-md transition ${
                    descView === "both"
                      ? isDark ? "bg-gray-600 text-white shadow" : "bg-white shadow font-medium"
                      : isDark ? "text-gray-400 hover:bg-gray-600" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t("both")}
                </button>
              </div>
            </div>

            <div className={`grid gap-4 sm:gap-6 ${descView === "both" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
              {(descView === "english" || descView === "both") && (
                <div>
                  <label className={`block text-[10px] sm:text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {t("description")} ({t("english")})
                  </label>
                  <textarea
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    placeholder={t("describeIssue")}
                    rows={descView === "both" ? 4 : 5}
                    className={`w-full border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base resize-y focus:ring-2 focus:ring-green-500 ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-gray-200"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>
              )}

              {(descView === "tamil" || descView === "both") && (
                <div>
                  <label className={`block text-[10px] sm:text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {t("descriptionTamil")}
                  </label>
                  <textarea
                    value={descTa}
                    onChange={(e) => setDescTa(e.target.value)}
                    placeholder={t("describeIssue")}
                    rows={descView === "both" ? 4 : 5}
                    className={`w-full border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base resize-y focus:ring-2 focus:ring-green-500 ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-gray-200"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <Hash className={`absolute left-3 top-3 ${isDark ? "text-gray-500" : "text-gray-400"}`} size={16} />
            <input
              type="text"
              value={hashtags}
              onChange={handleHashtagChange}
              placeholder={t("addHashtags")}
              className={`w-full border rounded-lg sm:rounded-xl pl-8 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-200"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
            {suggestions.length > 0 && (
              <div className={`absolute z-10 w-full border rounded-lg sm:rounded-xl shadow-lg p-2 sm:p-3 flex flex-wrap gap-1 sm:gap-2 mt-1 max-h-40 overflow-y-auto ${
                isDark
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}>
                {suggestions.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => applySuggestion(tag)}
                    className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-sm hover:bg-green-100 dark:hover:bg-green-900 transition ${
                      isDark
                        ? "bg-green-900/50 text-green-300 hover:bg-green-800/70"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-start gap-2 sm:gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 w-4 h-4 sm:w-5 sm:h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 flex-shrink-0"
            />
            <span className={`text-xs sm:text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {t("agreement")}
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !cameraAllowed || images.length < (getDepartmentDetails(department)?.minImages || 1)}
            className="w-full bg-green-600 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {t("proceed")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostIssue;