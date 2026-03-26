import { motion, AnimatePresence } from "framer-motion";
import { 
  Droplets, Construction, Zap, Trash2, 
  ShieldCheck, MoreVertical, ArrowUpRight, AlertCircle 
} from "lucide-react";

const deptData = [
  { id: 1, name: "Water Supply", issues: 45, resolved: 38, head: "Dr. Arun Kumar", icon: <Droplets />, color: "text-blue-600", bg: "bg-blue-50" },
  { id: 2, name: "Public Works", issues: 120, resolved: 65, head: "Eng. Sarah John", icon: <Construction />, color: "text-orange-600", bg: "bg-orange-50" },
  { id: 3, name: "Electricity", issues: 28, resolved: 26, head: "Rajesh V.", icon: <Zap />, color: "text-amber-500", bg: "bg-amber-50" },
  { id: 4, name: "Sanitation", issues: 56, resolved: 50, head: "M. Meena", icon: <Trash2 />, color: "text-emerald-600", bg: "bg-emerald-50" },
];

const Departments = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Administrative Departments</h2>
          <p className="text-slate-500 font-medium">Monitoring resolution efficiency and department heads</p>
        </div>
        <button className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2">
          + Add Department
        </button>
      </div>

      {/* Department Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
      >
        <AnimatePresence>
          {deptData.map((dept, index) => (
            <DepartmentCard key={dept.id} dept={dept} index={index} />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const DepartmentCard = ({ dept, index }) => {
  const percentage = Math.round((dept.resolved / dept.issues) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl ${dept.bg} ${dept.color} transition-transform group-hover:scale-110 duration-300`}>
          {dept.icon}
        </div>
        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="space-y-1 mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          {dept.name}
          <ArrowUpRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>
        <p className="text-sm text-slate-500 font-medium italic">Head: {dept.head}</p>
      </div>

      {/* Efficiency Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Efficiency</span>
          <span className={`text-sm font-bold ${percentage > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {percentage}%
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`h-full rounded-full ${percentage > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
          />
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-8 pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
            <AlertCircle size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Active Issues</p>
            <p className="text-sm font-bold text-slate-700">{dept.issues}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Resolved</p>
            <p className="text-sm font-bold text-slate-700">{dept.resolved}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Departments;