import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter, MapPin, FolderTree, Activity, 
  SortAsc, Image, User, ChevronRight, RotateCcw 
} from "lucide-react";
import { DISTRICTS, DEPARTMENTS, STATUSES, SORT_OPTIONS } from "./constants";

const FilterBar = ({
  district, setDistrict, department, setDepartment,
  status, setStatus, sortBy, setSortBy,
  onlyWithImages, setOnlyWithImages, onlyMyIssues, setOnlyMyIssues,
  clearFilters,
}) => {
  const isFilterActive =
    district !== DISTRICTS[0] || department !== DEPARTMENTS[0] ||
    status !== STATUSES[0] || sortBy !== SORT_OPTIONS[0] ||
    onlyWithImages || onlyMyIssues;

  // Global Shine - Full Box Sweep
  const shineTransition = {
    x: ["-150%", "150%"],
    transition: {
      duration: 2.2,
      repeat: Infinity,
      repeatDelay: 2.8,
      ease: "easeInOut",
    },
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      /* MAIN DARK GLASS CONTAINER */
      className="relative overflow-hidden w-full p-5 bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] flex flex-col gap-6 antialiased"
    >
      {/* 1. Background Shine Effect (The "Jewel" touch) */}
      <motion.div 
        animate={shineTransition}
        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skew-x-[-25deg] pointer-events-none z-0"
      />

      {/* Header Section */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/20 border border-rose-500/30 rounded-xl">
            <Filter size={16} className="text-rose-400" />
          </div>
          <div className="flex flex-col">
            <h3 className="font-black text-sm text-white uppercase tracking-widest">Filters</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Premium Mirror</span>
          </div>
        </div>
        
        <AnimatePresence>
          {isFilterActive && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={clearFilters}
              className="p-2 text-rose-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
            >
              <RotateCcw size={14} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Selectors Grid */}
      <div className="relative z-10 flex flex-col gap-5">
        <FilterSelect label="District" icon={MapPin} value={district} options={DISTRICTS} onChange={setDistrict} />
        <FilterSelect label="Department" icon={FolderTree} value={department} options={DEPARTMENTS} onChange={setDepartment} />
        
        <div className="grid grid-cols-2 gap-4">
          <FilterSelect label="Status" value={status} options={STATUSES} onChange={setStatus} />
          <FilterSelect label="Sort By" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
        </div>
      </div>

      {/* 3. Toggles Section (Glass-in-Glass look) */}
      <div className="relative z-10 p-4 bg-white/[0.03] border border-white/5 rounded-3xl flex flex-col gap-4">
        <FilterToggle active={onlyWithImages} onClick={() => setOnlyWithImages(!onlyWithImages)} icon={Image} label="With Media" />
        <div className="h-[1px] w-full bg-white/5" />
        <FilterToggle active={onlyMyIssues} onClick={() => setOnlyMyIssues(!onlyMyIssues)} icon={User} label="My Issues" />
      </div>

      {/* Live Sync Badge */}
      <div className="relative z-10 flex items-center justify-center gap-2 py-1">
        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_#f43f5e]" />
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Live Registry Active</span>
      </div>
    </motion.div>
  );
};

const FilterSelect = ({ label, value, options, onChange, icon: Icon }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 px-1">
      {Icon && <Icon size={10} className="text-slate-500" />}
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold appearance-none cursor-pointer outline-none text-slate-200 focus:border-rose-500/40 transition-all shadow-inner"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-slate-950 text-white">{opt}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-rose-400 transition-colors">
        <ChevronRight size={12} />
      </div>
    </div>
  </div>
);

const FilterToggle = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className="flex items-center justify-between w-full group outline-none">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl transition-all duration-500 ${active ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-white/5 text-slate-500'}`}>
        <Icon size={14} />
      </div>
      <span className={`text-xs font-bold transition-colors ${active ? 'text-white' : 'text-slate-400'}`}>{label}</span>
    </div>
    <div className={`w-10 h-5.5 rounded-full relative p-1 transition-all duration-500 ${active ? 'bg-rose-500' : 'bg-slate-800'}`}>
      <motion.div 
        animate={{ x: active ? 18 : 0 }} 
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="w-3.5 h-3.5 bg-white rounded-full shadow-lg" 
      />
    </div>
  </button>
);

export default FilterBar;