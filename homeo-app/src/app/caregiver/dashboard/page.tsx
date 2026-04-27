'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Calendar, Pill, Activity, Bell, BellOff, ChevronRight, AlertTriangle, TrendingUp } from 'lucide-react';
import { MOCK_PATIENTS, MOCK_APPOINTMENTS, MOCK_ADHERENCE, MOCK_CHECKINS, MOCK_ALERTS } from '@/lib/mockData';
import Link from 'next/link';

export default function CaregiverDashboard() {
  const { user, logout } = useAuth();
  const linkedPatientId = user?.linkedPatientId ?? 'p001';
  const patient = MOCK_PATIENTS.find((p) => p.id === linkedPatientId);

  const [notifications, setNotifications] = useState({
    missedMed: true,
    appointment: true,
    redReport: true,
  });

  if (!patient) return null;

  const nextAppt = MOCK_APPOINTMENTS.find((a) => a.patientId === linkedPatientId && a.status !== 'completed');
  const adherence = MOCK_ADHERENCE.find((a) => a.patientId === linkedPatientId);
  const recentCheckins = MOCK_CHECKINS.filter((c) => c.patientId === linkedPatientId).slice(0, 7);
  const alerts = MOCK_ALERTS.filter((a) => a.patientId === linkedPatientId && !a.isRead);

  const avgMood = recentCheckins.length
    ? recentCheckins.reduce((sum, c) => sum + c.energy, 0) / recentCheckins.length
    : 0;

  const statusColor = patient.status === 'improving' ? 'text-[#00C48C]' : patient.status === 'critical' ? 'text-[#FF4757]' : patient.status === 'moderate' ? 'text-[#FFB800]' : 'text-[#1A6BFF]';

  const containerVars = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVars = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="flex-1 flex flex-col bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 px-5 pt-12 pb-8 rounded-b-[36px]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-purple-200 text-xs">Caregiver Dashboard</p>
            <h1 className="text-white text-xl font-bold font-heading mt-0.5">Hi, {user?.name?.split(' ')[0]} 🤝</h1>
          </div>
          <button onClick={logout} className="text-purple-200 text-xs underline">Sign out</button>
        </div>

        {/* Patient card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold text-white">
              {patient.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-bold text-white text-base">{patient.name}</p>
              <p className="text-purple-200 text-xs">{patient.age}y · {patient.chiefComplaint}</p>
              <p className={`text-sm font-bold capitalize mt-1 ${statusColor}`}>{patient.status}</p>
            </div>
            <Heart className={`w-5 h-5 mt-1 ${statusColor}`} fill="currentColor" />
          </div>
        </div>
      </div>

      <motion.div variants={containerVars} initial="hidden" animate="visible" className="p-5 space-y-4">

        {/* Alerts */}
        {alerts.length > 0 && (
          <motion.div variants={itemVars} className="card p-4 border-[#FF4757]/30 bg-red-50">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#FF4757]" />
              <h3 className="font-bold text-red-800 text-sm">{alerts.length} Alert{alerts.length > 1 ? 's' : ''}</h3>
            </div>
            {alerts.slice(0, 2).map((a) => (
              <p key={a.id} className="text-xs text-red-700 mb-1">• {a.message}</p>
            ))}
          </motion.div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div variants={itemVars} className="card p-4">
            <div className="w-9 h-9 rounded-xl bg-[#00C48C]/10 flex items-center justify-center mb-2">
              <Pill className="w-4 h-4 text-[#00C48C]" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{adherence?.weekPercent ?? 88}%</p>
            <p className="text-xs text-slate-500 mt-0.5">Medicine taken this week</p>
            <p className={`text-[10px] font-semibold mt-1 ${(adherence?.weekPercent ?? 88) >= 80 ? 'text-[#00C48C]' : 'text-[#FFB800]'}`}>
              {(adherence?.weekPercent ?? 88) >= 80 ? '✓ Good adherence' : '⚠️ Needs improvement'}
            </p>
          </motion.div>

          <motion.div variants={itemVars} className="card p-4">
            <div className="w-9 h-9 rounded-xl bg-[#1A6BFF]/10 flex items-center justify-center mb-2">
              <Activity className="w-4 h-4 text-[#1A6BFF]" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{avgMood.toFixed(1)}/10</p>
            <p className="text-xs text-slate-500 mt-0.5">Avg energy (7 days)</p>
            <p className={`text-[10px] font-semibold mt-1 ${avgMood >= 6 ? 'text-[#00C48C]' : 'text-[#FFB800]'}`}>
              {avgMood >= 6 ? '↑ Trending well' : '→ Stable'}
            </p>
          </motion.div>
        </div>

        {/* Next Appointment */}
        {nextAppt && (
          <motion.div variants={itemVars} className="card p-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-4 h-4 text-[#1A6BFF]" />
              <h3 className="font-bold text-slate-900 text-sm">Next Appointment</h3>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="font-bold text-slate-900">
                {new Date(nextAppt.scheduledDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                {nextAppt.scheduledTime ? ` · ${nextAppt.scheduledTime}` : ''}
              </p>
              {nextAppt.reason && <p className="text-xs text-blue-600 mt-1">{nextAppt.reason}</p>}
            </div>
          </motion.div>
        )}

        {/* Check-in trend */}
        <motion.div variants={itemVars} className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#1A6BFF]" />
            <h3 className="font-bold text-slate-900 text-sm">7-Day Mood Trend</h3>
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {recentCheckins.reverse().map((ci, i) => {
              const h = (ci.energy / 10) * 100;
              const color = ci.energy >= 7 ? 'bg-[#00C48C]' : ci.energy >= 4 ? 'bg-[#FFB800]' : 'bg-[#FF4757]';
              return (
                <div key={ci.id} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.07, duration: 0.6, ease: 'easeOut' }}
                    className={`w-full rounded-t-sm ${color}`}
                  />
                  <span className="text-[10px] text-slate-400">{ci.mood}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Notification controls */}
        <motion.div variants={itemVars} className="card p-4">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#1A6BFF]" /> WhatsApp Alerts
          </h3>
          <p className="text-xs text-slate-500 mb-3">Choose what alerts you receive for {patient.name.split(' ')[0]}</p>
          <div className="space-y-2">
            {[
              { key: 'missedMed',   label: 'Missed medicine',   sub: 'Alert when a dose is missed' },
              { key: 'appointment', label: 'Upcoming visits',   sub: '24hr + 2hr before appointment' },
              { key: 'redReport',   label: 'Red lab reports',   sub: 'Critical test results flagged' },
            ].map(({ key, label, sub }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="text-[10px] text-slate-500">{sub}</p>
                </div>
                <button
                  onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    notifications[key as keyof typeof notifications] ? 'bg-[#1A6BFF]' : 'bg-slate-200'
                  }`}
                >
                  <motion.div
                    animate={{ x: notifications[key as keyof typeof notifications] ? 16 : 2 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="w-5 h-5 rounded-full bg-white absolute top-0.5 shadow-sm"
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="card p-4 bg-amber-50 border-amber-200">
          <p className="text-xs font-bold text-amber-700 mb-1">Privacy Note</p>
          <p className="text-xs text-amber-600">You can see appointments, medicines, and check-in trends. Personal notes, voice messages, and Quick Ask conversations are private to {patient.name.split(' ')[0]}.</p>
        </motion.div>

      </motion.div>
    </div>
  );
}
