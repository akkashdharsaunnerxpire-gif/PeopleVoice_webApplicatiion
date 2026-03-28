// src/components/constants.js

export const DISTRICTS = [
  "All-Districts",
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kancheepuram",
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
  "Thiruvallur",
  "Thiruvarur",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvannamalai",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
];

export const DEPARTMENTS = [
  "All-Categories",
  "Road",
  "Garbage",
  "Water",
  "Electricity",
  "Drainage",
  "Other",
];

export const STATUSES = [
  "All-Status",
  "Sent",
  "In Progress",
  "Resolved",
  "Rejected",
];

export const SORT_OPTIONS = [
  "Newest First",
  "Oldest First",
  "Most Liked",
  "Most Commented",
];

// ✅ Improved & Fixed Theme Colors
export const themeColors = {
  dark: {
    bg: "bg-black",
    card: "bg-zinc-950",           // better than bg-black/80
    cardBg: "bg-zinc-900",
    border: "border-zinc-800",
    cardBorder: "border-zinc-800",
    text: "text-zinc-100",
    textMuted: "text-zinc-400",
    hover: "hover:bg-zinc-800",
    accent: "text-emerald-400",    // optional - நீங்க வேணும்னா use பண்ணலாம்
  },
  light: {
    bg: "bg-gray-50",
    card: "bg-white",
    cardBg: "bg-white",
    border: "border-gray-200",
    cardBorder: "border-gray-200",
    text: "text-gray-900",
    textMuted: "text-gray-500",
    hover: "hover:bg-gray-100",
    accent: "text-emerald-600",
  },
};