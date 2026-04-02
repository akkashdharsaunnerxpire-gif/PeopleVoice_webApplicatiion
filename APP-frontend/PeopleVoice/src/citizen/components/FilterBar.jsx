import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  MapPin,
  FolderTree,
  User,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { DISTRICTS, DEPARTMENTS, STATUSES, SORT_OPTIONS } from "./constants";
import { useTheme } from "../../Context/ThemeContext";

const FilterBar = ({
  district,
  setDistrict,
  department,
  setDepartment,
  status,
  setStatus,
  sortBy,
  setSortBy,
  onlyWithImages,
  setOnlyWithImages,
  onlyMyIssues,
  setOnlyMyIssues,
  clearFilters,
}) => {
  const isFilterActive =
    district !== DISTRICTS[0] ||
    department !== DEPARTMENTS[0] ||
    status !== STATUSES[0] ||
    sortBy !== SORT_OPTIONS[0] ||
    onlyWithImages ||
    onlyMyIssues;

  const { isDark, toggleDarkMode } = useTheme();

  // Debug: log when onlyMyIssues changes – helps confirm parent isn't hiding things
  React.useEffect(() => {
    console.log("onlyMyIssues changed to:", onlyMyIssues);
  }, [onlyMyIssues]);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`relative overflow-hidden w-full p-5 rounded-2xl shadow-xl flex flex-col gap-6 transition-all duration-300 ${
        isDark
          ? "bg-gray-900 border border-gray-700"
          : "bg-white border border-gray-100 shadow-2xl"
      }`}
    >
      {/* Header Section */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${
              isDark
                ? "bg-emerald-500/20 border border-emerald-500/30"
                : "bg-emerald-100 border border-emerald-200"
            }`}
          >
            <Filter
              size={16}
              className={isDark ? "text-emerald-300" : "text-emerald-600"}
            />
          </div>
          <div className="flex flex-col">
            <h3
              className={`font-black text-sm uppercase tracking-widest ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              Filters
            </h3>
            <span
              className={`text-[10px] font-bold uppercase tracking-[0.3em] ${
                isDark ? "text-emerald-300/70" : "text-emerald-600"
              }`}
            >
              refine your view
            </span>
          </div>
        </div>

        <AnimatePresence>
          {isFilterActive && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={clearFilters}
              className={`p-2 rounded-xl transition-colors ${
                isDark
                  ? "text-emerald-300 bg-gray-800 hover:bg-gray-700 border border-gray-700"
                  : "text-emerald-600 bg-gray-50 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <RotateCcw size={14} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Selectors Grid – always visible, never hidden */}
      <div className="relative z-10 flex flex-col gap-5">
        <FilterSelect
          label="District"
          icon={MapPin}
          value={district}
          options={DISTRICTS}
          onChange={setDistrict}
          isDark={isDark}
        />
        <FilterSelect
          label="Department"
          icon={FolderTree}
          value={department}
          options={DEPARTMENTS}
          onChange={setDepartment}
          isDark={isDark}
        />

        <div className="grid grid-cols-2 gap-4">
          <FilterSelect
            label="Status"
            value={status}
            options={STATUSES}
            onChange={setStatus}
            isDark={isDark}
          />
          <FilterSelect
            label="Sort By"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={setSortBy}
            isDark={isDark}
          />
        </div>
      </div>

      {/* Toggles Section – Dark mode toggle + My Issues */}
      <div
        className={`relative z-10 p-4 rounded-2xl flex flex-col gap-4 ${
          isDark ? "bg-gray-800/50 border border-gray-700" : "bg-gray-50 border border-gray-100"
        }`}
      >
        <div className="flex justify-between items-center">
          <span className={isDark ? "text-white font-medium" : "text-gray-800 font-medium"}>
            Dark Mode
          </span>
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

      {/* My Issues Toggle – remains interactive, does NOT hide any other filter */}
      <FilterToggle
        active={onlyMyIssues}
        onClick={() => setOnlyMyIssues(!onlyMyIssues)}
        icon={User}
        label="My Issues"
        isDark={isDark}
      />

      {/* Live Sync Badge */}
      <div className="relative z-10 flex items-center justify-center gap-2 py-1">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
        <span
          className={`text-[10px] font-black uppercase tracking-[0.2em] ${
            isDark ? "text-emerald-400/80" : "text-emerald-600"
          }`}
        >
          Live Registry Active
        </span>
      </div>
    </motion.div>
  );
};

const FilterSelect = ({ label, value, options, onChange, icon: Icon, isDark }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 px-1">
      {Icon && <Icon size={10} className={isDark ? "text-emerald-400" : "text-emerald-600"} />}
      <span
        className={`text-[9px] font-black uppercase tracking-widest ${
          isDark ? "text-emerald-200" : "text-emerald-700"
        }`}
      >
        {label}
      </span>
    </div>
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl px-4 py-3 text-xs font-bold appearance-none cursor-pointer outline-none transition-all shadow-sm ${
          isDark
            ? "bg-gray-800 border border-gray-700 text-white focus:border-emerald-500"
            : "bg-white border border-gray-200 text-gray-800 focus:border-emerald-400"
        }`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className={isDark ? "bg-gray-800" : "bg-white"}>
            {opt}
          </option>
        ))}
      </select>
      <div
        className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
          isDark ? "text-emerald-400 group-hover:text-emerald-300" : "text-emerald-500 group-hover:text-emerald-600"
        }`}
      >
        <ChevronRight size={12} />
      </div>
    </div>
  </div>
);

const FilterToggle = ({ active, onClick, icon: Icon, label, isDark }) => (
  <button onClick={onClick} className="flex items-center justify-between w-full group outline-none">
    <div className="flex items-center gap-3">
      <div
        className={`p-2 rounded-xl transition-all duration-500 ${
          active
            ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            : isDark
            ? "bg-gray-800 text-gray-400"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        <Icon size={14} />
      </div>
      <span
        className={`text-xs font-bold transition-colors ${
          active
            ? "text-emerald-600 dark:text-emerald-300"
            : isDark
            ? "text-gray-400"
            : "text-gray-600"
        }`}
      >
        {label}
      </span>
    </div>
    <div
      className={`w-10 h-5.5 rounded-full relative p-1 transition-all duration-500 ${
        active ? "bg-emerald-500" : isDark ? "bg-gray-700" : "bg-gray-300"
      }`}
    >
      <motion.div
        animate={{ x: active ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-3.5 h-3.5 bg-white rounded-full shadow-lg"
      />
    </div>
  </button>
);

export default FilterBar;