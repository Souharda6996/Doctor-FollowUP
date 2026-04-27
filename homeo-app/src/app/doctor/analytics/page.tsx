'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, Activity, Heart, 
  ArrowUpRight, ArrowDownRight, Calendar, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts';

const recoveryData = [
  { month: 'Jan', count: 45 },
  { month: 'Feb', count: 52 },
  { month: 'Mar', count: 48 },
  { month: 'Apr', count: 61 },
  { month: 'May', count: 55 },
  { month: 'Jun', count: 67 },
];

const caseDistribution = [
  { name: 'Chronic', value: 70, color: '#2563EB' },
  { name: 'Acute', value: 30, color: '#22C55E' },
];

const symptomTrends = [
  { day: 'Mon', severity: 7 },
  { day: 'Tue', severity: 6 },
  { day: 'Wed', severity: 4 },
  { day: 'Thu', severity: 5 },
  { day: 'Fri', severity: 3 },
  { day: 'Sat', severity: 2 },
  { day: 'Sun', severity: 2 },
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Practice Analytics
            </h1>
            <p className="text-xs text-slate-500">Insights into your clinical practice</p>
          </div>
          <button className="p-2 bg-slate-100 rounded-xl">
            <Filter className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </header>

      <div className="p-5 space-y-5">
        {/* Key Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <StatMiniCard 
            label="Recovery Rate" 
            value="84%" 
            trend="+5.2%" 
            positive={true}
            icon={Heart}
            iconColor="text-red-500"
            bgColor="bg-red-50"
          />
          <StatMiniCard 
            label="Avg. Duration" 
            value="3.2m" 
            trend="-0.4m" 
            positive={true}
            icon={Activity}
            iconColor="text-blue-500"
            bgColor="bg-blue-50"
          />
        </div>

        {/* Recovery Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5"
        >
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Patient Recovery Growth</h3>
            <p className="text-xs text-slate-500">Total recovered cases monthly</p>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recoveryData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#2563EB" 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Case Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5"
          >
            <h3 className="font-bold text-slate-900 text-sm mb-4">Case Distribution</h3>
            <div className="h-48 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={caseDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {caseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 ml-4">
                {caseDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-semibold text-slate-700">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-5"
          >
            <h3 className="font-bold text-slate-900 text-sm mb-4">Avg. Symptom Severity</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symptomTrends}>
                  <Bar dataKey="severity" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatMiniCard({ label, value, trend, positive, icon: Icon, iconColor, bgColor }: any) {
  return (
    <div className="card p-4">
      <div className="flex justify-between items-start mb-2">
        <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <div className={`flex items-center text-[10px] font-bold ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
