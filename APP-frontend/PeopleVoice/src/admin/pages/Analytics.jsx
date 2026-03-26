import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from "recharts"; // Install: npm install recharts
import { TrendingUp, Users, CheckCircle2, AlertTriangle } from "lucide-react";

// Mock data - In reality, fetch this from your API
const deptData = [
  { name: "Water", issues: 45, resolved: 32 },
  { name: "Roads", issues: 80, resolved: 40 },
  { name: "Power", issues: 25, resolved: 20 },
  { name: "Health", issues: 60, resolved: 55 },
  { name: "Waste", issues: 35, resolved: 15 },
];

const COLORS = ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"];

const Analytics = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-8 space-y-8 bg-slate-50 min-h-screen"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Analytics Overview</h2>
          <p className="text-slate-500 font-medium">Real-time data across all government departments</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border text-sm font-semibold text-slate-600">
          Last Updated: Just now
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Issues" value="245" icon={<TrendingUp size={20}/>} color="bg-blue-600" trend="+12% this month" />
        <StatCard title="Resolved" value="162" icon={<CheckCircle2 size={20}/>} color="bg-emerald-600" trend="+18% efficiency" />
        <StatCard title="Pending" value="83" icon={<AlertTriangle size={20}/>} color="bg-amber-500" trend="-5% from last week" />
        <StatCard title="Active Users" value="1,204" icon={<Users size={20}/>} color="bg-purple-600" trend="Active citizens" />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Bar Chart: Issues by Department */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-6">Department Performance</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="issues" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                <Bar dataKey="resolved" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution (Mental Model) */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-2">Resolution Mix</h3>
          <p className="text-sm text-slate-400 mb-6">Percentage of issues closed vs open</p>
          <div className="h-64 flex items-center justify-center">
            {/* You can add a PieChart here or a custom visual indicator */}
            <div className="relative h-48 w-48 rounded-full border-[16px] border-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <span className="text-4xl font-black text-emerald-600">66%</span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</p>
                </div>
                {/* SVG Overlay for the ring progress */}
                <svg className="absolute -rotate-90 w-full h-full">
                    <circle cx="50%" cy="50%" r="88" stroke="currentColor" strokeWidth="16" fill="transparent" strokeDasharray="552" strokeDashoffset="180" className="text-emerald-500" />
                </svg>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};

// Sub-component for Stats
const StatCard = ({ title, value, icon, color, trend }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl text-white ${color} shadow-lg shadow-inherit opacity-80`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase">
        {trend}
      </span>
    </div>
    <h4 className="text-slate-500 text-sm font-medium">{title}</h4>
    <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
  </motion.div>
);

export default Analytics;