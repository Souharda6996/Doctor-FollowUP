'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Users, TrendingUp, AlertTriangle, Calendar, ArrowRight,
  Activity, ChevronRight, Plus, Bell, Brain
} from 'lucide-react';
import {
  GUT_TAG_LABELS, type GutTagType
} from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const trendData = [
  { day: 'Mon', improving: 2 }, { day: 'Tue', improving: 3 },
  { day: 'Wed', improving: 2 }, { day: 'Thu', improving: 4 },
  { day: 'Fri', improving: 3 }, { day: 'Sat', improving: 5 },
  { day: 'Sun', improving: 4 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function SilenceBadge({ days }: { days: number }) {
  if (days < 3) return null;
  const level = days >= 9 ? 'PRIORITY' : days >= 7 ? 'CAREGIVER ALERTED' : days >= 5 ? 'WHATSAPP SENT' : 'NUDGED';
  const color  = days >= 9 ? 'bg-[#FF4757] text-white' : days >= 5 ? 'bg-amber-500 text-white' : 'bg-yellow-400 text-yellow-900';
  return (
    <motion.span
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${color}`}
    >
      Silent {days}d · {level}
    </motion.span>
  );
}

export default function DoctorDashboard() {
  const { user, token } = useAuth();
  const [alertsExpanded, setAlertsExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'silent'>('all');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const load = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/doctor/dashboard', {
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
  };

  useEffect(() => {
    load();

    const channel = supabase.channel('dashboard-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quick_asks' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token]);

  if (loading) return <div className="p-5 space-y-4"><SkeletonCard lines={2} /><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>;
  if (error) return <div className="p-5"><ErrorState message={error} /></div>;
  if (!data) return null;

  const { stats, patients, alerts, followUps, fingerprintAlerts } = data;
  const unreadAlerts = alerts;

  const sortedPatients = [...patients].sort((a: any, b: any) => {
    const aScore = (a.silence_days ?? 0) * 2 + (a.status === 'critical' ? 5 : 0);
    const bScore = (b.silence_days ?? 0) * 2 + (b.status === 'critical' ? 5 : 0);
    return bScore - aScore;
  });

  const filteredPatients = activeFilter === 'critical'
    ? sortedPatients.filter((p) => p.status === 'critical')
    : activeFilter === 'silent'
    ? sortedPatients.filter((p) => (p.silence_days ?? 0) >= 5)
    : sortedPatients;

  const statCards = [
    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'text-[#1A6BFF]', bg: 'bg-blue-50', change: 'Current active' },
    { label: 'Improving', value: stats.improvingPatients, icon: TrendingUp, color: 'text-[#00C48C]', bg: 'bg-emerald-50', change: 'On track' },
    { label: 'Critical', value: stats.criticalPatients, icon: AlertTriangle, color: 'text-[#FF4757]', bg: 'bg-red-50', change: 'Needs attention' },
    { label: 'Today Follow-ups', value: stats.todayFollowUps, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50', change: 'Scheduled today' },
  ];

  const statusColor = (s: string) => ({
    improving: 'badge-improving', stable: 'badge-stable',
    moderate: 'badge-moderate',   critical: 'badge-critical',
  }[s] ?? 'badge-stable');

  const statusDot = (s: string) => ({
    improving: 'bg-[#1A6BFF]', stable: 'bg-[#00C48C]',
    moderate: 'bg-[#FFB800]',  critical: 'bg-[#FF4757]',
  }[s] ?? 'bg-slate-400');

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, Dr. {user?.display_name?.split(' ')[0] ?? user?.name?.split(' ')[0] ?? 'Doctor'} 👋
          </h2>
          <p className="text-xs text-slate-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <Link href="/doctor/alerts" className="relative">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Bell className="w-5 h-5 text-slate-600" />
          </div>
          {unreadAlerts.length > 0 && (
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF4757] text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unreadAlerts.length}
            </motion.span>
          )}
        </Link>
      </header>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-5 space-y-5">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat) => (
            <motion.div key={stat.label} variants={itemVariants}>
              <motion.div whileHover={{ y: -2 }} className="card p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.bg}`}>
                  <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs font-medium text-slate-600 mt-0.5">{stat.label}</p>
                <p className="text-[11px] text-slate-400 mt-1">{stat.change}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Fingerprint Alert Banner */}
        {fingerprintAlerts.length > 0 && fingerprintAlerts[0].matchFound && (
          <motion.div variants={itemVariants} className="card border-purple-300 bg-purple-50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-purple-900 text-sm flex items-center gap-2">
                  🧬 Symptom Fingerprint Match
                  <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                    {Math.round(fingerprintAlerts[0].confidence * 100)}% confidence
                  </span>
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  <strong>Rajesh Kumar</strong> shows pre-flare pattern. Last time this pattern occurred: {fingerprintAlerts[0].previousEventDescription}
                </p>
                <p className="text-xs text-purple-600 mt-1 font-medium">{fingerprintAlerts[0].recommendedAction}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Trend Chart */}
        <motion.div variants={itemVariants} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-heading">Patient Recovery Trend</h3>
              <p className="text-xs text-slate-500">This week</p>
            </div>
            <div className="bg-emerald-50 text-[#00C48C] text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
              +33% improving
            </div>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Line type="monotone" dataKey="improving" stroke="#1A6BFF" strokeWidth={2.5}
                  dot={{ fill: '#1A6BFF', r: 3 }} activeDot={{ r: 5, fill: '#1255CC' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Critical Alerts */}
        {unreadAlerts.length > 0 && (
          <motion.div variants={itemVariants} className="card border-[#FF4757]/30 overflow-hidden">
            <button
              className="p-4 flex items-center justify-between w-full"
              onClick={() => setAlertsExpanded(!alertsExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-[#FF4757]" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Alerts Requiring Attention</p>
                  <p className="text-xs text-[#FF4757]">{unreadAlerts.length} unread alerts</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${alertsExpanded ? 'rotate-90' : ''}`} />
            </button>
            <AnimatePresence>
              {alertsExpanded && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden border-t border-red-100"
                >
                  <div className="px-4 pb-4 space-y-2 pt-2">
                    {unreadAlerts.map((alert) => (
                      <div key={alert.id}
                        className={`rounded-xl p-3 border text-sm ${
                          alert.severity === 'high' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                        }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-semibold text-sm ${alert.severity === 'high' ? 'text-red-700' : 'text-yellow-700'}`}>
                            {alert.patient?.users?.display_name || 'Patient'}
                          </span>
                          <span className="badge-red text-[9px]">{alert.severity?.toUpperCase() || 'HIGH'}</span>
                        </div>
                        <p className="text-xs text-slate-600">{alert.message}</p>
                      </div>
                    ))}
                    <Link href="/doctor/alerts" className="block text-center text-[#1A6BFF] text-sm font-semibold pt-1">
                      View all alerts →
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Patient Priority Queue */}
        <motion.div variants={itemVariants} className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base font-heading flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1A6BFF]" /> Patient Priority Queue
              </h3>
              <Link href="/doctor/patients" className="text-[#1A6BFF] text-xs font-semibold flex items-center gap-1">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {/* Filter chips */}
            <div className="flex gap-2 mt-3">
              {(['all', 'critical', 'silent'] as const).map((f) => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold capitalize transition-all border ${
                    activeFilter === f ? 'bg-[#1A6BFF] text-white border-[#1A6BFF]' : 'bg-white text-slate-600 border-slate-200'
                  }`}>{f}</button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {filteredPatients.slice(0, 6).map((patient: any) => {
              const name = patient.users?.display_name || 'Patient';
              const silence = patient.silence_days;
              const isFP = fingerprintAlerts.some((f: any) => f.patient_id === patient.user_id);

              return (
                <Link key={patient.user_id} href={`/doctor/patients/${patient.user_id}`}>
                  <motion.div whileHover={{ backgroundColor: '#F8FAFC' }} className="p-4 flex items-start gap-3 transition-colors">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1A6BFF] to-[#1255CC] flex items-center justify-center text-white font-bold text-sm">
                        {name.charAt(0)}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${statusDot(patient.status)}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{name}</span>
                        <span className={`badge ${statusColor(patient.status)}`}>{patient.status}</span>
                        {isFP && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                            🧬 Fingerprint
                          </span>
                        )}
                        {(silence ?? 0) >= 3 && (
                          <SilenceBadge days={silence} />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{patient.chief_complaint || 'No complaint'}</p>

                      {/* Metrics row */}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {patient.adherence && (
                          <span className={`text-[10px] font-semibold ${patient.adherence.weekPercent >= 80 ? 'text-[#00C48C]' : 'text-[#FFB800]'}`}>
                            💊 {patient.adherence.weekPercent}% adherence
                          </span>
                        )}
                        {patient.last_checkin && (
                          <span className="text-[10px] text-slate-400">
                            📅 Check-in: {new Date(patient.last_checkin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>

                      {/* Gut tags */}
                      {patient.gutTags?.tags?.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1.5">
                          {patient.gutTags.tags.slice(0, 3).map((tag: any) => {
                            const info = GUT_TAG_LABELS[tag as GutTagType];
                            return (
                              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {info?.icon} {info?.label || tag}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Today's Follow-ups */}
        <motion.div variants={itemVariants} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-base font-heading flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1A6BFF]" /> Upcoming Follow-ups
            </h3>
            <Link href="/doctor/followups" className="text-[#1A6BFF] text-xs font-semibold flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {followUps.slice(0, 3).map((fu: any) => {
              const patientName = fu.patient?.users?.display_name || 'Patient';
              return (
                <Link key={fu.id} href={`/doctor/patients/${fu.patient_id}`}>
                  <motion.div whileHover={{ x: 3 }} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1A6BFF] text-white flex items-center justify-center text-sm font-bold">
                        {patientName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{patientName}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(fu.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge text-[9px] ${fu.type === 'urgent' ? 'badge-red' : 'badge-blue'}`}>{fu.status}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 pb-2">
          <Link href="/doctor/patients/new">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              className="card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all border-blue-100">
              <div className="w-10 h-10 rounded-xl bg-[#1A6BFF] flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div><p className="text-sm font-bold text-slate-900">New Patient</p><p className="text-xs text-slate-500">Add case</p></div>
            </motion.div>
          </Link>
          <Link href="/doctor/quick-ask">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              className="card p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all border-purple-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💬</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Quick Ask Queue</p>
                <p className="text-xs text-[#FF4757] font-semibold">2 pending</p>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
