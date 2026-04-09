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
  Globe,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../Context/ThemeContext";

const Settings = () => {
  const navigate = useNavigate();
  const { isDark, toggleDarkMode } = useTheme();

  return (
    <div
      className={`min-h-screen py-6 px-3 transition-colors duration-300 ${
        isDark ? "bg-black/95" : "bg-gray-50"
      }`}
    >
      <div className="max-w-2xl mx-auto">
        <div
          className={`rounded-2xl shadow-xl p-5 sm:p-6 transition-all ${
            isDark
              ? "bg-gray-900/90 border border-gray-800 text-gray-100"
              : "bg-white border border-gray-200 text-gray-900"
          }`}
        >
          {/* Back Button + Header */}
          <div className="flex items-center gap-3 mb-6 relative">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-full transition-all duration-200 ${
                isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
              }`}
              aria-label="Go back"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>

          {/* Appearance Section */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-3 opacity-70 tracking-wide">
              APPEARANCE
            </h2>
            <div
              className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                isDark ? "bg-gray-800/50" : "bg-gray-50"
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
                className={`w-12 h-7 flex items-center rounded-full p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDark ? "bg-emerald-500" : "bg-gray-300"
                }`}
                aria-label="Toggle dark mode"
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-all duration-300 ${
                    isDark ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Help & Support Section */}
          <div>
            <h2 className="text-sm font-semibold mb-3 opacity-70 tracking-wide">
              HELP & SUPPORT
            </h2>
            <div className="space-y-2">
              <SettingItem
                icon={<HelpCircle size={20} />}
                label="Help Center"
                desc="FAQs and guides"
                onClick={() => navigate("/peopleVoice/help")}
                isDark={isDark}
              />
              <SettingItem
                icon={<Info size={20} />}
                label="About PeopleVoice"
                desc="Our mission & team"
                onClick={() => navigate("/peopleVoice/about")}
                isDark={isDark}
              />
              <SettingItem
                icon={<Mail size={20} />}
                label="Contact Us"
                desc="Send feedback or report issues"
                onClick={() => (window.location.href = "mailto:support@peoplevoice.in")}
                isDark={isDark}
              />
              <SettingItem
                icon={<Shield size={20} />}
                label="Privacy Policy"
                desc="How we protect your data"
                onClick={() => navigate("/peopleVoice/privacy")}
                isDark={isDark}
              />
              <SettingItem
                icon={<Globe size={20} />}
                label="Community Guidelines"
                desc="Rules for respectful interaction"
                onClick={() => navigate("/peopleVoice/guidelines")}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs opacity-50 pt-6 mt-4 border-t border-gray-200 dark:border-gray-800">
            PeopleVoice © {new Date().getFullYear()} — Empowering better communities
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Setting Item Component with hover effects
const SettingItem = ({ icon, label, desc, onClick, isDark }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
        isDark ? "hover:bg-gray-800/70" : "hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="text-emerald-500 shrink-0">{icon}</div>
        <div className="text-left">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs opacity-60 mt-0.5">{desc}</p>
        </div>
      </div>
      <ChevronRight size={18} className="opacity-40 transition-transform group-hover:translate-x-1" />
    </button>
  );
};

export default Settings;