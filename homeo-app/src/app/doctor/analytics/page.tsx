'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { TrendingUp, Users, Calendar, Activity, Pill, CheckCircle, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const mockWeeklyData = [
  { day: 'Mon', adherence: 85, asks: 12 },
  { day: 'Tue', adherence: 88, asks: 8 },
  { day: 'Wed', adherence: 92, asks: 15 },
  { day: 'Thu', adherence: 90, asks: 10 },
  { day: 'Fri', adherence: 85, asks: 5 },
  { day: 'Sat', adherence: 95, asks: 2 },
  { day: 'Sun', adherence: 96, asks: 1 },
];

export default function DoctorAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const res = await fetch('/api/doctor/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) return <div className="p-5 space-y-4"><SkeletonCard lines={2} /><SkeletonCard lines={6} /><SkeletonCard lines={6} /></div>;
  if (error) return <div className="p-5"><ErrorState message={error} /></div>;

  return (
    <div className="p-5 space-y-6 bg-[#F8FAFC] min-h-screen pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" /> Practice Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">High-level overview of patient health & clinic performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Total Patients</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.totalPatients}</p>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Pill className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Avg Adherence</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.adherenceRate}%</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Ask Resolution</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.resolutionRate}%</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase">Upcoming Appts</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.upcomingAppointments}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" /> Weekly Adherence Trends
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockWeeklyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                <Tooltip cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="adherence" stroke="#00C48C" strokeWidth={3} dot={{ r: 4, fill: '#00C48C', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" /> Quick Asks Volume
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockWeeklyData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="asks" fill="#1A6BFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
