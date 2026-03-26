import React from "react";
import {
  Moon,
  Sun,
  HelpCircle,
  Info,
  Mail,
  Shield,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../Context/ThemeContext";
import { themeColors } from "../components/constants";

const Settings = () => {
  const navigate = useNavigate();
  const { isDark, toggleDarkMode } = useTheme();
  const theme = isDark ? themeColors.dark : themeColors.light;

  return (
    <div
      className={`min-h-screen pb-20 pt-6 px-4 transition-colors duration-300 ${theme.bg} ${theme.text}`}
    >
      <div className="max-w-md mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full transition ${
              isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>

        {/* CARD */}
        <div
          className={`rounded-2xl border shadow-sm p-4 ${
            isDark
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          {/* APPEARANCE */}
          <p className="text-sm font-semibold mb-3 opacity-70">
            Appearance
          </p>

          <div
            className={`flex items-center justify-between p-3 rounded-xl transition ${
              isDark ? "bg-gray-700/60" : "bg-gray-50"
            }`}
          >
            {/* LEFT */}
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon size={18} className="text-indigo-400" />
              ) : (
                <Sun size={18} className="text-yellow-500" />
              )}
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs opacity-60">
                  Eye-friendly theme
                </p>
              </div>
            </div>

            {/* TOGGLE SWITCH */}
            <button
              onClick={toggleDarkMode}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
                isDark ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${
                  isDark ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* HELP SECTION */}
          <p className="text-sm font-semibold mt-6 mb-3 opacity-70">
            Help & Support
          </p>

          <div className="space-y-1">
            <SettingItem
              icon={<HelpCircle size={18} />}
              label="Help Center"
              desc="FAQs and guides"
              onClick={() => alert("Coming soon")}
            />

            <SettingItem
              icon={<Info size={18} />}
              label="About PeopleVoice"
              desc="Our mission"
              onClick={() => navigate("/peopleVoice/about")}
            />

            <SettingItem
              icon={<Mail size={18} />}
              label="Contact Us"
              desc="Send feedback"
              onClick={() =>
                (window.location.href = "mailto:support@peoplevoice.in")
              }
            />

            <SettingItem
              icon={<Shield size={18} />}
              label="Privacy Policy"
              desc="Your data safety"
              onClick={() => navigate("/peopleVoice/privacy")}
            />
          </div>
        </div>

        {/* FOOTER */}
        <p className="text-center text-xs opacity-60 mt-6">
          PeopleVoice © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

const SettingItem = ({ icon, label, desc, onClick }) => {
  const { isDark } = useTheme();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-lg transition ${
        isDark ? "hover:bg-gray-700/60" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-green-500">{icon}</div>
        <div className="text-left">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs opacity-60">{desc}</p>
        </div>
      </div>
      <ChevronRight size={18} className="opacity-40" />
    </button>
  );
};

export default Settings;