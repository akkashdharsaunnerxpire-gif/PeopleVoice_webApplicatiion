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

const Settings = () => {
  const navigate = useNavigate();
  const { isDark, toggleDarkMode } = useTheme();

  return (
    <div className={`min-h-screen pb-20 pt-6 px-4 transition-colors duration-300 
      ${isDark ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      
      <div className="max-w-md mx-auto">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full transition ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>

        {/* MAIN CARD */}
        <div
          className={`rounded-3xl border shadow-sm overflow-hidden ${
            isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
          }`}
        >
          {/* APPEARANCE SECTION */}
          <div className="p-5 border-b border-gray-800/50">
            <p className="text-sm font-semibold mb-4 opacity-70">Appearance</p>

            <div
              className={`flex items-center justify-between p-4 rounded-2xl transition ${
                isDark ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {isDark ? (
                  <Moon size={22} className="text-indigo-400" />
                ) : (
                  <Sun size={22} className="text-yellow-500" />
                )}
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-xs opacity-60">Eye-friendly theme</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={toggleDarkMode}
                className={`w-12 h-7 flex items-center rounded-full p-1 transition-all duration-300 ${
                  isDark ? "bg-emerald-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300 ${
                    isDark ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* HELP & SUPPORT */}
          <div className="p-5">
            <p className="text-sm font-semibold mb-4 opacity-70">Help & Support</p>

            <div className="space-y-1">
              <SettingItem
                icon={<HelpCircle size={20} />}
                label="Help Center"
                desc="FAQs and guides"
                onClick={() => alert("Help Center - Coming soon")}
              />

              <SettingItem
                icon={<Info size={20} />}
                label="About PeopleVoice"
                desc="Our mission"
                onClick={() => navigate("/peopleVoice/about")}
              />

              <SettingItem
                icon={<Mail size={20} />}
                label="Contact Us"
                desc="Send feedback"
                onClick={() => (window.location.href = "mailto:support@peoplevoice.in")}
              />

              <SettingItem
                icon={<Shield size={20} />}
                label="Privacy Policy"
                desc="Your data safety"
                onClick={() => navigate("/peopleVoice/privacy")}
              />
            </div>
          </div>
        </div>

        <p className="text-center text-xs opacity-60 mt-8">
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
      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all
        ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}
    >
      <div className="flex items-center gap-4">
        <div className="text-emerald-500">{icon}</div>
        <div className="text-left">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs opacity-60">{desc}</p>
        </div>
      </div>
      <ChevronRight size={18} className="opacity-40" />
    </button>
  );
};

export default Settings;