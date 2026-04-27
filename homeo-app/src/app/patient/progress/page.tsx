'use client';

import React from 'react';

import { motion } from 'framer-motion';
import { TrendingUp, Activity, Calendar, Trophy, Zap, ChevronRight, ArrowLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';

const data = [
  { day: 'M', value: 30 },
  { day: 'T', value: 45 },
  { day: 'W', value: 40 },
  { day: 'T', value: 65 },
  { day: 'F', value: 70 },
  { day: 'S', value: 85 },
  { day: 'S', value: 90 },
];

export default function ProgressPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col bg-white">
      <header className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <button onClick={() => router.back()} className="text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold text-slate-900">Your Recovery Path</h1>
        <div className="w-5" />
      </header>

      <div className="p-6 space-y-8">
        {/* Progress Summary */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold">
            <Trophy className="w-3 h-3" /> 82% Improved
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Looking great!</h2>
          <p className="text-xs text-slate-500">Your adherence to the protocol is excellent</p>
        </div>

        {/* Level Indicator */}
        <div className="card p-6 border-blue-50 bg-gradient-to-br from-white to-blue-50/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-slate-900">Recovery Status</h3>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">PHASE 2</span>
          </div>
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '82%' }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
            You have successfully completed the initial acute management phase. Currently in the stabilization and long-term maintenance phase.
          </p>
        </div>

        {/* Mini Chart */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Health Trend (7 Days)</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={false} axisLine={false} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563EB" 
                  fill="url(#colorValue)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Accomplishments</h3>
          <div className="space-y-3">
            <Milestone 
              title="7 Day Streak" 
              sub="You didn't miss a single prescribed dose."
              completed={true}
              icon={Zap}
            />
            <Milestone 
              title="Improved Sleep" 
              sub="Your morning logs show 2 hours extra deep sleep."
              completed={true}
              icon={TrendingUp}
            />
            <Milestone 
              title="Next Target: Stress Mgmt" 
              sub="Focus on emotional logging this week."
              completed={false}
              icon={Activity}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Milestone({ title, sub, completed, icon: Icon }: {
  title: string; sub: string; completed: boolean; icon: React.ElementType;
}) {
  return (
    <div className={`p-4 rounded-3xl border flex items-center gap-4 ${
      completed ? 'bg-white border-slate-100' : 'bg-slate-50 border-transparent grayscale opacity-60'
    }`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
        completed ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-slate-900">{title}</h4>
        <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
